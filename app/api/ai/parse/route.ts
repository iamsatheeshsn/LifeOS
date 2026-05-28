import { createClient } from '@/lib/supabase/server';
import { generateStructured } from '@/lib/ai/provider';
import { getUserAIProvider } from '@/lib/ai/config';
import { aiGuardResponse, aiErrorResponse } from '@/lib/ai/api-guard';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guard = await aiGuardResponse(user.id);
    if (guard) return guard;

    const provider = await getUserAIProvider(user.id);
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    const parsed = await generateStructured<{
      type: 'task' | 'event' | 'reminder' | 'transaction';
      title: string;
      description?: string;
      due_date?: string;
      start_time?: string;
      end_time?: string;
      location?: string;
      amount?: number;
      transaction_type?: 'income' | 'expense';
      category?: string;
      remind_at?: string;
      for_person?: string;
      priority?: 'low' | 'med' | 'high';
    }>(
      `Parse this natural language input into structured data. Current date/time: ${new Date().toISOString()}\n\nInput: "${text}"`,
      `You are a natural language parser for a life management app. Determine if the input is a task, event, reminder, or transaction and extract relevant fields. Return JSON with: type, title, and any relevant fields (due_date, start_time, end_time, location, amount, transaction_type, category, remind_at, for_person, priority). Use ISO 8601 for dates.`,
      provider
    );

    if (parsed.type === 'task') {
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: parsed.title,
        description: parsed.description || null,
        due_date: parsed.due_date || null,
        priority: parsed.priority || 'med',
      });
    } else if (parsed.type === 'event') {
      await supabase.from('events').insert({
        user_id: user.id,
        title: parsed.title,
        start_time: parsed.start_time || new Date().toISOString(),
        end_time: parsed.end_time || new Date(Date.now() + 3600000).toISOString(),
        location: parsed.location || null,
      });
    } else if (parsed.type === 'reminder') {
      await supabase.from('reminders').insert({
        user_id: user.id,
        title: parsed.title,
        remind_at: parsed.remind_at || new Date().toISOString(),
        for_person: parsed.for_person || null,
      });
    } else if (parsed.type === 'transaction') {
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: parsed.amount || 0,
        type: parsed.transaction_type || 'expense',
        category: parsed.category || 'Other',
        note: parsed.description || null,
      });
    }

    return NextResponse.json({ parsed, success: true });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
