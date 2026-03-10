-- Add label column to roles table
ALTER TABLE public.roles ADD COLUMN label TEXT;

-- Seed labels for existing roles
UPDATE public.roles SET label = 'Admin' WHERE name = 'admin';
UPDATE public.roles SET label = 'Chủ sở hữu' WHERE name = 'owner';
UPDATE public.roles SET label = 'Quản lý' WHERE name = 'manager';
UPDATE public.roles SET label = 'Văn phòng' WHERE name = 'office_staff';
UPDATE public.roles SET label = 'Công nhân' WHERE name = 'worker';
