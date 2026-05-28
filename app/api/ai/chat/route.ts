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
    const { messages } = await request.json();
    if (!messages?.length) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    const context = await buildUserContext(user.id, lastUserMsg?.content);

    const result = await chatWithTools(
      [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
        ...messages,
      ],
      AI_TOOLS,
      provider
    );

    const actionResults: string[] = [];
    for (const toolCall of result.toolCalls) {
      const actionResult = await executeToolCall(user.id, toolCall.name, toolCall.arguments);
      actionResults.push(actionResult);
    }

    if (lastUserMsg) {
      extractAndSaveMemories(user.id, lastUserMsg.content).catch(() => {});
    }

    return NextResponse.json({
      response: result.content,
      actions: actionResults,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
