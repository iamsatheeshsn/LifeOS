'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createMemory, updateMemory, deleteMemory } from '@/lib/actions';
import type { Memory, MemoryCategory } from '@/types/database';
import { motion } from 'framer-motion';
import { Brain, Plus, Trash2, Pencil, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  preference: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  fact: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  goal: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  relationship: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  routine: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

function IndexMemoriesButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleIndex() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/ai/embed-memories', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Indexing failed');
      } else {
        setMessage(`Indexed ${data.updated} memories`);
        router.refresh();
      }
    } catch {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={handleIndex} disabled={loading} size="sm">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Index
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}

interface MemoryClientProps {
  memories: Memory[];
}

export function MemoryClient({ memories }: MemoryClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    await createMemory({
      content: formData.get('content') as string,
      category: formData.get('category') as MemoryCategory,
      importance: parseInt(formData.get('importance') as string) || 3,
    });
    setShowModal(false);
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editing) return;
    await updateMemory(editing.id, {
      content: formData.get('content') as string,
      category: formData.get('category') as MemoryCategory,
      importance: parseInt(formData.get('importance') as string) || 3,
    });
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteMemory(id);
    router.refresh();
  }

  const grouped = memories.reduce((acc: Record<string, Memory[]>, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold">AI Memory</h2>
            <p className="text-sm text-muted-foreground">What your AI knows about you</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <IndexMemoriesButton />
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus className="h-4 w-4" /> Add Memory
          </Button>
        </div>
      </div>

      {memories.length === 0 ? (
        <Card className="py-12 text-center">
          <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No memories yet. Chat with the AI or write journal entries to build your memory.
          </p>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-3 capitalize text-sm font-medium text-muted-foreground">{category}s</h3>
            <div className="space-y-2">
              {items.map((memory, i) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-lg px-2 py-0.5 text-xs font-medium capitalize', CATEGORY_COLORS[memory.category])}>
                            {memory.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Importance: {'★'.repeat(memory.importance)}{'☆'.repeat(5 - memory.importance)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{memory.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(parseISO(memory.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setEditing(memory)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label="Edit memory"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(memory.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                          aria-label="Delete memory"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Memory">
        <form action={handleCreate} className="space-y-4">
          <Textarea label="Content" name="content" required placeholder="Something the AI should remember..." />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select name="category" className="input-field">
              <option value="fact">Fact</option>
              <option value="preference">Preference</option>
              <option value="goal">Goal</option>
              <option value="relationship">Relationship</option>
              <option value="routine">Routine</option>
            </select>
          </div>
          <Input label="Importance (1-5)" name="importance" type="number" min={1} max={5} defaultValue={3} />
          <Button type="submit" className="w-full">Save Memory</Button>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Memory">
        {editing && (
          <form action={handleUpdate} className="space-y-4">
            <Textarea label="Content" name="content" required defaultValue={editing.content} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <select name="category" className="input-field" defaultValue={editing.category}>
                <option value="fact">Fact</option>
                <option value="preference">Preference</option>
                <option value="goal">Goal</option>
                <option value="relationship">Relationship</option>
                <option value="routine">Routine</option>
              </select>
            </div>
            <Input label="Importance (1-5)" name="importance" type="number" min={1} max={5} defaultValue={editing.importance} />
            <Button type="submit" className="w-full">Update Memory</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
