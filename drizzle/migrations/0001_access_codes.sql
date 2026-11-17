CREATE TABLE public.access_codes (level text PRIMARY KEY CHECK (level IN ('site','admin')), salt text NOT NULL, hash text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;