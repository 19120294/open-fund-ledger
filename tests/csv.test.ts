import { describe, expect, it } from 'vitest';

import {
  CsvValidationError,
  ledgerToCsv,
  parseLedgerCsv,
} from '../src/csv';

const header =
  'id,date,type,category,description,amount,reference';

describe('parseLedgerCsv', () => {
  it('parses quoted commas and escaped quotes', () => {
    const csv = [
      header,
      'TX-1,2026-01-02,income,Donations,"Market, weekend",1200,"REF ""A"""',
    ].join('\n');

    expect(parseLedgerCsv(csv)).toEqual([
      {
        id: 'TX-1',
        date: '2026-01-02',
        type: 'income',
        category: 'Donations',
        description: 'Market, weekend',
        amount: 1200,
        reference: 'REF "A"',
      },
    ]);
  });

  it('reports multiple validation issues together', () => {
    const csv = [
      header,
      'TX-1,2026-02-30,unknown,,Missing amount,0,',
      'TX-1,not-a-date,expense,Food,Duplicate id,100,',
    ].join('\n');

    try {
      parseLedgerCsv(csv);
      throw new Error('Expected parseLedgerCsv to fail');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(CsvValidationError);
      expect((error as CsvValidationError).issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('valid YYYY-MM-DD'),
          expect.stringContaining('type must be income or expense'),
          expect.stringContaining('category is required'),
          expect.stringContaining('positive number'),
          expect.stringContaining('duplicate id'),
        ]),
      );
    }
  });

  it('rejects an unclosed quoted field', () => {
    expect(() =>
      parseLedgerCsv([header, 'TX-1,2026-01-01,income,Test,"open,100,'].join('\n')),
    ).toThrowError(CsvValidationError);
  });
});

describe('ledgerToCsv', () => {
  it('round-trips parsed entries', () => {
    const input = [
      header,
      'TX-1,2026-01-02,expense,Food,"Rice, oil",1200,RECEIPT-1',
    ].join('\n');
    const parsed = parseLedgerCsv(input);

    expect(parseLedgerCsv(ledgerToCsv(parsed))).toEqual(parsed);
  });
});
