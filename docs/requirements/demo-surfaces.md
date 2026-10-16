# Interactive Demo Surfaces

These pages demonstrate possible later workflows locally; they do not provide production security or bank delivery.

## REQ-REVIEW-001 Review and return a job

The review page summarizes readiness, checklist, valuation, evidence, and status history. An authorized demo user can return `readyToSubmit` to `changesRequested` only with a reason. Demo approval proceeds to handoff without adding another status.

## REQ-EXPORT-001 Export data

Preview and export one job as properly escaped generic UTF-8 CSV. Exclude photo Data URLs and state that the file does not follow a bank-specific schema.

## REQ-INTEGRATION-001 Simulate a bank API

Preview a JSON payload without large image data and create a correlation ID on simulated send. Do not make a network request or change job status; record the demo activity locally.

## REQ-SECURITY-001 Show security posture

State that login, permissions, activity history, and storage are client-side demos, without enforced encryption or retention. Show the local activity log and role summary without calling them production audit evidence.
