# Study Hall planning in Midnight Study Room

## Source inspection, October 29, 2026

The existing app is `LiaFdez7/midnight-study-room`. The owner clarified that Midnight Study Room is the app they have; a separate Study Hall dashboard is not an available implementation. Earlier descriptions of a separate shared dashboard store or grade tracker are not implementation evidence for this repository.

The room source already contains course-specific tasks, day/due-date fields, priorities, estimated/studied minutes, a timer, local persistence, safe additive backup restoration, and a Google Sheets connector. This inspection did not verify a live connection to the owner's Sheet or access their browser records.

## Stage 1: submission tracking and mini-steps

Open the notebook, add a task, then Edit. Select Type → Assignment to access Not started, In progress, Ready to submit, and Submitted. The Ready action keeps the assignment unfinished and visible in Today, even if it was planned for a future day. Confirm submission in Edit after submitting. Submitted means user-confirmed, never Canvas-verified. Optional receipt links and confirmation timestamps are available.

Add editable mini-steps with minute estimates. Completing steps never submits an assignment. Empty steps must be named or removed before saving. The editor supports up to 30 steps. Ordinary task check-offs retain their behavior. Old completed assignments remain completed with submission explicitly unconfirmed; existing records are not silently reclassified.

Details persist in this browser and exported backups. The existing Sheet schema and connector are unchanged: workflow, steps, receipt, and confirmation timestamp do not sync between devices. Legacy Sheet responses preserve these local fields, and ordinary title/deadline updates still apply. Once a local assignment workflow is set, its completion state is managed locally to prevent a remote generic “done” from claiming submission. Use backups when moving these details to another device. Restore remains additive and does not overwrite an already-existing task.

## Validation

- `node --test tests/assignments.test.cjs`: five checks covering legacy data, task completion, steps, explicit submission/reopening, persistence, safe backup merge, legacy Sheet responses, and invalid input.
- `python _source/build.py _source/room.dc.html .`: rebuilds the published page and service-worker cache version. Bundled fonts/icons can be sourced from the repository root when _source copies are absent.
- Browser QA with isolated sample data: created an assignment and estimated mini-step; completed the step; marked Ready and confirmed it remained incomplete; refreshed and verified persistence; explicitly marked Submitted and verified the Completed list and timestamp.
- Owner's live Sheet, real academic records, mobile viewport, and Windows installation were not tested during this stage.

## Remaining proposals, not implemented

1. Next-task recommendation card with reasons and verified-source handling.
2. Exam score calculator using verified grading rules.
3. Available-time filter for tasks and steps.
4. Deadline change history and alerts.
5. Weekly workload comparison against actual availability.

These remain proposals. No syllabus weights, grades, schedules, deadlines, or automatic Canvas connection should be invented to populate them.
