-- ====================================================================
-- UNITHAI SRM - STRICT ROLE-BASED ACCESS CONTROL (RBAC) SECURITY SCRIPT
-- Enforces permissions for ADMIN and SRM roles at the PostgreSQL Database Layer
-- ====================================================================

-- 1. Helper function: Is Current Authenticated User an ADMIN?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure shipments table has all necessary columns
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS booking_no TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS po_no TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS flight_vessel TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS description_of_goods TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS package_qty TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'NORMAL';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'NORMAL';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_notes TEXT;

-- 3. Enable Row-Level Security on all tables
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- SHIPMENTS ROW-LEVEL SECURITY POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admin full shipments access" ON public.shipments;
DROP POLICY IF EXISTS "SRM view assigned shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated update shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow admin delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Only admin can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Only admin can delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shipments update policy" ON public.shipments;

-- SELECT: All authenticated users (Admin and SRM) can view shipments
CREATE POLICY "Allow authenticated read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: ONLY ADMIN can create new shipments
CREATE POLICY "Only admin can insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- DELETE: ONLY ADMIN can delete shipments
CREATE POLICY "Only admin can delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- UPDATE: ADMIN has full update; SRM can only update status to RECEIVED and urgency
CREATE POLICY "Shipments update policy" ON public.shipments
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR auth.uid() IS NOT NULL
  )
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() IS NOT NULL
      AND status IN ('RECEIVED', OLD.status)
      AND urgency IN ('CRITICAL', 'URGENT', 'NORMAL')
    )
  );

-- --------------------------------------------------------------------
-- SHIPMENTS TRIGGER: COLUMN-LEVEL AND VALUE-LEVEL RBAC ENFORCEMENT
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_shipments_rbac_on_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- If executed without an authenticated session (e.g., service role / internal jobs), allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

  -- ADMIN has full access to update any shipment field
  IF v_role = 'ADMIN' THEN
    RETURN NEW;
  END IF;

  -- SRM / Non-Admin: MUST NOT modify any general shipment information!
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
    RAISE EXCEPTION 'Access Denied: SRM is not authorized to modify general shipment fields.';
  END IF;

  -- SRM Status Change: ONLY permitted status change is ANY -> RECEIVED
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status <> 'RECEIVED' THEN
      RAISE EXCEPTION 'Access Denied: SRM can only change status to RECEIVED.';
    END IF;
  END IF;

  -- SRM Urgency Change: Must be CRITICAL, URGENT, or NORMAL
  IF NEW.urgency IS DISTINCT FROM OLD.urgency THEN
    IF NEW.urgency NOT IN ('CRITICAL', 'URGENT', 'NORMAL') THEN
      RAISE EXCEPTION 'Access Denied: Urgency level must be CRITICAL, URGENT, or NORMAL.';
    END IF;
  END IF;

  IF NEW.urgency_level IS DISTINCT FROM OLD.urgency_level THEN
    IF NEW.urgency_level NOT IN ('CRITICAL', 'URGENT', 'NORMAL') THEN
      RAISE EXCEPTION 'Access Denied: Urgency level must be CRITICAL, URGENT, or NORMAL.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_shipments_rbac ON public.shipments;
CREATE TRIGGER trg_enforce_shipments_rbac
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shipments_rbac_on_update();

-- Triggers to strictly block SRM from INSERT or DELETE on shipments at trigger level
CREATE OR REPLACE FUNCTION public.enforce_shipments_rbac_on_insert_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only ADMIN can insert or delete shipments.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_shipments_rbac_insert ON public.shipments;
CREATE TRIGGER trg_enforce_shipments_rbac_insert
  BEFORE INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shipments_rbac_on_insert_delete();

DROP TRIGGER IF EXISTS trg_enforce_shipments_rbac_delete ON public.shipments;
CREATE TRIGGER trg_enforce_shipments_rbac_delete
  BEFORE DELETE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shipments_rbac_on_insert_delete();

-- --------------------------------------------------------------------
-- SECURE RPC MUTATIONS FOR SRM
-- --------------------------------------------------------------------
-- RPC 1: SRM Mark as Received
CREATE OR REPLACE FUNCTION public.srm_mark_received(
  p_shipment_id UUID,
  p_receiver_notes TEXT DEFAULT 'Received into shipyard'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  UPDATE public.shipments
  SET
    status = 'RECEIVED',
    received_date = v_now,
    receiver_name = COALESCE(v_profile.full_name, v_profile.name, 'SRM Officer'),
    receiver_notes = COALESCE(p_receiver_notes, 'Received into shipyard')
  WHERE id = p_shipment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  -- Create confirmation notification
  INSERT INTO public.notifications (user_id, type, title, message, is_read)
  VALUES (
    v_user_id,
    'SHIPMENT_RECEIVED',
    'Spare Part Received',
    COALESCE(v_profile.full_name, v_profile.name, 'SRM Officer') || ' confirmed receipt of spare parts.',
    false
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: SRM Update Urgency Level
CREATE OR REPLACE FUNCTION public.srm_update_urgency(
  p_shipment_id UUID,
  p_urgency TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_urgency NOT IN ('CRITICAL', 'URGENT', 'NORMAL') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid urgency level. Must be CRITICAL, URGENT, or NORMAL.');
  END IF;

  UPDATE public.shipments
  SET
    urgency = p_urgency,
    urgency_level = p_urgency
  WHERE id = p_shipment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- JOBS ROW-LEVEL SECURITY POLICIES (ONLY ADMIN CAN CREATE/EDIT/DELETE)
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- SPARE_PARTS ROW-LEVEL SECURITY POLICIES (ONLY ADMIN CAN CREATE/EDIT/DELETE)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated read spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Admin full spare_parts access" ON public.spare_parts;
DROP POLICY IF EXISTS "SRM view spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "SRM update stock" ON public.spare_parts;
DROP POLICY IF EXISTS "Admin insert spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Admin update spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Admin delete spare_parts" ON public.spare_parts;

CREATE POLICY "Allow authenticated read spare_parts" ON public.spare_parts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin insert spare_parts" ON public.spare_parts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update spare_parts" ON public.spare_parts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete spare_parts" ON public.spare_parts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- PROFILES ROW-LEVEL SECURITY & ROLE TAMPERING PREVENTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_role_security()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Non-admin users cannot change their own role or status
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Access Denied: Only ADMIN can change user roles.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Access Denied: Only ADMIN can change user status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_profile_role ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_security();
