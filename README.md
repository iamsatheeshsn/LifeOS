# LifeOS — AI-Powered Life Assistant

A beautiful, all-in-one web app that replaces Notes, Calendar, To-do apps, Habit trackers, and AI assistants. Built with Next.js 14, Supabase, and OpenAI/Gemini.

![LifeOS](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## Features

- **Today Dashboard** — Tasks, events, habits, and reminders at a glance with natural language quick-add
- **Planner** — Full task management with drag-to-reorder and calendar events
- **Finance** — Income/expense tracking with donut and line charts, animated totals
- **Health** — Habit tracker with streaks, GitHub-style heatmaps, and weekly progress rings
- **Journal** — Mood-tagged entries with AI-generated summaries and memory extraction
- **Reminders** — Family reminders tagged to people with upcoming feed
- **AI Memory** — Semantic memory store with vector search, view/edit/delete what AI knows
- **Life Insights** — AI-generated pattern cards from your data
- **Voice Assistant** — Web Speech API with tool calling (create tasks, log expenses, etc.)
- **Dark/Light Mode** — Gorgeous glassmorphism UI with vibrant gradients

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | Supabase (Postgres, Auth, RLS, Realtime) |
| AI | OpenAI (primary) / Google Gemini (fallback) |
| State | React Server Components + Zustand |
| Charts | Recharts |
| Hosting | Vercel |

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url> ai-life-os
cd ai-life-os
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and keys from Settings → API

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
AI_PROVIDER=openai
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start using LifeOS.

### 5. Seed demo data

Run migration `002_add_user_roles.sql` in the SQL Editor, then:

```bash
npm run seed
```

With an AI key set, seed also generates memory embeddings automatically. To backfill later:

```bash
npm run seed:embeddings
```

This creates **4 role-based demo users**, each with **20+ records** per entity:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@lifeos.demo | Demo123! | All modules + Admin panel |
| Member | member@lifeos.demo | Demo123! | Full access |
| Family | family@lifeos.demo | Demo123! | Today, Reminders, Health, Journal, Memory |
| Partner | partner@lifeos.demo | Demo123! | Today, Planner, Reminders, Journal, Health, Memory |

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. In Supabase, add your Vercel URL to Authentication → URL Configuration → Redirect URLs

## Project Structure

```
app/
  (auth)/login, signup     — Authentication pages
  (app)/
    today/                 — Daily dashboard (default)
    planner/               — Tasks + calendar
    finance/               — Income/expense tracking
    health/                — Habit tracker
    journal/               — Smart journaling
    reminders/             — Family reminders
    memory/                — AI memory viewer
    insights/              — AI life insights
    settings/              — Profile & preferences
  api/ai/                  — AI route handlers
lib/
  supabase/                — Client, server, middleware
  ai/                      — Provider, memory, tools, context
components/
  ui/                      — Design system components
  features/                — Feature-specific components
  layout/                  — App shell
supabase/migrations/       — SQL schema + RLS
scripts/seed.ts            — Demo data seeder
```

## AI Architecture

- **`lib/ai/provider.ts`** — Unified interface: `generateText`, `generateStructured`, `embed`, `chatWithTools`
- **`lib/ai/memory.ts`** — Vector similarity search via pgvector, auto-extraction from chat/journal
- **`lib/ai/tools.ts`** — Function calling: createTask, createEvent, logTransaction, createReminder, logHabit, saveMemory
- Switch providers via `AI_PROVIDER=openai` or `AI_PROVIDER=gemini` in env

## License

MIT
# LifeOS
