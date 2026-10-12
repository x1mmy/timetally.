-- Server-side sessions (issue #47). The session cookies used to hold the raw client,
-- employee or admin ID, so anyone who learned an ID could forge a session. Each login
-- now gets a random token: the cookie holds the token, this table holds its SHA-256 hash
-- (src/lib/auth.ts). Logout deletes the row, so a session can be revoked.
-- Applying this logs everyone out: existing ID-valued cookies match no row.
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash CHAR(64) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'employee', 'admin')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Each role is tied to exactly the records it acts for
  CONSTRAINT sessions_owner_matches_role CHECK (
    (role = 'manager' AND client_id IS NOT NULL AND employee_id IS NULL AND admin_id IS NULL)
    OR (role = 'employee' AND client_id IS NOT NULL AND employee_id IS NOT NULL AND admin_id IS NULL)
    OR (role = 'admin' AND client_id IS NULL AND employee_id IS NULL AND admin_id IS NOT NULL)
  )
);

-- Expired rows are deleted on each login
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Server-only table: RLS on with no policies, so only the service role can touch it.
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
