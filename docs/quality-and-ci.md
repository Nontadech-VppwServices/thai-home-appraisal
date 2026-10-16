# Quality and CI

## Current local checks

`package.json` is authoritative:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

The scripts run ESLint, TypeScript, Vitest, and a Next.js production build using webpack. Run checks proportional to the change and report any that did not run. Browser behavior, touch gestures, printing, and external integrations need separate verification.

## Future CI

No GitHub Actions workflow is currently present. When one is introduced, use the pinned pnpm lockfile and compatible Node version, run the same checks on pull requests, and make required checks explicit. Keep secret-dependent integration checks separate; never print secrets. Add deployment, database migration, and production security checks only after their actual environments and requirements are defined.
