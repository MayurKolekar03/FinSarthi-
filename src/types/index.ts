export type AccountType = 'savings' | 'current' | 'cash' | 'credit';

export interface Account {
  id: string;
  bank_name: string;      // e.g. 'HDFC Bank', 'SBI Savings', 'Cash In Hand'
  account_number: string; // e.g. 'XX1234', 'XX5678', 'Wallet'
  balance: number;
  color_accent?: string;
  type?: AccountType;
}

export type TransactionType = 'credit' | 'debit';

export type TransactionCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Fuel & Travel'
  | 'Utilities & Bills'
  | 'Shopping'
  | 'Salary & Income'
  | 'Transfer'
  | 'Health & Wellness'
  | 'Entertainment'
  | 'Other';

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  merchant: string;
  category: TransactionCategory;
  type: TransactionType;
  date: string; // ISO or YYYY-MM-DD HH:mm
  notes?: string;
  account_name?: string;
  account_number?: string;
}

export type SupportedLanguage = 'EN' | 'HI' | 'MR';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  verifiedBadge?: boolean;
  metadata?: {
    action?: 'logged_transaction' | 'budget_forecast' | 'insight';
    category?: string;
    amount?: number;
    merchant?: string;
  };
}

export interface UserSettings {
  userName: string;
  activeLanguage: SupportedLanguage;
  googleConnected: boolean;
  googleUserEmail?: string;
  lastBackupTime: string;
  groqApiKey: string;
  isGroqConnected: boolean;
  biometricEnabled: boolean;
}
