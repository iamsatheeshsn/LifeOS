'use client';

import { cn, getPriorityColor, formatTime } from '@/lib/utils';
import { updateTask, deleteTask, reorderTasks } from '@/lib/actions';
import type { Task } from '@/types/database';
import { Reorder, useDragControls } from 'framer-motion';
import { Check, Circle, GripVertical, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TaskListProps {
  tasks: Task[];
  draggable?: boolean;
}

function TaskRow({
  task,
  draggable,
  onToggle,
  onDelete,
}: {
  task: Task;
  draggable: boolean;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5 transition-all hover:bg-card',
        task.status === 'done' && 'opacity-60'
      )}
    >
      {draggable ? (
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab touch-none text-muted-foreground/50 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 shrink-0" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onToggle(task)}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          task.status === 'done'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-muted-foreground/30 hover:border-indigo-500'
        )}
        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.status === 'done' ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Circle className="h-3 w-3 text-transparent" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', task.status === 'done' && 'line-through')}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-muted-foreground">Due {formatTime(task.due_date)}</p>
        )}
      </div>
      <span className={cn('rounded-lg px-2 py-0.5 text-xs font-medium', getPriorityColor(task.priority))}>
        {task.priority}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </Reorder.Item>
  );
}

function StaticTaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5 transition-all hover:bg-card',
        task.status === 'done' && 'opacity-60'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          task.status === 'done'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-muted-foreground/30 hover:border-indigo-500'
        )}
        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.status === 'done' ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Circle className="h-3 w-3 text-transparent" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', task.status === 'done' && 'line-through')}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-muted-foreground">Due {formatTime(task.due_date)}</p>
        )}
      </div>
      <span className={cn('rounded-lg px-2 py-0.5 text-xs font-medium', getPriorityColor(task.priority))}>
        {task.priority}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TaskList({ tasks, draggable = false }: TaskListProps) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: newStatus });
    if (newStatus === 'done') {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    router.refresh();
  }

  async function handleReorder(newOrder: Task[]) {
    setItems(newOrder);
    await reorderTasks(newOrder.map((t) => t.id));
    router.refresh();
  }

  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No tasks yet. Add one above!
      </p>
    );
  }

  if (draggable) {
    return (
      <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
        {items.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            draggable
            onToggle={toggleTask}
            onDelete={handleDelete}
          />
        ))}
      </Reorder.Group>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((task) => (
        <StaticTaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={handleDelete} />
      ))}
    </div>
  );
}
