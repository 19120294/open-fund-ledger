import type { EntryType, LedgerEntry } from './types';

const REQUIRED_HEADERS = [
  'id',
  'date',
  'type',
  'category',
  'description',
  'amount',
] as const;

export class CsvValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join('\n'));
    this.name = 'CsvValidationError';
  }
}

export function parseLedgerCsv(source: string): LedgerEntry[] {
  const rows = parseRows(source.replace(/^\uFEFF/, '')).filter((row) =>
    row.some((field) => field.trim() !== ''),
  );

  const headerRow = rows[0];
  if (!headerRow) {
    throw new CsvValidationError(['The CSV file is empty.']);
  }

  const headers = headerRow.map((header) => header.trim().toLocaleLowerCase());
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new CsvValidationError([
      `Missing required column(s): ${missingHeaders.join(', ')}.`,
    ]);
  }

  const headerIndex = new Map(
    headers.map((header, index) => [header, index] as const),
  );
  const issues: string[] = [];
  const seenIds = new Set<string>();
  const entries: LedgerEntry[] = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const get = (column: string): string => {
      const index = headerIndex.get(column);
      return index === undefined ? '' : (row[index] ?? '').trim();
    };

    const id = get('id');
    const date = get('date');
    const rawType = get('type').toLocaleLowerCase();
    const category = get('category');
    const description = get('description');
    const rawAmount = get('amount').replace(/[\s_]/g, '');
    const reference = get('reference');
    const amount = Number(rawAmount);

    if (!id) {
      issues.push(`Line ${lineNumber}: id is required.`);
    } else if (seenIds.has(id)) {
      issues.push(`Line ${lineNumber}: duplicate id "${id}".`);
    } else {
      seenIds.add(id);
    }

    if (!isIsoDate(date)) {
      issues.push(`Line ${lineNumber}: date must be a valid YYYY-MM-DD value.`);
    }

    if (rawType !== 'income' && rawType !== 'expense') {
      issues.push(`Line ${lineNumber}: type must be income or expense.`);
    }

    if (!category) {
      issues.push(`Line ${lineNumber}: category is required.`);
    }

    if (!description) {
      issues.push(`Line ${lineNumber}: description is required.`);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      issues.push(`Line ${lineNumber}: amount must be a positive number.`);
    }

    if (
      id &&
      isIsoDate(date) &&
      (rawType === 'income' || rawType === 'expense') &&
      category &&
      description &&
      Number.isFinite(amount) &&
      amount > 0
    ) {
      entries.push({
        id,
        date,
        type: rawType as EntryType,
        category,
        description,
        amount,
        ...(reference ? { reference } : {}),
      });
    }
  });

  if (issues.length > 0) {
    throw new CsvValidationError(issues);
  }

  if (entries.length === 0) {
    throw new CsvValidationError(['The CSV contains no transaction rows.']);
  }

  return entries;
}

export function ledgerToCsv(entries: LedgerEntry[]): string {
  const header = [
    'id',
    'date',
    'type',
    'category',
    'description',
    'amount',
    'reference',
  ];
  const rows = entries.map((entry) => [
    entry.id,
    entry.date,
    entry.type,
    entry.category,
    entry.description,
    entry.amount.toString(),
    entry.reference ?? '',
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeField).join(','))
    .join('\n');
}

function parseRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source.charAt(index);

    if (quoted) {
      if (character === '"' && source.charAt(index + 1) === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (quoted) {
    throw new CsvValidationError(['The CSV contains an unclosed quoted field.']);
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function escapeField(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}
