-- Migration: Add unique constraint on employee PIN per client
-- Date: 2025-11-15
-- Description: Makes employee PINs unique within each client to enable PIN-only authentication
--
-- IMPORTANT: Run this migration if you already deployed the old schema
-- If you're setting up fresh, just run schema.sql instead

-- Add unique constraint on (client_id, pin)
-- Note: This will fail if you already have duplicate PINs for the same client
ALTER TABLE employees
  ADD CONSTRAINT employees_client_pin_key UNIQUE (client_id, pin);

-- Add index for faster PIN lookups during authentication
CREATE INDEX IF NOT EXISTS idx_employees_client_pin ON employees(client_id, pin);

-- Verification query - check for any duplicate PINs per client
-- Run this first to see if you have conflicts before applying the migration
/*
SELECT client_id, pin, COUNT(*) as count
FROM employees
GROUP BY client_id, pin
HAVING COUNT(*) > 1;
*/
