
-- 1. Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_id TEXT,
  ADD COLUMN IF NOT EXISTS professor_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS linked_professor_code TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_linked_prof_code
  ON public.profiles(linked_professor_code);

-- 2. Update handle_new_user to capture school_id and linked_professor_code from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, school_id, linked_professor_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'school_id',
    NEW.raw_user_meta_data->>'linked_professor_code'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Updated grant_admin_role: now also accepts school_id + professor_code
CREATE OR REPLACE FUNCTION public.grant_admin_role(
  _invite_code TEXT,
  _school_id TEXT DEFAULT NULL,
  _professor_code TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _invite_code IS NULL OR _invite_code <> 'FUNPHY-ADMIN-2026' THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Save school_id and professor_code on profile
  UPDATE public.profiles
     SET school_id = COALESCE(_school_id, school_id),
         professor_code = COALESCE(_professor_code, professor_code)
   WHERE id = _uid;

  RETURN true;
END;
$function$;

-- 4. Helper to fetch the current professor's own professor_code
CREATE OR REPLACE FUNCTION public.my_professor_code()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT professor_code FROM public.profiles WHERE id = auth.uid();
$function$;

-- 5. RLS: allow professors to view profiles of students linked to their code
DROP POLICY IF EXISTS "Professors view linked students" ON public.profiles;
CREATE POLICY "Professors view linked students"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  AND linked_professor_code IS NOT NULL
  AND linked_professor_code = public.my_professor_code()
);

-- 6. RLS: allow professors to view progress of linked students
DROP POLICY IF EXISTS "Professors view linked student progress" ON public.user_progress;
CREATE POLICY "Professors view linked student progress"
ON public.user_progress
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  AND user_id IN (
    SELECT id FROM public.profiles
     WHERE linked_professor_code = public.my_professor_code()
  )
);
