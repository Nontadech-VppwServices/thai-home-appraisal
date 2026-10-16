# Team Pipeline and Roles

The browser demo models Team A intake, Team B appraisal, and Team C handoff. It has no real accounts, server-side authorization, or production audit. Team A records bank work manually; Team C records manual delivery.

| Status | `JobStatus` | Owner |
|---|---|---|
| Awaiting assignment | `intake` | Team A |
| Assigned for inspection | `assigned` | Team B |
| Awaiting bank handoff | `readyToSubmit` | Team C |
| Changes requested | `changesRequested` | Team B |
| Submitted to bank | `submitted` | None |

Legacy statuses are normalized when read from `localStorage`.

## REQ-PIPELINE-001 Capture bank work

Team A records bank name and reference, receipt and due dates, client, preliminary property data, and site contact. A new job starts in `intake`. The same bank reference cannot be reused by another open job.

## REQ-PIPELINE-002 Assign an appraiser

Team A selects a Team B appraiser and inspection date before assignment. The job becomes `assigned`. The appraiser can be changed until the job reaches `readyToSubmit`.

## REQ-PIPELINE-003 Perform the appraisal

Team B sees Team A's bank-reference fields as read-only and enters property details, at least one photo, price evidence, and valuation. Submission requires property data, a photo, and a valuation; it moves the job to `readyToSubmit`. See `REQ-PROPERTY-001`, `REQ-PHOTO-001`, `REQ-REFERENCE-001`–`005`, and `REQ-VALUATION-001`.

## REQ-PIPELINE-004 Record bank handoff

Team C reviews completeness, then records channel, time, sender, and bank response reference. Completion moves the job to `submitted` and locks edits. Incomplete work must be returned through `REQ-PIPELINE-006`.

## REQ-PIPELINE-005 Enforce transitions and history

Allow `intake → assigned → readyToSubmit → submitted` and the return path `readyToSubmit → changesRequested → readyToSubmit`. No skipped transitions or changes after `submitted`. Every transition records old/new status, actor, time, and note; show history chronologically. Current history is browser-local and not tamper-proof.

## REQ-PIPELINE-006 Return work for correction

Team C or Team A must provide a reason before returning a job to Team B. The job becomes `changesRequested`, Team B can edit it again, and the reason appears in status history.

## REQ-ROLE-001 Bind roles to real accounts

**Production acceptance target, not completed:** accounts can hold Team A, B, C, or administrator roles; unauthorized actions are rejected server-side; history actors refer to real accounts. The intended permission matrix is:

| Action | Team A | Team B | Team C |
|---|---|---|---|
| Capture/edit bank references; assign appraiser | Edit | None | None |
| Edit property, photos, drawings, price evidence, valuation | None | Assigned jobs only | None |
| Record bank handoff | None | None | Edit |
| Return work | Edit | None | Edit |
| View jobs/reports | View | Assigned jobs only | View |

The current `/login` buttons bypass authentication. Permissions are client-side; direct URLs can show a read-only page with a warning. Local history can be altered through Developer Tools. None of this meets server-side access or audit acceptance.

## REQ-ROLE-002 Configure menu permissions

The administrator demo can set each team's menu permission to hidden, read-only, or editable. Defaults follow the matrix above. Hidden menus disappear from navigation; read-only menus explain why editing is unavailable. Changes apply immediately, survive a browser reload, and can be reset to defaults. Only the administrator demo role can change this matrix. This covers menus, not field-level or server-side permissions.

## Deferred

Automated bank intake/delivery, cross-team notifications, and bank-specific SLA/overdue alerts are not implemented.
