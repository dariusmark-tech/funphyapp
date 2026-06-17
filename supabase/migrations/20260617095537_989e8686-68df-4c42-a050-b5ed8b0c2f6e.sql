
-- 1. user_roles: explicit write policies (admin-only). SECURITY DEFINER helpers bypass RLS.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Hide correct_answer column from clients
REVOKE SELECT ON public.questions FROM authenticated, anon;
GRANT SELECT (id, quiz_id, question_text, answer_type, choices, hint, order_index) ON public.questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;

-- 3. Secure grading RPC
CREATE OR REPLACE FUNCTION public.grade_quiz(_quiz_id uuid, _answers jsonb)
RETURNS TABLE(question_id uuid, is_correct boolean, correct_answer text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    lower(btrim(COALESCE(_answers->>q.id::text, ''))) = lower(btrim(q.correct_answer)) AS is_correct,
    q.correct_answer
  FROM public.questions q
  WHERE q.quiz_id = _quiz_id;
END;
$$;

REVOKE ALL ON FUNCTION public.grade_quiz(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_quiz(uuid, jsonb) TO authenticated, service_role;
