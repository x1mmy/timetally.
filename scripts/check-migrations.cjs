/**
 * Validates migration filenames in supabase/migrations.
 *
 * The Supabase CLI uses the numeric prefix as the migration's version and
 * applies files in version order, so every file needs a unique 14-digit
 * timestamp: YYYYMMDDHHMMSS_description.sql
 *
 * Create new migrations with `pnpm --allow-build=supabase dlx supabase migration new <description>`
 * to get a valid name automatically.
 */
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");
const VALID_NAME = /^(\d{14})_[a-z0-9_]+\.sql$/;

const files = fs.existsSync(MIGRATIONS_DIR)
  ? fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql"))
  : [];

const errors = [];
const seenVersions = new Map();

for (const file of files) {
  const match = VALID_NAME.exec(file);
  if (!match) {
    errors.push(
      `${file}: name must be YYYYMMDDHHMMSS_description.sql (14-digit timestamp, lowercase description)`,
    );
    continue;
  }

  const version = match[1];
  const duplicate = seenVersions.get(version);
  if (duplicate) {
    errors.push(`${file}: shares version ${version} with ${duplicate}`);
  }
  seenVersions.set(version, file);
}

if (errors.length > 0) {
  console.error("Invalid migration files in supabase/migrations:\n");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`${files.length} migration file(s) OK`);
