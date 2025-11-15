-- TimeTally Database Schema
-- Multi-tenant timesheet management system with subdomain-based client isolation

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: admin_users
-- Stores admin portal users who can manage clients
-- =====================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- =====================================================
-- TABLE: clients
-- Stores business clients - each gets their own subdomain
-- =====================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  manager_pin TEXT NOT NULL, -- Hashed PIN for manager access
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on subdomain for fast subdomain routing
CREATE INDEX idx_clients_subdomain ON clients(subdomain);
-- Create index on status for filtering active clients
CREATE INDEX idx_clients_status ON clients(status);

-- =====================================================
-- TABLE: employees
-- Stores employees for each client
-- Each employee has a 4-digit PIN for login (plain text, isolated by client_id)
-- =====================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  pin VARCHAR(4) NOT NULL, -- 4-digit PIN (plain text, client-isolated)
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, employee_number), -- Employee number unique within client
  UNIQUE(client_id, pin) -- PIN unique within client (for PIN-only login)
);

-- Create index on client_id for efficient client-specific queries
CREATE INDEX idx_employees_client_id ON employees(client_id);
-- Create composite index for employee number lookups within a client
CREATE INDEX idx_employees_client_employee ON employees(client_id, employee_number);
-- Create composite index for PIN lookups within a client (for authentication)
CREATE INDEX idx_employees_client_pin ON employees(client_id, pin);
-- Create index on status for filtering active employees
CREATE INDEX idx_employees_status ON employees(status);

-- =====================================================
-- TABLE: timesheets
-- Stores individual timesheet entries for employees
-- =====================================================
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0, -- Auto-calculated based on break rules
  total_hours DECIMAL(5,2) NOT NULL, -- Calculated: (end - start - break) in hours
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, work_date) -- One timesheet per employee per day
);

-- Create index on employee_id for fetching employee timesheets
CREATE INDEX idx_timesheets_employee_id ON timesheets(employee_id);
-- Create index on client_id for client-wide reports
CREATE INDEX idx_timesheets_client_id ON timesheets(client_id);
-- Create index on work_date for date-based queries
CREATE INDEX idx_timesheets_work_date ON timesheets(work_date);
-- Composite index for efficient weekly queries
CREATE INDEX idx_timesheets_client_date ON timesheets(client_id, work_date);

-- =====================================================
-- TABLE: break_rules
-- Stores automated break rules for each client
-- Based on hours worked, system auto-calculates break time
-- =====================================================
CREATE TABLE break_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  min_hours DECIMAL(4,2) NOT NULL, -- Minimum hours worked to trigger this break
  break_minutes INTEGER NOT NULL, -- Break minutes to deduct
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, min_hours) -- One rule per hour threshold per client
);

-- Create index on client_id for fetching client break rules
CREATE INDEX idx_break_rules_client_id ON break_rules(client_id);

-- =====================================================
-- FUNCTION: update_updated_at_column
-- Automatically updates the updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Auto-update updated_at on all tables
-- =====================================================
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: calculate_break_minutes
-- Calculates break minutes based on client's break rules
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_break_minutes(
  p_client_id UUID,
  p_total_hours DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_break_minutes INTEGER := 0;
BEGIN
  -- Find the applicable break rule (highest min_hours that's <= total_hours)
  SELECT break_minutes INTO v_break_minutes
  FROM break_rules
  WHERE client_id = p_client_id
    AND min_hours <= p_total_hours
  ORDER BY min_hours DESC
  LIMIT 1;

  -- Return 0 if no rule found
  RETURN COALESCE(v_break_minutes, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: calculate_timesheet_hours
-- Calculates total hours for a timesheet entry
-- Factors in break time based on client rules
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_hours DECIMAL;
  v_break_minutes INTEGER;
  v_client_id UUID;
BEGIN
  -- Get client_id from employee
  SELECT client_id INTO v_client_id
  FROM employees
  WHERE id = NEW.employee_id;

  -- Calculate raw hours (end - start)
  v_raw_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;

  -- Calculate break minutes based on raw hours
  v_break_minutes := calculate_break_minutes(v_client_id, v_raw_hours);

  -- Set break_minutes if not manually set
  IF NEW.break_minutes IS NULL THEN
    NEW.break_minutes := v_break_minutes;
  END IF;

  -- Calculate final total hours (raw hours - break time)
  NEW.total_hours := v_raw_hours - (NEW.break_minutes / 60.0);

  -- Set client_id for efficient queries
  NEW.client_id := v_client_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-calculate hours on timesheet insert/update
-- =====================================================
CREATE TRIGGER calculate_hours_before_insert
  BEFORE INSERT ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_timesheet_hours();

CREATE TRIGGER calculate_hours_before_update
  BEFORE UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_timesheet_hours();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures clients can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_rules ENABLE ROW LEVEL SECURITY;

-- Admins have full access to all tables (no RLS restrictions in service role)
-- Client-specific access is enforced at the application layer via middleware

-- =====================================================
-- SEED DATA: Default admin user
-- Password: 'admin123' (should be changed in production)
-- Hash generated with bcrypt, 10 rounds
-- =====================================================
-- Note: You'll need to generate a proper hash using bcrypt
-- Example: $2a$10$rKVlXjKYHJQDjZFXXSqJ6eXXXXXXXXXXXXXXXXXXXXXXXX
-- INSERT INTO admin_users (email, password_hash) VALUES
-- ('admin@timetally.com', '$2a$10$your-bcrypt-hash-here');

-- =====================================================
-- SAMPLE CLIENT DATA (for testing)
-- =====================================================
-- INSERT INTO clients (business_name, subdomain, contact_email, manager_pin) VALUES
-- ('Test Company', 'testcompany', 'manager@testcompany.com', '$2a$10$your-hashed-pin-here');

-- =====================================================
-- SAMPLE BREAK RULES (common setup)
-- =====================================================
-- For a client that requires:
-- - 30 min break for 5+ hours
-- - No break for less than 5 hours
-- INSERT INTO break_rules (client_id, min_hours, break_minutes) VALUES
-- ('client-uuid-here', 5.0, 30),
-- ('client-uuid-here', 0.0, 0);
