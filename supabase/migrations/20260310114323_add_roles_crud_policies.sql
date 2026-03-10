-- Allow admin/owner to manage roles
CREATE POLICY "Admin can insert roles"
  ON public.roles FOR INSERT
  TO public
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Admin can update roles"
  ON public.roles FOR UPDATE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Admin can delete roles"
  ON public.roles FOR DELETE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));
