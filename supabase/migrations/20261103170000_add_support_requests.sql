-- Persist authenticated users' support requests for the support team.
CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_requests_user_created_idx
  ON public.support_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_requests_status_created_idx
  ON public.support_requests (status, created_at ASC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own support requests" ON public.support_requests;
CREATE POLICY "Users can create own support requests"
  ON public.support_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own support requests" ON public.support_requests;
CREATE POLICY "Users can view own support requests"
  ON public.support_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;
CREATE POLICY "Admins can view all support requests"
  ON public.support_requests
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

REVOKE ALL ON public.support_requests FROM anon;
GRANT SELECT, INSERT ON public.support_requests TO authenticated;
