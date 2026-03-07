CREATE TABLE public.salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  salary_amount NUMERIC NOT NULL CHECK (salary_amount >= 0),
  effective_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;
