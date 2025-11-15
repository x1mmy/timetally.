-- =====================================================
-- SAMPLE DATA FOR TIMETALLY
-- Run this AFTER running schema.sql
-- =====================================================

-- Step 1: Create admin user
-- First, generate a hash for the password 'admin123':
-- Run in terminal: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
-- Then replace YOUR_ADMIN_HASH below with the output

INSERT INTO admin_users (email, password_hash)
VALUES ('admin@timetally.com', '$2a$10$rKVlXjKYHJQDjZFXXSqJ6.nJxJZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z');
-- ⚠️ REPLACE THE HASH ABOVE WITH YOUR GENERATED HASH!

-- Step 2: Create test client
-- Generate hash for manager PIN '0000':
-- Run in terminal: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('0000', 10))"
-- Then replace YOUR_MANAGER_PIN_HASH below

INSERT INTO clients (business_name, subdomain, contact_email, manager_pin)
VALUES ('Test Company', 'testclient', 'manager@testcompany.com', '$2a$10$rKVlXjKYHJQDjZFXXSqJ6.nJxJZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z');
-- ⚠️ REPLACE THE HASH ABOVE WITH YOUR GENERATED HASH!

-- Step 3: Create break rules for the test client
-- This is automatic - 30 min break for 5+ hours, no break for less
INSERT INTO break_rules (client_id, min_hours, break_minutes)
VALUES
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 5.0, 30),
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 0.0, 0);

-- Step 4: Create sample employees (PINs are plain text now!)
INSERT INTO employees (client_id, employee_number, first_name, last_name, pin)
VALUES
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 'EMP001', 'John', 'Doe', '1234'),
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 'EMP002', 'Jane', 'Smith', '5678'),
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 'EMP003', 'Bob', 'Johnson', '9999');

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to check your data was inserted correctly
-- =====================================================

-- Check admin user
SELECT email FROM admin_users;

-- Check clients
SELECT business_name, subdomain, contact_email FROM clients;

-- Check employees
SELECT employee_number, first_name, last_name, pin FROM employees;

-- Check break rules
SELECT
  c.business_name,
  br.min_hours,
  br.break_minutes
FROM break_rules br
JOIN clients c ON br.client_id = c.id
ORDER BY c.business_name, br.min_hours;

-- =====================================================
-- TEST CREDENTIALS
-- =====================================================
--
-- ADMIN LOGIN:
--   URL: http://admin.timetally.local:3000
--   Email: admin@timetally.com
--   Password: admin123
--
-- MANAGER LOGIN:
--   URL: http://testclient.timetally.local:3000
--   PIN: 0000
--
-- EMPLOYEE LOGINS:
--   URL: http://testclient.timetally.local:3000
--
--   Employee 1:
--     Number: EMP001
--     PIN: 1234
--
--   Employee 2:
--     Number: EMP002
--     PIN: 5678
--
--   Employee 3:
--     Number: EMP003
--     PIN: 9999
--
-- =====================================================
