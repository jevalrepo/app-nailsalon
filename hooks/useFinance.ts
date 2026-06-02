import { useQuery } from '@tanstack/react-query';
import { getDb } from '@/lib/db/database';
import { useActiveOrg } from '@/hooks/useActiveOrg';

export interface FinanceSummary {
  income: number;
  expenses: number;
  net: number;
}

export interface RecentTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  payment_method: string;
  date: string;
}

export interface Transaction extends RecentTransaction {
  appointment_id: string | null;
  employee_id: string | null;
  created_by: string;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface CashCloseSummary {
  cash_income: number;
  cash_expenses: number;
  card_income: number;
  transfer_income: number;
  total_income: number;
  total_expenses: number;
  net: number;
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthRange(year: number, month: number) {
  const start = toLocalDateString(new Date(year, month, 1));
  const end = toLocalDateString(new Date(year, month + 1, 0));
  return { start, end };
}

export function useMonthSummary(year: number, month: number) {
  const { orgId } = useActiveOrg();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['transactions', 'month-summary', orgId, year, month],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<{ income: number; expenses: number }>(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
         FROM transactions
         WHERE organization_id = ? AND date >= ? AND date <= ? AND _deleted = 0`,
        [orgId!, start, end]
      );
      const income = row?.income ?? 0;
      const expenses = row?.expenses ?? 0;
      return { income, expenses, net: income - expenses } as FinanceSummary;
    },
  });
}

export function useRecentTransactions(limit = 10) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['transactions', 'recent', orgId, limit],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<RecentTransaction>(
        `SELECT id, type, amount, description, category, payment_method, date
         FROM transactions
         WHERE organization_id = ? AND _deleted = 0
         ORDER BY date DESC, created_at DESC
         LIMIT ?`,
        [orgId!, limit]
      );
      return rows;
    },
  });
}

export function useMonthTransactions(year: number, month: number) {
  const { orgId } = useActiveOrg();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['transactions', 'month', orgId, year, month],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<Transaction>(
        `SELECT id, type, amount, description, category, payment_method, date,
                appointment_id, employee_id, created_by, created_at
         FROM transactions
         WHERE organization_id = ? AND date >= ? AND date <= ? AND _deleted = 0
         ORDER BY date DESC, created_at DESC`,
        [orgId!, start, end]
      );
      return rows;
    },
  });
}

export function useTransactionById(id: string | null) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['transactions', 'detail', orgId, id],
    enabled: !!orgId && !!id,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const row = await db.getFirstAsync<Transaction>(
        `SELECT id, type, amount, description, category, payment_method, date,
                appointment_id, employee_id, created_by, created_at
         FROM transactions
         WHERE id = ? AND organization_id = ? AND _deleted = 0`,
        [id!, orgId!]
      );
      if (!row) throw new Error('Transaction not found');
      return row;
    },
  });
}

export function useMonthCategorySummary(year: number, month: number, type: 'income' | 'expense') {
  const { orgId } = useActiveOrg();
  const { start, end } = monthRange(year, month);

  return useQuery({
    queryKey: ['transactions', 'categories', orgId, year, month, type],
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<{ category: string; total: number; count: number }>(
        `SELECT category,
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS count
         FROM transactions
         WHERE organization_id = ? AND date >= ? AND date <= ? AND type = ? AND _deleted = 0
         GROUP BY category
         ORDER BY total DESC`,
        [orgId!, start, end, type]
      );
      return rows as CategorySummary[];
    },
  });
}

export function useDayCashClose(dateStr: string) {
  const { orgId } = useActiveOrg();

  return useQuery({
    queryKey: ['transactions', 'cash-close', orgId, dateStr],
    enabled: !!orgId && !!dateStr,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync<{ type: string; amount: number; payment_method: string }>(
        `SELECT type, amount, payment_method
         FROM transactions
         WHERE organization_id = ? AND date = ? AND _deleted = 0`,
        [orgId!, dateStr]
      );

      let cash_income = 0, cash_expenses = 0, card_income = 0, transfer_income = 0;

      for (const row of rows) {
        if (row.type === 'income') {
          if (row.payment_method === 'cash') cash_income += row.amount ?? 0;
          else if (row.payment_method === 'card') card_income += row.amount ?? 0;
          else if (row.payment_method === 'transfer') transfer_income += row.amount ?? 0;
        } else {
          if (row.payment_method === 'cash') cash_expenses += row.amount ?? 0;
        }
      }

      const total_income = cash_income + card_income + transfer_income;
      return {
        cash_income,
        cash_expenses,
        card_income,
        transfer_income,
        total_income,
        total_expenses: cash_expenses,
        net: total_income - cash_expenses,
      } as CashCloseSummary;
    },
  });
}
