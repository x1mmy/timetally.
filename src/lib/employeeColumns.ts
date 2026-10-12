/**
 * Employee columns that are safe to return in API responses
 * Use this instead of select("*") on the employees table so the PIN never leaves the server
 */
export const EMPLOYEE_PUBLIC_COLUMNS =
  "id, client_id, first_name, last_name, weekday_rate, saturday_rate, sunday_rate, public_holiday_rate, pay_type, apply_break_rules, category_id, status, created_at, updated_at";
