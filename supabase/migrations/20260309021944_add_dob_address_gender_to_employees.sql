ALTER TABLE public.employees
  ADD COLUMN dob DATE,
  ADD COLUMN address TEXT,
  ADD COLUMN gender TEXT CHECK (gender IN ('Nam', 'Nữ'));
