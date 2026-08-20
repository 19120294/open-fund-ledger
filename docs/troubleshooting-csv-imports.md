## Troubleshooting CSV imports

If your CSV file is rejected or displays errors during import, verify your data against these common validation rules. Note that imported files must be under the **2 MB browser safety limit**.

> **Privacy Notice:** Never publish donor identities, bank account details, or confidential references. Keep all transaction descriptions anonymous and use privacy-safe reference codes.

---

### Common Validation Issues & Fixes

#### 1. Missing or Invalid Headers
The first row must explicitly contain all 7 required field names in any order: `id,date,type,category,description,amount,reference`.

* **Incorrect (Missing headers or wrong names):**
  ```csv
  date,type,description,amount
  2026-01-15,income,Community workshop grant,500
  ```
* **Corrected Row:**
  ```csv
  id,date,type,category,description,amount,reference
  TX-101,2026-01-15,income,Grants,Community workshop grant,500,REF-001
  ```

---

#### 2. Invalid Date Formats
Dates must strictly use the ISO 8601 format (`YYYY-MM-DD`). Localized formats such as `MM/DD/YYYY` or `DD/MM/YYYY` will fail validation.

* **Incorrect (Localized date format):**
  ```csv
  TX-102,15/01/2026,expense,Supplies,Printing paper,25,
  ```
* **Corrected Row:**
  ```csv
  TX-102,2026-01-15,expense,Supplies,Printing paper,25,
  ```

---

#### 3. Duplicate Transaction IDs
Every row must have a unique identifier in the `id` column. Duplicate IDs will cause the ledger parser to reject the file.

* **Incorrect (Duplicate `TX-103` ID):**
  ```csv
  TX-103,2026-02-01,income,Donations,Anonymous contribution,100,
  TX-103,2026-02-02,expense,Venue,Hall rental,50,
  ```
* **Corrected Rows:**
  ```csv
  TX-103,2026-02-01,income,Donations,Anonymous contribution,100,
  TX-104,2026-02-02,expense,Venue,Hall rental,50,
  ```

---

#### 4. Unsupported Transaction Types
The `type` column only accepts two exact values: `income` or `expense` (lowercase). Terms like `donation`, `grant`, `payout`, or capitalized strings are not allowed.

* **Incorrect (Unsupported type value):**
  ```csv
  TX-105,2026-02-10,donation,Fundraising,General support,75,
  ```
* **Corrected Row:**
  ```csv
  TX-105,2026-02-10,income,Fundraising,General support,75,
  ```

---

#### 5. Non-Positive or Formatted Amounts
Amounts must be positive numbers greater than zero. Do not include currency symbols (e.g., `$`, `₫`), thousands separators (`,`), negative values, or zero amounts.

* **Incorrect (Negative amount with currency symbol):**
  ```csv
  TX-106,2026-02-12,expense,Utilities,Electricity bill,-$150,
  ```
* **Corrected Row:**
  ```csv
  TX-106,2026-02-12,expense,Utilities,Electricity bill,150,
  ```
