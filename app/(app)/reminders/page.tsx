import { createClient } from '@/lib/supabase/server';
import { RemindersClient } from '@/components/features/reminders-client';

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('remind_at');

  return <RemindersClient reminders={reminders || []} />;
}
