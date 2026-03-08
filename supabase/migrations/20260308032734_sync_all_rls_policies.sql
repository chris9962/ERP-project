-- ============================================================
-- Sync all RLS policies
-- ============================================================

-- 1. Helper function: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT r.name
  FROM public.roles r
  JOIN public.profiles p ON p.role_id = r.id
  WHERE p.id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop old profiles policies (from previous migration)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- ============================================================
-- ROLES
-- ============================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Allow insert for own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can insert profiles"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Admin can delete profiles"
  ON public.profiles FOR DELETE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE POLICY "Authenticated can read departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert departments"
  ON public.departments FOR INSERT
  TO public
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Admin can update departments"
  ON public.departments FOR UPDATE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

CREATE POLICY "Admin can delete departments"
  ON public.departments FOR DELETE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE POLICY "Staff can read employees"
  ON public.employees FOR SELECT
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
    OR profile_id = auth.uid()
  );

CREATE POLICY "Staff can insert employees"
  ON public.employees FOR INSERT
  TO public
  WITH CHECK (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
  );

CREATE POLICY "Staff can update employees"
  ON public.employees FOR UPDATE
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
  );

CREATE POLICY "Admin can delete employees"
  ON public.employees FOR DELETE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE POLICY "Staff can read attendance"
  ON public.attendance FOR SELECT
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
    OR employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert attendance"
  ON public.attendance FOR INSERT
  TO public
  WITH CHECK (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
  );

CREATE POLICY "Staff can update attendance"
  ON public.attendance FOR UPDATE
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
  );

CREATE POLICY "Staff can delete attendance"
  ON public.attendance FOR DELETE
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager', 'office_staff'])
  );

-- ============================================================
-- SALARY HISTORY
-- ============================================================
CREATE POLICY "Authorized can read salary_history"
  ON public.salary_history FOR SELECT
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager'])
    OR employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admin manager can insert salary_history"
  ON public.salary_history FOR INSERT
  TO public
  WITH CHECK (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager'])
  );

CREATE POLICY "Admin manager can update salary_history"
  ON public.salary_history FOR UPDATE
  TO public
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner', 'manager'])
  );

-- ============================================================
-- SALARY CONFIG
-- ============================================================
CREATE POLICY "Authenticated can read salary_config"
  ON public.salary_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update salary_config"
  ON public.salary_config FOR UPDATE
  TO public
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'owner']));
