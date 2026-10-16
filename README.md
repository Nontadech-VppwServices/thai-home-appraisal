# Thai Home Appraisal

A Next.js prototype for recording home-appraisal jobs, property details, photos, illustrative drawings, price evidence, valuations, and printable reports. Data stays in the current browser's `localStorage`; there is no production backend, authentication, or bank integration.

## Run locally

Use the package manager pinned in `package.json` (`pnpm@11.24.0`):

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000` and create a job at `/jobs/new`. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` for local validation.

## What the prototype does

- Manages appraisal jobs and property details with browser-local autosave.
- Adds photos, reusable price-reference snapshots, three valuation methods, and a printable/PDF-ready report.
- Creates room, building, and per-floor house-plan illustrations with a mobile material library, editable elements, PNG/SVG export, and optional report inclusion.
- Imports JPG/PNG/WebP sketches into a house plan one floor at a time: crop, review detected horizontal/vertical lines, then create editable wall or line elements. It does not read handwriting, doors, stairs, or dimensions, and does not retain the source image in the job.
- Demonstrates team handoff, review, generic CSV export, permission menus, security posture, and bank-payload simulation. These are local demos, not production controls or delivery.

Drawings have no measurement scale and must not be used as survey or engineering plans. Photo Data URLs can exhaust browser storage. `index.html` is a retained legacy prototype, not the Next.js entry point.

## Documentation

- [AGENTS.md](AGENTS.md): short rules and task-based reading map for coding agents.
- [Requirements](docs/requirements/README.md) and [traceability](docs/requirements/traceability.md): behavior and implementation status.
- [Current architecture](docs/architecture-stack.md), [design system](docs/design-system.md), [quality checks](docs/quality-and-ci.md), and [production targets](docs/production-targets.md).
- [Cloudflare deployment](docs/deployment-cloudflare.md): Workers build and custom-domain configuration.

The app routes live in `src/app/`; domain rules in `src/domain/`; UI in `src/components/`; and browser persistence in `src/infrastructure/storage/`.
