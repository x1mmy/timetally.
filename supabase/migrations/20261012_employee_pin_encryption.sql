-- Employee PINs at rest (issue #49, step 1 of 2: add columns).
-- pin_lookup    = keyed hash of the PIN, used for login lookup and uniqueness.
-- pin_encrypted = AES-256-GCM ciphertext of the PIN.
-- Both are written by the app (src/lib/employeePin.ts) using EMPLOYEE_PIN_SECRET.
--
-- Rollout:
--   1. Run this migration.
--   2. Set EMPLOYEE_PIN_SECRET and deploy the app. Rows that still hold a plain
--      text pin keep working and are converted when that employee logs in.
--   3. Take a backup, then run scripts/backfill-employee-pins.mjs to convert the rest.
--   4. A later migration drops the pin column once no row uses it.
ALTER TABLE employees
  ADD COLUMN pin_lookup TEXT,
  ADD COLUMN pin_encrypted TEXT;

-- Converted rows clear the plain text pin, so it can no longer be required.
ALTER TABLE employees
  ALTER COLUMN pin DROP NOT NULL;

-- Replaces employees_client_pin_key for converted rows. Also serves as the login index.
ALTER TABLE employees
  ADD CONSTRAINT employees_client_pin_lookup_key UNIQUE (client_id, pin_lookup);

-- Every row must have a PIN in one form or the other, and the two new columns travel together.
ALTER TABLE employees
  ADD CONSTRAINT employees_pin_present_check
    CHECK (
      (pin_lookup IS NULL) = (pin_encrypted IS NULL)
      AND (pin IS NOT NULL OR pin_lookup IS NOT NULL)
    );
