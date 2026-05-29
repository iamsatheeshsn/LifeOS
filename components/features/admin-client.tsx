'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAdminUser, updateUserRole } from '@/lib/admin/actions';
import type { AdminUser } from '@/lib/admin/actions';
import type { UserRole } from '@/types/database';
import { ROLE_DESCRIPTIONS, USER_ROLES } from '@/lib/auth/roles';
import { Shield, Users, Database, Brain, RefreshCw, UserPlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface AdminClientProps {
  stats: {
    users: AdminUser[];
    totalTasks: number;
    totalMemories: number;
    memoriesWithEmbeddings: number;
    memoriesMissingEmbeddings: number;
  };
}

export function AdminClient({ stats }: AdminClientProps) {
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleBackfill() {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await fetch('/api/ai/embed-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBackfillResult(data.error || 'Backfill failed');
      } else {
        setBackfillResult(`Updated ${data.updated} memories (${data.skipped} skipped)`);
        router.refresh();
      }
    } catch {
      setBackfillResult('Network error');
    } finally {
      setBackfilling(false);
    }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    const result = await updateUserRole(userId, role);
    if (result?.error) {
      setCreateError(result.error);
      return;
    }
    setCreateError('');
    router.refresh();
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const result = await createAdminUser(new FormData(event.currentTarget));
      if (result?.error) {
        setCreateError(result.error);
        return;
      }
      if (result?.message) {
        setCreateSuccess(result.message);
        event.currentTarget.reset();
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-red-500" />
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Create users by role and manage AI memory embeddings</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 text-indigo-500">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Users</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.users.length}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-violet-500">
            <Database className="h-5 w-5" />
            <span className="text-sm font-medium">Total Tasks</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.totalTasks}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-amber-500">
            <Brain className="h-5 w-5" />
            <span className="text-sm font-medium">Memory Embeddings</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {stats.memoriesWithEmbeddings}/{stats.totalMemories}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create User
          </CardTitle>
        </CardHeader>
        {createError && (
          <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {createError}
          </div>
        )}
        {createSuccess && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            {createSuccess}
          </div>
        )}
        <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" name="fullName" required placeholder="Jane Doe" />
          <Input label="Email" name="email" type="email" required placeholder="jane@example.com" />
          <Input label="Password" name="password" type="password" required minLength={6} placeholder="••••••••" />
          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-sm font-medium text-foreground/80">
              Role
            </label>
            <select id="role" name="role" required defaultValue="member" className="input-field w-full text-sm">
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role} — {ROLE_DESCRIPTIONS[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating} size="sm">
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Memory Embeddings</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          {stats.memoriesMissingEmbeddings} memories missing vector embeddings.
          Backfill enables semantic search and AI context recall.
        </p>
        <Button onClick={handleBackfill} disabled={backfilling} size="sm">
          <RefreshCw className={`h-4 w-4 ${backfilling ? 'animate-spin' : ''}`} />
          {backfilling ? 'Backfilling...' : 'Backfill All Embeddings'}
        </Button>
        {backfillResult && (
          <p className="mt-3 text-sm text-muted-foreground">{backfillResult}</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {stats.users.length === 0 && (
            <p className="text-sm text-muted-foreground">No users yet. Create one above.</p>
          )}
          {stats.users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">{user.full_name || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground">
                  {user.email || 'No email'} · Joined {format(parseISO(user.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                className="input-field w-auto text-sm"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
