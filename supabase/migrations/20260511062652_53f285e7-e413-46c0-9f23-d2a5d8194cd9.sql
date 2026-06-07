
CREATE OR REPLACE FUNCTION public.professor_code_exists(_code TEXT)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE professor_code = _code);
$$;
