import { SettingsClient } from '@/components/features/settings-client';
import {
  getUserAIProvider,
  isAIConfigured,
  getAIConfigMessage,
} from '@/lib/ai/config';
import { getCurrentUserProfile } from '@/lib/auth/profile';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getCurrentUserProfile();
  if (!session) redirect('/login');

  const { user, profile, role } = session;
  const aiProvider = await getUserAIProvider(user.id);

  return (
    <SettingsClient
      profile={{ ...profile, role }}
      email={user.email || ''}
      aiProvider={aiProvider}
      aiConfigured={isAIConfigured(aiProvider)}
      aiConfigMessage={getAIConfigMessage(aiProvider)}
    />
  );
}
