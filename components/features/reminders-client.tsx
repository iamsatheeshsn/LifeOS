'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createReminder, deleteReminder } from '@/lib/actions';
import type { Reminder } from '@/types/database';
import { motion } from 'framer-motion';
import { Plus, Bell, User, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isPast, isFuture } from 'date-fns';

interface RemindersClientProps {
  reminders: Reminder[];
}

export function RemindersClient({ reminders }: RemindersClientProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const upcoming = reminders.filter((r) => isFuture(parseISO(r.remind_at)));
  const past = reminders.filter((r) => isPast(parseISO(r.remind_at)));

  async function handleCreate(formData: FormData) {
    await createReminder({
      title: formData.get('title') as string,
      remind_at: new Date(formData.get('remind_at') as string).toISOString(),
      for_person: (formData.get('for_person') as string) || undefined,
    });
    setShowModal(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteReminder(id);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-sky-500" />
          <h2 className="text-2xl font-bold">Reminders</h2>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Add Reminder
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
          <span className="text-xs text-muted-foreground">{upcoming.length} reminders</span>
        </CardHeader>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No upcoming reminders</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                  <Bell className="h-5 w-5 text-sky-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(r.remind_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                  {r.for_person && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-sky-500">
                      <User className="h-3 w-3" /> For {r.for_person}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:text-red-500"
                  aria-label="Delete reminder"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {past.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2 opacity-50">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm line-through">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(r.remind_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Reminder">
        <form action={handleCreate} className="space-y-4">
          <Input label="Title" name="title" required placeholder="What to remember?" />
          <Input label="When" name="remind_at" type="datetime-local" required />
          <Input label="For Person" name="for_person" placeholder="Optional — e.g. Mom, Partner" />
          <Button type="submit" className="w-full">Create Reminder</Button>
        </form>
      </Modal>
    </div>
  );
}
