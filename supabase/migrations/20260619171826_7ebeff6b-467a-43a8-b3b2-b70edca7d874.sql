CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
 RETURNS TABLE(rank bigint, user_id uuid, display_name text, avatar_url text, xp integer, league text, streak integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.xp DESC NULLS LAST, p.max_streak DESC NULLS LAST, p.created_at ASC) AS rank,
    p.id AS user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Player') AS display_name,
    p.avatar_url,
    COALESCE(p.xp, 0) AS xp,
    COALESCE(NULLIF(p.league, ''), 'Bronze') AS league,
    COALESCE(p.streak, 0) AS streak
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'student'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'
  )
  ORDER BY p.xp DESC NULLS LAST, p.max_streak DESC NULLS LAST, p.created_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 50), 200));
$function$;