-- Company settings table (single row) for contract auto-fill
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name TEXT DEFAULT '',
  employer_title TEXT DEFAULT '',
  employer_address TEXT DEFAULT '',
  employer_phone TEXT DEFAULT '',
  employer_tax_code TEXT DEFAULT '',
  contract_location TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row
INSERT INTO company_settings DEFAULT VALUES;

-- RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read company_settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update company_settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
