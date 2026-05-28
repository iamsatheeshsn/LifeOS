import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'h:mm a');
}

export function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${timeGreeting}, ${name.split(' ')[0]}` : timeGreeting;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-coral-500 bg-coral-500/10';
    case 'low':
      return 'text-sky-500 bg-sky-500/10';
    default:
      return 'text-amber-500 bg-amber-500/10';
  }
}

export function getMoodEmoji(mood: string): string {
  switch (mood) {
    case 'great':
      return '😄';
    case 'good':
      return '🙂';
    case 'neutral':
      return '😐';
    case 'bad':
      return '😔';
    case 'awful':
      return '😢';
    default:
      return '😐';
  }
}

export const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'bad', label: 'Bad', emoji: '😔' },
  { value: 'awful', label: 'Awful', emoji: '😢' },
] as const;

export const EXPENSE_CATEGORIES = [
  'Dining', 'Groceries', 'Transport', 'Shopping', 'Entertainment',
  'Bills', 'Health', 'Travel', 'Education', 'Other',
];

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

export const MODULE_COLORS = {
  planner: { from: 'from-indigo-500', to: 'to-violet-500', accent: 'indigo' },
  finance: { from: 'from-emerald-500', to: 'to-teal-500', accent: 'emerald' },
  health: { from: 'from-orange-500', to: 'to-coral-500', accent: 'orange' },
  journal: { from: 'from-violet-500', to: 'to-fuchsia-500', accent: 'violet' },
  memory: { from: 'from-amber-500', to: 'to-orange-500', accent: 'amber' },
  reminders: { from: 'from-sky-500', to: 'to-blue-500', accent: 'sky' },
  insights: { from: 'from-fuchsia-500', to: 'to-pink-500', accent: 'fuchsia' },
} as const;
