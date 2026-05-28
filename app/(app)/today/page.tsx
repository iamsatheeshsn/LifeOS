import { createClient } from '@/lib/supabase/server';
import { QuickAddBar } from '@/components/features/quick-add-bar';
import { TaskList } from '@/components/features/task-list';
import { EventList } from '@/components/features/event-list';
import { HabitChecklist } from '@/components/features/habit-checklist';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckSquare, Heart, Bell } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { formatTime } from '@/lib/utils';
import type { Reminder } from '@/types/database';

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const [tasksRes, eventsRes, habitsRes, logsRes, remindersRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .order('sort_order')
      .limit(10),
    supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .order('start_time'),
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('habit_logs').select('*').eq('user_id', user.id),
    supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .gte('remind_at', dayStart)
      .lte('remind_at', dayEnd)
      .order('remind_at'),
  ]);

  const tasks = tasksRes.data || [];
  const events = eventsRes.data || [];
  const habits = habitsRes.data || [];
  const logs = logsRes.data || [];
  const reminders = (remindersRes.data || []) as Reminder[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <QuickAddBar />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-500" />
              <CardTitle>Tasks</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{tasks.length} pending</span>
          </CardHeader>
          <div className="max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
            <TaskList tasks={tasks} draggable />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-500" />
              <CardTitle>Events</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{events.length} today</span>
          </CardHeader>
          <div className="max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
            <EventList events={events} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-orange-500" />
              <CardTitle>Habits</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{habits.length} tracked</span>
          </CardHeader>
          <div className="max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
            <HabitChecklist habits={habits} logs={logs} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-sky-500" />
              <CardTitle>Reminders</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{reminders.length} today</span>
          </CardHeader>
          {reminders.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No reminders today</p>
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5">
                  <Bell className="h-4 w-4 shrink-0 text-sky-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(r.remind_at)}
                      {r.for_person && ` · for ${r.for_person}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
