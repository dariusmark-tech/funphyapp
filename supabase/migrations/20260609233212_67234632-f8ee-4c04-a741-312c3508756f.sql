REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_profile(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_professor_code() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.professor_code_exists(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_professor_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.professor_code_exists(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';