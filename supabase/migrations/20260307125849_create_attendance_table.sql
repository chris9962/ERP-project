CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL CHECK (value IN (0, 0.5, 1, 1.5)),
  noted_by UUID REFERENCES public.profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
