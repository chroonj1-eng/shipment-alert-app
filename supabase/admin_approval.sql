-- ====================================================================
-- UNITHAI SRM - ADMIN SELF-REGISTRATION WITH APPROVAL
-- Users may request the ADMIN role at sign-up, but the account is created
-- with status = 'PENDING' and has NO admin rights until an existing
-- active ADMIN approves it. Run this once in Supabase SQL Editor.
-- ====================================================================

-- 1. Allow PENDING as a profile status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING'));

-- 2. Sign-up trigger: ADMIN requests start as PENDING.
--    On later auth.users updates, NEVER overwrite role/status from user metadata
--    (users can edit their own metadata via supabase.auth.updateUser).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'SRM'));
BEGIN
  IF v_role NOT IN ('ADMIN', 'SRM', 'CO_SRM', 'IN_CHARGE', 'ENGINEER', 'USER') THEN
    v_role := 'SRM';
  END IF;

  INSERT INTO public.profiles (
    id, email, name, full_name, employee_id, role, department, status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'UT-' || SUBSTRING(NEW.id::text, 1, 5)),
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Ship Repair Management'),
    CASE WHEN v_role = 'ADMIN' THEN 'PENDING' ELSE 'ACTIVE' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Client-side profile INSERTs: a non-admin can never create an active ADMIN row
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role') THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    IF NEW.role = 'ADMIN' THEN
      NEW.status := 'PENDING';
    ELSE
      NEW.status := 'ACTIVE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_profile_insert ON public.profiles;
CREATE TRIGGER trg_enforce_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_insert_security();

-- 4. Role/status changes on UPDATE remain admin-only (re-asserted here)
CREATE OR REPLACE FUNCTION public.enforce_profile_role_security()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Authentication required.';
  END IF;

  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Access Denied: Only active ADMIN can change user roles.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Access Denied: Only active ADMIN can change user status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_profile_role ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_security();

-- 5. FIRST ADMIN (bootstrap): if nobody is an active ADMIN yet, approve
--    your own account manually once, replacing the email below:
-- UPDATE public.profiles SET role = 'ADMIN', status = 'ACTIVE'
--   WHERE email = 'your.name@unithai.com';
