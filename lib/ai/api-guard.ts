import { isAIConfigured, getAIConfigMessage, getUserAIProvider, formatAIError } from '@/lib/ai/config';
import { NextResponse } from 'next/server';

export async function aiGuardResponse(userId: string) {
  const provider = await getUserAIProvider(userId);
  if (!isAIConfigured(provider)) {
    return NextResponse.json(
      { error: getAIConfigMessage(provider) || 'AI not configured' },
      { status: 503 }
    );
  }
  return null;
}

export function aiErrorResponse(error: unknown) {
  const message = formatAIError(error);
  if (message.includes('API key') || message.includes('AI not configured') || message.includes('quota')) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  console.error('AI API error:', error);
  return NextResponse.json({ error: message }, { status: 500 });
}
