-- Fix break_minutes default value to NULL instead of 0
-- This ensures the trigger automatically calculates break minutes
-- when timesheets are created

-- Change the default value of break_minutes from 0 to NULL
ALTER TABLE timesheets
ALTER COLUMN break_minutes SET DEFAULT NULL;

-- Update all existing timesheets with break_minutes = 0 to NULL
-- so they get recalculated by the trigger
UPDATE timesheets
SET break_minutes = NULL,
    updated_at = NOW()
WHERE break_minutes = 0
  AND start_time IS NOT NULL
  AND end_time IS NOT NULL;

-- Note: The UPDATE will trigger the calculate_hours_before_update trigger
-- which will automatically recalculate break_minutes based on break rules
