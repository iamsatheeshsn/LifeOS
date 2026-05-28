import { createClient } from '@/lib/supabase/server';
import { embed } from '@/lib/ai/provider';
import { getUserAIProvider } from '@/lib/ai/config';
import type { Memory, MemoryCategory } from '@/types/database';

function formatEmbedding(values: number[]): string {
  return `[${values.join(',')}]`;
}

export async function getRelevantMemories(
  userId: string,
  queryText: string,
  k = 8
): Promise<Memory[]> {
  const supabase = await createClient();
  const provider = await getUserAIProvider(userId);
  const queryEmbedding = await embed(queryText, provider);

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: formatEmbedding(queryEmbedding),
    match_user_id: userId,
    match_count: k,
  });

  if (error) {
    console.error('Memory search error:', error);
    const { data: fallback } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .limit(k);
    return fallback || [];
  }

  return (data || []) as Memory[];
}

export async function saveMemory(
  userId: string,
  content: string,
  category: MemoryCategory = 'fact',
  importance = 3
): Promise<Memory | null> {
  const supabase = await createClient();
  const provider = await getUserAIProvider(userId);
  const embedding = await embed(content, provider);

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      content,
      category,
      importance,
      embedding: formatEmbedding(embedding),
    })
    .select()
    .single();

  if (error) {
    console.error('Save memory error:', error);
    return null;
  }

  return data;
}

export async function extractAndSaveMemories(
  userId: string,
  text: string
): Promise<Memory[]> {
  const { generateStructured } = await import('@/lib/ai/provider');
  const provider = await getUserAIProvider(userId);

  const extracted = await generateStructured<{
    memories: Array<{
      content: string;
      category: MemoryCategory;
      importance: number;
    }>;
  }>(
    `Extract durable facts about the user from this text. Only extract genuinely useful long-term information (preferences, goals, relationships, routines, facts). Return empty array if nothing worth remembering.\n\nText: ${text}`,
    `You are a memory extraction system. Return JSON: { "memories": [{ "content": string, "category": "preference"|"fact"|"goal"|"relationship"|"routine", "importance": 1-5 }] }`,
    provider
  );

  const saved: Memory[] = [];
  for (const mem of extracted.memories || []) {
    const result = await saveMemory(userId, mem.content, mem.category, mem.importance);
    if (result) saved.push(result);
  }

  return saved;
}

export function formatMemoriesForContext(memories: Memory[]): string {
  if (!memories.length) return '';
  return (
    'What you know about this user:\n' +
    memories.map((m) => `- [${m.category}] ${m.content}`).join('\n')
  );
}
