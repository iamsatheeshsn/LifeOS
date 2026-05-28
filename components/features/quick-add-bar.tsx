'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickAddBar() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to parse input' });
        return;
      }

      setFeedback({
        type: 'success',
        message: `Created ${data.parsed?.type || 'item'}: "${data.parsed?.title}"`,
      });
      setText('');
      router.refresh();
    } catch {
      setFeedback({ type: 'error', message: 'Network error — try again' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/50 p-2 backdrop-blur-sm">
          <Sparkles className="ml-2 h-5 w-5 shrink-0 text-indigo-500" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Quick add: "lunch with mom tomorrow at 1pm"...'
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            disabled={loading}
          />
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-500" />}
        </div>
      </form>
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {feedback.message}
        </div>
      )}
    </div>
  );
}
