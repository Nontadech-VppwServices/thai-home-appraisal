# Cloudflare Deployment

This Next.js prototype uses the OpenNext adapter for Cloudflare Workers. The existing webpack build remains authoritative because the drawing importer uses a custom webpack fallback for OpenCV. The Worker configuration targets the active Cloudflare zone at `home.vespiarioth.com`.

## Local checks and deployment

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm cf:build
pnpm cf:preview
pnpm cf:deploy
```

`cf:build` lets OpenNext invoke the existing `next build --webpack` script in standalone mode before adapting its output. `cf:preview` runs the generated Worker locally; `cf:deploy` uploads it and attaches the custom domain through `wrangler.jsonc`. Wrangler must be authenticated to the account that owns `vespiarioth.com`. The custom domain provisions its own DNS record and TLS certificate; do not add a competing CNAME record.

The site is a public **prototype**, not a production appraisal service. It has browser-local storage and demo-only permissions; no server-side login, shared database, or real bank delivery. Do not enter real customer data until production security and retention requirements are implemented. To restrict access, add a Cloudflare Access policy before using it with non-demo data.

After deployment, verify the exact HTTPS hostname, a dynamic job route, static assets, and a browser workflow. A successful build or HTTP 200 alone is not end-to-end proof.
