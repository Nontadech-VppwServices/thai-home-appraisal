# Requirements Index

Version: `0.10.0` · Status: Next.js browser-local prototype · Updated: 2026-09-23

Requirements are the source of truth for business behavior. Use `REQ-<DOMAIN>-###` identifiers and update [traceability](traceability.md) when behavior changes. Read only the domain relevant to the task:

| Responsibility | Document |
|---|---|
| Job creation, persistence, property, photos | [Jobs and property](job-and-property.md) |
| Drawing editor, house plans, sketch import | [Drawings](drawings.md) |
| Valuation and printable report | [Valuation and report](valuation-and-report.md) |
| Team A/B/C lifecycle and permissions | [Pipeline and roles](pipeline.md) |
| Price evidence and snapshots | [References](references.md) |
| Administrator reporting | [Insights](insights.md) |
| Review, generic export, simulated API, security page | [Demo surfaces](demo-surfaces.md) |

The prototype stores jobs in one browser, prints through the browser, and simulates roles and bank handoff. It does **not** provide real login, server authorization, central storage, cross-device sync, bank delivery, production audit, encryption, or retention enforcement. Confirm bank schemas and accepted valuation sources, reviewer roles, retention/PDPA, offline and signature needs, and handoff acknowledgements before production. See [production targets](../production-targets.md) for technical decisions.

Historical changes are in [CHANGELOG.md](CHANGELOG.md).
