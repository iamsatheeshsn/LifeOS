import { createClient } from '@/lib/supabase/server';
import { PlannerClient } from '@/components/features/planner-client';

export default async function PlannerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tasksRes, eventsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).order('sort_order'),
    supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(20),
  ]);

  return (
    <PlannerClient
      tasks={tasksRes.data || []}
      events={eventsRes.data || []}
    />
  );
}
