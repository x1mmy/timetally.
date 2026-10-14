-- Migration: Add employee categories
-- Date: 2026-03-24
-- Description:
--   1. Create employee_categories table for organising staff by department
--   2. Add category_id FK to employees table

CREATE TABLE employee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, name)
);

ALTER TABLE employees
  ADD COLUMN category_id UUID REFERENCES employee_categories(id) ON DELETE SET NULL;
