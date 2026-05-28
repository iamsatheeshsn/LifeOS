import { createClient } from '@/lib/supabase/server';

export type AIProvider = 'openai' | 'gemini';

export function getDefaultAIProvider(): AIProvider {
  return process.env.AI_PROVIDER === 'gemini' ? 'gemini' : 'openai';
}

export function resolveAIProvider(preference?: AIProvider | null): AIProvider {
  if (preference === 'openai' || preference === 'gemini') return preference;
  return getDefaultAIProvider();
}

/** @deprecated Use getDefaultAIProvider or resolveAIProvider */
export function getAIProvider(): AIProvider {
  return getDefaultAIProvider();
}

export function isAIConfigured(provider?: AIProvider): boolean {
  const p = provider ?? getDefaultAIProvider();
  if (p === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    return !!key && key !== 'your-gemini-key' && key.length > 10;
  }
  const key = process.env.OPENAI_API_KEY;
  return !!key && !key.startsWith('sk-your') && key.length > 20;
}

export function getAIConfigMessage(provider?: AIProvider): string | null {
  if (isAIConfigured(provider)) return null;
  const p = provider ?? getDefaultAIProvider();
  if (p === 'gemini') {
    return 'Add GEMINI_API_KEY to .env.local to enable AI features.';
  }
  return 'Add OPENAI_API_KEY to .env.local to enable AI features.';
}

export function assertAIConfigured(provider?: AIProvider): void {
  const message = getAIConfigMessage(provider);
  if (message) {
    throw new Error(message);
  }
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

export function formatAIError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API quota exceeded. Wait a minute and retry, switch to OpenAI in Settings, or enable billing at https://ai.google.dev';
  }

  if (message.includes('404') && message.includes('models/')) {
    return `Gemini model unavailable. Set GEMINI_MODEL in .env.local (try gemini-2.5-flash). Details: ${message}`;
  }

  return message;
}

export async function getUserAIProvider(userId: string): Promise<AIProvider> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.id === userId) {
    const fromMetadata = user.user_metadata?.ai_provider;
    if (fromMetadata === 'openai' || fromMetadata === 'gemini') {
      return fromMetadata;
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('ai_provider')
    .eq('id', userId)
    .single();

  if (!error && (data?.ai_provider === 'openai' || data?.ai_provider === 'gemini')) {
    return data.ai_provider;
  }

  return getDefaultAIProvider();
}
