'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { getRoutesForRole } from '@/lib/auth/roles';
import type { UserRole } from '@/types/database';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Brain,
  BookOpen,
  Bell,
  Wallet,
  Settings,
  ChevronLeft,
  Sparkles,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ALL_NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: LayoutDashboard, color: 'text-indigo-500' },
  { href: '/planner', label: 'Planner', icon: CalendarDays, color: 'text-violet-500' },
  { href: '/finance', label: 'Finance', icon: Wallet, color: 'text-emerald-500' },
  { href: '/health', label: 'Health', icon: Heart, color: 'text-orange-500' },
  { href: '/journal', label: 'Journal', icon: BookOpen, color: 'text-fuchsia-500' },
  { href: '/reminders', label: 'Reminders', icon: Bell, color: 'text-sky-500' },
  { href: '/memory', label: 'Memory', icon: Brain, color: 'text-amber-500' },
  { href: '/insights', label: 'Insights', icon: Lightbulb, color: 'text-pink-500' },
  { href: '/admin', label: 'Admin', icon: Shield, color: 'text-red-500' },
  { href: '/settings', label: 'Settings', icon: Settings, color: 'text-muted-foreground' },
] as const;

function getNavItems(role: UserRole) {
  const allowed = getRoutesForRole(role);
  return ALL_NAV_ITEMS.filter((item) => allowed.includes(item.href as typeof allowed[number]));
}

interface SidebarProps {
  userRole?: UserRole;
}

export function Sidebar({ userRole = 'member' }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navItems = getNavItems(userRole);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
      className="hidden h-screen flex-col border-r border-border bg-card/30 backdrop-blur-xl md:flex"
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-lg font-bold gradient-text">LifeOS</span>
            <p className="text-xs capitalize text-muted-foreground">{userRole}</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive ? item.color : '')} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="mx-3 mb-4 flex items-center justify-center rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft
          className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')}
        />
      </button>
    </motion.aside>
  );
}

export function MobileNav({ userRole = 'member' }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(userRole).slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                isActive ? item.color : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
