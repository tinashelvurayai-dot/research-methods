GRANT SELECT ON public.topics, public.cards TO anon, authenticated;
GRANT INSERT ON public.access_requests, public.support_tickets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests, public.app_users, public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO service_role;

DROP POLICY IF EXISTS "Public can read topics" ON public.topics;
CREATE POLICY "Public can read topics"
ON public.topics
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read cards" ON public.cards;
CREATE POLICY "Public can read cards"
ON public.cards
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can submit access requests" ON public.access_requests;
CREATE POLICY "Anyone can submit access requests"
ON public.access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending' AND access_code IS NULL AND approved_at IS NULL);

DROP POLICY IF EXISTS "Anyone can submit support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can submit support tickets"
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'open' AND admin_response IS NULL);