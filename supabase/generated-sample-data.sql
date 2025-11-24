-- =====================================================
-- SAMPLE DATA FOR TIMETALLY (AUTO-GENERATED)
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- Generated: 2025-11-15T12:29:13.315Z
-- =====================================================

-- Create admin user
-- Email: admin@timetally.com
-- Password: admin123
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@timetally.com', '$2b$10$.1HWGT4zv2.JSZhkf3QiQeESrVcWWHRvb3C0IdWDECkbr.s9/mJna');

-- Create test client
-- Subdomain: testclient
-- Manager PIN: 0000
INSERT INTO clients (business_name, subdomain, contact_email, manager_pin)
VALUES ('Test Company', 'testclient', 'manager@testcompany.com', '$2b$10$DHeBy2d.vxJGyR4dKO3B1uwr7UMNJf.Vu4ZBHEYDCUhzmqTvvXyy6');

-- Create break rules
INSERT INTO break_rules (client_id, min_hours, break_minutes)
VALUES
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 5.0, 30),
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 0.0, 0);

-- Create sample employees (PINs are plain text!)
INSERT INTO employees (client_id, employee_number, first_name, last_name, pin)
VALUES
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 'EMP001', 'John', 'Doe', '1234'),
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 'EMP002', 'Jane', 'Smith', '5678'),
  ((SELECT id FROM clients WHERE subdomain = 'testclient'), 'EMP003', 'Bob', 'Johnson', '9999');

-- =====================================================
-- VERIFICATION: Check data was inserted
-- =====================================================
SELECT 'Admin Users' as table_name, COUNT(*) as count FROM admin_users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Break Rules', COUNT(*) FROM break_rules;

-- =====================================================
-- TEST CREDENTIALS
-- =====================================================
--
-- ADMIN LOGIN:
--   URL: http://timetally.local:3000/admin
--   Email: admin@timetally.com
--   Password: admin123
--
-- MANAGER LOGIN:
--   URL: http://testclient.timetally.local:3000
--   Click "Manager Access"
--   PIN: 0000
--
-- EMPLOYEE LOGINS:
--   URL: http://testclient.timetally.local:3000
--   Click "Employee Login"
--
--   Employee 1: EMP001 / PIN: 1234
--   Employee 2: EMP002 / PIN: 5678
--   Employee 3: EMP003 / PIN: 9999
--
-- =====================================================

