import { getAdminStats } from '@/lib/admin/actions';
import { AdminClient } from '@/components/features/admin-client';

export default async function AdminPage() {
  const stats = await getAdminStats();
  return <AdminClient stats={stats} />;
}
