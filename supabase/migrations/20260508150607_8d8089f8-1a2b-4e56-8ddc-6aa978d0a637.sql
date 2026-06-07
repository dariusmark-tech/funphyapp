
-- Roles enum and user_roles table (separate, with security definer)
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Modules
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can read modules" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Lessons
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  text_content text,
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Quizzes
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_checkpoint boolean NOT NULL DEFAULT true,
  time_limit_seconds integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Questions
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
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- User progress per lesson/module
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  score integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress" ON public.user_progress FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Admins read progress" ON public.user_progress FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- Game scores
CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  high_score integer NOT NULL DEFAULT 0,
  times_played integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_name, level)
);
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own game scores" ON public.game_scores FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Admins read scores" ON public.game_scores FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- Daily quests (global)
CREATE TABLE public.daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  target_xp integer NOT NULL DEFAULT 30,
  reward_gems integer NOT NULL DEFAULT 10,
  active_date date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read quests" ON public.daily_quests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage quests" ON public.daily_quests FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  gems_spent integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own transactions" ON public.transactions FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
