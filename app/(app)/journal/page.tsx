import { createClient } from '@/lib/supabase/server';
import { JournalClient } from '@/components/features/journal-client';

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <JournalClient entries={entries || []} />;
}
