/**
 * Generate Sample Data SQL with bcrypt hashes
 * Run with: node scripts/generate-sample-data.js
 */
const bcrypt = require('bcryptjs');

// Generate hashes
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const managerPinHash = bcrypt.hashSync('0000', 10);

// Generate SQL
const sql = `-- =====================================================
-- SAMPLE DATA FOR TIMETALLY (AUTO-GENERATED)
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- Generated: ${new Date().toISOString()}
-- =====================================================

-- Create admin user
-- Email: admin@timetally.com
-- Password: admin123
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@timetally.com', '${adminPasswordHash}');

-- Create test client
-- Subdomain: testclient
-- Manager PIN: 0000
INSERT INTO clients (business_name, subdomain, contact_email, manager_pin)
VALUES ('Test Company', 'testclient', 'manager@testcompany.com', '${managerPinHash}');

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
--   URL: http://admin.timetally.local:3000
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
`;

console.log(sql);
console.log('\n✅ SQL generated successfully!');
console.log('\n📋 Copy the SQL above and run it in Supabase SQL Editor');
console.log('\n🔐 Credentials:');
console.log('   Admin: admin@timetally.com / admin123');
console.log('   Manager: PIN 0000');
console.log('   Employee 1: EMP001 / PIN 1234');
console.log('   Employee 2: EMP002 / PIN 5678');
console.log('   Employee 3: EMP003 / PIN 9999');
