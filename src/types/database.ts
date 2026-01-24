/**
 * Database type definitions for TimeTally
 * These types match the Supabase schema defined in supabase/schema.sql
 */

/**
 * Admin user account
 * Can manage clients and access admin portal
 */
export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * Client/Business entity
 * Each client gets their own subdomain
 */
export interface Client {
  id: string;
  business_name: string;
  subdomain: string;
  contact_email: string;
  manager_pin: string; // Hashed PIN
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

/**
 * Employee entity
 * Belongs to a specific client
 */
export interface Employee {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  pin: string; // 4-digit PIN (plain text, client-isolated)
  weekday_rate: number; // Rate for Monday-Friday (hourly or daily based on pay_type)
  saturday_rate: number; // Rate for Saturday (hourly or daily based on pay_type)
  sunday_rate: number; // Rate for Sunday (hourly or daily based on pay_type)
  pay_type: "hourly" | "day_rate"; // How the employee is paid
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

/**
 * Timesheet entry
 * One entry per employee per day
 */
export interface Timesheet {
  id: string;
  employee_id: string;
  client_id: string;
  work_date: string; // ISO date string
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  break_minutes: number;
  total_hours: number;
  notes?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Break rule
 * Defines automatic break deductions based on hours worked
 */
export interface BreakRule {
  id: string;
  client_id: string;
  min_hours: number;
  break_minutes: number;
  created_at: string;
}

/**
 * Extended employee type with computed full name
 */
export interface EmployeeWithName extends Employee {
  full_name: string;
}

/**
 * Timesheet with employee information
 * Used for displaying timesheet lists with employee names
 */
export interface TimesheetWithEmployee extends Timesheet {
  employee: Pick<Employee, "first_name" | "last_name">;
}

/**
 * Weekly timesheet summary for an employee
 */
export interface WeeklySummary {
  employee_id: string;
  first_name: string;
  last_name: string;
  total_hours: number;
  days_worked: number;
  timesheets: Timesheet[];
}

/**
 * Client with employee count
 */
export interface ClientWithStats extends Client {
  employee_count: number;
  active_employee_count: number;
}

/**
 * Form data types for creating/updating entities
 */

export interface CreateClientInput {
  businessName: string;
  contactEmail: string;
  subdomain?: string;
  managerPin?: string;
}

export interface UpdateClientInput {
  businessName?: string;
  contactEmail?: string;
  status?: "active" | "inactive" | "suspended";
  managerPin?: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  pin: string;
  weekdayRate: number;
  saturdayRate: number;
  sundayRate: number;
  payType?: "hourly" | "day_rate"; // Defaults to 'hourly' if not provided
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  pin?: string;
  weekdayRate?: number;
  saturdayRate?: number;
  sundayRate?: number;
  payType?: "hourly" | "day_rate";
  status?: "active" | "inactive";
}

export interface CreateTimesheetInput {
  workDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface CreateBreakRuleInput {
  minHours: number;
  breakMinutes: number;
}
