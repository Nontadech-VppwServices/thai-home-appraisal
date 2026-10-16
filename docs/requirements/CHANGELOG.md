# Requirements Changelog

## 0.10.0 — 2026-09-23
- Focused new drawings on room, building, and house-plan work; store schema v2 removes existing road, land, housing-estate, and village drawings once.
- Added a categorized appraisal material library with direct-draw and stamped components for walls, openings, stairs, hatched areas, labels, inspection leaders, and numbered callouts.
- Added persistent drag-to-draw, 45° snapping, mobile free-angle control, desktop Alt override, and one Undo step per completed stroke.
- Added editable double-door and straight/L/U-stair variants while keeping the prototype illustrative and without scale.

## 0.9.4 — 2026-09-22
- Aligned mobile drawing-dock actions with the input control baseline while retaining the single-row height and touch targets.

## 0.9.3 — 2026-09-22
- Placed all mobile selected-element properties in a single horizontally scrollable strip that replaces the add tools at the same height and position, without covering the drawing with an automatic sheet.

## 0.9.2 — 2026-09-22
- Split the mobile drawing dock into add mode and selection-driven editing, with visible text editing, delete, and unselect actions.
- Kept drawing-level title and element-list controls in the header panel; selected-element controls scroll within a dock capped at 40% of viewport height.

## 0.9.1 — 2026-09-22
- Prevented page scrolling during mobile canvas gestures and made the property panel visible above mobile navigation with internal scrolling.
- Added 45° left/right rotation controls alongside the existing 15° controls.

## 0.9.0 — 2026-09-22
- Added `REQ-DRAWING-004`: crop a house-plan sketch one floor at a time, detect lines locally, and create editable walls/lines without retaining the source image.
- Added `REQ-DRAWING-001`–`003`: seven illustrative drawing types, separate house-plan floors, mobile editing, report inclusion, and image export.
- Added house-plan starters, stairs, hatching, dashed lines, and editable polygon points; dimensions remain user-entered text without scale.
- Made drawing templates monochrome plans focused on boundaries, walls, openings, entrances, and roads rather than furniture.
- Revised mobile navigation and the design system, using UI UX Pro Max for UX review.
- Stored drawing shapes in `localStorage` with legacy-data migration; prototype limitations remain.

## 0.8.0 — 2026-08-29
- Replaced intake, review, export, handoff, integration, and security scaffolds with interactive demos.
- Added `intake → assigned → readyToSubmit → submitted`, the `changesRequested` return path, and status history.
- Added intake, appraiser/contact, handoff evidence, generic CSV, simulated integration, and local activity data.
- Organized navigation into four workflow stages and locked appraisal pages by status while documenting auth, storage, and bank API limits.

## 0.7.0 — 2026-08-29
- Changed `REQ-INSIGHT-006` to auto-seed demo jobs on first view when no demo jobs exist, regardless of demo role, so reports are not empty.
- Remembered prior seeding so cleared examples stay cleared; added an explicit demo-data warning.

## 0.6.0 — 2026-08-29
- Added [insights.md](insights.md) and `REQ-INSIGHT-001`–`007` for administrator filters, summaries, backlog, stage/job duration, demo data, and appraiser workload.
- Connected `/insights` to existing `src/domain/reporting.ts`, added load/clear controls through `src/domain/demoJobs.ts`, `assigneeStats`, and tests for both modules.
- Marked stage-time targets and stale-job thresholds as unvalidated assumptions, not bank SLAs.

## 0.5.0 — 2026-08-28
- Added `REQ-REFERENCE-001`–`006` for searching, importing, selecting, summarizing, and reusing price evidence.
- Added the references page, browser snapshot library, location/time lookup of prior jobs, and external link-outs.
- Added comparable ranges and report evidence, with migration of the old `comparePrice` value.

## 0.4.0 — 2026-08-28
- Added `REQ-ROLE-002`: per-team hidden/read/edit menu permissions and demo `/login`/`/permissions` pages. Client-only enforcement does not complete `REQ-ROLE-001`.

## 0.3.0 — 2026-08-28
- Added [pipeline.md](pipeline.md) for Team A intake, Team B appraisal, and Team C handoff.
- Added `REQ-PIPELINE-001`–`006` for intake, assignment, appraisal, delivery, transitions, and returns, plus `REQ-ROLE-001` for real account-bound roles dependent on `REQ-SECURITY-001`.
- Added intake and handoff route scaffolds.

## 0.2.0 — 2026-08-28
- Added a Next.js/TypeScript App Router implementation with separate jobs, creation, workflow, property, photos, valuation, and report pages.
- Added review, export, bank-integration, and security scaffolds with explicit production questions; updated route/component traceability.

## 0.1.0 — 2026-08-28
- Added the initial home-appraisal prototype requirements, property/photo workflow, and three valuation methods.
- Linked requirements to `index.html` and identified production gaps in login, backend, review, and bank APIs.
