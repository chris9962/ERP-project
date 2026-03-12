-- Table to track accumulated leave balance per employee per year
CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  remaining_days NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, year)
);

-- Add new columns to salary_records for full-time leave tracking
ALTER TABLE salary_records
  ADD COLUMN IF NOT EXISTS absent_days NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_off_days NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leave_days_used NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unpaid_days NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write
CREATE POLICY "Authenticated users can manage leave balances"
  ON employee_leave_balances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
