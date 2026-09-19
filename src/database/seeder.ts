import { getDB } from './db';
import { Account, Transaction } from '../types';

export const seedDatabase = async (): Promise<void> => {
  const db = getDB();
  await db.init();
};

export const resetDatabase = async (): Promise<void> => {
  const db = getDB();
  await db.resetAndReseed();
};

export const fetchAllFinanceData = async (): Promise<{
  accounts: Account[];
  transactions: Transaction[];
  totalBalance: number;
  mtdSpending: number;
  categoryExpenses: Record<string, number>;
}> => {
  const db = getDB();
  const accounts = await db.getAccounts();
  const transactions = await db.getTransactions();

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  // Month-to-date spending (September 2026 transactions that are debits)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let mtdSpending = 0;
  const categoryExpenses: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'debit') {
      const txDate = new Date(tx.date);
      // Group category totals
      categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + tx.amount;

      // Count MTD spending
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        mtdSpending += tx.amount;
      }
    }
  });

  return {
    accounts,
    transactions,
    totalBalance,
    mtdSpending,
    categoryExpenses,
  };
};
