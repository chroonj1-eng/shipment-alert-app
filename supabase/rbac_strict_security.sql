-- ====================================================================
-- UNITHAI SRM - STRICT ROLE-BASED ACCESS CONTROL (RBAC) SECURITY SCRIPT
-- Enforces permissions for ADMIN and SRM roles at the PostgreSQL Database Layer
-- Table: public.shipments (20 columns, urgency column only)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS (HARDENED SEARCH_PATH)
-- Authenticates strictly against public.profiles (role and status)
-- --------------------------------------------------------------------

-- Helper: Is Current Authenticated User an Active ADMIN?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
      AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper: Is Current Authenticated User an Active SRM?
CREATE OR REPLACE FUNCTION public.is_srm()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'SRM'
      AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- --------------------------------------------------------------------
-- 2. ENABLE ROW-LEVEL SECURITY
-- --------------------------------------------------------------------
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 3. SHIPMENTS ROW-LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------

-- Clean up existing shipment policies for idempotency
DROP POLICY IF EXISTS "Allow authenticated read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admin full shipments access" ON public.shipments;
DROP POLICY IF EXISTS "SRM view assigned shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated update shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow admin delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Only admin can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Only admin can delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shipments update policy" ON public.shipments;

-- SELECT Policy: All authenticated users can view shipments
CREATE POLICY "Allow authenticated read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (true);

-- INSERT Policy: ONLY active ADMIN users can create new shipments
CREATE POLICY "Only admin can insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- DELETE Policy: ONLY active ADMIN users can delete shipments
CREATE POLICY "Only admin can delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- UPDATE Policy:
-- - Active ADMIN has full update permissions.
-- - Active SRM can target rows for update, with WITH CHECK enforcing valid urgency values.
-- - Generic roles (USER, ENGINEER, INACTIVE) are completely blocked by USING clause.
-- - All granular column/value restrictions (blocking general edits, enforcing status -> RECEIVED)
--   are enforced by the BEFORE UPDATE trigger trg_enforce_shipments_rbac.
CREATE POLICY "Shipments update policy" ON public.shipments
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR public.is_srm()
  )
  WITH CHECK (
    public.is_admin() OR (
      public.is_srm()
      AND urgency IN ('NORMAL', 'URGENT', 'CRITICAL')
    )
  );

-- --------------------------------------------------------------------
-- 4. SHIPMENTS BEFORE UPDATE TRIGGER: COLUMN-LEVEL RBAC PROTECTION
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_shipments_rbac_on_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_status TEXT;
BEGIN
  -- Explicitly allow legitimate internal database maintenance or service_role
  IF (current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Strictly reject unauthenticated / anon callers
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Authentication required.';
  END IF;

  -- Fetch user role and status directly from public.profiles
  SELECT role, status INTO v_role, v_status
  FROM public.profiles
  WHERE id = auth.uid();

  -- Active ADMIN users have unrestricted access to update any column
  IF v_role = 'ADMIN' AND v_status = 'ACTIVE' THEN
    RETURN NEW;
  END IF;

  -- If caller is not an active SRM (e.g. USER, ENGINEER, or INACTIVE), deny all updates
  IF v_role <> 'SRM' OR v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Access Denied: Only active SRM or ADMIN users can update shipments.';
  END IF;

  -- ==================================================================
  -- SRM UPDATE RESTRICTIONS (Database-level protection)
  -- ==================================================================

  -- 1. General shipment fields MUST NOT be modified by SRM
  IF NEW.id <> OLD.id OR
     NEW.job_id IS DISTINCT FROM OLD.job_id OR
     NEW.booking_no IS DISTINCT FROM OLD.booking_no OR
     NEW.po_no IS DISTINCT FROM OLD.po_no OR
     NEW.awb_bl IS DISTINCT FROM OLD.awb_bl OR
     NEW.flight_vessel IS DISTINCT FROM OLD.flight_vessel OR
     NEW.description_of_goods IS DISTINCT FROM OLD.description_of_goods OR
     NEW.package_qty IS DISTINCT FROM OLD.package_qty OR
     NEW.supplier IS DISTINCT FROM OLD.supplier OR
     NEW.origin IS DISTINCT FROM OLD.origin OR
     NEW.destination IS DISTINCT FROM OLD.destination OR
     NEW.mode IS DISTINCT FROM OLD.mode OR
     NEW.eta IS DISTINCT FROM OLD.eta OR
     NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access Denied: SRM is not authorized to modify general shipment information.';
  END IF;

  -- 2. Status Transition:
  -- - SRM can ONLY change status to 'RECEIVED'
  -- - If status is already 'RECEIVED', SRM cannot change it back
  -- - SRM cannot change status to IN_TRANSIT, ARRIVING_TODAY, DELAYED, etc.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'RECEIVED' THEN
      RAISE EXCEPTION 'Access Denied: Shipment has already been marked as RECEIVED and cannot be changed back.';
    END IF;
    IF NEW.status <> 'RECEIVED' THEN
      RAISE EXCEPTION 'Access Denied: SRM can only change shipment status to RECEIVED.';
    END IF;
  END IF;

  -- 3. Urgency Level:
  -- - SRM can ONLY set urgency to NORMAL, URGENT, or CRITICAL
  IF NEW.urgency IS DISTINCT FROM OLD.urgency THEN
    IF NEW.urgency NOT IN ('NORMAL', 'URGENT', 'CRITICAL') THEN
      RAISE EXCEPTION 'Access Denied: Urgency level must be NORMAL, URGENT, or CRITICAL.';
    END IF;
  END IF;

  -- 4. Receipt Audit Fields:
  -- - received_date, receiver_name, and receiver_notes can ONLY be modified
  --   when status is RECEIVED (or transitioning to RECEIVED)
  IF (NEW.received_date IS DISTINCT FROM OLD.received_date OR
      NEW.receiver_name IS DISTINCT FROM OLD.receiver_name OR
      NEW.receiver_notes IS DISTINCT FROM OLD.receiver_notes) THEN
    IF NEW.status <> 'RECEIVED' THEN
      RAISE EXCEPTION 'Access Denied: Receipt fields can only be set when status is RECEIVED.';
    END IF;
  END IF;

  -- Automatically refresh updated_at timestamp
  NEW.updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Attach BEFORE UPDATE trigger to public.shipments
DROP TRIGGER IF EXISTS trg_enforce_shipments_rbac ON public.shipments;
CREATE TRIGGER trg_enforce_shipments_rbac
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shipments_rbac_on_update();

-- --------------------------------------------------------------------
-- 5. SHIPMENTS INSERT & DELETE RBAC TRIGGERS
-- Strictly prevents SRM / Non-Admin from creating or deleting shipments
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_shipments_rbac_on_insert_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_status TEXT;
BEGIN
  -- Explicitly allow legitimate internal database maintenance or service_role
  IF (current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Strictly reject unauthenticated / anon callers
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Authentication required.';
  END IF;

  SELECT role, status INTO v_role, v_status
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role <> 'ADMIN' OR v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Access Denied: Only active ADMIN users can insert or delete shipments.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Attach BEFORE INSERT trigger
DROP TRIGGER IF EXISTS trg_enforce_shipments_rbac_insert ON public.shipments;
CREATE TRIGGER trg_enforce_shipments_rbac_insert
  BEFORE INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shipments_rbac_on_insert_delete();

-- Attach BEFORE DELETE trigger
DROP TRIGGER IF EXISTS trg_enforce_shipments_rbac_delete ON public.shipments;
CREATE TRIGGER trg_enforce_shipments_rbac_delete
  BEFORE DELETE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shipments_rbac_on_insert_delete();

-- --------------------------------------------------------------------
-- 6. SECURE RPC MUTATIONS FOR SRM (STRICTLY role = 'SRM' & status = 'ACTIVE')
-- --------------------------------------------------------------------

-- RPC 1: SRM Mark as Received
CREATE OR REPLACE FUNCTION public.srm_mark_received(
  p_shipment_id UUID,
  p_receiver_notes TEXT DEFAULT 'Received into shipyard'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_status TEXT;
  v_profile_name TEXT;
  v_current_status TEXT;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- 1. Ensure caller is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 2. Verify caller is strictly an ACTIVE SRM user (ADMIN uses normal update path)
  SELECT role, status, COALESCE(full_name, name, 'SRM Officer')
  INTO v_role, v_status, v_profile_name
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF v_role <> 'SRM' OR v_status <> 'ACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Only active SRM users can mark shipments as received.');
  END IF;

  -- 3. Verify shipment exists and inspect current status
  SELECT status INTO v_current_status
  FROM public.shipments
  WHERE id = p_shipment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  -- 4. Reject if shipment is already RECEIVED
  IF v_current_status = 'RECEIVED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment has already been marked as RECEIVED.');
  END IF;

  -- 5. Execute update ONLY on permitted receipt fields
  UPDATE public.shipments
  SET
    status = 'RECEIVED',
    received_date = v_now,
    receiver_name = v_profile_name,
    receiver_notes = COALESCE(p_receiver_notes, 'Received into shipyard'),
    updated_at = v_now
  WHERE id = p_shipment_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 2: SRM Update Urgency
CREATE OR REPLACE FUNCTION public.srm_update_urgency(
  p_shipment_id UUID,
  p_urgency TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_status TEXT;
  v_check_id UUID;
BEGIN
  -- 1. Ensure caller is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 2. Verify caller is strictly an ACTIVE SRM user (ADMIN uses normal update path)
  SELECT role, status
  INTO v_role, v_status
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF v_role <> 'SRM' OR v_status <> 'ACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Only active SRM users can update urgency.');
  END IF;

  -- 3. Validate urgency value
  IF p_urgency NOT IN ('NORMAL', 'URGENT', 'CRITICAL') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid urgency level. Must be NORMAL, URGENT, or CRITICAL.');
  END IF;

  -- 4. Verify shipment exists
  SELECT id INTO v_check_id
  FROM public.shipments
  WHERE id = p_shipment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  -- 5. Execute update ONLY on urgency and updated_at
  UPDATE public.shipments
  SET
    urgency = p_urgency,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_shipment_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- --------------------------------------------------------------------
-- 7. RPC EXECUTION PRIVILEGES (REVOKE PUBLIC, GRANT AUTHENTICATED)
-- --------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.srm_mark_received(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.srm_update_urgency(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.srm_mark_received(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.srm_update_urgency(UUID, TEXT) TO authenticated;

-- --------------------------------------------------------------------
-- 8. JOBS ROW-LEVEL SECURITY POLICIES (ONLY ACTIVE ADMIN CAN CREATE/EDIT/DELETE)
-- --------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    DROP POLICY IF EXISTS "Allow authenticated read jobs" ON public.jobs;
    DROP POLICY IF EXISTS "Admin full jobs access" ON public.jobs;
    DROP POLICY IF EXISTS "SRM assigned jobs view" ON public.jobs;
    DROP POLICY IF EXISTS "Admin insert jobs" ON public.jobs;
    DROP POLICY IF EXISTS "Admin update jobs" ON public.jobs;
    DROP POLICY IF EXISTS "Admin delete jobs" ON public.jobs;

    CREATE POLICY "Allow authenticated read jobs" ON public.jobs
      FOR SELECT TO authenticated
      USING (true);

    CREATE POLICY "Admin insert jobs" ON public.jobs
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());

    CREATE POLICY "Admin update jobs" ON public.jobs
      FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    CREATE POLICY "Admin delete jobs" ON public.jobs
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 9. PROFILES ROW-LEVEL SECURITY & ROLE TAMPERING PREVENTION
-- Prevents non-admin users from changing their own role or status
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_role_security()
RETURNS TRIGGER AS $$
BEGIN
  -- Explicitly allow legitimate internal database maintenance or service_role
  IF (current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Authentication required.';
  END IF;

  -- Non-admin users cannot change their own role or status
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
