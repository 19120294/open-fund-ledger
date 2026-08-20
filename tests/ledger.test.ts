import { describe, expect, it } from 'vitest';

import {
  calculateExpenseBreakdown,
  filterLedger,
  listCategories,
  sortLedgerNewestFirst,
  summarizeLedger,
} from '../src/ledger';
import type { LedgerEntry } from '../src/types';

const entries: LedgerEntry[] = [
  {
    id: '1',
    date: '2026-01-01',
    type: 'income',
    category: 'Đóng góp',
    description: 'Community donation',
    amount: 1_000,
    reference: 'CAMPAIGN-A',
  },
  {
    id: '2',
    date: '2026-01-03',
    type: 'expense',
    category: 'Education',
    description: 'Books',
    amount: 300,
  },
  {
    id: '3',
    date: '2026-01-02',
    type: 'expense',
    category: 'Education',
    description: 'Pens',
    amount: 200,
  },
];

describe('ledger calculations', () => {
  it('summarizes income, expenses, balance, and count', () => {
    expect(summarizeLedger(entries)).toEqual({
      income: 1_000,
      expense: 500,
      balance: 500,
      transactionCount: 3,
    });
  });

  it('groups expenses and calculates their share', () => {
    expect(calculateExpenseBreakdown(entries)).toEqual([
      { category: 'Education', amount: 500, percentage: 100 },
    ]);
  });

  it('lists unique categories alphabetically', () => {
    expect(listCategories(entries)).toEqual(['Đóng góp', 'Education']);
  });

  it('sorts a copy without mutating the source', () => {
    const sorted = sortLedgerNewestFirst(entries);

    expect(sorted.map((entry) => entry.id)).toEqual(['2', '3', '1']);
    expect(entries.map((entry) => entry.id)).toEqual(['1', '2', '3']);
  });
});

describe('ledger filters', () => {
  it('combines type, category, and search filters', () => {
    expect(
      filterLedger(entries, {
        query: 'book',
        type: 'expense',
        category: 'Education',
      }).map((entry) => entry.id),
    ).toEqual(['2']);
  });

  it('searches Vietnamese text without requiring diacritics', () => {
    expect(
      filterLedger(entries, {
        query: 'dong gop',
        type: 'all',
        category: 'all',
      }).map((entry) => entry.id),
    ).toEqual(['1']);
  });
});
