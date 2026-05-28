import { createClient } from '@/lib/supabase/server';
import { MemoryClient } from '@/components/features/memory-client';

export default async function MemoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <MemoryClient memories={memories || []} />;
}
