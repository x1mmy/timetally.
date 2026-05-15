-- Clock-in rounding per category (applies to 'today_only' / Clock In/Out view).
-- 0 = no rounding (default). Other valid values: 5, 10, 15, 30 (minutes).
-- The API enforces the allowed values; the CHECK is belt-and-suspenders.
ALTER TABLE employee_categories
  ADD COLUMN clock_in_rounding_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (clock_in_rounding_minutes IN (0, 5, 10, 15, 30));
