
-- Hide quiz correct_answer from clients; grade_quiz (SECURITY DEFINER) still reads it.
REVOKE SELECT (correct_answer) ON public.questions FROM authenticated;
REVOKE SELECT (correct_answer) ON public.questions FROM anon;

-- Prevent students from self-elevating by changing professor_code / linked_professor_code.
-- ensure_profile and grant_admin_role are SECURITY DEFINER and still write these fields.
REVOKE UPDATE (professor_code, linked_professor_code) ON public.profiles FROM authenticated;
REVOKE UPDATE (professor_code, linked_professor_code) ON public.profiles FROM anon;
