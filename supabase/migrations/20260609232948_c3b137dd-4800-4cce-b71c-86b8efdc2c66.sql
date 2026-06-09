DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'student');
  END IF;
END $$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  display_name text,
  avatar_url text,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  hearts integer NOT NULL DEFAULT 5,
  gems integer NOT NULL DEFAULT 50,
  physics_score integer NOT NULL DEFAULT 0,
  league text NOT NULL DEFAULT 'Bronze',
  current_module_id uuid,
  last_heart_at timestamptz NOT NULL DEFAULT now(),
  last_active_date date NOT NULL DEFAULT CURRENT_DATE,
  placement_completed boolean NOT NULL DEFAULT false,
  school_id text,
  professor_code text UNIQUE,
  linked_professor_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_linked_prof_code ON public.profiles(linked_professor_code);
CREATE INDEX idx_profiles_leaderboard ON public.profiles(xp DESC, max_streak DESC, created_at ASC);

CREATE POLICY "View own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read modules"
ON public.modules
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage modules"
ON public.modules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  text_content text,
  diagram_url text,
  equations jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_checkpoint boolean NOT NULL DEFAULT true,
  time_limit_seconds integer NOT NULL DEFAULT 60,
  passing_score integer NOT NULL DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage quizzes"
ON public.quizzes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  answer_type text NOT NULL DEFAULT 'multiple_choice',
  choices jsonb,
  correct_answer text NOT NULL,
  hint text,
  order_index integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage questions"
ON public.questions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  score integer,
  completed_at timestamptz,
  posttest_score integer,
  posttest_passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress"
ON public.user_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read progress"
ON public.user_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_name text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  high_score integer NOT NULL DEFAULT 0,
  times_played integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_name, level)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_scores TO authenticated;
GRANT ALL ON public.game_scores TO service_role;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own game scores"
ON public.game_scores
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read game scores"
ON public.game_scores
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  target_xp integer NOT NULL DEFAULT 30,
  reward_gems integer NOT NULL DEFAULT 10,
  active_date date NOT NULL DEFAULT CURRENT_DATE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_quests TO authenticated;
GRANT ALL ON public.daily_quests TO service_role;
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quests"
ON public.daily_quests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage quests"
ON public.daily_quests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  gems_spent integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes"
ON public.notes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  channel text,
  url text NOT NULL,
  thumbnail_url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read videos"
ON public.videos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage videos"
ON public.videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.references_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citation text NOT NULL,
  url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.references_list TO authenticated;
GRANT ALL ON public.references_list TO service_role;
ALTER TABLE public.references_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read references"
ON public.references_list
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage references"
ON public.references_list
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_xp integer NOT NULL DEFAULT 50,
  deadline_date date NOT NULL,
  professor_code text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors manage own assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Students view linked assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  professor_code IN (
    SELECT linked_professor_code
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.ensure_profile(
  _display_name text DEFAULT NULL,
  _school_id text DEFAULT NULL,
  _linked_professor_code text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, school_id, linked_professor_code)
  VALUES (
    _uid,
    auth.jwt()->>'email',
    COALESCE(NULLIF(_display_name, ''), auth.jwt()->'user_metadata'->>'display_name', split_part(COALESCE(auth.jwt()->>'email', 'Player'), '@', 1), 'Player'),
    NULLIF(_school_id, ''),
    NULLIF(_linked_professor_code, '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(public.profiles.email, EXCLUDED.email),
        display_name = COALESCE(NULLIF(public.profiles.display_name, ''), EXCLUDED.display_name),
        school_id = COALESCE(NULLIF(public.profiles.school_id, ''), EXCLUDED.school_id),
        linked_professor_code = COALESCE(NULLIF(public.profiles.linked_professor_code, ''), EXCLUDED.linked_professor_code),
        updated_at = now()
  RETURNING * INTO _profile;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_role(
  _invite_code text,
  _school_id text DEFAULT NULL,
  _professor_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _invite_code IS NULL OR _invite_code <> 'FUNPHY-ADMIN-2026' THEN
    RETURN false;
  END IF;

  PERFORM public.ensure_profile(NULL, _school_id, NULL);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET school_id = COALESCE(NULLIF(_school_id, ''), school_id),
      professor_code = COALESCE(NULLIF(_professor_code, ''), professor_code),
      updated_at = now()
  WHERE id = _uid;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.my_professor_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT professor_code
  FROM public.profiles
  WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.professor_code_exists(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE professor_code = _code
  )
$$;

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
    ROW_NUMBER() OVER (ORDER BY p.xp DESC NULLS LAST, p.max_streak DESC NULLS LAST, p.created_at ASC) AS rank,
    p.id AS user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Player') AS display_name,
    p.avatar_url,
    COALESCE(p.xp, 0) AS xp,
    COALESCE(NULLIF(p.league, ''), 'Bronze') AS league,
    COALESCE(p.streak, 0) AS streak
  FROM public.profiles p
  ORDER BY p.xp DESC NULLS LAST, p.max_streak DESC NULLS LAST, p.created_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 50), 200));
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_profile(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_professor_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.professor_code_exists(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_professor_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.professor_code_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;

CREATE POLICY "Professors view linked students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND linked_professor_code IS NOT NULL
  AND linked_professor_code = public.my_professor_code()
);

CREATE POLICY "Professors view linked student progress"
ON public.user_progress
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND user_id IN (
    SELECT id
    FROM public.profiles
    WHERE linked_professor_code = public.my_professor_code()
  )
);

WITH inserted_modules AS (
  INSERT INTO public.modules (title, description, order_index, icon, color)
  VALUES
    ('Realm of Varyon', 'Reference Frame, Displacement, and Velocity', 1, 'rocket', '#39FF14'),
    ('Realm of Accelara', 'Acceleration', 2, 'zap', '#22D3EE'),
    ('Realm of Inertros', 'Momentum and Inertia', 3, 'battery', '#A78BFA'),
    ('Realm of Kinetra', 'Kinetic Energy', 4, 'target', '#F59E0B'),
    ('Realm of Enereth', 'Interaction & Energy', 5, 'rotate-cw', '#EC4899')
  RETURNING id, order_index, title
), lesson_seed AS (
  SELECT id AS module_id, order_index AS module_order, 1 AS lesson_order, 'Reference Frames' AS title,
         'A reference frame is the perspective from which motion is observed and measured. Motion is always relative, so specify the frame before describing position, velocity, or acceleration.' AS content,
         'https://www.youtube.com/embed/3yaZ7lkQPUQ' AS video_url
  FROM inserted_modules WHERE order_index = 1
  UNION ALL SELECT id, order_index, 2, 'Distance vs Displacement', 'Distance is total path length. Displacement is the straight-line change from start to finish and includes direction.', 'https://www.youtube.com/embed/ZM8ECpBuQYE' FROM inserted_modules WHERE order_index = 1
  UNION ALL SELECT id, order_index, 3, 'Speed and Velocity', 'Speed is how fast you move. Velocity is speed with direction. Average velocity equals displacement divided by time.', 'https://www.youtube.com/embed/ZM8ECpBuQYE' FROM inserted_modules WHERE order_index = 1
  UNION ALL SELECT id, order_index, 1, 'What is Acceleration?', 'Acceleration is the rate of change of velocity over time. Its SI unit is meters per second squared.', 'https://www.youtube.com/embed/ZM8ECpBuQYE' FROM inserted_modules WHERE order_index = 2
  UNION ALL SELECT id, order_index, 2, 'Kinematic Equations', 'For constant acceleration, use v = v₀ + at, x = v₀t + ½at², and v² = v₀² + 2aΔx.', 'https://www.youtube.com/embed/ZM8ECpBuQYE' FROM inserted_modules WHERE order_index = 2
  UNION ALL SELECT id, order_index, 3, 'Free Fall', 'Free fall is motion under gravity alone. Near Earth, gravitational acceleration is about 9.8 m/s² downward.', 'https://www.youtube.com/embed/kKKM8Y-u7ds' FROM inserted_modules WHERE order_index = 2
  UNION ALL SELECT id, order_index, 1, 'Inertia & Newton''s First Law', 'Inertia is resistance to changes in motion. An object keeps its state of motion unless a net external force acts on it.', 'https://www.youtube.com/embed/GnQrbW4HYtU' FROM inserted_modules WHERE order_index = 3
  UNION ALL SELECT id, order_index, 2, 'Momentum', 'Momentum is mass in motion: p = mv. It is a vector quantity measured in kg·m/s.', 'https://www.youtube.com/embed/GnQrbW4HYtU' FROM inserted_modules WHERE order_index = 3
  UNION ALL SELECT id, order_index, 3, 'Conservation of Momentum', 'In a closed system with no external forces, total momentum before an interaction equals total momentum after.', 'https://www.youtube.com/embed/w4QFJb9a8vo' FROM inserted_modules WHERE order_index = 3
  UNION ALL SELECT id, order_index, 1, 'Work and Energy', 'Work is done when a force causes displacement. Energy is the capacity to do work and is measured in joules.', 'https://www.youtube.com/embed/w4QFJb9a8vo' FROM inserted_modules WHERE order_index = 4
  UNION ALL SELECT id, order_index, 2, 'Kinetic Energy', 'Kinetic energy is energy of motion: KE = ½mv². Doubling speed quadruples kinetic energy.', 'https://www.youtube.com/embed/w4QFJb9a8vo' FROM inserted_modules WHERE order_index = 4
  UNION ALL SELECT id, order_index, 3, 'Work-Energy Theorem', 'The net work done on an object equals its change in kinetic energy.', 'https://www.youtube.com/embed/aUrms3VFn0I' FROM inserted_modules WHERE order_index = 4
  UNION ALL SELECT id, order_index, 1, 'Potential Energy', 'Potential energy is stored energy due to position or configuration. Gravitational potential energy is PE = mgh.', 'https://www.youtube.com/embed/GdDrYgXzBew' FROM inserted_modules WHERE order_index = 5
  UNION ALL SELECT id, order_index, 2, 'Conservation of Energy', 'Energy cannot be created or destroyed, only transformed. In ideal systems, total mechanical energy stays constant.', 'https://www.youtube.com/embed/w4QFJb9a8vo' FROM inserted_modules WHERE order_index = 5
  UNION ALL SELECT id, order_index, 3, 'Power and Efficiency', 'Power is the rate of doing work: P = W/t. Efficiency compares useful energy output to total energy input.', 'https://www.youtube.com/embed/w4QFJb9a8vo' FROM inserted_modules WHERE order_index = 5
), inserted_lessons AS (
  INSERT INTO public.lessons (module_id, order_index, title, text_content, video_url, key_points, equations)
  SELECT module_id, lesson_order, title, content, video_url,
         jsonb_build_array('Read the concept', 'Watch the example', 'Pass the posttest'),
         '[]'::jsonb
  FROM lesson_seed
  RETURNING id, module_id, title
), inserted_quizzes AS (
  INSERT INTO public.quizzes (lesson_id, module_id, title, is_checkpoint, passing_score, time_limit_seconds)
  SELECT id, module_id, 'Posttest: ' || title, false, 70, 120
  FROM inserted_lessons
  RETURNING id, lesson_id, title
)
INSERT INTO public.questions (quiz_id, question_text, choices, correct_answer, hint, order_index)
SELECT q.id,
       'Which idea best matches this lesson?',
       jsonb_build_array('A core physics concept', 'A random guess', 'A shopping item', 'A username'),
       'A core physics concept',
       'Review the lesson summary before answering.',
       1
FROM inserted_quizzes q;

INSERT INTO public.daily_quests (description, target_xp, reward_gems)
VALUES ('Earn 30 XP today', 30, 10);

INSERT INTO public.videos (module_id, title, channel, url, order_index)
SELECT m.id, l.title, 'Physics Learning', COALESCE(l.video_url, 'https://www.youtube.com/watch?v=ZM8ECpBuQYE'), (m.order_index * 10 + l.order_index)
FROM public.lessons l
JOIN public.modules m ON m.id = l.module_id;

INSERT INTO public.references_list (citation, url, order_index)
VALUES
  ('Halliday, D., Resnick, R., & Walker, J. Fundamentals of Physics. Wiley.', 'https://www.wiley.com/', 1),
  ('University Physics I - Classical Mechanics. LibreTexts.', 'https://phys.libretexts.org/', 2),
  ('Thornton, S. & Marion, J. Classical Dynamics of Particles and Systems.', 'https://www.cengage.com/', 3),
  ('Goldstein, H., Poole, C., & Safko. Classical Mechanics.', 'https://www.pearson.com/', 4);

NOTIFY pgrst, 'reload schema';