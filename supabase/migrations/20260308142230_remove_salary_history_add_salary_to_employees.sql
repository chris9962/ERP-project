-- Drop salary_history table and add salary_amount to employees

-- Drop RLS policies on salary_history first
DROP POLICY IF EXISTS "Authenticated users can view salary history" ON salary_history;
DROP POLICY IF EXISTS "Admins can insert salary history" ON salary_history;
DROP POLICY IF EXISTS "Admins can update salary history" ON salary_history;
DROP POLICY IF EXISTS "Admins can delete salary history" ON salary_history;

-- Drop salary_history table
DROP TABLE IF EXISTS salary_history;

-- Add salary_amount column to employees
ALTER TABLE employees ADD COLUMN salary_amount NUMERIC DEFAULT 0;
