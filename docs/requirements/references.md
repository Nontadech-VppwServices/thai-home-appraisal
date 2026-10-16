# Price-Reference Evidence

The system assists Team B with evidence; the appraiser chooses references and the final valuation. Government appraisals, market asking prices, and prior company jobs are distinct sources, not interchangeable transaction prices.

## REQ-REFERENCE-001 Search comparable prices

Search by job coordinates and property type, defaulting to the same type, a 5 km radius, and the last 24 months. Users can adjust location, type, radius, and period. Keep government, asking-price, and prior-job results separate; show distance, date, source, amount, and unit. If coordinates are missing, request them rather than guessing.

## REQ-REFERENCE-002 Import an external snapshot

After user verification, capture source/provider, URL, external reference, property type, address, coordinates, total and unit prices, area, source date, import time, and importer. Mark market listings as asking prices. Saved snapshots are immutable; corrections create a revision linked to the original. Deduplicate by provider plus external reference, or URL plus price plus source date. Existing reports must retain stored values if a source URL disappears.

## REQ-REFERENCE-003 Select and reuse evidence

Team B can select multiple records, deselect them, and explain similarities/differences while the job remains editable. Store selector and selection time. Prior snapshots and jobs must be discoverable for eligible new jobs. The prototype library is limited to one browser; company-wide reuse requires central storage.

## REQ-REFERENCE-004 Summarize comparable ranges

For selected evidence, show minimum, median, maximum, and sample count separately by source and price unit (total THB, THB/`ตร.วา`, THB/`ตร.ม.`). Never copy a summary into the final valuation automatically.

## REQ-REFERENCE-005 Show evidence in appraisal and report

Show grouped ranges in valuation while the appraiser enters the final price. Reports show the selected snapshot, date, provider, URL, note, and range. Missing evidence produces a warning/checklist acknowledgement, not a submission block.

## REQ-REFERENCE-006 Govern access and sources

Team B edits/selects; Teams A/C read; administrators manage providers and duplicates. Production needs server-side authorization and audit. Automatic retrieval must use authorized APIs, feeds, or contracts; otherwise link out and require user verification. Never label government values or aggregate indices as parcel-level market prices.

## Prototype limits

No central database, external API call, or scraping is implemented. Link-outs require manual import; permissions remain a client-side demo under `REQ-ROLE-001`.
