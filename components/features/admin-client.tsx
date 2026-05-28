'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateUserRole } from '@/lib/admin/actions';
import type { UserRole } from '@/types/database';
import { Shield, Users, Database, Brain, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface AdminClientProps {
  stats: {
    users: Array<{ id: string; full_name: string | null; role: UserRole; created_at: string }>;
    totalTasks: number;
    totalMemories: number;
    memoriesWithEmbeddings: number;
    memoriesMissingEmbeddings: number;
  };
}

const ROLES: UserRole[] = ['admin', 'member', 'family', 'partner'];

export function AdminClient({ stats }: AdminClientProps) {
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
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
    await updateUserRole(userId, role);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-red-500" />
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage users, roles, and AI memory embeddings</p>
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
          {stats.users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">{user.full_name || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {format(parseISO(user.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                className="input-field w-auto text-sm"
              >
                {ROLES.map((r) => (
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
