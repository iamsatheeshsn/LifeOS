'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAdmin, USER_ROLES } from '@/lib/auth/roles';
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

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

async function syncUserRole(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  role: UserRole,
  fullName?: string | null
) {
  const profileUpdate: { role: UserRole; full_name?: string } = { role };
  if (fullName) profileUpdate.full_name = fullName;

  const { error: profileError } = await service
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId);

  if (!profileError) return null;

  if (profileError.code === '42703') {
    const { data: authUser, error: fetchError } = await service.auth.admin.getUserById(userId);
    if (fetchError) return fetchError.message;

    const metadata: Record<string, unknown> = {
      ...authUser.user?.user_metadata,
      role,
    };
    if (fullName) metadata.full_name = fullName;

    const { error: updateError } = await service.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });
    return updateError?.message ?? null;
  }

  return profileError.message;
}

async function fetchAdminUsers(service: Awaited<ReturnType<typeof createServiceClient>>): Promise<AdminUser[]> {
  const authRes = await service.auth.admin.listUsers();
  const emailById = new Map(
    authRes.data?.users?.map((u) => [u.id, u.email ?? null]) || []
  );
  const metadataById = new Map(
    authRes.data?.users?.map((u) => [u.id, u.user_metadata?.role]) || []
  );

  const withRole = await service.from('profiles').select('id, full_name, role, created_at');
  if (!withRole.error) {
    return (withRole.data || []).map((profile) => ({
      ...profile,
      email: emailById.get(profile.id) ?? null,
      role: resolveUserRole(profile.role as UserRole | undefined, metadataById.get(profile.id)),
    }));
  }

  const profilesRes = await service.from('profiles').select('id, full_name, created_at');

  return (profilesRes.data || []).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? null,
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

export async function createAdminUser(formData: FormData) {
  await requireAdmin();

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string)?.trim();
  const roleInput = formData.get('role') as string;

  if (!email || !password || !fullName) {
    return { error: 'Full name, email, and password are required' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }
  if (!isValidRole(roleInput)) {
    return { error: 'Invalid role selected' };
  }

  const service = await createServiceClient();
  const { data: existing } = await service.auth.admin.listUsers();
  if (existing?.users?.some((u) => u.email?.toLowerCase() === email.toLowerCase())) {
    return { error: 'A user with this email already exists' };
  }

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: roleInput },
  });

  if (error || !data.user) {
    return { error: error?.message || 'Failed to create user' };
  }

  const syncError = await syncUserRole(service, data.user.id, roleInput, fullName);
  if (syncError) {
    return { error: `User created but role sync failed: ${syncError}` };
  }

  revalidatePath('/admin');
  return { success: true, message: `Created ${roleInput} user ${email}` };
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin();
  if (!isValidRole(role)) return { error: 'Invalid role' };

  const service = await createServiceClient();
  const syncError = await syncUserRole(service, userId, role);
  if (syncError) return { error: syncError };

  revalidatePath('/admin');
  return { success: true };
}
