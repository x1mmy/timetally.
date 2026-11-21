-- Migration: Log employee breaks from the clock page
-- Date: 2026-07-28
-- Description:
--   1. Create timesheet_breaks table so employees can start/end one or more
--      breaks during a shift (issue #36).
--   2. Keep timesheets.break_minutes in sync with logged breaks via trigger.
--   3. Update calculate_timesheet_hours() so logged breaks always take
--      precedence over the rule-based break_minutes estimate, even when the
--      employee has apply_break_rules disabled.

CREATE TABLE timesheet_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  break_start_time TIME NOT NULL,
  break_end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timesheet_breaks_timesheet_id ON timesheet_breaks(timesheet_id);

ALTER TABLE timesheet_breaks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Keep timesheets.break_minutes in sync with logged breaks
-- ============================================

CREATE OR REPLACE FUNCTION sync_timesheet_break_minutes()
RETURNS TRIGGER AS $$
DECLARE
  v_timesheet_id UUID;
  v_completed_count INTEGER;
  v_total_minutes INTEGER;
BEGIN
  v_timesheet_id := COALESCE(NEW.timesheet_id, OLD.timesheet_id);

  SELECT COUNT(*), COALESCE(SUM(EXTRACT(EPOCH FROM (break_end_time - break_start_time)) / 60), 0)
  INTO v_completed_count, v_total_minutes
  FROM timesheet_breaks
  WHERE timesheet_id = v_timesheet_id
    AND break_end_time IS NOT NULL;

  -- Only override break_minutes while at least one logged break exists;
  -- otherwise leave it NULL so the rule-based estimate applies.
  IF v_completed_count > 0 THEN
    UPDATE timesheets SET break_minutes = v_total_minutes WHERE id = v_timesheet_id;
  ELSE
    UPDATE timesheets SET break_minutes = NULL WHERE id = v_timesheet_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_break_minutes_on_change
  AFTER INSERT OR UPDATE OR DELETE ON timesheet_breaks
  FOR EACH ROW
  EXECUTE FUNCTION sync_timesheet_break_minutes();

-- ============================================
-- UPDATE TRIGGER: Logged breaks override the apply_break_rules estimate
-- ============================================

CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_hours DECIMAL(5,2);
  v_apply_breaks BOOLEAN;
  v_has_logged_breaks BOOLEAN;
BEGIN
  IF NEW.end_time IS NULL THEN
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