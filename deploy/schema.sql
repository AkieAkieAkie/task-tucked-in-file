-- Tables à créer dans ta base PostgreSQL sur le VPS
CREATE TABLE IF NOT EXISTS friend_directory (
  id text PRIMARY KEY,
  friends jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS access_codes (
  level text PRIMARY KEY CHECK (level IN ('site','admin')),
  salt text NOT NULL,
  hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
