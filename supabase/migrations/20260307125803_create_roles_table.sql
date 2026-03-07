CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Seed default roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Quan tri he thong, quan ly toan bo user'),
  ('owner', 'Chu doanh nghiep, xem bao cao thong ke'),
  ('manager', 'Quan ly, diem danh va quan ly nhan vien'),
  ('office_staff', 'Nhan vien hanh chinh, diem danh'),
  ('worker', 'Cong nhan, xem thong tin ca nhan');
