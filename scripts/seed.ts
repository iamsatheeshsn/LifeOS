/**
 * LifeOS seed — role-based demo users + 20+ records per entity.
 *
 * Usage:
 *   1. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. Run migration 002_add_user_roles.sql in Supabase SQL Editor
 *   3. npm run seed
 *
 * Demo logins (password for all: Demo123!):
 *   admin@lifeos.demo   — Admin
 *   member@lifeos.demo  — Member
 *   family@lifeos.demo  — Family
 *   partner@lifeos.demo — Partner
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import ws from 'ws';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RECORD_COUNT = 20;
const DEMO_PASSWORD = 'Demo123!';

type UserRole = 'admin' | 'member' | 'family' | 'partner';
type TaskPriority = 'low' | 'med' | 'high';
type TaskStatus = 'todo' | 'doing' | 'done';
type JournalMood = 'great' | 'good' | 'neutral' | 'bad' | 'awful';
type MemoryCategory = 'preference' | 'fact' | 'goal' | 'relationship' | 'routine';

interface DemoUser {
  email: string;
  full_name: string;
  role: UserRole;
  timezone: string;
}

const DEMO_USERS: DemoUser[] = [
  { email: 'admin@lifeos.demo', full_name: 'Alex Rivera', role: 'admin', timezone: 'America/New_York' },
  { email: 'member@lifeos.demo', full_name: 'Jordan Lee', role: 'member', timezone: 'America/Chicago' },
  { email: 'family@lifeos.demo', full_name: 'Sam Chen', role: 'family', timezone: 'America/Los_Angeles' },
  { email: 'partner@lifeos.demo', full_name: 'Taylor Morgan', role: 'partner', timezone: 'Europe/London' },
];

const TASK_TITLES = [
  'Review quarterly goals', 'Buy groceries', 'Call dentist', 'Finish project proposal',
  'Water plants', 'Schedule team sync', 'Update resume', 'Pay utility bills',
  'Plan weekend trip', 'Organize home office', 'Book flight tickets', 'Renew insurance',
  'Prepare presentation', 'Send follow-up emails', 'Clean garage', 'Fix leaky faucet',
  'Research vacation spots', 'Backup laptop files', 'Order birthday gift', 'Review budget',
];

const EVENT_TITLES = [
  'Team standup', 'Lunch with Sarah', 'Doctor appointment', 'Yoga class',
  'Client call', 'Dinner reservation', 'School pickup', 'Gym session',
  'Book club', 'Parent-teacher meeting', 'Car service', 'Coffee with mentor',
  'Webinar: productivity', 'Movie night', 'Brunch with friends', 'Dentist cleaning',
  'Project demo', 'Flight to NYC', 'Anniversary dinner', 'Community volunteer',
];

const HABIT_NAMES = [
  { name: 'Morning meditation', icon: 'brain', color: '#8b5cf6' },
  { name: 'Exercise', icon: 'dumbbell', color: '#f97316' },
  { name: 'Read 30 minutes', icon: 'book-open', color: '#3b82f6' },
  { name: 'Drink water', icon: 'droplets', color: '#06b6d4' },
  { name: 'Walk 10k steps', icon: 'footprints', color: '#10b981' },
  { name: 'Journal', icon: 'book-open', color: '#ec4899' },
  { name: 'Stretch', icon: 'heart', color: '#ef4444' },
  { name: 'No phone before bed', icon: 'moon', color: '#6366f1' },
  { name: 'Healthy breakfast', icon: 'apple', color: '#f59e0b' },
  { name: 'Practice guitar', icon: 'sparkles', color: '#a855f7' },
  { name: 'Floss teeth', icon: 'sparkles', color: '#14b8a6' },
  { name: 'Vitamins', icon: 'heart', color: '#f43f5e' },
  { name: 'Deep work block', icon: 'brain', color: '#4f46e5' },
  { name: 'Evening walk', icon: 'footprints', color: '#22c55e' },
  { name: 'Gratitude note', icon: 'sun', color: '#eab308' },
  { name: 'Meal prep', icon: 'apple', color: '#84cc16' },
  { name: 'Inbox zero', icon: 'sparkles', color: '#0ea5e9' },
  { name: 'Language practice', icon: 'book-open', color: '#d946ef' },
  { name: 'Skincare routine', icon: 'droplets', color: '#fb7185' },
  { name: 'Early bedtime', icon: 'moon', color: '#64748b' },
];

const EXPENSE_CATEGORIES = ['Dining', 'Groceries', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Travel'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift'];
const EVENT_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
const MOODS: JournalMood[] = ['great', 'good', 'neutral', 'bad', 'awful'];
const MEMORY_CATEGORIES: MemoryCategory[] = ['preference', 'fact', 'goal', 'relationship', 'routine'];
const INSIGHT_TYPES = ['productivity', 'finance', 'health', 'wellness', 'habit'];
const FAMILY_NAMES = ['Mom', 'Dad', 'Partner', 'Kids', 'Grandma', 'Uncle Joe', 'Sister', 'Brother'];

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  realtime: { transport: ws as never },
});

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function ensureDemoUser(demo: DemoUser): Promise<string> {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === demo.email);

  if (found) {
    await supabase.from('profiles').update({
      full_name: demo.full_name,
      role: demo.role,
      timezone: demo.timezone,
    }).eq('id', found.id);
    console.log(`  ↳ Existing user: ${demo.email} (${demo.role})`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: demo.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: demo.full_name, role: demo.role },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create ${demo.email}: ${error?.message}`);
  }

  await supabase.from('profiles').update({
    full_name: demo.full_name,
    role: demo.role,
    timezone: demo.timezone,
  }).eq('id', data.user.id);

  console.log(`  ✓ Created user: ${demo.email} (${demo.role})`);
  return data.user.id;
}

async function clearUserData(userId: string) {
  const tables = [
    'habit_logs', 'insights', 'journal_entries', 'memories', 'reminders',
    'transactions', 'events', 'tasks', 'habits',
  ] as const;

  for (const table of tables) {
    await supabase.from(table).delete().eq('user_id', userId);
  }
}

async function seedUser(userId: string, demo: DemoUser) {
  console.log(`\nSeeding ${demo.full_name} (${demo.role}) — ${RECORD_COUNT}+ records per entity...`);
  await clearUserData(userId);

  const priorities: TaskPriority[] = ['low', 'med', 'high'];
  const statuses: TaskStatus[] = ['todo', 'doing', 'done'];

  const tasks = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    user_id: userId,
    title: `[${demo.role}] ${TASK_TITLES[i % TASK_TITLES.length]}`,
    description: `Seeded task #${i + 1} for ${demo.full_name}`,
    due_date: (i % 3 === 0 ? daysFromNow(i % 14) : daysAgo(i % 10)).toISOString(),
    priority: priorities[i % 3],
    status: statuses[i % 3],
    sort_order: i,
  }));

  const { error: tasksErr } = await supabase.from('tasks').insert(tasks);
  if (tasksErr) throw new Error(`Tasks: ${tasksErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} tasks`);

  const events = Array.from({ length: RECORD_COUNT }, (_, i) => {
    const start = i % 2 === 0 ? daysFromNow(i % 21, 9 + (i % 8)) : daysAgo(i % 14, 9 + (i % 8));
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return {
      user_id: userId,
      title: `[${demo.role}] ${EVENT_TITLES[i % EVENT_TITLES.length]}`,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: i % 4 === 0 ? 'Downtown' : i % 4 === 1 ? 'Home' : i % 4 === 2 ? 'Office' : null,
      color: EVENT_COLORS[i % EVENT_COLORS.length],
    };
  });

  const { error: eventsErr } = await supabase.from('events').insert(events);
  if (eventsErr) throw new Error(`Events: ${eventsErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} events`);

  const habits = HABIT_NAMES.slice(0, RECORD_COUNT).map((h, i) => ({
    user_id: userId,
    name: h.name,
    icon: h.icon,
    color: h.color,
    target_frequency: i % 5 === 0 ? 'weekly' : 'daily',
  }));

  const { data: habitRows, error: habitsErr } = await supabase.from('habits').insert(habits).select();
  if (habitsErr) throw new Error(`Habits: ${habitsErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} habits`);

  const habitLogs = (habitRows || []).flatMap((habit, hi) =>
    Array.from({ length: Math.min(14, 5 + (hi % 10)) }, (_, di) => ({
      habit_id: habit.id,
      user_id: userId,
      completed_at: daysAgo(di + (hi % 3)).toISOString(),
    }))
  );

  const { error: logsErr } = await supabase.from('habit_logs').insert(habitLogs);
  if (logsErr) throw new Error(`Habit logs: ${logsErr.message}`);
  console.log(`  ✓ ${habitLogs.length} habit logs`);

  const transactions = Array.from({ length: RECORD_COUNT }, (_, i) => {
    const isIncome = i % 5 === 0;
    return {
      user_id: userId,
      amount: isIncome ? 1000 + i * 250 : 12 + i * 8.5,
      type: isIncome ? 'income' : 'expense',
      category: isIncome ? INCOME_CATEGORIES[i % INCOME_CATEGORIES.length] : EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length],
      note: `Seeded ${isIncome ? 'income' : 'expense'} #${i + 1}`,
      occurred_at: daysAgo(i % 30).toISOString(),
    };
  });

  const { error: txErr } = await supabase.from('transactions').insert(transactions);
  if (txErr) throw new Error(`Transactions: ${txErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} transactions`);

  const reminders = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    user_id: userId,
    title: `[${demo.role}] Reminder #${i + 1}: ${TASK_TITLES[i % TASK_TITLES.length]}`,
    remind_at: daysFromNow(i % 28, 8 + (i % 12)).toISOString(),
    for_person: demo.role === 'family' || i % 3 === 0 ? FAMILY_NAMES[i % FAMILY_NAMES.length] : null,
  }));

  const { error: remErr } = await supabase.from('reminders').insert(reminders);
  if (remErr) throw new Error(`Reminders: ${remErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} reminders`);

  const journalEntries = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    user_id: userId,
    content: `Journal entry #${i + 1} for ${demo.full_name} (${demo.role}). Today I focused on ${TASK_TITLES[i % TASK_TITLES.length].toLowerCase()} and reflected on my progress. Entry written on ${daysAgo(i % 20).toDateString()}.`,
    mood: MOODS[i % MOODS.length],
    ai_summary: `Summary: ${MOODS[i % MOODS.length]} mood day — entry #${i + 1}.`,
    created_at: daysAgo(i % 25).toISOString(),
  }));

  const { error: journalErr } = await supabase.from('journal_entries').insert(journalEntries);
  if (journalErr) throw new Error(`Journal: ${journalErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} journal entries`);

  const memories = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    user_id: userId,
    content: `[${demo.role}] Memory #${i + 1}: ${demo.full_name} — ${MEMORY_CATEGORIES[i % MEMORY_CATEGORIES.length]} fact stored for AI context.`,
    category: MEMORY_CATEGORIES[i % MEMORY_CATEGORIES.length],
    importance: (i % 5) + 1,
    created_at: daysAgo(i % 60).toISOString(),
  }));

  const { error: memErr } = await supabase.from('memories').insert(memories);
  if (memErr) throw new Error(`Memories: ${memErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} memories`);

  const { isAIConfigured } = await import('../lib/ai/config');
  if (isAIConfigured()) {
    const { embed } = await import('../lib/ai/provider');
    const { data: memRows } = await supabase.from('memories').select('id, content').eq('user_id', userId);
    let embedded = 0;
    for (const m of memRows || []) {
      try {
        const vector = await embed(m.content);
        await supabase.from('memories').update({ embedding: `[${vector.join(',')}]` }).eq('id', m.id);
        embedded++;
      } catch {
        // skip individual failures
      }
    }
    console.log(`  ✓ ${embedded} memory embeddings`);
  } else {
    console.log('  ⚠ Skipped embeddings — add OPENAI_API_KEY to .env.local');
  }

  const insights = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    user_id: userId,
    type: INSIGHT_TYPES[i % INSIGHT_TYPES.length],
    content: `[${demo.role}] Insight #${i + 1}: Pattern detected in your ${INSIGHT_TYPES[i % INSIGHT_TYPES.length]} data. Keep up the momentum!`,
    source_data: { seed: true, index: i, role: demo.role },
    created_at: daysAgo(i % 15).toISOString(),
  }));

  const { error: insErr } = await supabase.from('insights').insert(insights);
  if (insErr) throw new Error(`Insights: ${insErr.message}`);
  console.log(`  ✓ ${RECORD_COUNT} insights`);
}

async function main() {
  const targetUserId = process.argv[2];

  console.log('LifeOS seed — role-based users + 20 records each\n');

  if (targetUserId) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
    await seedUser(targetUserId, {
      email: 'custom@lifeos.demo',
      full_name: profile?.full_name || 'Custom User',
      role: (profile?.role as UserRole) || 'member',
      timezone: profile?.timezone || 'UTC',
    });
    return;
  }

  console.log('Creating / updating demo users...');
  for (const demo of DEMO_USERS) {
    const userId = await ensureDemoUser(demo);
    await seedUser(userId, demo);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('Seed complete! Demo accounts:\n');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(8)} ${u.email.padEnd(22)} password: ${DEMO_PASSWORD}`);
  }
  console.log('\nLog in at http://localhost:3000/login');
  console.log('══════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message || err);
  process.exit(1);
});
