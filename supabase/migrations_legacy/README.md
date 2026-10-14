# Legacy migrations (do not run)

These SQL files were applied to production by hand before the project used the
Supabase CLI. They are kept for reference only.

They cannot be replayed onto an empty database: `schema.sql` was edited after
some of them were written, so it already contains changes these files try to
make again, and several files share the same version prefix.

The current schema is captured by the baseline migration in
`supabase/migrations/`. All new changes go there.
