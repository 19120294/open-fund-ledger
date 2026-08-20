export type EntryType = 'income' | 'expense';

export interface LedgerEntry {
  id: string;
  date: string;
  type: EntryType;
  category: string;
  description: string;
  amount: number;
  reference?: string;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface LedgerFilters {
  query: string;
  type: EntryType | 'all';
  category: string | 'all';
}

export interface CategoryTotal {
  category: string;
  amount: number;
  percentage: number;
}
