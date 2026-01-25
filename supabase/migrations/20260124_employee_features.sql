-- Migration: Add employee features - break rules toggle and public holiday rate
-- Date: 2026-01-24
-- Description:
--   1. Add apply_break_rules boolean to control break deductions per employee
--   2. Add public_holiday_rate for NSW public holiday pay

-- ============================================
-- FEATURE 1: Break Rules Toggle
-- ============================================

-- Add apply_break_rules column with default true (current behavior)
ALTER TABLE employees
ADD COLUMN apply_break_rules BOOLEAN DEFAULT true;

-- Backfill existing employees to true
UPDATE employees SET apply_break_rules = true WHERE apply_break_rules IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE employees
ALTER COLUMN apply_break_rules SET NOT NULL;

-- ============================================
-- FEATURE 2: Public Holiday Rate
-- ============================================

-- Add public_holiday_rate column
ALTER TABLE employees
ADD COLUMN public_holiday_rate NUMERIC DEFAULT 0;

-- Backfill existing employees with 2x weekday rate as default
UPDATE employees
SET public_holiday_rate = weekday_rate * 2
WHERE public_holiday_rate IS NULL OR public_holiday_rate = 0;

-- Make NOT NULL after backfill
ALTER TABLE employees
ALTER COLUMN public_holiday_rate SET NOT NULL;

-- ============================================
-- UPDATE TRIGGER: Respect apply_break_rules
-- ============================================

-- Update the calculate_timesheet_hours trigger function to check employee's apply_break_rules setting
CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_hours DECIMAL(5,2);
  v_apply_breaks BOOLEAN;
BEGIN
  -- Only calculate if we have both start and end time
  IF NEW.end_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get employee's break rules setting
  SELECT apply_break_rules INTO v_apply_breaks
  FROM employees WHERE id = NEW.employee_id;

  -- Calculate raw hours from start to end time
  v_raw_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

  -- Set client_id from employee if not provided
  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id
    FROM employees WHERE id = NEW.employee_id;
  END IF;

  -- Apply break rules only if employee has them enabled AND break_minutes is NULL (not manually set)
  IF v_apply_breaks = true AND NEW.break_minutes IS NULL THEN
    NEW.break_minutes := calculate_break_minutes(NEW.client_id, v_raw_hours);
  ELSIF v_apply_breaks = false THEN
    -- Employee has break rules disabled - set to 0
    NEW.break_minutes := 0;
  END IF;

  -- Calculate total hours (subtracting break if applied)
  NEW.total_hours := v_raw_hours - (COALESCE(NEW.break_minutes, 0) / 60.0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
