ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS session_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_admin_users_session_token ON public.admin_users(session_token);