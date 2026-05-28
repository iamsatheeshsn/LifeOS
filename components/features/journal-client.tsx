'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createJournalEntry, deleteJournalEntry } from '@/lib/actions';
import { getMoodEmoji, MOOD_OPTIONS } from '@/lib/utils';
import type { JournalEntry, JournalMood } from '@/types/database';
import { motion } from 'framer-motion';
import { BookOpen, Trash2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface JournalClientProps {
  entries: JournalEntry[];
}

export function JournalClient({ entries }: JournalClientProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalMood>('neutral');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (!content.trim() || saving) return;
    setSaving(true);
    await createJournalEntry({ content: content.trim(), mood });
    setContent('');
    setMood('neutral');
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteJournalEntry(id);
    router.refresh();
  }

  const entriesByDate = entries.reduce((acc: Record<string, JournalEntry[]>, entry) => {
    const date = format(parseISO(entry.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-fuchsia-500" />
        <h2 className="text-2xl font-bold">Journal</h2>
      </div>

      <Card gradient="from-violet-500/5 to-fuchsia-500/5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today?"
          className="min-h-[160px] border-0 bg-transparent text-base"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={cn(
                  'rounded-xl px-2.5 py-1.5 text-lg transition-all',
                  mood === m.value ? 'bg-violet-500/10 ring-2 ring-violet-500/30' : 'hover:bg-muted'
                )}
                aria-label={m.label}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <Button onClick={handleSave} disabled={!content.trim() || saving}>
            {saving ? 'Saving...' : 'Save Entry'}
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        {Object.entries(entriesByDate).map(([date, dayEntries]) => (
          <div key={date}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-3">
              {dayEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
                    {entry.ai_summary && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-500/5 p-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                        <p className="text-xs text-muted-foreground">{entry.ai_summary}</p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(parseISO(entry.created_at), 'h:mm a')}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <Card className="py-12 text-center">
            <p className="text-muted-foreground">Your journal is empty. Start writing above!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
