-- Add avatar_url column to employees
ALTER TABLE public.employees ADD COLUMN avatar_url TEXT;

-- Create storage bucket for employee avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-avatars', 'employee-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload employee avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-avatars');

-- Allow authenticated users to update (replace) files
CREATE POLICY "Authenticated users can update employee avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-avatars');

-- Allow public read access
CREATE POLICY "Public read access for employee avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'employee-avatars');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete employee avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-avatars');
