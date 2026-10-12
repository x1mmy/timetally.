-- Attempt log used to rate limit sensitive checks (issue #49: manager PIN re-check
-- before revealing an employee PIN). One row per attempt; the app counts rows in a
-- time window and clears them on success (src/lib/authAttempts.ts).
-- "action" keeps the table reusable for other endpoints (see issue #41).
CREATE TABLE auth_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_attempts_lookup ON auth_attempts(client_id, action, created_at);

-- Server-only table: RLS on with no policies, so only the service role can touch it.
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
