'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import { resolveUserRole } from '@/lib/auth/profile';
import type { UserRole } from '@/types/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = resolveUserRole(
    profile?.role as UserRole | undefined,
    user.user_metadata?.role
  );

  if (!isAdmin(role)) {
    redirect('/today');
  }

  return user;
}

type AdminUser = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

async function fetchAdminUsers(service: Awaited<ReturnType<typeof createServiceClient>>): Promise<AdminUser[]> {
  const withRole = await service.from('profiles').select('id, full_name, role, created_at');
  if (!withRole.error) return (withRole.data || []) as AdminUser[];

  const [profilesRes, authRes] = await Promise.all([
    service.from('profiles').select('id, full_name, created_at'),
    service.auth.admin.listUsers(),
  ]);

  const metadataById = new Map(
    authRes.data?.users?.map((u) => [u.id, u.user_metadata?.role]) || []
  );

  return (profilesRes.data || []).map((profile) => ({
    ...profile,
    role: resolveUserRole(undefined, metadataById.get(profile.id)),
  }));
}

export async function getAdminStats() {
  await requireAdmin();
  const service = await createServiceClient();

  const [profiles, tasksRes, memoriesRes] = await Promise.all([
    fetchAdminUsers(service),
    service.from('tasks').select('id', { count: 'exact', head: true }),
    service.from('memories').select('id, embedding', { count: 'exact' }),
  ]);
  const memories = memoriesRes.data || [];
  const withEmbeddings = memories.filter((m) => m.embedding != null).length;

  return {
    users: profiles,
    totalTasks: tasksRes.count || 0,
    totalMemories: memories.length,
    memoriesWithEmbeddings: withEmbeddings,
    memoriesMissingEmbeddings: memories.length - withEmbeddings,
  };
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin();
  const service = await createServiceClient();
  const { error } = await service.from('profiles').update({ role }).eq('id', userId);

  if (!error) {
    revalidatePath('/admin');
    return { success: true };
  }

  if (error.code === '42703') {
    const { data: authUser, error: fetchError } = await service.auth.admin.getUserById(userId);
    if (fetchError) return { error: fetchError.message };

    const { error: updateError } = await service.auth.admin.updateUserById(userId, {
      user_metadata: { ...authUser.user?.user_metadata, role },
    });
    if (updateError) return { error: updateError.message };

    revalidatePath('/admin');
    return { success: true };
  }

  return { error: error.message };
}
