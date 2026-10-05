-- ====================================================================
-- UNITHAI SRM - Create shipments Table Migration
-- Run this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Ensure uuid-ossp or pgcrypto extension is enabled for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure public.jobs exists (Required for foreign key and target vessel selection)
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

-- Seed baseline jobs if table is empty
INSERT INTO public.jobs (id, job_no, job_name, vessel, customer, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001', '26-R-2928', 'Main Engine Overhaul & Drydocking Survey', 'GAS LOMBOK', 'PT Pertamina International Shipping', 'ACTIVE'),
  ('c1000000-0000-0000-0000-000000000002', '26-R-2931', 'Propeller Shaft & Stern Tube Survey & Seals', 'SEMERU', 'Samudera Indonesia', 'ACTIVE'),
  ('c1000000-0000-0000-0000-000000000003', '26-R-2930', 'Cargo Holds Blasting & Tank Coating', 'THOR CONFIDENCE', 'Thoresen Shipping', 'ACTIVE'),
  ('c1000000-0000-0000-0000-000000000004', '26-R-2940', 'Auxiliary Engine Crankshaft Replacement', 'WAN HAI 312', 'Wan Hai Lines', 'ACTIVE')
ON CONFLICT (job_no) DO NOTHING;

-- 3. Create public.shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
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

-- 4. Safely add Foreign Key to public.jobs if jobs table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_shipments_job' AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.shipments
        ADD CONSTRAINT fk_shipments_job
        FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 5. Create Performance Indexes for shipments
CREATE INDEX IF NOT EXISTS idx_shipments_job_id ON public.shipments(job_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_urgency ON public.shipments(urgency);
CREATE INDEX IF NOT EXISTS idx_shipments_eta ON public.shipments(eta);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- 6. Updated At Trigger for shipments
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_shipments_updated_at ON public.shipments;
CREATE TRIGGER set_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security (RLS) Policies for public.shipments
-- Allow authenticated users to SELECT shipments
DROP POLICY IF EXISTS "Allow authenticated read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admin full shipments access" ON public.shipments;
DROP POLICY IF EXISTS "SRM view assigned shipments" ON public.shipments;
CREATE POLICY "Allow authenticated read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to INSERT new shipments
DROP POLICY IF EXISTS "Allow authenticated insert shipments" ON public.shipments;
CREATE POLICY "Allow authenticated insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE shipments (status, receipt notes, urgency)
DROP POLICY IF EXISTS "Allow authenticated update shipments" ON public.shipments;
CREATE POLICY "Allow authenticated update shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to DELETE shipments
DROP POLICY IF EXISTS "Allow authenticated delete shipments" ON public.shipments;
CREATE POLICY "Allow authenticated delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (true);

-- 9. Row Level Security (RLS) Policies for public.jobs (Required for Target Vessel dropdown)
DROP POLICY IF EXISTS "Allow authenticated read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin full jobs access" ON public.jobs;
CREATE POLICY "Allow authenticated read jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (true);
