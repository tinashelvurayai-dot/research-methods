DROP POLICY IF EXISTS "Backend manages admin users" ON public.admin_users;
CREATE POLICY "Backend manages admin users"
ON public.admin_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Backend manages app users" ON public.app_users;
CREATE POLICY "Backend manages app users"
ON public.app_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Backend manages user sessions" ON public.user_sessions;
CREATE POLICY "Backend manages user sessions"
ON public.user_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Backend manages card progress" ON public.card_progress;
CREATE POLICY "Backend manages card progress"
ON public.card_progress
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Backend manages agent settings" ON public.agent_settings;
CREATE POLICY "Backend manages agent settings"
ON public.agent_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Backend manages pricing settings" ON public.pricing_settings;
CREATE POLICY "Backend manages pricing settings"
ON public.pricing_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);