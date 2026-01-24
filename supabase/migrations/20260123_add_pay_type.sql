-- Migration: Add pay_type column to employees table
-- Date: 2026-01-23
-- Description: Adds support for day rate vs hourly pay calculation

-- Add pay_type column with default 'hourly' for backward compatibility
ALTER TABLE employees
ADD COLUMN pay_type VARCHAR(20) DEFAULT 'hourly';

-- Add CHECK constraint to ensure valid values
ALTER TABLE employees
ADD CONSTRAINT employees_pay_type_check 
CHECK (pay_type IN ('hourly', 'day_rate'));

-- Set existing employees to 'hourly' (explicit, even though it's the default)
UPDATE employees SET pay_type = 'hourly' WHERE pay_type IS NULL;

-- Make the column NOT NULL after backfill
ALTER TABLE employees
ALTER COLUMN pay_type SET NOT NULL;
