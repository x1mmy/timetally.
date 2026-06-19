-- Add break tracking to employee categories and timesheets
-- enable_break_tracking: per-category opt-in for employees to clock out/in for breaks
-- on_break / break_start_time: track active break state on a timesheet row

ALTER TABLE employee_categories
  ADD COLUMN IF NOT EXISTS enable_break_tracking BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE timesheets
  ADD COLUMN IF NOT EXISTS on_break BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS break_start_time TIME;

-- Fix: preserve manually accumulated break_minutes when end_time is not yet set.
-- The previous ELSE branch unconditionally reset break_minutes to 0 on every update,
-- which would wipe tracked break time before the employee clocks out.
CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_hours DECIMAL;
  v_break_minutes INTEGER;
  v_client_id UUID;
BEGIN
  SELECT client_id INTO v_client_id
  FROM employees
  WHERE id = NEW.employee_id;

  NEW.client_id := v_client_id;

  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    v_raw_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

    v_break_minutes := calculate_break_minutes(v_client_id, v_raw_hours);

    IF NEW.break_minutes IS NULL THEN
      NEW.break_minutes := v_break_minutes;
    END IF;

    NEW.total_hours := v_raw_hours - (NEW.break_minutes / 60.0);
  ELSE
    -- Preserve manually tracked break_minutes; only default to 0 if unset
    IF NEW.break_minutes IS NULL THEN
      NEW.break_minutes := 0;
    END IF;
    NEW.total_hours := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
