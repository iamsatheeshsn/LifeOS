/**
 * Backfill vector embeddings for memories missing them.
 * Usage: npm run seed:embeddings
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, { realtime: { transport: ws as never } });
  const { backfillAllMemoryEmbeddings } = await import('../lib/ai/embeddings');

  console.log('Backfilling memory embeddings...\n');
  const result = await backfillAllMemoryEmbeddings(supabase);
  console.log(`Done: ${result.updated} updated, ${result.skipped} skipped`);
}

main().catch((err) => {
  console.error('Backfill failed:', err.message || err);
  process.exit(1);
});
