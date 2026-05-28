'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateProfile, signOut } from '@/lib/actions';
import type { AIProvider } from '@/lib/ai/config';
import type { Profile } from '@/types/database';
import { Settings, LogOut, User, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsClientProps {
  profile: Profile;
  email: string;
  aiProvider: AIProvider;
  aiConfigured: boolean;
  aiConfigMessage: string | null;
}

export function SettingsClient({
  profile,
  email,
  aiProvider,
  aiConfigured,
  aiConfigMessage,
}: SettingsClientProps) {
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<AIProvider>(aiProvider);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerStatus, setProviderStatus] = useState({
    configured: aiConfigured,
    message: aiConfigMessage,
  });
  const router = useRouter();

  useEffect(() => {
    setProvider(aiProvider);
    setProviderStatus({ configured: aiConfigured, message: aiConfigMessage });
  }, [aiProvider, aiConfigured, aiConfigMessage]);

  async function handleUpdate(formData: FormData) {
    setSaving(true);
    await updateProfile({
      full_name: formData.get('full_name') as string,
      timezone: formData.get('timezone') as string,
    });
    setSaving(false);
    router.refresh();
  }

  async function handleProviderChange(nextProvider: AIProvider) {
    if (nextProvider === provider) return;

    setProviderSaving(true);
    const result = await updateProfile({ ai_provider: nextProvider });

    if (result?.error) {
      setProvider(aiProvider);
      setProviderSaving(false);
      return;
    }

    setProvider(nextProvider);
    setProviderStatus((prev) => ({
      ...prev,
      message: null,
    }));
    router.refresh();

    try {
      const res = await fetch('/api/ai/status', { cache: 'no-store' });
      const data = await res.json();
      setProvider(data.provider);
      setProviderStatus({
        configured: data.configured,
        message: data.message,
      });
    } catch {
      // Keep previous status if refresh fails
    }

    setProviderSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <form action={handleUpdate} className="space-y-4">
          <Input label="Email" value={email} disabled />
          <Input label="Full Name" name="full_name" defaultValue={profile.full_name || ''} />
          <Input label="Timezone" name="timezone" defaultValue={profile.timezone || 'UTC'} />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <CardTitle>AI Provider</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="ai-provider" className="mb-1.5 block text-sm font-medium">
              Provider
            </label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              disabled={providerSaving}
              className="input-field"
            >
              <option value="openai">OpenAI (GPT-4o mini)</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
              providerStatus.configured
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            }`}
          >
            {providerStatus.configured ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {providerStatus.configured
                  ? `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} is ready`
                  : `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} needs setup`}
              </p>
              {!providerStatus.configured && providerStatus.message && (
                <p className="mt-0.5 text-xs opacity-90">{providerStatus.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your choice applies to chat, voice, quick-add parsing, and insights. Add both API keys in
            `.env.local` to switch freely.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-muted-foreground">
          Role: <span className="font-medium capitalize text-foreground">{profile.role || 'member'}</span>
        </p>
        <form action={signOut}>
          <Button variant="danger" type="submit">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </form>
      </Card>
    </div>
  );
}
