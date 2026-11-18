CREATE TABLE public.directory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('auto','manual')),
  label text NOT NULL DEFAULT '',
  friends jsonb NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.directory_snapshots TO service_role;
ALTER TABLE public.directory_snapshots ENABLE ROW LEVEL SECURITY;
CREATE INDEX directory_snapshots_created ON public.directory_snapshots (created_at DESC);