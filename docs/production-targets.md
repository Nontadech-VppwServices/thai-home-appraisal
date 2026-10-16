# Production Targets (Not Implemented)

These are design directions, not claims about the current prototype. Confirm deployment, bank contracts, data retention, and security requirements before implementation.

- Add real accounts, server-side authorization, immutable audit evidence, encryption, retention/deletion rules, and controls for personal data.
- Choose a database and image store after deployment and retention decisions. Prisma is a possible infrastructure-only ORM, not a current dependency or approved schema.
- Keep domain models independent of frameworks and persistence. Introduce application use cases and repository interfaces only where real boundaries justify them; map database records in infrastructure.
- Define and validate bank-specific export/API contracts, authentication, acknowledgements, and handoff before replacing generic CSV and simulated integration. Do not infer schemas from the demo.
- Decide whether cross-device sync, offline use, digital signatures, and automated bank intake/delivery are required.
- Establish CI, migration review, backup/recovery, and deployment checks once environments exist. Do not treat local checks as production readiness.

See the [requirements index](requirements/README.md) for product questions and the [quality guide](quality-and-ci.md) for current validation commands.
