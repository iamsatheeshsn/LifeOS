'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createTransaction, deleteTransaction } from '@/lib/actions';
import { formatCurrency, EXPENSE_CATEGORIES } from '@/lib/utils';
import type { Transaction } from '@/types/database';
import { motion } from 'framer-motion';
import { Plus, TrendingDown, TrendingUp, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CHART_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

interface FinanceClientProps {
  transactions: Transaction[];
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatCurrency(display)}</span>;
}

export function FinanceClient({ transactions }: FinanceClientProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;

  const categoryData = Object.entries(
    transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  const dailySpending = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      const day = format(parseISO(t.occurred_at), 'MMM d');
      acc[day] = (acc[day] || 0) + Number(t.amount);
      return acc;
    }, {});

  const lineData = Object.entries(dailySpending).map(([date, amount]) => ({ date, amount }));

  async function handleCreate(formData: FormData) {
    await createTransaction({
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as 'income' | 'expense',
      category: formData.get('category') as string,
      note: (formData.get('note') as string) || undefined,
    });
    setShowModal(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Finance</h2>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card gradient="from-emerald-500/10 to-teal-500/10">
            <div className="flex items-center gap-2 text-emerald-500">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Income</span>
            </div>
            <p className="mt-2 text-2xl font-bold"><AnimatedNumber value={income} /></p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card gradient="from-red-500/10 to-orange-500/10">
            <div className="flex items-center gap-2 text-red-500">
              <TrendingDown className="h-5 w-5" />
              <span className="text-sm font-medium">Expenses</span>
            </div>
            <p className="mt-2 text-2xl font-bold"><AnimatedNumber value={expenses} /></p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card gradient="from-indigo-500/10 to-violet-500/10">
            <span className="text-sm font-medium text-indigo-500">Balance</span>
            <p className="mt-2 text-2xl font-bold"><AnimatedNumber value={balance} /></p>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No expense data yet</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryData.map((cat, i) => (
              <span key={cat.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {cat.name}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend Over Time</CardTitle>
          </CardHeader>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No spending data yet</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {transactions.slice(0, 15).map((t) => (
            <div key={t.id} className="group flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {t.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.category}</p>
                {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
              </div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
              </span>
              <button onClick={() => handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:text-red-500" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Transaction">
        <form action={handleCreate} className="space-y-4">
          <Input label="Amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Type</label>
            <select name="type" className="input-field">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select name="category" className="input-field">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label="Note" name="note" placeholder="Optional note" />
          <Button type="submit" className="w-full">Add Transaction</Button>
        </form>
      </Modal>
    </div>
  );
}
