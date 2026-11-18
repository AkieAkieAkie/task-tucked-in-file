CREATE TABLE public.login_blocks (
  key text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.login_blocks TO service_role;
ALTER TABLE public.login_blocks ENABLE ROW LEVEL SECURITY;