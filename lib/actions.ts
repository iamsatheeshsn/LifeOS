'use server';

import { createClient } from '@/lib/supabase/server';
import { formatSignUpError, isAutoConfirmSignupEnabled } from '@/lib/auth/signup';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type {
  Task, Event, Transaction, Habit, Reminder, JournalEntry, Memory,
  TaskPriority, TaskStatus, TransactionType, JournalMood, MemoryCategory,
} from '@/types/database';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

// Auth
async function signUpWithAutoConfirm(email: string, password: string, fullName: string) {
  const { createServiceClient } = await import('@/lib/supabase/server');
  const service = await createServiceClient();

  const { data: existing } = await service.auth.admin.listUsers();
  if (existing?.users?.some((u) => u.email?.toLowerCase() === email.toLowerCase())) {
    return { error: 'An account with this email already exists. Try signing in.' };
  }

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'member' },
  });

  if (error || !data.user) {
    return { error: formatSignUpError(error?.message || 'Failed to create account') };
  }

  await service
    .from('profiles')
    .update({ full_name: fullName, role: 'member' })
    .eq('id', data.user.id);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: formatSignUpError(signInError.message) };
  }

  redirect('/today');
}

export async function signUp(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string)?.trim();

  if (!email || !password || !fullName) {
    return { error: 'Full name, email, and password are required' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  if (isAutoConfirmSignupEnabled()) {
    return signUpWithAutoConfirm(email, password, fullName);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'member' } },
  });

  if (error) return { error: formatSignUpError(error.message) };

  if (!data.session) {
    return {
      success: true,
      message: 'Account created! Check your email to confirm your address, then sign in.',
    };
  }

  redirect('/today');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect('/today');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// Profile
export async function updateProfile(data: {
  full_name?: string;
  timezone?: string;
  ai_provider?: 'openai' | 'gemini';
}) {
  const { supabase, userId } = await getUserId();
  const { ai_provider, ...profileFields } = data;

  if (ai_provider) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: { ai_provider },
    });
    if (metaError) return { error: metaError.message };

    await supabase.auth.refreshSession();

    // Best-effort sync when the profiles column exists
    await supabase.from('profiles').update({ ai_provider }).eq('id', userId);
  }

  if (Object.keys(profileFields).length > 0) {
    const { error } = await supabase.from('profiles').update(profileFields).eq('id', userId);
    if (error) return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

// Tasks
export async function getTasks(filters?: { status?: TaskStatus; dueToday?: boolean }) {
  const { supabase, userId } = await getUserId();
  let query = supabase.from('tasks').select('*').eq('user_id', userId).order('sort_order');

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.dueToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Task[];
}

export async function createTask(data: {
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
}) {
  const { supabase, userId } = await getUserId();
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/today');
  revalidatePath('/planner');
  return { task };
}

export async function updateTask(id: string, data: Partial<Task>) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('tasks').update(data).eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/today');
  revalidatePath('/planner');
  return { success: true };
}

export async function deleteTask(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/today');
  revalidatePath('/planner');
  return { success: true };
}

export async function reorderTasks(taskIds: string[]) {
  const { supabase, userId } = await getUserId();
  const updates = taskIds.map((id, index) =>
    supabase.from('tasks').update({ sort_order: index }).eq('id', id).eq('user_id', userId)
  );
  await Promise.all(updates);
  revalidatePath('/today');
  revalidatePath('/planner');
}

// Events
export async function getEvents(startDate?: string, endDate?: string) {
  const { supabase, userId } = await getUserId();
  let query = supabase.from('events').select('*').eq('user_id', userId).order('start_time');

  if (startDate) query = query.gte('start_time', startDate);
  if (endDate) query = query.lte('start_time', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data as Event[];
}

export async function createEvent(data: {
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  color?: string;
}) {
  const { supabase, userId } = await getUserId();
  const { data: event, error } = await supabase
    .from('events')
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/today');
  revalidatePath('/planner');
  return { event };
}

export async function deleteEvent(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/today');
  revalidatePath('/planner');
  return { success: true };
}

// Transactions
export async function getTransactions(month?: string) {
  const { supabase, userId } = await getUserId();
  let query = supabase.from('transactions').select('*').eq('user_id', userId).order('occurred_at', { ascending: false });

  if (month) {
    const start = new Date(month);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    query = query.gte('occurred_at', start.toISOString()).lte('occurred_at', end.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Transaction[];
}

export async function createTransaction(data: {
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  occurred_at?: string;
}) {
  const { supabase, userId } = await getUserId();
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/finance');
  return { transaction };
}

export async function deleteTransaction(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/finance');
  return { success: true };
}

// Habits
export async function getHabits() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as Habit[];
}

export async function getHabitLogs(habitId?: string) {
  const { supabase, userId } = await getUserId();
  let query = supabase.from('habit_logs').select('*').eq('user_id', userId).order('completed_at', { ascending: false });
  if (habitId) query = query.eq('habit_id', habitId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createHabit(data: { name: string; icon?: string; color?: string; target_frequency?: 'daily' | 'weekly' }) {
  const { supabase, userId } = await getUserId();
  const { data: habit, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/health');
  revalidatePath('/today');
  return { habit };
}

export async function logHabit(habitId: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: userId });
  if (error) return { error: error.message };
  revalidatePath('/health');
  revalidatePath('/today');
  return { success: true };
}

export async function deleteHabit(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/health');
  return { success: true };
}

// Reminders
export async function getReminders() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('remind_at');
  if (error) throw error;
  return data as Reminder[];
}

export async function createReminder(data: {
  title: string;
  remind_at: string;
  for_person?: string;
  recurring?: string;
}) {
  const { supabase, userId } = await getUserId();
  const { data: reminder, error } = await supabase
    .from('reminders')
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/reminders');
  revalidatePath('/today');
  return { reminder };
}

export async function deleteReminder(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/reminders');
  return { success: true };
}

// Journal
export async function getJournalEntries() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
}

export async function createJournalEntry(data: { content: string; mood: JournalMood }) {
  const { supabase, userId } = await getUserId();
  const { data: entry, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) return { error: error.message };

  try {
    const { generateStructured } = await import('@/lib/ai/provider');
    const { extractAndSaveMemories } = await import('@/lib/ai/memory');
    const { getUserAIProvider } = await import('@/lib/ai/config');
    const provider = await getUserAIProvider(userId);
    const analysis = await generateStructured<{ summary: string; mood: JournalMood }>(
      `Analyze this journal entry:\n\n${data.content}`,
      `Return JSON with: "summary" (1-2 sentence summary) and "mood" (one of: great, good, neutral, bad, awful).`,
      provider
    );
    await supabase
      .from('journal_entries')
      .update({ ai_summary: analysis.summary, mood: analysis.mood || data.mood })
      .eq('id', entry.id);
    extractAndSaveMemories(userId, data.content).catch(() => {});
  } catch {
    // AI processing is best-effort
  }

  revalidatePath('/journal');
  return { entry };
}

export async function deleteJournalEntry(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/journal');
  return { success: true };
}

// Memories
export async function getMemories() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Memory[];
}

export async function createMemory(data: { content: string; category: MemoryCategory; importance?: number }) {
  const { saveMemory } = await import('@/lib/ai/memory');
  const { userId } = await getUserId();
  const memory = await saveMemory(userId, data.content, data.category, data.importance || 3);
  revalidatePath('/memory');
  return { memory };
}

export async function updateMemory(id: string, data: Partial<Memory>) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('memories').update(data).eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/memory');
  return { success: true };
}

export async function deleteMemory(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/memory');
  return { success: true };
}

// Insights
export async function getInsights() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

// Profile
export async function getProfile() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}
