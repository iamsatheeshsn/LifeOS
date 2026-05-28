export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'member' | 'family' | 'partner';
export type MemoryCategory = 'preference' | 'fact' | 'goal' | 'relationship' | 'routine';
export type TaskPriority = 'low' | 'med' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TransactionType = 'income' | 'expense';
export type HabitFrequency = 'daily' | 'weekly';
export type JournalMood = 'great' | 'good' | 'neutral' | 'bad' | 'awful';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  role: UserRole;
  ai_provider?: 'openai' | 'gemini' | null;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  category: MemoryCategory;
  importance: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  recurring: string | null;
  sort_order: number;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string | null;
  occurred_at: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  target_frequency: HabitFrequency;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  remind_at: string;
  for_person: string | null;
  recurring: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: JournalMood;
  ai_summary: string | null;
  created_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  type: string;
  content: string;
  source_data: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; timezone?: string; role?: UserRole; created_at?: string };
        Update: { full_name?: string | null; avatar_url?: string | null; timezone?: string; role?: UserRole };
        Relationships: [];
      };
      memories: {
        Row: Memory;
        Insert: { id?: string; user_id: string; content: string; category: MemoryCategory; embedding?: string | null; importance?: number; created_at?: string };
        Update: Partial<Omit<Memory, 'id'>>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: { id?: string; user_id: string; title: string; description?: string | null; due_date?: string | null; priority?: TaskPriority; status?: TaskStatus; recurring?: string | null; sort_order?: number; created_at?: string };
        Update: Partial<Omit<Task, 'id'>>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: { id?: string; user_id: string; title: string; start_time: string; end_time: string; location?: string | null; color?: string; created_at?: string };
        Update: Partial<Omit<Event, 'id'>>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: { id?: string; user_id: string; amount: number; type: TransactionType; category: string; note?: string | null; occurred_at?: string; created_at?: string };
        Update: Partial<Omit<Transaction, 'id'>>;
        Relationships: [];
      };
      habits: {
        Row: Habit;
        Insert: { id?: string; user_id: string; name: string; icon?: string; color?: string; target_frequency?: HabitFrequency; created_at?: string };
        Update: Partial<Omit<Habit, 'id'>>;
        Relationships: [];
      };
      habit_logs: {
        Row: HabitLog;
        Insert: { id?: string; habit_id: string; user_id: string; completed_at?: string };
        Update: Partial<Omit<HabitLog, 'id'>>;
        Relationships: [];
      };
      reminders: {
        Row: Reminder;
        Insert: { id?: string; user_id: string; title: string; remind_at: string; for_person?: string | null; recurring?: string | null; created_at?: string };
        Update: Partial<Omit<Reminder, 'id'>>;
        Relationships: [];
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: { id?: string; user_id: string; content: string; mood?: JournalMood; ai_summary?: string | null; created_at?: string };
        Update: Partial<Omit<JournalEntry, 'id'>>;
        Relationships: [];
      };
      insights: {
        Row: Insight;
        Insert: { id?: string; user_id: string; type: string; content: string; source_data?: Json; created_at?: string };
        Update: Partial<Omit<Insight, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_memories: {
        Args: { query_embedding: string; match_user_id: string; match_count?: number };
        Returns: Array<{
          id: string;
          content: string;
          category: MemoryCategory;
          importance: number;
          similarity: number;
        }>;
      };
    };
    Enums: {
      user_role: UserRole;
      memory_category: MemoryCategory;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      transaction_type: TransactionType;
      habit_frequency: HabitFrequency;
      journal_mood: JournalMood;
    };
    CompositeTypes: Record<string, never>;
  };
}
