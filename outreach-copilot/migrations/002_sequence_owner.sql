ALTER TABLE sequences
  ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX IF NOT EXISTS sequences_owner_created_idx
  ON sequences (owner_id, created_at DESC);
