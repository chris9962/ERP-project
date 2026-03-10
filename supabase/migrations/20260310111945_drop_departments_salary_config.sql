-- 1. Add new column `department` (text) to employees
ALTER TABLE public.employees ADD COLUMN department text;

-- 2. Migrate existing data: copy department name from departments table
UPDATE public.employees e
SET department = d.name
FROM public.departments d
WHERE e.department_id = d.id;

-- 3. Drop FK constraint and old column
ALTER TABLE public.employees DROP CONSTRAINT employees_department_id_fkey;
ALTER TABLE public.employees DROP COLUMN department_id;

-- 4. Drop departments table
DROP TABLE public.departments;

-- 5. Drop salary_config table
DROP TABLE public.salary_config;
