'use client';

import { signUp } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

export default function SignUpPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(event.currentTarget);

    try {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.message) {
        setSuccess(result.message);
        event.currentTarget.reset();
      }
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
          <h1 className="text-3xl font-bold gradient-text">Create your account</h1>
          <p className="mt-2 text-muted-foreground">Start organizing your life with AI</p>
        </div>

        <div className="glass-card p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="fullName" required placeholder="Jane Doe" />
            <Input label="Email" name="email" type="email" required placeholder="you@gmail.com" />
            <Input label="Password" name="password" type="password" required minLength={6} placeholder="••••••••" />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-500 hover:text-indigo-400">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
