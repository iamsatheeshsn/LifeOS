import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { embed } from '@/lib/ai/provider';
import { getUserAIProvider, isAIConfigured } from '@/lib/ai/config';

function formatEmbedding(values: number[]): string {
  return `[${values.join(',')}]`;
}

async function getServiceSupabase(): Promise<SupabaseClient> {
  const { createServiceClient } = await import('@/lib/supabase/server');
  return createServiceClient();
}

async function getUserSupabase(): Promise<SupabaseClient> {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

export async function backfillMemoryEmbeddings(
  userId?: string,
  client?: SupabaseClient
): Promise<{ updated: number; skipped: number }> {
  if (!userId) {
    throw new Error('userId is required for memory embedding backfill');
  }

  const provider = await getUserAIProvider(userId);
  if (!isAIConfigured(provider)) {
    throw new Error('AI not configured for the selected provider');
  }

  const supabase = client || (await getUserSupabase());
  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, content, user_id')
    .eq('user_id', userId)
    .is('embedding', null);

  if (error) throw error;

  let updated = 0;
  let skipped = 0;

  for (const memory of memories || []) {
    try {
      const vector = await embed(memory.content, provider);
      const { error: updateError } = await supabase
        .from('memories')
        .update({ embedding: formatEmbedding(vector) })
        .eq('id', memory.id);

      if (updateError) skipped++;
      else updated++;
    } catch {
      skipped++;
    }
  }

  return { updated, skipped };
}

export async function backfillAllMemoryEmbeddings(
  client?: SupabaseClient
): Promise<{ updated: number; skipped: number }> {
  const supabase = client || (await getServiceSupabase());
  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, content, user_id')
    .is('embedding', null);

  if (error) throw error;

  let updated = 0;
  let skipped = 0;

  for (const memory of memories || []) {
    try {
      const provider = await getUserAIProvider(memory.user_id);
      if (!isAIConfigured(provider)) {
        skipped++;
        continue;
      }

      const vector = await embed(memory.content, provider);
      const { error: updateError } = await supabase
        .from('memories')
        .update({ embedding: formatEmbedding(vector) })
        .eq('id', memory.id);

      if (updateError) skipped++;
      else updated++;
    } catch {
      skipped++;
    }
  }

  return { updated, skipped };
}

/** Standalone script helper — pass service-role client directly */
export function createSeedSupabase(url: string, serviceKey: string, wsTransport?: typeof WebSocket) {
  return createSupabaseClient(url, serviceKey, {
    realtime: wsTransport ? { transport: wsTransport as never } : undefined,
  });
}
