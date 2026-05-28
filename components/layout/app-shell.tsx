'use client';

import { Sidebar, MobileNav } from '@/components/ui/sidebar';
import { TopBar } from '@/components/ui/topbar';
import { AIBanner } from '@/components/features/ai-status';
import type { UserRole } from '@/types/database';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  userName?: string | null;
  userRole?: UserRole;
}

export function AppShell({ children, userName, userRole = 'member' }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar userName={userName} />
        <AIBanner />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileNav userRole={userRole} />
    </div>
  );
}
