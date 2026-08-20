# Open Fund Ledger

[![CI](https://github.com/19120294/open-fund-ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/19120294/open-fund-ledger/actions/workflows/ci.yml)
[![Deploy](https://github.com/19120294/open-fund-ledger/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/19120294/open-fund-ledger/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f766e.svg)](LICENSE)

A privacy-first, open-source transparency dashboard for volunteer groups,
community funds, and small nonprofit initiatives.

Open Fund Ledger turns a simple CSV file into a clear public view of income,
expenses, balance, categories, and transaction details. Everything runs in the
browser: imported data is never uploaded to a server.

## Why this exists

Small community groups often need transparency without the cost and complexity
of accounting software. A spreadsheet is easy to maintain, but difficult for
supporters to explore. Open Fund Ledger provides a friendly, accessible layer
on top of that spreadsheet while keeping the source data portable.

This project is a transparency aid, not certified accounting or audit software.

## Features

- Import a local CSV ledger without sending data anywhere.
- Review income, expenses, balance, and transaction count.
- Search and filter by transaction type or category.
- See an expense breakdown without a charting dependency.
- Export the currently filtered view back to CSV.
- Keyboard-friendly, responsive, and screen-reader-conscious interface.
- Built-in demo data and a downloadable CSV template.
- Automated tests, type checking, build verification, and GitHub Pages deploy.

## Live demo

After GitHub Pages is enabled, the application is available at:

https://19120294.github.io/open-fund-ledger/

## CSV format

The first row must use these headers:

```csv
id,date,type,category,description,amount,reference
```

| Field | Required | Rules |
| --- | --- | --- |
| `id` | Yes | Unique value for the transaction |
| `date` | Yes | ISO date in `YYYY-MM-DD` format |
| `type` | Yes | `income` or `expense` |
| `category` | Yes | Human-readable grouping |
| `description` | Yes | Public transaction description |
| `amount` | Yes | Positive number without a currency symbol |
| `reference` | No | Receipt, campaign, or public reference |

The MVP displays amounts as Vietnamese đồng (VND). Do not mix currencies in a
single ledger.

Download [the sample ledger](public/sample-ledger.csv) to get started.

## Local development

Requirements: Node.js 22 or later.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run build
```

## Publish your own ledger

1. Fork this repository.
2. Replace `public/sample-ledger.csv` with your public data.
3. Enable GitHub Pages with **GitHub Actions** as the source.
4. Merge to `main`; the deploy workflow builds and publishes the app.

For recurring publication, keep private donor details outside the public CSV.
Use anonymous references when identity disclosure is not explicitly permitted.

## Project principles

- **Privacy by default:** no backend, trackers, accounts, or silent persistence.
- **Portable data:** CSV remains the source of truth.
- **Accessible information:** key numbers never rely on color alone.
- **Honest scope:** no claims of bookkeeping, tax, or audit compliance.
- **Low maintenance:** minimal runtime dependencies and a static deployment.

## Contributing

Community contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before opening a pull request. Please report security or privacy concerns using
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
