import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Account, Transaction } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS } from '../utils/mockData';

const DB_NAME = 'finsarathi.db';

// Cross-platform interface for DB interactions
export interface FinSarathiDB {
  init(): Promise<void>;
  getAccounts(): Promise<Account[]>;
  getTransactions(accountId?: string): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction>;
  resetAndReseed(): Promise<void>;
}

/**
 * Native SQLite Implementation using expo-sqlite (SDK 57)
 */
class NativeSQLiteEngine implements FinSarathiDB {
  private db: SQLite.SQLiteDatabase | null = null;

  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return this.db;
  }

  async init(): Promise<void> {
    const db = await this.getDB();

    // Enable WAL mode for high performance
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        balance REAL NOT NULL,
        color_accent TEXT,
        type TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        amount REAL NOT NULL,
        merchant TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
      );
    `);

    // Check if initial seeding is required
    const countRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM accounts;'
    );

    if (!countRow || countRow.count === 0) {
      await this.seedInitialData();
    }
  }

  private async seedInitialData(): Promise<void> {
    const db = await this.getDB();

    await db.withTransactionAsync(async () => {
      // Seed Accounts
      for (const acc of INITIAL_ACCOUNTS) {
        await db.runAsync(
          'INSERT OR REPLACE INTO accounts (id, bank_name, account_number, balance, color_accent, type) VALUES (?, ?, ?, ?, ?, ?);',
          [acc.id, acc.bank_name, acc.account_number, acc.balance, acc.color_accent || '#0A2540', acc.type || 'savings']
        );
      }

      // Seed 15 Realistic Indian Transactions
      for (const tx of INITIAL_TRANSACTIONS) {
        await db.runAsync(
          'INSERT OR REPLACE INTO transactions (id, account_id, amount, merchant, category, type, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [tx.id, tx.account_id, tx.amount, tx.merchant, tx.category, tx.type, tx.date, tx.notes || '']
        );
      }
    });
  }

  async getAccounts(): Promise<Account[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<Account>(
      'SELECT id, bank_name, account_number, balance, color_accent, type FROM accounts;'
    );
    return rows;
  }

  async getTransactions(accountId?: string): Promise<Transaction[]> {
    const db = await this.getDB();
    let query = `
      SELECT t.id, t.account_id, t.amount, t.merchant, t.category, t.type, t.date, t.notes,
             a.bank_name as account_name, a.account_number as account_number
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
    `;
    const params: string[] = [];

    if (accountId) {
      query += ' WHERE t.account_id = ?';
      params.push(accountId);
    }

    query += ' ORDER BY datetime(t.date) DESC;';

    const rows = await db.getAllAsync<Transaction>(query, params);
    return rows;
  }

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const db = await this.getDB();
    const newId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newTx: Transaction = {
      ...tx,
      id: newId,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO transactions (id, account_id, amount, merchant, category, type, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
        [newTx.id, newTx.account_id, newTx.amount, newTx.merchant, newTx.category, newTx.type, newTx.date, newTx.notes || '']
      );

      // Adjust account balance
      const multiplier = newTx.type === 'credit' ? 1 : -1;
      await db.runAsync(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?;',
        [newTx.amount * multiplier, newTx.account_id]
      );
    });

    return newTx;
  }

  async resetAndReseed(): Promise<void> {
    const db = await this.getDB();
    await db.withTransactionAsync(async () => {
      await db.execAsync('DELETE FROM transactions; DELETE FROM accounts;');
    });
    await this.seedInitialData();
  }
}

/**
 * Web / In-Memory Fallback Engine for cross-platform robustness
 */
class MemoryDBEngine implements FinSarathiDB {
  private accounts: Account[] = [];
  private transactions: Transaction[] = [];

  async init(): Promise<void> {
    this.accounts = JSON.parse(JSON.stringify(INITIAL_ACCOUNTS));
    this.transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
  }

  async getAccounts(): Promise<Account[]> {
    return [...this.accounts];
  }

  async getTransactions(accountId?: string): Promise<Transaction[]> {
    const list = accountId
      ? this.transactions.filter((t) => t.account_id === accountId)
      : this.transactions;

    return list
      .map((t) => {
        const acc = this.accounts.find((a) => a.id === t.account_id);
        return {
          ...t,
          account_name: acc?.bank_name,
          account_number: acc?.account_number,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newId = `tx_${Date.now()}`;
    const newTx: Transaction = { ...tx, id: newId };
    this.transactions.unshift(newTx);

    // Update balance
    const acc = this.accounts.find((a) => a.id === tx.account_id);
    if (acc) {
      if (tx.type === 'credit') {
        acc.balance += tx.amount;
      } else {
        acc.balance -= tx.amount;
      }
    }
    return newTx;
  }

  async resetAndReseed(): Promise<void> {
    await this.init();
  }
}

// Determine best engine based on environment
let dbInstance: FinSarathiDB;

if (Platform.OS === 'web') {
  dbInstance = new MemoryDBEngine();
} else {
  try {
    dbInstance = new NativeSQLiteEngine();
  } catch (err) {
    console.warn('Fallback to memory DB engine:', err);
    dbInstance = new MemoryDBEngine();
  }
}

export const getDB = (): FinSarathiDB => dbInstance;
export default getDB;
