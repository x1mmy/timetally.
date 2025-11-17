/**
 * Migration: Add pay rate fields and remove employee_number
 * Date: 2025-11-16
 * Description:
 * - Remove employee_number column from employees table
 * - Add weekday_rate, saturday_rate, sunday_rate columns (NO defaults)
 * - Set rates for existing 3 employees only
 */

-- Step 1: Add pay rate columns to employees table (NO DEFAULT)
ALTER TABLE employees
ADD COLUMN weekday_rate DECIMAL(10,2),
ADD COLUMN saturday_rate DECIMAL(10,2),
ADD COLUMN sunday_rate DECIMAL(10,2);

-- Step 2: Drop employee_number column and its unique constraint
-- First drop the unique constraint if it exists
ALTER TABLE employees
DROP CONSTRAINT IF EXISTS employees_client_id_employee_number_key;

-- Then drop the column
ALTER TABLE employees
DROP COLUMN IF EXISTS employee_number;

-- Step 3: Set pay rates for the 3 existing employees
-- This only affects employees that exist at the time of migration
UPDATE employees
SET
  weekday_rate = 25.00,
  saturday_rate = 30.00,
  sunday_rate = 35.00
WHERE weekday_rate IS NULL;

-- Step 4: Make pay rate columns NOT NULL
-- New employees will be required to have rates specified at creation
ALTER TABLE employees
ALTER COLUMN weekday_rate SET NOT NULL,
ALTER COLUMN saturday_rate SET NOT NULL,
ALTER COLUMN sunday_rate SET NOT NULL;
