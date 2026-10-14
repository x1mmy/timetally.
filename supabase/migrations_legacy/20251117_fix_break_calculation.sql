-- Fix calculate_timesheet_hours to handle NULL end_time
-- This allows saving partial timesheets (start time only, or end time only)

CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_hours DECIMAL;
  v_break_minutes INTEGER;
  v_client_id UUID;
BEGIN
  -- Get client_id from employee
  SELECT client_id INTO v_client_id
  FROM employees
  WHERE id = NEW.employee_id;

  -- Set client_id for efficient queries
  NEW.client_id := v_client_id;

  -- Only calculate hours if both start_time and end_time are present
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    -- Calculate raw hours (end - start)
    v_raw_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

    -- Calculate break minutes based on raw hours
    v_break_minutes := calculate_break_minutes(v_client_id, v_raw_hours);

    -- Set break_minutes if not manually set
    IF NEW.break_minutes IS NULL THEN
      NEW.break_minutes := v_break_minutes;
    END IF;

    -- Calculate final total hours (raw hours - break time)
    NEW.total_hours := v_raw_hours - (NEW.break_minutes / 60.0);
  ELSE
    -- If times are incomplete, set defaults
    NEW.break_minutes := 0;
    NEW.total_hours := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
