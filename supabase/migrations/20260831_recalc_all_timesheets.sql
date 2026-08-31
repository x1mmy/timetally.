-- Migration: Recalculate existing timesheets under the corrected break boundary
-- Date: 2026-08-31
-- Run AFTER 20260831_fix_break_boundary_exclusive.sql
--
-- WHY THIS IS NEEDED
--   calculate_break_minutes() only runs inside the calculate_timesheet_hours()
--   trigger, which fires on INSERT/UPDATE. Fixing the function changes the logic
--   for future writes but does NOT retroactively recompute already-stored rows —
--   their break_minutes/total_hours keep whatever was calculated under the old
--   inclusive boundary. Sanya's 19/8 and 20/8 would still read 4.50 hours.
--
-- HOW IT WORKS
--   Setting break_minutes to NULL makes the trigger recompute it (see
--   20260124_employee_features.sql: it only recalculates when break_minutes
--   IS NULL). total_hours is then recalculated from the new break value.
--
-- SCOPE
--   Only rows whose stored break disagrees with what the corrected rules
--   produce. Verified against production before running: 14 rows, of which 13
--   were exact 5-hour shifts going 4.50 -> 5.00 hours.
--
-- ---------------------------------------------------------------------------
-- PREVIEW — run this first. Read-only. Lists every row the UPDATE will change,
-- with before/after values, so there are no surprises. Re-run it afterwards:
-- it should return zero rows, meaning nothing is left mismatched.
-- ---------------------------------------------------------------------------
-- SELECT t.work_date,
--        e.first_name || ' ' || e.last_name AS employee,
--        c.business_name,
--        e.apply_break_rules,
--        t.break_minutes AS break_now,
--        CASE WHEN e.apply_break_rules
--             THEN calculate_break_minutes(e.client_id,
--                    EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600)
--             ELSE 0 END AS break_after,
--        t.total_hours AS total_now
-- FROM timesheets t
-- JOIN employees e ON e.id = t.employee_id
-- JOIN clients c ON c.id = e.client_id
-- WHERE t.start_time IS NOT NULL AND t.end_time IS NOT NULL
--   AND t.break_minutes IS DISTINCT FROM
--       (CASE WHEN e.apply_break_rules
--             THEN calculate_break_minutes(e.client_id,
--                    EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600)
--             ELSE 0 END)
-- ORDER BY t.work_date DESC;

-- Null out break_minutes so the trigger recalculates break and total hours.
UPDATE timesheets t
SET break_minutes = NULL,
    updated_at = NOW()
FROM employees e
WHERE e.id = t.employee_id

  -- Skip incomplete entries. The trigger returns early on a NULL end_time,
  -- which would strand break_minutes as NULL instead of recalculating it.
  AND t.start_time IS NOT NULL
  AND t.end_time IS NOT NULL

  -- Only touch rows that actually change. Without this every timesheet in the
  -- database gets rewritten (and its updated_at churned) just to arrive back at
  -- the same numbers. IS DISTINCT FROM rather than <> so NULL breaks compare.
  AND t.break_minutes IS DISTINCT FROM

      -- What the break SHOULD be — mirrors the trigger's own logic:
      -- employees with break rules disabled are forced to 0, everyone else
      -- gets the rule matching their shift length under the corrected
      -- exclusive boundary.
      (CASE WHEN e.apply_break_rules
            THEN calculate_break_minutes(e.client_id,
                   -- Raw shift length in hours, e.g. 09:30-14:30 = 5.0
                   EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600)
            ELSE 0 END);

-- Expected result: UPDATE 14
-- A much larger number means the preview above no longer matches reality —
-- stop and re-check before continuing.
