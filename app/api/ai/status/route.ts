import {
  isAIConfigured,
  getAIConfigMessage,
  getUserAIProvider,
  getDefaultAIProvider,
} from '@/lib/ai/config';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const provider = user ? await getUserAIProvider(user.id) : getDefaultAIProvider();
  const configured = isAIConfigured(provider);

  return NextResponse.json({
    configured,
    provider,
    message: getAIConfigMessage(provider),
  });
}
