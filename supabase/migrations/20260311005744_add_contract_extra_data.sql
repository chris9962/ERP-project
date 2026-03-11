-- Add contract_extra_data JSONB column to employees for auto-fill
ALTER TABLE employees ADD COLUMN contract_extra_data JSONB DEFAULT '{}';
