# Leaderboard SQL — run in your Supabase SQL editor

Adds a `public.get_leaderboard(_limit)` RPC that returns ranked players for
the in-app Leaderboard screen. Uses SECURITY DEFINER so authenticated
players can read a minimal projection of all profiles without weakening
the existing per-row RLS.

```sql
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 50)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  xp integer,
  league text,
  streak integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.max_streak DESC, p.created_at ASC) AS rank,
    p.id AS user_id,
    COALESCE(p.display_name, 'Player') AS display_name,
    p.avatar_url,
    p.xp,
    p.league,
    p.streak
  FROM public.profiles p
  ORDER BY p.xp DESC, p.max_streak DESC, p.created_at ASC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;
```
