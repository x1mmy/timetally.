-- Store original (pre-rounding) clock-in/out times so managers can view exact
-- times vs. rounded times in reports. Only populated on initial employee clock-in;
-- manager edits leave these columns unchanged.
ALTER TABLE timesheets
  ADD COLUMN original_start_time TEXT,
  ADD COLUMN original_end_time TEXT;
