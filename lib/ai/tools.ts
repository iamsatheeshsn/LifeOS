import type { ToolDefinition } from '@/lib/ai/provider';
import { createClient } from '@/lib/supabase/server';
import { saveMemory } from '@/lib/ai/memory';

export const AI_TOOLS: ToolDefinition[] = [
  {
    name: 'createTask',
    description: 'Create a new task/to-do item',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Optional description' },
        due_date: { type: 'string', description: 'ISO date string for due date' },
        priority: { type: 'string', enum: ['low', 'med', 'high'] },
      },
      required: ['title'],
    },
  },
  {
    name: 'createEvent',
    description: 'Create a calendar event',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        start_time: { type: 'string', description: 'ISO datetime' },
        end_time: { type: 'string', description: 'ISO datetime' },
        location: { type: 'string' },
      },
      required: ['title', 'start_time', 'end_time'],
    },
  },
  {
    name: 'logTransaction',
    description: 'Log an income or expense transaction',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        type: { type: 'string', enum: ['income', 'expense'] },
        category: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['amount', 'type', 'category'],
    },
  },
  {
    name: 'createReminder',
    description: 'Create a reminder, optionally for a family member',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        remind_at: { type: 'string', description: 'ISO datetime' },
        for_person: { type: 'string', description: 'Person this reminder is for' },
      },
      required: ['title', 'remind_at'],
    },
  },
  {
    name: 'logHabit',
    description: 'Mark a habit as completed for today',
    parameters: {
      type: 'object',
      properties: {
        habit_name: { type: 'string', description: 'Name of the habit to log' },
      },
      required: ['habit_name'],
    },
  },
  {
    name: 'saveMemory',
    description: 'Save a durable fact about the user to long-term memory',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        category: { type: 'string', enum: ['preference', 'fact', 'goal', 'relationship', 'routine'] },
        importance: { type: 'number', description: '1-5 scale' },
      },
      required: ['content', 'category'],
    },
  },
];

export async function executeToolCall(
  userId: string,
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const supabase = await createClient();

  switch (name) {
    case 'createTask': {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: args.title as string,
          description: (args.description as string) || null,
          due_date: (args.due_date as string) || null,
          priority: (args.priority as 'low' | 'med' | 'high') || 'med',
        })
        .select()
        .single();
      if (error) return `Failed to create task: ${error.message}`;
      return `Created task: "${data.title}"`;
    }

    case 'createEvent': {
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: args.title as string,
          start_time: args.start_time as string,
          end_time: args.end_time as string,
          location: (args.location as string) || null,
        })
        .select()
        .single();
      if (error) return `Failed to create event: ${error.message}`;
      return `Created event: "${data.title}" at ${data.start_time}`;
    }

    case 'logTransaction': {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: args.amount as number,
          type: args.type as 'income' | 'expense',
          category: args.category as string,
          note: (args.note as string) || null,
        })
        .select()
        .single();
      if (error) return `Failed to log transaction: ${error.message}`;
      return `Logged ${data.type}: $${data.amount} (${data.category})`;
    }

    case 'createReminder': {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          title: args.title as string,
          remind_at: args.remind_at as string,
          for_person: (args.for_person as string) || null,
        })
        .select()
        .single();
      if (error) return `Failed to create reminder: ${error.message}`;
      return `Created reminder: "${data.title}"`;
    }

    case 'logHabit': {
      const habitName = args.habit_name as string;
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', `%${habitName}%`)
        .limit(1);

      if (!habits?.length) return `No habit found matching "${habitName}"`;
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habits[0].id,
        user_id: userId,
      });
      if (error) return `Failed to log habit: ${error.message}`;
      return `Logged habit: "${habitName}"`;
    }

    case 'saveMemory': {
      const memory = await saveMemory(
        userId,
        args.content as string,
        args.category as 'preference' | 'fact' | 'goal' | 'relationship' | 'routine',
        (args.importance as number) || 3
      );
      if (!memory) return 'Failed to save memory';
      return `Saved memory: "${memory.content}"`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
