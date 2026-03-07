CREATE TABLE public.salary_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_type TEXT NOT NULL UNIQUE CHECK (employment_type IN ('full_time', 'part_time')),
  default_daily_rate NUMERIC NOT NULL CHECK (default_daily_rate >= 0),
  overtime_multiplier NUMERIC NOT NULL DEFAULT 1.5 CHECK (overtime_multiplier >= 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.salary_config ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER on_salary_config_updated
  BEFORE UPDATE ON public.salary_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed default config
INSERT INTO public.salary_config (employment_type, default_daily_rate, overtime_multiplier) VALUES
  ('full_time', 400000, 1.5),
  ('part_time', 250000, 1.5);
