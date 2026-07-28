-- Fix: clocking in (INSERT with end_time NULL) was violating the NOT NULL
-- constraint on timesheets.total_hours.
--
-- The live database's calculate_timesheet_hours() previously set
-- total_hours := 0 for open shifts (no committed migration recorded this —
-- schema drift), but the 20260728_timesheet_breaks.sql migration replaced
-- the function based on the committed history alone and dropped that
-- fallback, since it was never reflected in any migration file on disk.
-- Restoring it here.

CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_hours DECIMAL(5,2);
  v_apply_breaks BOOLEAN;
  v_has_logged_breaks BOOLEAN;
BEGIN
  IF NEW.end_time IS NULL THEN
    NEW.total_hours := 0;
    RETURN NEW;
  END IF;

  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id
    FROM employees WHERE id = NEW.employee_id;
  END IF;

  v_raw_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

  SELECT EXISTS(
    SELECT 1 FROM timesheet_breaks
    WHERE timesheet_id = NEW.id AND break_end_time IS NOT NULL
  ) INTO v_has_logged_breaks;

  IF NOT v_has_logged_breaks THEN
    SELECT apply_break_rules INTO v_apply_breaks
    FROM employees WHERE id = NEW.employee_id;

    IF v_apply_breaks = true AND NEW.break_minutes IS NULL THEN
      NEW.break_minutes := calculate_break_minutes(NEW.client_id, v_raw_hours);
    ELSIF v_apply_breaks = false THEN
      NEW.break_minutes := 0;
    END IF;
  END IF;

  NEW.total_hours := v_raw_hours - (COALESCE(NEW.break_minutes, 0) / 60.0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;