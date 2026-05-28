import { createClient } from '@/lib/supabase/server';
import { backfillMemoryEmbeddings, backfillAllMemoryEmbeddings } from '@/lib/ai/embeddings';
import { aiGuardResponse, aiErrorResponse } from '@/lib/ai/api-guard';
import { resolveUserRole } from '@/lib/auth/profile';
import { isAdmin } from '@/lib/auth/roles';
import type { UserRole } from '@/types/database';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guard = await aiGuardResponse(user.id);
    if (guard) return guard;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = resolveUserRole(
      profile?.role as UserRole | undefined,
      user.user_metadata?.role
    );
    const body = await request.json().catch(() => ({}));
    const allUsers = body.all === true && isAdmin(role);

    const result = allUsers
      ? await backfillAllMemoryEmbeddings()
      : await backfillMemoryEmbeddings(user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
