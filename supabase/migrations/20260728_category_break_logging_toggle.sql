-- Migration: Per-category toggle for the start/finish break feature
-- Date: 2026-07-28
-- Description:
--   Managers control which employee categories see the Start Break / End
--   Break buttons on the clock page, configured from the category's
--   Clock In/Out settings alongside clock-in rounding. Off by default — no
--   one gets the option until a manager enables it for their category.

ALTER TABLE employee_categories
ADD COLUMN allow_break_logging BOOLEAN NOT NULL DEFAULT false;