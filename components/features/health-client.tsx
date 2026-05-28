'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createHabit, logHabit, deleteHabit } from '@/lib/actions';
import type { Habit, HabitLog } from '@/types/database';
import { motion } from 'framer-motion';
import { Plus, Flame, Trash2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, parseISO, subDays, isSameDay } from 'date-fns';
import confetti from 'canvas-confetti';
import { getHabitIcon, HABIT_ICONS, HABIT_COLORS } from '@/lib/habit-icons';

interface HealthClientProps {
  habits: Habit[];
  logs: HabitLog[];
}

function getStreak(logs: HabitLog[]): number {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < sorted.length; i++) {
    const logDate = new Date(sorted[i].completed_at);
    logDate.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (isSameDay(logDate, expected)) streak++;
    else break;
  }
  return streak;
}

function Heatmap({ logs, color }: { logs: HabitLog[]; color: string }) {
  const days = Array.from({ length: 84 }, (_, i) => subDays(new Date(), 83 - i));
  const logDates = new Set(logs.map((l) => format(parseISO(l.completed_at), 'yyyy-MM-dd')));

  return (
    <div className="grid grid-cols-[repeat(12,1fr)] gap-1">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const active = logDates.has(key);
        return (
          <div
            key={key}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: active ? color : `${color}15` }}
            title={format(day, 'MMM d')}
          />
        );
      })}
    </div>
  );
}

export function HealthClient({ habits, logs }: HealthClientProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    await createHabit({
      name: formData.get('name') as string,
      icon: formData.get('icon') as string,
      color: formData.get('color') as string,
      target_frequency: formData.get('frequency') as 'daily' | 'weekly',
    });
    setShowModal(false);
    router.refresh();
  }

  async function handleLog(habitId: string) {
    await logHabit(habitId);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 }, colors: ['#f97316', '#fb7185'] });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteHabit(id);
    router.refresh();
  }

  const todayLogs = logs.filter((l) => isSameDay(parseISO(l.completed_at), new Date()));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health & Habits</h2>
          <p className="text-sm text-muted-foreground">{todayLogs.length}/{habits.length} completed today</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> New Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">Start building healthy routines by adding your first habit.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit, i) => {
            const habitLogs = logs.filter((l) => l.habit_id === habit.id);
            const streak = getStreak(habitLogs);
            const completedToday = habitLogs.some((l) => isSameDay(parseISO(l.completed_at), new Date()));
            const Icon = getHabitIcon(habit.icon);
            const weekLogs = habitLogs.filter((l) => {
              const d = parseISO(l.completed_at);
              return d >= subDays(new Date(), 7);
            }).length;

            return (
              <motion.div key={habit.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{habit.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {streak > 0 && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <Flame className="h-3.5 w-3.5" /> {streak} day streak
                            </span>
                          )}
                          <span>{weekLogs}/7 this week</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => !completedToday && handleLog(habit.id)}
                        disabled={completedToday}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                          completedToday
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'border border-border hover:bg-muted'
                        )}
                        aria-label="Complete habit"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Delete habit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Last 12 weeks</p>
                    <Heatmap logs={habitLogs} color={habit.color} />
                  </div>

                  {/* Weekly progress ring */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-12 w-12">
                      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke={`${habit.color}20`} strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={habit.color} strokeWidth="3"
                          strokeDasharray={`${(weekLogs / 7) * 94.2} 94.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        {weekLogs}/7
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Weekly progress</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Habit">
        <form action={handleCreate} className="space-y-4">
          <Input label="Habit Name" name="name" required placeholder="e.g. Morning meditation" />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Icon</label>
            <select name="icon" className="input-field">
              {HABIT_ICONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Color</label>
            <select name="color" className="input-field">
              {HABIT_COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Frequency</label>
            <select name="frequency" className="input-field">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Create Habit</Button>
        </form>
      </Modal>
    </div>
  );
}
