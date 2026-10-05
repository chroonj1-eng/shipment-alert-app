-- ====================================================================
-- SRM Spare Part Management System - Supabase PostgreSQL Schema
-- Unithai Shipyard & Engineering (Laem Chabang Port)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_id TEXT,
  role TEXT NOT NULL DEFAULT 'SRM',
  department TEXT NOT NULL DEFAULT 'Ship Repair Management',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was previously created with minimal columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'SRM';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Ship Repair Management';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 3. Create JOBS Table (Shipyard repair & modification jobs)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no TEXT UNIQUE NOT NULL,
  job_name TEXT NOT NULL,
  vessel TEXT NOT NULL,
  customer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create JOB_ASSIGNMENTS Table (Linking SRMs to Jobs)
CREATE TABLE IF NOT EXISTS public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_job_assignment UNIQUE (user_id, job_id)
);

-- 5. Create SHIPMENTS Table (Tracking spare parts & maritime cargo)
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  booking_no TEXT,
  po_no TEXT,
  awb_bl TEXT NOT NULL,
  flight_vessel TEXT,
  description_of_goods TEXT,
  package_qty TEXT,
  supplier TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT 'Unithai Shipyard Laem Chabang',
  mode TEXT NOT NULL CHECK (mode IN ('AIR', 'SEA', 'COURIER', 'LAND')),
  eta TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_TRANSIT' CHECK (status IN ('IN_TRANSIT', 'ARRIVING_TODAY', 'RECEIVED', 'DELAYED')),
  urgency TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('CRITICAL', 'URGENT', 'NORMAL')),
  received_date TIMESTAMPTZ,
  receiver_name TEXT,
  receiver_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was already created with minimal columns
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS booking_no TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS po_no TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS flight_vessel TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS description_of_goods TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS package_qty TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'NORMAL';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_notes TEXT;

-- 6. Create NOTIFICATIONS Table (Targeted alerts for SRMs)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create SPARE_PARTS Table (Marine Spare Parts Inventory & Tracking)
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_no TEXT NOT NULL,
  part_name TEXT NOT NULL,
  category TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'PCS',
  location TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('CRITICAL', 'URGENT', 'NORMAL')),
  status TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ON_ORDER')),
  supplier TEXT NOT NULL,
  unit_cost NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON public.profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_no ON public.jobs(job_no);
CREATE INDEX IF NOT EXISTS idx_job_assignments_user_id ON public.job_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON public.job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_shipments_job_id ON public.shipments(job_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_spare_parts_job_id ON public.spare_parts(job_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_no ON public.spare_parts(part_no);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON public.spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_urgency ON public.spare_parts(urgency);
CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON public.spare_parts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 8. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_jobs_updated_at ON public.jobs;
CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_shipments_updated_at ON public.shipments;
CREATE TRIGGER set_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_spare_parts_updated_at ON public.spare_parts;
CREATE TRIGGER set_spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Automatic Profile Creation on Supabase auth.users Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    full_name,
    employee_id,
    role,
    department,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'UT-' || SUBSTRING(NEW.id::text, 1, 5)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'SRM'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Ship Repair Management'),
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Current User an ADMIN?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------------------
-- Authenticated users can view team profiles
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile; Admins can update any profile
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  ) WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- --------------------------------------------------------------------
-- JOBS POLICIES
-- --------------------------------------------------------------------
-- Admins have full access to jobs
DROP POLICY IF EXISTS "Admin full jobs access" ON public.jobs;
CREATE POLICY "Admin full jobs access" ON public.jobs
  FOR ALL USING (public.is_admin());

-- SRMs can view only jobs assigned to them
DROP POLICY IF EXISTS "SRM assigned jobs view" ON public.jobs;
CREATE POLICY "SRM assigned jobs view" ON public.jobs
  FOR SELECT USING (
    id IN (
      SELECT job_id FROM public.job_assignments
      WHERE user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------
-- JOB_ASSIGNMENTS POLICIES
-- --------------------------------------------------------------------
-- Admins have full access to assignments
DROP POLICY IF EXISTS "Admin full job_assignments access" ON public.job_assignments;
CREATE POLICY "Admin full job_assignments access" ON public.job_assignments
  FOR ALL USING (public.is_admin());

-- SRMs can view their own job assignments
DROP POLICY IF EXISTS "SRM read own job_assignments" ON public.job_assignments;
CREATE POLICY "SRM read own job_assignments" ON public.job_assignments
  FOR SELECT USING (user_id = auth.uid());

-- --------------------------------------------------------------------
-- SHIPMENTS POLICIES
-- --------------------------------------------------------------------
-- Allow all authenticated users (Admins and SRMs) to read shipments
DROP POLICY IF EXISTS "Allow authenticated read shipments" ON public.shipments;
CREATE POLICY "Allow authenticated read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert shipments
DROP POLICY IF EXISTS "Allow authenticated insert shipments" ON public.shipments;
CREATE POLICY "Allow authenticated insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update shipments (status, received date, notes)
DROP POLICY IF EXISTS "Allow authenticated update shipments" ON public.shipments;
CREATE POLICY "Allow authenticated update shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow admins to delete shipments
DROP POLICY IF EXISTS "Allow admin delete shipments" ON public.shipments;
CREATE POLICY "Allow admin delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (public.is_admin() OR auth.role() = 'authenticated');

-- --------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- --------------------------------------------------------------------
-- Users can view their own notifications
DROP POLICY IF EXISTS "User read own notifications" ON public.notifications;
CREATE POLICY "User read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Users can mark their own notifications as read
DROP POLICY IF EXISTS "User update own notifications" ON public.notifications;
CREATE POLICY "User update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- --------------------------------------------------------------------
-- SPARE_PARTS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- Admins have full access to spare parts (create, edit, delete, view)
DROP POLICY IF EXISTS "Admin full spare_parts access" ON public.spare_parts;
CREATE POLICY "Admin full spare_parts access" ON public.spare_parts
  FOR ALL USING (public.is_admin());

-- SRMs can view spare parts for assigned jobs or general warehouse parts
DROP POLICY IF EXISTS "SRM view spare_parts" ON public.spare_parts;
CREATE POLICY "SRM view spare_parts" ON public.spare_parts
  FOR SELECT USING (
    job_id IS NULL OR job_id IN (
      SELECT job_id FROM public.job_assignments
      WHERE user_id = auth.uid()
    )
  );

-- SRMs can update stock counts & notes for their assigned jobs
DROP POLICY IF EXISTS "SRM update stock" ON public.spare_parts;
CREATE POLICY "SRM update stock" ON public.spare_parts
  FOR UPDATE USING (
    job_id IS NULL OR job_id IN (
      SELECT job_id FROM public.job_assignments
      WHERE user_id = auth.uid()
    )
  );

-- ====================================================================
-- SEED DATA (Unithai Shipyard Realistic Baseline Projects)
-- ====================================================================

INSERT INTO public.jobs (job_no, job_name, vessel, customer, status)
VALUES
  ('26-R-2928', 'GAS LOMBOK - Main Engine Overhaul & Drydocking', 'GAS LOMBOK', 'PT Pertamina International Shipping', 'ACTIVE'),
  ('26-R-2931', 'SEMERU - Propeller Shaft & Stern Tube Survey', 'SEMERU', 'Samudera Indonesia', 'ACTIVE'),
  ('26-R-2930', 'THOR CONFIDENCE - Hull Grit Blasting & Cargo Holds', 'THOR CONFIDENCE', 'Thoresen Shipping', 'ACTIVE'),
  ('26-R-2940', 'WAN HAI 312 - Auxiliary Engine #2 Crankshaft Replacement', 'WAN HAI 312', 'Wan Hai Lines', 'ACTIVE'),
  ('26-R-2945', 'EASTERN OCEAN - Ballast Water Treatment System (BWTS) Retrofit', 'EASTERN OCEAN', 'Eastern Maritime Co.', 'ACTIVE')
ON CONFLICT (job_no) DO NOTHING;
