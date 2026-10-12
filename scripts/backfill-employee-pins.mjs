/**
 * Backfill employee PIN encryption (issue #49)
 * Converts every employee row that still holds a plain text pin into pin_lookup + pin_encrypted
 * and clears the plain text value. Safe to re-run: converted rows are skipped.
 *
 * Take a database backup first. Requires migration 20261012_employee_pin_encryption.sql.
 *
 * Dry run (default, writes nothing):
 *   node --env-file=.env.local scripts/backfill-employee-pins.mjs
 * Apply:
 *   node --env-file=.env.local scripts/backfill-employee-pins.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";
import { decryptPin, pinColumns } from "../src/lib/employeePin.ts";

const apply = process.argv.includes("--apply");
const PAGE_SIZE = 500;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

let converted = 0;
let skipped = 0;
let lastId = "00000000-0000-0000-0000-000000000000";

for (;;) {
  const { data: rows, error } = await supabase
    .from("employees")
    .select("id, client_id, pin")
    .not("pin", "is", null)
    .is("pin_lookup", null)
    .gt("id", lastId)
    .order("id", { ascending: true })
    .limit(PAGE_SIZE);

  if (error) {
    console.error("Failed to read employees:", error.message);
    process.exit(1);
  }
  if (rows.length === 0) break;

  for (const row of rows) {
    lastId = row.id;

    if (!/^\d{4}$/.test(row.pin)) {
      console.warn(`Skipping employee ${row.id}: stored pin is not 4 digits`);
      skipped++;
      continue;
    }

    const columns = pinColumns(row.client_id, row.pin);
    // Prove the value can be read back before the plain text copy is cleared
    if (decryptPin(row.client_id, columns.pin_encrypted) !== row.pin) {
      console.error(`Round-trip check failed for employee ${row.id}; nothing written for this row`);
      process.exit(1);
    }

    if (apply) {
      const { error: updateError } = await supabase
        .from("employees")
        .update(columns)
        .eq("id", row.id)
        .is("pin_lookup", null);

      if (updateError) {
        console.error(`Failed to update employee ${row.id}:`, updateError.message);
        process.exit(1);
      }
    }
    converted++;
  }
}

console.log(
  `${apply ? "Converted" : "Would convert"} ${converted} employee(s); skipped ${skipped}.`,
);
if (!apply) console.log("Dry run only. Re-run with --apply to write.");
