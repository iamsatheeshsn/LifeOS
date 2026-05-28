'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Insight } from '@/types/database';
import { motion } from 'framer-motion';
import { Lightbulb, RefreshCw, TrendingUp, Heart, Wallet, CheckSquare, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

const TYPE_CONFIG: Record<string, { icon: typeof Lightbulb; gradient: string }> = {
  finance: { icon: Wallet, gradient: 'from-emerald-500/20 to-teal-500/20' },
  health: { icon: Heart, gradient: 'from-orange-500/20 to-red-500/20' },
  productivity: { icon: CheckSquare, gradient: 'from-indigo-500/20 to-violet-500/20' },
  wellness: { icon: Sparkles, gradient: 'from-fuchsia-500/20 to-pink-500/20' },
  habit: { icon: TrendingUp, gradient: 'from-amber-500/20 to-orange-500/20' },
};

interface InsightsClientProps {
  insights: Insight[];
}

export function InsightsClient({ insights }: InsightsClientProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generateInsights() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate insights');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error — try again');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-pink-500" />
          <div>
            <h2 className="text-2xl font-bold">Life Insights</h2>
            <p className="text-sm text-muted-foreground">AI-powered patterns and nudges</p>
          </div>
        </div>
        <Button onClick={generateInsights} disabled={generating} size="sm">
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {insights.length === 0 ? (
        <Card className="py-12 text-center">
          <Lightbulb className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No insights yet. Add some data and click &quot;Generate Insights&quot; to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, i) => {
            const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.wellness;
            const Icon = config.icon;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card gradient={config.gradient} hover>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {insight.type}
                      </span>
                      <p className="mt-1 text-sm leading-relaxed">{insight.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(parseISO(insight.created_at), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
