'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';

export function useAIStatus() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured);
        setMessage(data.message);
      })
      .catch(() => setConfigured(false));
  }, []);

  return { configured, message, loading: configured === null };
}

export function AIBanner() {
  const { configured, message, loading } = useAIStatus();

  if (loading || configured) return null;

  return (
    <div className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 md:mx-6">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
      <div>
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">AI features disabled</p>
        <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
          {message || 'Add your API key to .env.local and restart the dev server.'}
        </p>
      </div>
      <Sparkles className="ml-auto h-4 w-4 shrink-0 text-amber-500/50" />
    </div>
  );
}

export function showAIError(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-error', { detail: message }));
  }
}
