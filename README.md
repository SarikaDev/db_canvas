# DB Architect — Visual PostgreSQL Schema Builder

A free, browser-based tool for designing production-ready PostgreSQL database
schemas visually — without writing a single line of SQL manually.

🔗 **Live Demo:** [your-vercel-url.vercel.app](#)

---

## What It Does

DB Architect lets you drag and drop tables onto a canvas, define columns with
full PostgreSQL type support, connect tables with foreign keys, toggle RLS,
and instantly receive validated, scored, production-ready PostgreSQL DDL code
on the right panel — ready to copy or export.

No account. No backend. No installation. Open the URL and start building.

---

## Why I Built This

Every developer designing a PostgreSQL schema faces the same three problems:

- Diagram tools produce pretty pictures but zero SQL output
- Writing DDL manually requires memorising exact PostgreSQL syntax for
  constraints, foreign keys, RLS policies and index rules
- No tool validates schema decisions against PostgreSQL production standards
  in real time and tells you specifically what is wrong and why

DB Architect solves all three in one place.

---

## Features

### Schema Management
- Three pre-provided schemas: `public`, `auth`, `app`
- Cross-schema foreign key references supported
- Essential for Supabase RLS patterns referencing `auth.users`

### Table Builder
- Drag and drop table cards on the canvas
- Inline editable table names
- Per-table RLS toggle

### Column Definition
- Full PostgreSQL type support (19 types)
- Primary Key, Not Null, Unique flags per column
- Optional default value and CHECK expression
- Foreign Key selector with schema → table → column dropdowns
- ON DELETE rule: RESTRICT, CASCADE, SET NULL, SET DEFAULT, NO ACTION

### Auto Index Suggestions
Automatically suggests indexes for:
- Every foreign key column
- Columns named: `email`, `username`, `slug`, `phone`, `status`, `type`, `role`

### Validation Engine
Runs on every state change. Enforces real PostgreSQL production standards.

**Hard Errors** (block SQL generation, score → 0):
- Duplicate column names within the same table
- Empty table or column names
- PostgreSQL reserved keywords used as identifiers
- FK referencing a non-existent schema, table or column
- FK column type mismatch with referenced column
- FK referencing a column that is neither PK nor UNIQUE

**Warnings** (reduce score with specific deductions):
- No primary key defined (-20)
- `serial`/`bigserial` used instead of `uuid` for PK (-8)
- `timestamp` used instead of `timestamptz` (-8 per column)
- `float`/`real` used — likely a money field (-10)
- FK column has no index (-10 per column)
- `camelCase` naming detected (-5 per column)
- Singular table name detected (-3)
- FK column not ending in `_id` (-5 per column)
- PK column not named `id` (-5)
- `char` type used (-5 per column)
- `int` used for PK instead of `uuid` or `bigint` (-5)

### Score System
| Score | Status |
|-------|--------|
| 90–100 | Production ready |
| 70–89 | Good, minor issues |
| Below 70 | Needs fixes before use |

### SQL Output
- Live SQL panel updates on every change
- Per-table copy button
- Full schema export as `.md` migration file with SQL code fences
- Schema-qualified table names throughout (`app.orders`, `auth.users`)
- RLS policy stubs generated automatically when RLS is enabled

### Persistence
- Full state saved to `localStorage` automatically
- Rehydrates on page refresh
- Clear Canvas button with confirmation dialog

---

## How It Compares

| Feature | DB Architect | dbdiagram.io | DrawSQL | Supabase Editor |
|---------|-------------|--------------|---------|-----------------|
| Drag and drop | ✅ | ❌ (DSL syntax) | ✅ | ✅ |
| PostgreSQL standards validation | ✅ | ❌ | ❌ | ❌ |
| Correctness score | ✅ | ❌ | ❌ | ❌ |
| RLS policy generation | ✅ | ❌ | ❌ | ✅ |
| Cross-schema FK support | ✅ | ✅ | ❌ | ✅ |
| No account required | ✅ | ✅ | ❌ | ❌ |
| Export as .md migration file | ✅ | ❌ | ❌ | ❌ |
| Works offline | ✅ | ❌ | ❌ | ❌ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict mode) |
| Canvas | React Flow |
| State | Zustand with persist middleware |
| Styling | Tailwind CSS |
| Build | Vite |
| Deployment | Vercel |
| Storage | localStorage (no backend, no API) |

---

## Project Architecture

This project was built using a strict 3-document approach before any code
was written. All three documents are in this repository.

**[PRD.md](./PRD.md)** — Product Requirement Document
Defines what the product is, what it is not, every feature in plain language,
validation rules, score system, and Phase 2 roadmap.

**[UXD.md](./UXD.md)** — User Experience Document
Defines every screen, every interaction, every empty state, every error state,
and every user flow without mentioning a single technology.

**[TRD.md](./TRD.md)** — Technical Requirement Document
Defines every file, every TypeScript interface, every function signature,
every component's props, and the complete build order.

This 3-document approach compressed what would typically be 2–3 weeks of
senior developer work into a single focused build session with zero
architectural rework.

---

## File Structure
```
src/
  types/
    schema.ts          # All TypeScript interfaces and types
  lib/
    constants.ts       # PostgreSQL types, reserved keywords, rules
    validator.ts       # Validation engine — all 7 errors, 14 warnings
    sqlGenerator.ts    # Pure TS function: Schema → PostgreSQL DDL string
    exporter.ts        # Exports full schema as .md migration file
  store/
    useSchemaStore.ts  # Zustand store with localStorage persistence
  components/
    TopBar.tsx         # Export and Clear Canvas controls
    SchemaTabBar.tsx   # Schema tab switcher and Add Table button
    TableNode.tsx      # React Flow custom node — table card
    ColumnRow.tsx      # Individual column row with all controls
    FKSelector.tsx     # Four-dropdown FK configuration panel
    SQLPanel.tsx       # Live SQL output with copy button
    ScoreBadge.tsx     # Score display with color-coded status
  App.tsx              # Root — canvas, edges, score computation
  main.tsx             # Vite entry point
```

---

## Running Locally
```bash
git clone https://github.com/yourusername/db-architect
cd db-architect
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Roadmap — Phase 2

- Partial index suggestions for low cardinality columns
- Composite index suggestions for multi-FK tables
- Detection of missing `updated_at` on tables with `created_at`
- `jsonb` columns without GIN index suggestion
- Detailed score breakdown with plain English explanation per rule
- Learn mode — each warning explains why it matters in production

---

## What I Learned Building This

This project taught me that the most valuable skill in the AI era is not
knowing how to prompt. It is knowing your domain deeply enough to define
what correct looks like before the first line of code is written.

The PostgreSQL validation rules, the score weightings, the cross-schema RLS
patterns, the index suggestion logic — none of that came from AI. That came
from understanding how PostgreSQL actually behaves in production. The AI
built what I specified. I specified what I knew.

---

## Author

Built by Sairam Sarika
[GitHub](#) · [LinkedIn](#)