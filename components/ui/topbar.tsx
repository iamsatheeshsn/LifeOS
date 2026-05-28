'use client';

import { getGreeting } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { VoiceButton } from '@/components/ui/voice-button';
import { format } from 'date-fns';
import { Menu } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface TopBarProps {
  userName?: string | null;
}

export function TopBar({ userName }: TopBarProps) {
  const { toggleSidebar } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/60 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold md:text-xl">{getGreeting(userName)}</h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <VoiceButton />
      </div>
    </header>
  );
}
