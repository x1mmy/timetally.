-- Migration: Recalculate all existing timesheets under the corrected break boundary
-- Date: 2026-08-31
-- Run AFTER 20260831_fix_break_boundary_exclusive.sql
--
-- Why this is needed:
--   calculate_break_minutes() only runs inside the calculate_timesheet_hours()
--   trigger, which fires on INSERT/UPDATE. Fixing the function changes the logic
--   for future writes but does NOT retroactively recompute already-stored rows —
--   their break_minutes/total_hours stay as they were calculated under the old
--   inclusive boundary. This backfills every existing timesheet.
--
-- How it works:
--   Setting break_minutes to NULL makes the trigger recompute it (see
--   20260124_employee_features.sql: the trigger only recalculates when
--   break_minutes IS NULL, and skips employees with apply_break_rules = false,
--   forcing those to 0). total_hours is then recomputed from the new break.
--
-- Scope: all clients, all history. Only rows landing exactly on a tier boundary
--   (e.g. exactly 5.00 or 7.00 hours) change value; every other row recomputes to
--   the identical number it already had, since the trigger is deterministic.
--   Rows without both start and end time are skipped — the trigger returns early
--   on a NULL end_time and would leave break_minutes stranded as NULL.
--
-- NOTE: this retroactively changes hours on pay periods that may already have
--   been paid out. Confirmed as intended.

-- ---------------------------------------------------------------------------
-- BEFORE: rows that will actually change (exact tier boundaries).
-- Run this first and keep the output to compare against afterwards.
-- ---------------------------------------------------------------------------
-- SELECT t.id, t.work_date, e.name, t.start_time, t.end_time,
--        t.break_minutes, t.total_hours
-- FROM timesheets t
-- JOIN employees e ON e.id = t.employee_id
-- WHERE t.start_time IS NOT NULL AND t.end_time IS NOT NULL
--   AND EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600 IN (5, 7)
-- ORDER BY t.work_date DESC;

UPDATE timesheets
SET break_minutes = NULL,
    updated_at = NOW()
WHERE start_time IS NOT NULL
  AND end_time IS NOT NULL;

-- ---------------------------------------------------------------------------
-- AFTER: re-run the query above. Exact 5-hour shifts should now show
-- break_minutes = 0 and total_hours = 5.00 (previously 30 and 4.50).
-- ---------------------------------------------------------------------------
