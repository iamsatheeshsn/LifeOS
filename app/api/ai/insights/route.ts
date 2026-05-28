import { createClient } from '@/lib/supabase/server';
import { generateStructured } from '@/lib/ai/provider';
import { getUserAIProvider } from '@/lib/ai/config';
import { aiGuardResponse, aiErrorResponse } from '@/lib/ai/api-guard';
import { NextResponse } from 'next/server';
import type { Task, Transaction, JournalEntry } from '@/types/database';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guard = await aiGuardResponse(user.id);
    if (guard) return guard;

    const provider = await getUserAIProvider(user.id);

    const [tasksRes, transactionsRes, habitsRes, journalRes, habitLogsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('transactions').select('*').eq('user_id', user.id).gte('occurred_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('completed_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    const tasks = (tasksRes.data || []) as Task[];
    const transactions = (transactionsRes.data || []) as Transaction[];
    const journalEntries = (journalRes.data || []) as JournalEntry[];

    const dataSummary = {
      tasksCompleted: tasks.filter((t) => t.status === 'done').length,
      tasksPending: tasks.filter((t) => t.status !== 'done').length,
      totalExpenses: transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      totalIncome: transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      expenseCategories: transactions.filter((t) => t.type === 'expense').reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {}),
      habitCount: habitsRes.data?.length || 0,
      habitCompletions: habitLogsRes.data?.length || 0,
      journalEntries: journalEntries.length,
      recentMoods: journalEntries.map((j) => j.mood),
    };

    const insights = await generateStructured<{
      insights: Array<{ type: string; content: string }>;
    }>(
      `Analyze this user's life data from the past 30 days and generate 3-5 personalized insights:\n${JSON.stringify(dataSummary, null, 2)}`,
      `You are a compassionate life coach AI. Generate insights that are encouraging, specific, and actionable. Return JSON: { "insights": [{ "type": "finance"|"health"|"productivity"|"wellness"|"habit", "content": "insight text" }] }`,
      provider
    );

    const saved = [];
    for (const insight of insights.insights || []) {
      const { data } = await supabase
        .from('insights')
        .insert({
          user_id: user.id,
          type: insight.type,
          content: insight.content,
          source_data: dataSummary as Record<string, unknown>,
        })
        .select()
        .single();
      if (data) saved.push(data);
    }

    return NextResponse.json({ insights: saved });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
