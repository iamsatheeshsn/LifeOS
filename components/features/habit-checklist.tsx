'use client';

import { logHabit } from '@/lib/actions';
import type { Habit, HabitLog } from '@/types/database';
import { motion } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isSameDay, parseISO } from 'date-fns';
import { getHabitIcon } from '@/lib/habit-icons';

interface HabitChecklistProps {
  habits: Habit[];
  logs: HabitLog[];
}

function getStreak(logs: HabitLog[]): number {
  if (!logs.length) return 0;
  const sorted = [...logs].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const logDate = new Date(sorted[i].completed_at);
    logDate.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);

    if (isSameDay(logDate, expected)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function HabitChecklist({ habits, logs }: HabitChecklistProps) {
  const router = useRouter();
  const today = new Date();

  async function handleLog(habitId: string) {
    await logHabit(habitId);
    confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 }, colors: ['#f97316', '#fb7185', '#fbbf24'] });
    router.refresh();
  }

  if (!habits.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">No habits tracked yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((habit, i) => {
        const habitLogs = logs.filter((l) => l.habit_id === habit.id);
        const completedToday = habitLogs.some((l) => isSameDay(parseISO(l.completed_at), today));
        const streak = getStreak(habitLogs);
        const Icon = getHabitIcon(habit.icon);

        return (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5"
          >
            <button
              onClick={() => !completedToday && handleLog(habit.id)}
              disabled={completedToday}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                completedToday ? 'opacity-60' : 'hover:scale-110 active:scale-95'
              )}
              style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
              aria-label={`Log ${habit.name}`}
            >
              {completedToday ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <p className={cn('text-sm font-medium', completedToday && 'line-through opacity-60')}>
                {habit.name}
              </p>
            </div>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                <Flame className="h-3.5 w-3.5" /> {streak}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
