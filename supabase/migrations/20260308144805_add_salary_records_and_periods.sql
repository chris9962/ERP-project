-- Bảng quản lý trạng thái chốt lương theo tháng
create table salary_periods (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month between 1 and 12),
  year integer not null,
  status text not null default 'open' check (status in ('open', 'finalized')),
  finalized_by uuid references profiles(id),
  finalized_at timestamptz,
  created_at timestamptz default now(),
  unique (month, year)
);

-- Bảng lưu snapshot lương từng nhân viên theo tháng
create table salary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  month integer not null check (month between 1 and 12),
  year integer not null,
  full_name text,
  employee_code text,
  cccd_number text,
  role_name text,
  employment_type text not null default 'full_time',
  salary_amount numeric not null default 0,
  total_days numeric not null default 0,
  bonus numeric not null default 0,
  total_salary numeric not null default 0,
  note text,
  created_at timestamptz default now(),
  unique (employee_id, month, year)
);

-- RLS
alter table salary_periods enable row level security;
alter table salary_records enable row level security;

create policy "Authenticated users can read salary_periods"
  on salary_periods for select to authenticated using (true);

create policy "Authenticated users can insert salary_periods"
  on salary_periods for insert to authenticated with check (true);

create policy "Authenticated users can update salary_periods"
  on salary_periods for update to authenticated using (true);

create policy "Authenticated users can read salary_records"
  on salary_records for select to authenticated using (true);

create policy "Authenticated users can insert salary_records"
  on salary_records for insert to authenticated with check (true);

create policy "Authenticated users can update salary_records"
  on salary_records for update to authenticated using (true);
