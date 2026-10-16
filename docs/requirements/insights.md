# Administrator Insights

This read-only, browser-local report uses job `statusHistory` to show current backlog, bottlenecks, job duration, and Team B workload. It does not modify jobs. Timeliness targets are illustrative, not bank SLAs.

## REQ-INSIGHT-001 Restrict the insights page

The administrator demo role can open `/insights`; Teams A/B/C default to a hidden menu. Direct access without permission shows an explanation rather than a blank page. The report has no job-editing actions. `/permissions` can adjust the demo menu setting. This is not server authorization.

## REQ-INSIGHT-002 Filter by time

Offer today, trailing 7 days, trailing 30 days, trailing 12 months, and an inclusive custom date range. Presets are rolling windows, not calendar periods. Incomplete or reversed custom ranges show a warning rather than silently changing results. Choose daily/weekly/monthly trend buckets by range length and display the chosen granularity. The prototype does not persist this filter across page loads.

## REQ-INSIGHT-003 Summarize work

Show incoming and closed jobs, closed-job value, current backlog, on-time rate, and return rate, plus an incoming-versus-closed trend. Incoming uses receipt date; closed uses the transition to `submitted`. Value covers jobs closed in the selected period. On-time rate excludes jobs without due dates and shows its denominator; return rate uses incoming jobs as its denominator. Current backlog is not filtered by the selected period.

## REQ-INSIGHT-004 Locate backlog

Show current open jobs by status and owning team, with average and oldest age per stage. Highlight overdue, inactive, and longest-open jobs, showing a bounded list and total count. Editing activity prevents a job from being marked inactive even when status does not change. Current backlog remains independent of the date filter.

## REQ-INSIGHT-005 Measure stage and job duration

Show mean, median, p90, and sample count in days for each stage; identify the largest-median bottleneck. For complete jobs, show mean, median, p90, fastest, slowest, and duration distribution from receipt to submission. Repeated stages after returns count as separate intervals. Open intervals run through the end of today and are labeled lower bounds. Stage targets and stale-job thresholds are unvalidated assumptions, not bank SLAs. Stage durations can include open intervals ending inside the selected range; Team B performance counts completed intervals only, so totals intentionally differ.

## REQ-INSIGHT-006 Seed demo data

On first view without demo jobs, seed deterministic examples automatically and default to 12 months. A real job must not suppress seeding; seeding is independent of demo role so the page is not empty. Demo IDs start with `demo-` and coexist with real jobs. Remember that seeding occurred so a later user-initiated clear does not refill data. Mark demo data clearly and explain removal according to current permissions. Only the administrator demo role can load or clear manually; clearing requires confirmation and removes only demo jobs. Reloading uses the same IDs rather than creating duplicates. Seed data covers closed, open, and returned jobs with status history. Report browser quota failures.

## REQ-INSIGHT-007 Summarize appraisers

For each Team B appraiser, show current assigned workload, overdue workload, jobs closed in range, completed work intervals, and mean interval duration with sample count. Jobs handed to Team C are not Team B workload. Completed intervals across appraisers must total Team B's completed intervals. Group jobs without an appraiser as one `ยังไม่ระบุผู้ประเมิน` row. Use this for workload/bottleneck analysis, not individual performance appraisal.

## Prototype limits

The report sees only jobs in the current browser. Demo permissions do not restrict server access. Targets remain unvalidated, and there is no file export or overdue notification. Real jobs may show limited history until the user progresses through the workflow.
