import { createClient } from '@/lib/supabase/server';
import { InsightsClient } from '@/components/features/insights-client';

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return <InsightsClient insights={insights || []} />;
}
