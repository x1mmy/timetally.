-- Determines which employee UI is shown to employees in this category.
-- 'weekly'     = 7-day grid timesheet (default)
-- 'today_only' = clock in / clock out (today only, two buttons)
ALTER TABLE employee_categories
  ADD COLUMN dashboard_view TEXT NOT NULL DEFAULT 'weekly'
    CHECK (dashboard_view IN ('weekly', 'today_only'));

-- Preserve existing behaviour: trimsfresh's 'Fruit' category gets today_only automatically.
-- This mirrors what was previously hardcoded in the login page (categoryName === "Fruit").
UPDATE employee_categories ec
SET dashboard_view = 'today_only'
FROM clients c
WHERE ec.client_id = c.id
  AND c.subdomain = 'trimsfresh'
  AND ec.name = 'Fruit';
