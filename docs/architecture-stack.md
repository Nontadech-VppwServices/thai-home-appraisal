# Current Architecture

This is a Next.js App Router and strict-TypeScript prototype, not the planned production architecture.

| Area | Current responsibility |
|---|---|
| `src/app/` | Routes, layouts, global styles |
| `src/components/` | Client UI and page composition |
| `src/domain/` | Types, normalization, valuation, workflow, drawing, and reporting rules |
| `src/infrastructure/storage/` | Browser `localStorage` adapters |

The current app uses React, Tailwind CSS, Vitest, and browser-local persistence. It has no Prisma schema, database, central file store, server authorization, or real bank API. `index.html` is a legacy reference.

Keep domain rules independent of React and Next.js where practical. Validate data at boundaries, keep UI state separate from persistence, and reuse existing functions before adding layers or packages. The prospective database/application architecture and decisions still required for production are in [production-targets.md](production-targets.md).
