// Database Types for Supabase SRM Spare Part Management System

export type RoleType = 'ADMIN' | 'SRM' | 'CO_SRM' | 'IN_CHARGE' | 'ENGINEER' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type JobStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
export type ShipmentStatus = 'IN_TRANSIT' | 'ARRIVING_TODAY' | 'RECEIVED' | 'DELAYED';
export type ShipmentMode = 'AIR' | 'SEA' | 'COURIER' | 'LAND';
export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'NORMAL';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER';

export interface Profile {
  id: string; // UUID references auth.users(id)
  email: string;
  name: string;
  full_name: string;
  employee_id?: string;
  role: RoleType;
  department: string;
  status: UserStatus;
  last_login?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined assignments for convenience
  assigned_jobs?: Job[];
}

export interface Job {
  id: string; // UUID
  job_no: string; // e.g. "26-R-2928"
  job_name: string;
  vessel: string; // e.g. "GAS LOMBOK"
  customer: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobAssignment {
  id: string; // UUID
  user_id: string; // UUID
  job_id: string; // UUID
  assigned_at: string;
  profile?: Profile;
  job?: Job;
}

export interface Shipment {
  id: string; // UUID
  job_id: string; // UUID
  booking_no?: string; // e.g. "BKG-2026-0914"
  po_no?: string; // e.g. "PO-770413"
  awb_bl: string;
  flight_vessel?: string; // e.g. "TG-920 / MV SIAM GLORY"
  description_of_goods?: string; // e.g. "Main Engine Exhaust Valves & Gaskets"
  package_qty?: string; // e.g. "2 Wooden Crates (140 kg)"
  supplier: string;
  origin: string;
  destination: string;
  mode: ShipmentMode;
  eta: string;
  status: ShipmentStatus;
  urgency?: UrgencyLevel;
  received_date?: string | null;
  receiver_name?: string | null;
  receiver_notes?: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  assigned_srms?: Profile[];
}

export interface SparePart {
  id: string; // UUID
  part_no: string; // e.g. "ME-VALVE-4012"
  part_name: string; // e.g. "Main Engine Exhaust Valve Spindle"
  category: string; // e.g. "Main Engine", "Auxiliary Engine", "Propeller & Stern Tube", "Hydraulics & Pumps", "Electrical", "Hull & Deck"
  job_id?: string | null; // references jobs.id (Target Vessel / Project)
  quantity_in_stock: number; // Current remaining stock (จำนวนคงเหลือ)
  min_quantity: number; // Minimum reorder alert level
  unit: string; // e.g. "PCS", "SETS", "BOXES", "DRUMS"
  location: string; // Warehouse / Toolroom location (e.g. "Toolroom No.1 / Shelf B-03")
  urgency: UrgencyLevel; // 'CRITICAL' | 'URGENT' | 'NORMAL'
  status: StockStatus;
  supplier: string;
  unit_cost?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface NotificationItem {
  id: string; // UUID
  user_id: string; // UUID
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// App Theme: Dark or Bright (Light)
export type AppTheme = 'dark' | 'bright';
