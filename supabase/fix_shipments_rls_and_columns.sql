-- ====================================================================
-- UNITHAI SRM - Fix Shipments Table Columns & Row-Level Security (RLS)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
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

-- 3. Allow all authenticated users (Admins & SRMs) to read shipments
DROP POLICY IF EXISTS "Allow authenticated read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admin full shipments access" ON public.shipments;
DROP POLICY IF EXISTS "SRM view assigned shipments" ON public.shipments;

CREATE POLICY "Allow authenticated read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (true);

-- 4. Allow all authenticated users to insert shipments
DROP POLICY IF EXISTS "Allow authenticated insert shipments" ON public.shipments;

CREATE POLICY "Allow authenticated insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Allow authenticated users to update shipments
DROP POLICY IF EXISTS "Allow authenticated update shipments" ON public.shipments;

CREATE POLICY "Allow authenticated update shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Allow authenticated users/admins to delete shipments
DROP POLICY IF EXISTS "Allow admin delete shipments" ON public.shipments;

CREATE POLICY "Allow admin delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (true);

-- 7. Ensure authenticated users can read jobs (needed for target vessel dropdown)
DROP POLICY IF EXISTS "Allow authenticated read jobs" ON public.jobs;
CREATE POLICY "Allow authenticated read jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (true);
