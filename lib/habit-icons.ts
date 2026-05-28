import {
  Sparkles, Heart, Dumbbell, BookOpen, Droplets, Moon, Sun, Apple, Brain, Footprints,
  type LucideIcon,
} from 'lucide-react';

const HABIT_ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  heart: Heart,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  droplets: Droplets,
  moon: Moon,
  sun: Sun,
  apple: Apple,
  brain: Brain,
  footprints: Footprints,
};

export function getHabitIcon(name: string): LucideIcon {
  return HABIT_ICON_MAP[name] || Sparkles;
}

export const HABIT_ICONS = Object.keys(HABIT_ICON_MAP);
export const HABIT_COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
