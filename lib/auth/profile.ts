import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types/database';

const VALID_ROLES: UserRole[] = ['admin', 'member', 'family', 'partner'];

export function resolveUserRole(
  profileRole?: UserRole | null,
  metadataRole?: unknown
): UserRole {
  if (profileRole && VALID_ROLES.includes(profileRole)) return profileRole;
  if (typeof metadataRole === 'string' && VALID_ROLES.includes(metadataRole as UserRole)) {
    return metadataRole as UserRole;
  }
  return 'member';
}

export async function getCurrentUserProfile(): Promise<{
  user: { id: string; email: string | undefined };
  profile: Profile;
  role: UserRole;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = resolveUserRole(profile?.role as UserRole | undefined, user.user_metadata?.role);

  return {
    user: { id: user.id, email: user.email },
    profile: {
      id: user.id,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      timezone: profile?.timezone ?? 'UTC',
      role,
      ai_provider: profile?.ai_provider ?? null,
      created_at: profile?.created_at ?? new Date().toISOString(),
    },
    role,
  };
}
