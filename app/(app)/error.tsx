'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">Could not load this page</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'Please try again.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
