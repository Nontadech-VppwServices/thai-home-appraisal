# Requirement Traceability

Statuses describe the local prototype, not production readiness. The requirement source is the linked domain document in the [index](README.md).

| Requirement | Implementation / verification | Status |
|---|---|---|
| REQ-WORKFLOW-001 | `/jobs/new`, workflow: create and reopen a job with bank/client/date | Implemented |
| REQ-WORKFLOW-002 | `appraisalStore.ts`: edit, autosave/manual save, reload | Implemented |
| REQ-PROPERTY-001 | Property page: address, coordinates, type, condition, area, floors, year, rooms | Implemented |
| REQ-PROPERTY-002 | Property/summary/report: exact UI units `ตร.วา`, `ตร.ม.`, `บาท`; numeric storage | Implemented |
| REQ-PHOTO-001 | Photos/report: add multiple images and preview them | Implemented |
| REQ-PHOTO-002 | Photos/report: delete an image and confirm it disappears | Implemented |
| REQ-DRAWING-001 | Drawings page, `drawings.ts`, and store schema v2: room/building/house-plan types, floor variants, copy/delete/reload, and one-time removal of retired drawing types | Prototype |
| REQ-DRAWING-002 | Editor, material catalog, renderer, and `drawingGeometry.ts`: categorized direct/stamp tools, persistent draw mode, 45° snap/free-angle override, door/stair variants, callouts, selection, handles, scroll isolation, same-height mobile add/edit dock, text draft, delete/undo, and rotation; real iPhone touch/pinch/`pointercancel` still needs device verification | Prototype; device check pending |
| REQ-DRAWING-003 | Drawings/report: include selected drawings and export PNG/SVG; printed output needs real-browser verification | Prototype; print check pending |
| REQ-DRAWING-004 | `DrawingImageImport.tsx`, worker, `drawingImport.ts`: crop/rotate/review/import editable lines; end-to-end upload/result through UI still needs verification | Prototype; UI check pending |
| REQ-VALUATION-001 | Valuation and `appraisal.ts`: test all three methods | Implemented |
| REQ-VALUATION-002 | Price summary/report: change method and check amount/explanation | Implemented |
| REQ-REFERENCE-001 | References: same-type, 5 km/24-month defaults and separate sources | Prototype |
| REQ-REFERENCE-002 | Reference import/store: dedupe and immutable snapshots | Prototype |
| REQ-REFERENCE-003 | Reference selection: select/deselect/reload and reuse within the same browser | Prototype |
| REQ-REFERENCE-004 | Reference/valuation summaries: min/median/max by source and unit | Implemented |
| REQ-REFERENCE-005 | Checklist, valuation, report: warn when missing; render saved evidence | Implemented |
| REQ-REFERENCE-006 | `access.ts` and link-outs: demo role behavior only; no server auth or provider API | Partial |
| REQ-REPORT-001 | Report and print CSS: open print dialog/save PDF | Implemented; print check pending |
| REQ-REPORT-002 | Checklist/report: disclose no actual bank delivery | Implemented |
| REQ-REVIEW-001 | Review: checklist, timeline, reasoned return, handoff route | Demo |
| REQ-EXPORT-001 | Export: preview generic UTF-8 CSV without image Data URLs | Demo |
| REQ-INTEGRATION-001 | Integration: preview JSON and simulated correlation ID without network send | Demo |
| REQ-SECURITY-001 | Security page: posture, role summary, local activity; no production controls | Partial |
| REQ-PIPELINE-001 | New job/intake: bank reference, dates, client, property, contact | Demo |
| REQ-PIPELINE-002 | Intake: required appraiser/date and duplicate-reference checks | Demo |
| REQ-PIPELINE-003 | Property/photos/references/valuation: editable states and completion gate | Demo |
| REQ-PIPELINE-004 | Handoff: channel/time/sender/response and submitted lock | Demo |
| REQ-PIPELINE-005 | `appraisal.ts`, store, review: transition tests and ordered history | Demo |
| REQ-PIPELINE-006 | Review: require return reason and show it in history | Demo |
| REQ-ROLE-001 | Login, `access.ts`, shell: role matrix tests; no server-side enforcement | Demo only |
| REQ-ROLE-002 | Permissions/`accessStore.ts`: change, reload, reset menu settings | Demo |
| REQ-INSIGHT-001 | Insights/`access.ts`: administrator menu; direct URL gives demo access notice | Demo only |
| REQ-INSIGHT-002 | Insights/`resolveRange`: five filters and invalid custom-range warning | Implemented |
| REQ-INSIGHT-003 | Insights: reconcile trend with incoming/closed counts and closed value | Implemented |
| REQ-INSIGHT-004 | Insights: stage backlog totals match current open jobs | Implemented |
| REQ-INSIGHT-005 | Insights: repeated returned intervals and assumed-target warnings | Prototype; targets unvalidated |
| REQ-INSIGHT-006 | Insights/`demoJobs.ts`: first-view auto-seed, deterministic load/clear, preserve real jobs | Demo only |
| REQ-INSIGHT-007 | Insights/`assigneeStats`: Team B completed-interval totals and current workload | Implemented |
