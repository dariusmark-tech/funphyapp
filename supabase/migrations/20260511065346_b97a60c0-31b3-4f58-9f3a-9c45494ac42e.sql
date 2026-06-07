
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_code text NOT NULL,
  title text NOT NULL,
  target_xp integer NOT NULL DEFAULT 50,
  deadline_date date NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors manage own assignments"
ON public.assignments FOR ALL
USING (public.has_role(auth.uid(), 'admin') AND professor_code = public.my_professor_code())
WITH CHECK (public.has_role(auth.uid(), 'admin') AND professor_code = public.my_professor_code() AND created_by = auth.uid());

CREATE POLICY "Linked students view assignments"
ON public.assignments FOR SELECT
USING (professor_code IN (SELECT linked_professor_code FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_assignments_prof_code ON public.assignments(professor_code);
CREATE INDEX idx_assignments_deadline ON public.assignments(deadline_date);
