import { createClient } from '@/lib/supabase/server';
import { generateStructured } from '@/lib/ai/provider';
import { getUserAIProvider } from '@/lib/ai/config';
import { extractAndSaveMemories } from '@/lib/ai/memory';
import { aiGuardResponse, aiErrorResponse } from '@/lib/ai/api-guard';
import { NextResponse } from 'next/server';
import type { JournalMood } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guard = await aiGuardResponse(user.id);
    if (guard) return guard;

    const provider = await getUserAIProvider(user.id);
    const { entryId, content } = await request.json();

    const analysis = await generateStructured<{
      summary: string;
      mood: JournalMood;
    }>(
      `Analyze this journal entry:\n\n${content}`,
      `Return JSON with: "summary" (1-2 sentence summary) and "mood" (one of: great, good, neutral, bad, awful).`,
      provider
    );

    extractAndSaveMemories(user.id, content).catch(() => {});

    return NextResponse.json({
      summary: analysis.summary,
      mood: analysis.mood,
      entryId,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
