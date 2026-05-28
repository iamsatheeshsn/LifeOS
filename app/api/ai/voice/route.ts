import { createClient } from '@/lib/supabase/server';
import { chatWithTools } from '@/lib/ai/provider';
import { getUserAIProvider } from '@/lib/ai/config';
import { AI_TOOLS, executeToolCall } from '@/lib/ai/tools';
import { buildUserContext, SYSTEM_PROMPT } from '@/lib/ai/context';
import { extractAndSaveMemories } from '@/lib/ai/memory';
import { aiGuardResponse, aiErrorResponse } from '@/lib/ai/api-guard';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guard = await aiGuardResponse(user.id);
    if (guard) return guard;

    const provider = await getUserAIProvider(user.id);
    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const context = await buildUserContext(user.id, message);
    const result = await chatWithTools(
      [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
        { role: 'user', content: message },
      ],
      AI_TOOLS,
      provider
    );

    const actionResults: string[] = [];
    for (const toolCall of result.toolCalls) {
      const actionResult = await executeToolCall(user.id, toolCall.name, toolCall.arguments);
      actionResults.push(actionResult);
    }

    let response = result.content;
    if (actionResults.length > 0) {
      response += '\n\n' + actionResults.join('\n');
    }

    extractAndSaveMemories(user.id, message).catch(() => {});

    return NextResponse.json({ response, actions: actionResults });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
