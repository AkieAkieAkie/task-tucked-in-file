CREATE TABLE public.friend_directory (
  id text PRIMARY KEY DEFAULT 'shared' CHECK (id = 'shared'),
  friends jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.friend_directory TO service_role;
REVOKE ALL ON public.friend_directory FROM anon, authenticated;
ALTER TABLE public.friend_directory ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.friend_directory IS 'Private shared directory. Access exclusively through encrypted site/admin session checks in server functions; no direct browser policies.';