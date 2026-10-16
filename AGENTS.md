# Repository Guide

Read this file first. Open only the task-relevant document below; do not preload all documentation.

## Working rules

- Reply to the user in Thai; write repository Markdown in English, retaining exact Thai UI labels where necessary.
- Check available connected tools before repository or integration work; verify external state when relevant.
- Preserve unrelated work in the current branch. Inspect status and relevant code before editing.
- Do not commit directly to `main`/`master`, force-push, or merge without explicit authorization.
- Keep changes small, typed, testable, and aligned with existing patterns. Do not add speculative infrastructure.
- Requirements in `docs/requirements/` define business behavior. For a behavior change, update its requirement, traceability entry, and changelog/version; resolve conflicts before coding.
- Treat this as a browser-local prototype: `localStorage`, demo roles, and simulated integrations are not production authentication, audit, storage, or bank delivery.
- Never expose secrets or personal data. Report exactly which checks ran and which boundaries remain unverified.
- For Next.js API changes, read the relevant installed guide in `node_modules/next/dist/docs/` before coding.

## Read by task

| Task | Read |
|---|---|
| Product behavior or acceptance criteria | [requirements index](docs/requirements/README.md), then the relevant domain file |
| Routes, state, persistence, dependencies | [current architecture](docs/architecture-stack.md) |
| UI, mobile, accessibility, print | [design system](docs/design-system.md) |
| CI or validation | [quality and CI](docs/quality-and-ci.md) |
| Cloudflare build, domain, or deployment | [Cloudflare deployment](docs/deployment-cloudflare.md) |
| Production architecture or security decisions | [production targets](docs/production-targets.md) |
| Reusable coding behavior skill | [Karpathy guidelines](skills/karpathy-guidelines/SKILL.md), only when applicable |

## Local checks

Use `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` as relevant; finish with `git diff --check`. Scripts in `package.json` are authoritative. Do not claim a browser flow, deployment, or production integration was verified by these checks alone.
