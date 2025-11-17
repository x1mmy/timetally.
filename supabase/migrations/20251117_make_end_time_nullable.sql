-- Make end_time nullable to allow employees to clock in first, then clock out later
-- This allows saving timesheet with just start_time, then updating with end_time

ALTER TABLE timesheets
ALTER COLUMN end_time DROP NOT NULL;

-- Update the trigger to handle null end_time
-- Only calculate total_hours when both start_time and end_time exist
CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if both start_time and end_time are provided
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    -- Calculate hours worked (end_time - start_time)
    NEW.total_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

    -- If break_minutes is provided, subtract from total hours
    IF NEW.break_minutes IS NOT NULL THEN
      NEW.total_hours := NEW.total_hours - (NEW.break_minutes / 60.0);
    END IF;
  ELSE
    -- If either time is missing, set total_hours to 0
    NEW.total_hours := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
