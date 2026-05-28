import { AppShell } from '@/components/layout/app-shell';
import { getCurrentUserProfile } from '@/lib/auth/profile';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUserProfile();
  if (!session) redirect('/login');

  const { profile, role } = session;

  return (
    <AppShell userName={profile.full_name} userRole={role}>
      {children}
    </AppShell>
  );
}
