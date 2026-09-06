CREATE TABLE IF NOT EXISTS user_study_state (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{"progress":{},"starred":[]}'::jsonb,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
