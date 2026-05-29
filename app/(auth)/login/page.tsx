'use client';

import { signIn } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(new FormData(event.currentTarget));
      if (result?.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Welcome to LifeOS</h1>
          <p className="mt-2 text-muted-foreground">Your AI-powered life assistant</p>
        </div>

        <div className="glass-card p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
            <Input label="Password" name="password" type="password" required placeholder="••••••••" />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-indigo-500 hover:text-indigo-400">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
