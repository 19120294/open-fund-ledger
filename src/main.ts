import './styles.css';

import { CsvValidationError, ledgerToCsv, parseLedgerCsv } from './csv';
import { DEMO_ENTRIES } from './demo';
import {
  calculateExpenseBreakdown,
  filterLedger,
  listCategories,
  sortLedgerNewestFirst,
  summarizeLedger,
} from './ledger';
import type { EntryType, LedgerEntry, LedgerFilters } from './types';

const CURRENCY = 'VND';
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const elements = {
  dataHeading: byId<HTMLHeadingElement>('data-heading'),
  dataStatus: byId<HTMLParagraphElement>('data-status'),
  fileInput: byId<HTMLInputElement>('csv-file'),
  exportButton: byId<HTMLButtonElement>('export-csv'),
  demoButton: byId<HTMLButtonElement>('load-demo'),
  clearFiltersButton: byId<HTMLButtonElement>('clear-filters'),
  searchInput: byId<HTMLInputElement>('search'),
  typeFilter: byId<HTMLSelectElement>('type-filter'),
  categoryFilter: byId<HTMLSelectElement>('category-filter'),
  income: byId<HTMLElement>('total-income'),
  expense: byId<HTMLElement>('total-expense'),
  balance: byId<HTMLElement>('balance'),
  transactionCount: byId<HTMLElement>('transaction-count'),
  categoryBreakdown: byId<HTMLOListElement>('category-breakdown'),
  transactionRows: byId<HTMLTableSectionElement>('transaction-rows'),
  resultCount: byId<HTMLParagraphElement>('result-count'),
};

let entries: LedgerEntry[] = [...DEMO_ENTRIES];
let sourceName = 'Community support demo';

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  timeZone: 'UTC',
});

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element #${id}`);
  }
  return element as T;
}

function getFilters(): LedgerFilters {
  return {
    query: elements.searchInput.value,
    type: elements.typeFilter.value as EntryType | 'all',
    category: elements.categoryFilter.value,
  };
}

function render(): void {
  const filteredEntries = filterLedger(entries, getFilters());
  const sortedEntries = sortLedgerNewestFirst(filteredEntries);
  const fullSummary = summarizeLedger(entries);

  elements.income.textContent = formatMoney(fullSummary.income);
  elements.expense.textContent = formatMoney(fullSummary.expense);
  elements.balance.textContent = formatMoney(fullSummary.balance);
  elements.balance.dataset.negative = String(fullSummary.balance < 0);
  elements.transactionCount.textContent =
    fullSummary.transactionCount.toLocaleString('en');

  renderCategories(filteredEntries);
  renderRows(sortedEntries);

  const suffix = sortedEntries.length === 1 ? 'transaction' : 'transactions';
  elements.resultCount.textContent =
    `${sortedEntries.length.toLocaleString('en')} ${suffix} shown`;
  elements.exportButton.disabled = sortedEntries.length === 0;
}

function renderCategories(currentEntries: LedgerEntry[]): void {
  const breakdown = calculateExpenseBreakdown(currentEntries);
  elements.categoryBreakdown.replaceChildren();

  if (breakdown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No expense data is available for this view.';
    elements.categoryBreakdown.append(empty);
    return;
  }

  breakdown.forEach((item) => {
    const listItem = document.createElement('li');
    const heading = document.createElement('div');
    const category = document.createElement('strong');
    const amount = document.createElement('span');
    const track = document.createElement('div');
    const bar = document.createElement('span');

    heading.className = 'breakdown-heading';
    category.textContent = item.category;
    amount.textContent = formatMoney(item.amount);
    track.className = 'breakdown-track';
    track.setAttribute('aria-hidden', 'true');
    bar.className = 'breakdown-bar';
    bar.style.width = `${Math.max(item.percentage, 2).toFixed(2)}%`;

    heading.append(category, amount);
    track.append(bar);
    listItem.append(heading, track);
    elements.categoryBreakdown.append(listItem);
  });
}

function renderRows(currentEntries: LedgerEntry[]): void {
  elements.transactionRows.replaceChildren();

  if (currentEntries.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'empty-state table-empty';
    cell.textContent = 'No transactions match the selected filters.';
    row.append(cell);
    elements.transactionRows.append(row);
    return;
  }

  currentEntries.forEach((entry) => {
    const row = document.createElement('tr');
    row.append(
      createCell(formatDate(entry.date), 'date-cell'),
      createCell(entry.description, 'description-cell'),
      createCell(entry.category),
      createTypeCell(entry.type),
      createCell(entry.reference ?? '—', 'reference-cell'),
      createCell(
        `${entry.type === 'expense' ? '−' : '+'}${formatMoney(entry.amount)}`,
        `amount-cell amount-${entry.type}`,
      ),
    );
    elements.transactionRows.append(row);
  });
}

function createCell(text: string, className?: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
}

function createTypeCell(type: EntryType): HTMLTableCellElement {
  const cell = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = `type-badge type-${type}`;
  badge.textContent = type === 'income' ? 'Income' : 'Expense';
  cell.append(badge);
  return cell;
}

function updateCategoryOptions(): void {
  const selected = elements.categoryFilter.value;
  const categories = listCategories(entries);
  const options = [new Option('All categories', 'all')];

  categories.forEach((category) => {
    options.push(new Option(category, category));
  });

  elements.categoryFilter.replaceChildren(...options);
  elements.categoryFilter.value = categories.includes(selected) ? selected : 'all';
}

function clearFilters(): void {
  elements.searchInput.value = '';
  elements.typeFilter.value = 'all';
  elements.categoryFilter.value = 'all';
  render();
  elements.searchInput.focus();
}

function loadDemo(): void {
  entries = [...DEMO_ENTRIES];
  sourceName = 'Community support demo';
  elements.dataHeading.textContent = sourceName;
  setStatus('Showing privacy-safe sample transactions.', 'neutral');
  updateCategoryOptions();
  clearFilters();
  elements.fileInput.value = '';
}

async function importFile(file: File): Promise<void> {
  if (file.size > MAX_FILE_SIZE) {
    setStatus('The selected CSV is larger than the 2 MB safety limit.', 'error');
    elements.fileInput.value = '';
    return;
  }

  try {
    const imported = parseLedgerCsv(await file.text());
    entries = imported;
    sourceName = file.name;
    elements.dataHeading.textContent = sourceName;
    setStatus(
      `Loaded ${imported.length.toLocaleString('en')} transactions locally. Nothing was uploaded.`,
      'success',
    );
    updateCategoryOptions();
    clearFilters();
  } catch (error: unknown) {
    const message =
      error instanceof CsvValidationError
        ? error.issues.slice(0, 4).join(' ')
        : 'The selected file could not be read.';
    setStatus(message, 'error');
  } finally {
    elements.fileInput.value = '';
  }
}

function exportView(): void {
  const filteredEntries = sortLedgerNewestFirst(
    filterLedger(entries, getFilters()),
  );
  const blob = new Blob([ledgerToCsv(filteredEntries)], {
    type: 'text/csv;charset=utf-8',
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = sourceName
    .replace(/\.csv$/i, '')
    .replace(/[^a-z0-9_-]+/gi, '-');

  link.href = objectUrl;
  link.download = `${safeName || 'open-fund-ledger'}-filtered.csv`;
  link.click();
  URL.revokeObjectURL(objectUrl);
  setStatus(
    `Exported ${filteredEntries.length.toLocaleString('en')} visible transactions.`,
    'success',
  );
}

function setStatus(
  message: string,
  tone: 'neutral' | 'success' | 'error',
): void {
  elements.dataStatus.textContent = message;
  elements.dataStatus.dataset.tone = tone;
}

function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

elements.fileInput.addEventListener('change', () => {
  const file = elements.fileInput.files?.[0];
  if (file) {
    void importFile(file);
  }
});
elements.exportButton.addEventListener('click', exportView);
elements.demoButton.addEventListener('click', loadDemo);
elements.clearFiltersButton.addEventListener('click', clearFilters);
elements.searchInput.addEventListener('input', render);
elements.typeFilter.addEventListener('change', render);
elements.categoryFilter.addEventListener('change', render);

updateCategoryOptions();
render();
