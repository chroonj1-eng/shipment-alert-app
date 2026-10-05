-- ====================================================================
-- UNITHAI SRM - Fix Shipments Table Columns & Row-Level Security (RLS)
-- Strict Role-Based Access Control (RBAC) Edition
-- ====================================================================

-- 1. Ensure all columns exist on public.shipments table
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS booking_no TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS po_no TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS flight_vessel TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS description_of_goods TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS package_qty TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'NORMAL';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_notes TEXT;

-- 2. Ensure RLS is enabled on public.shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 3. Helper function: Is Current User an ADMIN?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Clean up old permissive policies
DROP POLICY IF EXISTS "Allow authenticated read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admin full shipments access" ON public.shipments;
DROP POLICY IF EXISTS "SRM view assigned shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow authenticated update shipments" ON public.shipments;
DROP POLICY IF EXISTS "Allow admin delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Only admin can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Only admin can delete shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shipments update policy" ON public.shipments;

-- 5. Read shipments: Allowed for all authenticated users
CREATE POLICY "Allow authenticated read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (true);

-- 6. Insert shipments: ONLY ADMIN
CREATE POLICY "Only admin can insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 7. Delete shipments: ONLY ADMIN
CREATE POLICY "Only admin can delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 8. Update shipments: Admin full access; SRM restricted to RECEIVED and Urgency
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

-- 9. Trigger for granular column & value level protection
CREATE OR REPLACE FUNCTION public.enforce_shipments_rbac_on_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role = 'ADMIN' THEN
    RETURN NEW;
  END IF;

  -- SRM cannot modify general shipment info
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

  -- Status check: SRM can ONLY change to RECEIVED
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status <> 'RECEIVED' THEN
      RAISE EXCEPTION 'Access Denied: SRM can only change status to RECEIVED.';
    END IF;
  END IF;

  -- Urgency check: Must be CRITICAL, URGENT, or NORMAL
  IF NEW.urgency IS DISTINCT FROM OLD.urgency THEN
    IF NEW.urgency NOT IN ('CRITICAL', 'URGENT', 'NORMAL') THEN
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

-- 10. Ensure authenticated users can read jobs
DROP POLICY IF EXISTS "Allow authenticated read jobs" ON public.jobs;
CREATE POLICY "Allow authenticated read jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (true);
