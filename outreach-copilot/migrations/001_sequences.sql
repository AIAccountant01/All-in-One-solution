CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  poc JSONB,
  "to" TEXT NOT NULL,
  to_checked BOOLEAN NOT NULL DEFAULT FALSE,
  subject TEXT NOT NULL,
  steps JSONB NOT NULL,
  linkedin JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  test BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sequences_status_idx ON sequences (status);
CREATE INDEX IF NOT EXISTS sequences_created_at_idx ON sequences (created_at DESC);
