import { createClient } from '@/lib/supabase/server';
import { HealthClient } from '@/components/features/health-client';

export default async function HealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [habitsRes, logsRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('habit_logs').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }),
  ]);

  return <HealthClient habits={habitsRes.data || []} logs={logsRes.data || []} />;
}
