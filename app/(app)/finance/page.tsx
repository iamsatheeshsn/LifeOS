import { createClient } from '@/lib/supabase/server';
import { FinanceClient } from '@/components/features/finance-client';

export default async function FinancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('occurred_at', monthStart)
    .order('occurred_at', { ascending: false });

  return <FinanceClient transactions={transactions || []} />;
}
