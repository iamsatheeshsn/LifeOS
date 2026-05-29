import type { UserRole } from '@/types/database';

export type AppRoute =
  | '/today'
  | '/planner'
  | '/finance'
  | '/health'
  | '/journal'
  | '/reminders'
  | '/memory'
  | '/insights'
  | '/settings'
  | '/admin';

const ROLE_ROUTES: Record<UserRole, AppRoute[]> = {
  admin: [
    '/today', '/planner', '/finance', '/health', '/journal',
    '/reminders', '/memory', '/insights', '/settings', '/admin',
  ],
  member: [
    '/today', '/planner', '/finance', '/health', '/journal',
    '/reminders', '/memory', '/insights', '/settings',
  ],
  family: [
    '/today', '/reminders', '/health', '/journal', '/memory', '/settings',
  ],
  partner: [
    '/today', '/planner', '/reminders', '/journal', '/health', '/memory', '/settings',
  ],
};

export function getRoutesForRole(role: UserRole | null | undefined): AppRoute[] {
  return ROLE_ROUTES[role || 'member'] ?? ROLE_ROUTES.member;
}

export function canAccessRoute(role: UserRole | null | undefined, pathname: string): boolean {
  const routes = getRoutesForRole(role);
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

export const USER_ROLES: UserRole[] = ['admin', 'member', 'family', 'partner'];

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access including Admin panel',
  member: 'All life modules (tasks, finance, health, etc.)',
  family: 'Reminders, health, journal, and memory',
  partner: 'Planner, reminders, journal, health, and memory',
};

export const ROUTE_LABELS: Record<AppRoute, string> = {
  '/today': 'Today',
  '/planner': 'Planner',
  '/finance': 'Finance',
  '/health': 'Health',
  '/journal': 'Journal',
  '/reminders': 'Reminders',
  '/memory': 'Memory',
  '/insights': 'Insights',
  '/settings': 'Settings',
  '/admin': 'Admin',
};
