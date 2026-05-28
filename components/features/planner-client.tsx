'use client';

import { useState } from 'react';
import { TaskList } from '@/components/features/task-list';
import { EventList } from '@/components/features/event-list';
import { QuickAddBar } from '@/components/features/quick-add-bar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createTask, createEvent } from '@/lib/actions';
import type { Task, Event } from '@/types/database';
import { CalendarDays, CheckSquare, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlannerClientProps {
  tasks: Task[];
  events: Event[];
}

export function PlannerClient({ tasks, events }: PlannerClientProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const router = useRouter();

  async function handleCreateTask(formData: FormData) {
    await createTask({
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      due_date: (formData.get('due_date') as string) || undefined,
      priority: (formData.get('priority') as 'low' | 'med' | 'high') || 'med',
    });
    setShowTaskModal(false);
    router.refresh();
  }

  async function handleCreateEvent(formData: FormData) {
    const startTime = formData.get('start_time') as string;
    const endTime = formData.get('end_time') as string;
    await createEvent({
      title: formData.get('title') as string,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      location: (formData.get('location') as string) || undefined,
    });
    setShowEventModal(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <QuickAddBar />

      <div className="flex gap-2">
        <Button onClick={() => setShowTaskModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
        <Button onClick={() => setShowEventModal(true)} variant="secondary" size="sm">
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-500" />
              <CardTitle>All Tasks</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{tasks.length} total</span>
          </CardHeader>
          <div className="max-h-[min(28rem,60vh)] overflow-y-auto pr-1">
            <TaskList tasks={tasks} draggable />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-500" />
              <CardTitle>Upcoming Events</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">{events.length} events</span>
          </CardHeader>
          <div className="max-h-[min(28rem,60vh)] overflow-y-auto pr-1">
            <EventList events={events} />
          </div>
        </Card>
      </div>

      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="New Task">
        <form action={handleCreateTask} className="space-y-4">
          <Input label="Title" name="title" required placeholder="What needs to be done?" />
          <Input label="Description" name="description" placeholder="Optional details" />
          <Input label="Due Date" name="due_date" type="datetime-local" />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Priority</label>
            <select name="priority" className="input-field">
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Create Task</Button>
        </form>
      </Modal>

      <Modal open={showEventModal} onClose={() => setShowEventModal(false)} title="New Event">
        <form action={handleCreateEvent} className="space-y-4">
          <Input label="Title" name="title" required placeholder="Event name" />
          <Input label="Start" name="start_time" type="datetime-local" required />
          <Input label="End" name="end_time" type="datetime-local" required />
          <Input label="Location" name="location" placeholder="Optional location" />
          <Button type="submit" className="w-full">Create Event</Button>
        </form>
      </Modal>
    </div>
  );
}
