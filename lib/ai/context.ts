import { createClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay, format } from 'date-fns';
import { getRelevantMemories, formatMemoriesForContext } from '@/lib/ai/memory';

export async function buildUserContext(userId: string, query?: string): Promise<string> {
  const supabase = await createClient();
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const [profileRes, tasksRes, eventsRes, habitsRes, remindersRes, transactionsRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'done')
        .order('due_date', { ascending: true })
        .limit(10),
      supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .order('start_time'),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .gte('remind_at', dayStart)
        .order('remind_at')
        .limit(5),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('occurred_at', startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)).toISOString())
        .order('occurred_at', { ascending: false })
        .limit(20),
    ]);

  const memories = query
    ? await getRelevantMemories(userId, query)
    : await getRelevantMemories(userId, 'user preferences goals routines', 5);

  const profile = profileRes.data;
  const tasks = tasksRes.data || [];
  const events = eventsRes.data || [];
  const habits = habitsRes.data || [];
  const reminders = remindersRes.data || [];
  const transactions = transactionsRes.data || [];

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return [
    `Today is ${format(today, 'EEEE, MMMM d, yyyy')}.`,
    profile?.full_name ? `User name: ${profile.full_name}` : '',
    formatMemoriesForContext(memories),
    tasks.length
      ? `\nPending tasks:\n${tasks.map((t) => `- ${t.title}${t.due_date ? ` (due: ${format(new Date(t.due_date), 'MMM d')})` : ''}`).join('\n')}`
      : '',
    events.length
      ? `\nToday's events:\n${events.map((e) => `- ${e.title} at ${format(new Date(e.start_time), 'h:mm a')}`).join('\n')}`
      : '',
    habits.length
      ? `\nHabits: ${habits.map((h) => h.name).join(', ')}`
      : '',
    reminders.length
      ? `\nUpcoming reminders:\n${reminders.map((r) => `- ${r.title}${r.for_person ? ` (for ${r.for_person})` : ''}`).join('\n')}`
      : '',
    totalExpenses > 0 ? `\nThis month's spending so far: $${totalExpenses.toFixed(2)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const SYSTEM_PROMPT = `You are LifeOS, a warm and intelligent personal life assistant. You help users manage their tasks, calendar, finances, habits, journal, and reminders. You have access to their memories and today's data.

Be concise, friendly, and proactive. When the user asks you to do something, use the available tools. When they share personal information, save it as a memory.

Current capabilities: create tasks, events, reminders, log expenses/income, log habits, save memories.`;
