
-- Rename modules to themed realms
UPDATE public.modules SET title='Realm of Varyon', description='Reference Frame, Displacement, and Velocity', color='#39FF14', icon='rocket' WHERE order_index=1;
UPDATE public.modules SET title='Realm of Accelara', description='Acceleration', color='#22D3EE', icon='zap' WHERE order_index=2;
UPDATE public.modules SET title='Realm of Inertros', description='Momentum and Inertia', color='#A78BFA', icon='battery' WHERE order_index=3;
UPDATE public.modules SET title='Realm of Kinetra', description='Kinetic Energy', color='#F59E0B', icon='target' WHERE order_index=4;
UPDATE public.modules SET title='Realm of Enereth', description='Interaction & Energy', color='#EC4899', icon='rotate-cw' WHERE order_index=5;

-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notes" ON public.notes FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Videos
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  channel text,
  url text NOT NULL,
  thumbnail_url text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read videos" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage videos" ON public.videos FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- References
CREATE TABLE public.references_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citation text NOT NULL,
  url text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.references_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read refs" ON public.references_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage refs" ON public.references_list FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Seed videos
INSERT INTO public.videos (title, channel, url, order_index) VALUES
  ('Introduction to Reference Frames', 'Khan Academy', 'https://www.youtube.com/watch?v=mYR2A-DdbCk', 1),
  ('Reference Frames - Physics', 'The Organic Chemistry Tutor', 'https://www.youtube.com/watch?v=8WsDuf5sYrA', 2),
  ('Acceleration - Physics 101', 'Khan Academy', 'https://www.youtube.com/watch?v=FOkQszg1-j8', 3),
  ('Momentum and Impulse', 'The Organic Chemistry Tutor', 'https://www.youtube.com/watch?v=ZvPrn3aBQG8', 4);

-- Seed references
INSERT INTO public.references_list (citation, url, order_index) VALUES
  ('Halliday, D., Resnick, R., & Walker, J. (2014). Fundamentals of Physics (10th ed.). Wiley.', 'https://www.wiley.com/en-us/Fundamentals+of+Physics%2C+10th+Edition-p-9781118230718', 1),
  ('Banacloche, J. G. University Physics I - Classical Mechanics. LibreTexts.', 'https://phys.libretexts.org/', 2),
  ('Thornton, S. & Marion, J. Classical Dynamics of Particles and Systems (5th ed.).', 'https://www.cengage.com/', 3),
  ('Goldstein, H., Poole, C., & Safko, J. Classical Mechanics (3rd ed.). University of Toronto.', 'https://www.pearson.com/', 4);
