import type {
  CategoryTotal,
  LedgerEntry,
  LedgerFilters,
  LedgerSummary,
} from './types';

export function summarizeLedger(entries: LedgerEntry[]): LedgerSummary {
  const totals = entries.reduce(
    (summary, entry) => {
      summary[entry.type] += entry.amount;
      return summary;
    },
    { income: 0, expense: 0 },
  );

  return {
    income: totals.income,
    expense: totals.expense,
    balance: totals.income - totals.expense,
    transactionCount: entries.length,
  };
}

export function filterLedger(
  entries: LedgerEntry[],
  filters: LedgerFilters,
): LedgerEntry[] {
  const query = normalizeSearchText(filters.query.trim());

  return entries.filter((entry) => {
    if (filters.type !== 'all' && entry.type !== filters.type) {
      return false;
    }

    if (filters.category !== 'all' && entry.category !== filters.category) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchable = normalizeSearchText(
      [
        entry.id,
        entry.date,
        entry.category,
        entry.description,
        entry.reference ?? '',
      ].join(' '),
    );

    return searchable.includes(query);
  });
}

export function listCategories(entries: LedgerEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.category))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function calculateExpenseBreakdown(
  entries: LedgerEntry[],
): CategoryTotal[] {
  const totals = new Map<string, number>();

  entries
    .filter((entry) => entry.type === 'expense')
    .forEach((entry) => {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    });

  const totalExpense = [...totals.values()].reduce(
    (total, amount) => total + amount,
    0,
  );

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense === 0 ? 0 : (amount / totalExpense) * 100,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));
}

export function sortLedgerNewestFirst(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[đĐ]/g, (character) => (character === 'đ' ? 'd' : 'D'))
    .toLocaleLowerCase();
}
