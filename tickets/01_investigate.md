# Ticket: Investigate Outage

## Status
Done

## Description
The site is reported down. We need to find the smoking gun.
1. Check if Docker containers are running (`docker ps`).
2. Check backend logs for errors.
3. Check database connectivity.
4. Run `test-db.mjs` or similar diagnostics if available.

## Acceptance Criteria
*   Log analysis complete.
*   Root cause identified (e.g., "DB connection failed", "Syntax error in main.py").
*   Report written to `investigation_report.md`.
