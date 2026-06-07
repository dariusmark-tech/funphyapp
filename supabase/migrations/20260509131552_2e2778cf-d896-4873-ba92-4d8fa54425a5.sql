
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS diagram_url text,
  ADD COLUMN IF NOT EXISTS equations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_points jsonb NOT NULL DEFAULT '[]'::jsonb;
