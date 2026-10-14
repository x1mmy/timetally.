-- Migration: Fix break rule boundary to be strictly exclusive
-- Date: 2026-08-31
-- Description:
--   calculate_break_minutes() previously used `min_hours <= p_total_hours`,
--   so a shift of EXACTLY min_hours (e.g. exactly 5.00 hours) matched the
--   higher tier and had a break deducted. A break rule should only apply
--   once a shift goes STRICTLY OVER the tier's threshold — an exact
--   5.0-hour shift must fall into the "Under 5 hours" (0 min) tier.
--
--   Reported by Trims Fresh Merrylands: a 9:30am–2:30pm shift (exactly 5.00
--   hours) was paid as 4.50 hours because the "5-7 hours → 30 min" rule
--   matched at the boundary.
--
--   Applies to every client, since all clients share this function. Only the
--   comparison operator changes; break_rules rows are untouched.

CREATE OR REPLACE FUNCTION calculate_break_minutes(
  p_client_id UUID,
  p_total_hours DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_break_minutes INTEGER := 0;
BEGIN
  -- Find the applicable break rule (highest min_hours that's strictly
  -- less than total_hours — a shift of exactly min_hours does NOT
  -- trigger that tier's break).
  SELECT break_minutes INTO v_break_minutes
  FROM break_rules
  WHERE client_id = p_client_id
    AND min_hours < p_total_hours
  ORDER BY min_hours DESC
  LIMIT 1;

  -- Return 0 if no rule found
  RETURN COALESCE(v_break_minutes, 0);
END;
$$ LANGUAGE plpgsql;
