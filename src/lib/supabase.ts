import { createClient } from '@supabase/supabase-js';
import { Profile, Job, JobAssignment, Shipment, NotificationItem, SparePart } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = true;

// Real Supabase Client - Direct connection to Supabase Production
export const realSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ============================================================================
// Local State Fallback Store (Used when Supabase credentials are not in .env)
// Follows identical schema & RLS semantics of supabase/schema.sql
// ============================================================================

interface LocalUserSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      name?: string;
      employee_id: string;
      role?: string;
      department?: string;
    };
  };
  access_token: string;
}

const STORAGE_KEY_AUTH = 'srm_supabase_auth_session';
const STORAGE_KEY_DB = 'srm_supabase_db_records';

// Initial Mock Seed Data matching Unithai Shipyard Realistic Projects
export const INITIAL_DB = {
  profiles: [
    {
      id: 'usr-admin-001',
      name: 'Captain Somchai Pradit',
      full_name: 'Captain Somchai Pradit',
      employee_id: 'UT-00109',
      role: 'ADMIN' as const,
      department: 'Shipyard Executive & Operations',
      status: 'ACTIVE' as const,
      email: 'admin.somchai@unithai.com',
      last_login: new Date(Date.now() - 3600000).toISOString(),
      created_at: '2026-01-10T08:00:00.000Z',
      updated_at: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'usr-srm-002',
      name: 'Ing (Preecha Kittisup)',
      full_name: 'Ing (Preecha Kittisup)',
      employee_id: 'UT-02488',
      role: 'SRM' as const,
      department: 'Ship Repair Management',
      status: 'ACTIVE' as const,
      email: 'ing.srm@unithai.com',
      last_login: new Date(Date.now() - 7200000).toISOString(),
      created_at: '2026-02-15T09:30:00.000Z',
      updated_at: '2026-02-15T09:30:00.000Z',
    },
    {
      id: 'usr-srm-003',
      name: 'Kamonchanok Chaiyamat',
      full_name: 'Kamonchanok Chaiyamat',
      employee_id: 'UT-02941',
      role: 'SRM' as const,
      department: 'Ship Repair Management',
      status: 'ACTIVE' as const,
      email: 'kamolchanok.chaiyamat@gmail.com',
      last_login: new Date(Date.now() - 1800000).toISOString(),
      created_at: '2026-03-01T10:00:00.000Z',
      updated_at: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'usr-cosrm-004',
      name: 'Anan Prasert',
      full_name: 'Anan Prasert',
      employee_id: 'UT-03112',
      role: 'CO_SRM' as const,
      department: 'Ship Repair Management',
      status: 'ACTIVE' as const,
      email: 'anan.p@unithai.com',
      last_login: new Date(Date.now() - 3600000).toISOString(),
      created_at: '2026-02-20T08:00:00.000Z',
      updated_at: '2026-02-20T08:00:00.000Z',
    },
    {
      id: 'usr-incharge-005',
      name: 'Natthapong Thongdee',
      full_name: 'Natthapong Thongdee',
      employee_id: 'UT-03405',
      role: 'IN_CHARGE' as const,
      department: 'Machinery & Dock Operations',
      status: 'ACTIVE' as const,
      email: 'natthapong.t@unithai.com',
      last_login: new Date(Date.now() - 5400000).toISOString(),
      created_at: '2026-02-25T08:00:00.000Z',
      updated_at: '2026-02-25T08:00:00.000Z',
    },
  ] as Profile[],

  jobs: [
    {
      id: 'job-001',
      job_no: '26-R-2928',
      job_name: 'Main Engine Overhaul & Drydocking Survey',
      vessel: 'GAS LOMBOK',
      customer: 'PT Pertamina International Shipping',
      status: 'ACTIVE' as const,
      eta: '2026-03-25',
      etd: '2026-04-10',
      srm_id: 'usr-srm-002',
      srm_name: 'Ing (Preecha Kittisup)',
      co_srm_id: 'usr-cosrm-004',
      co_srm_name: 'Anan Prasert',
      in_charge_id: 'usr-incharge-005',
      in_charge_name: 'Natthapong Thongdee',
      created_at: '2026-03-01T08:00:00.000Z',
      updated_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'job-002',
      job_no: '26-R-2931',
      job_name: 'Propeller Shaft & Stern Tube Survey & Seals',
      vessel: 'SEMERU',
      customer: 'Samudera Indonesia',
      status: 'ACTIVE' as const,
      eta: '2026-03-28',
      etd: '2026-04-15',
      srm_id: 'usr-srm-002',
      srm_name: 'Ing (Preecha Kittisup)',
      co_srm_id: 'usr-cosrm-004',
      co_srm_name: 'Anan Prasert',
      created_at: '2026-03-05T08:00:00.000Z',
      updated_at: '2026-03-05T08:00:00.000Z',
    },
    {
      id: 'job-003',
      job_no: '26-R-2930',
      job_name: 'Cargo Holds Blasting & Tank Coating',
      vessel: 'THOR CONFIDENCE',
      customer: 'Thoresen Shipping',
      status: 'ACTIVE' as const,
      eta: '2026-04-02',
      etd: '2026-04-20',
      srm_id: 'usr-srm-003',
      srm_name: 'Kamonchanok Chaiyamat',
      in_charge_id: 'usr-incharge-005',
      in_charge_name: 'Natthapong Thongdee',
      created_at: '2026-03-10T08:00:00.000Z',
      updated_at: '2026-03-10T08:00:00.000Z',
    },
    {
      id: 'job-004',
      job_no: '26-R-2940',
      job_name: 'Auxiliary Engine Crankshaft Replacement',
      vessel: 'WAN HAI 312',
      customer: 'Wan Hai Lines',
      status: 'ACTIVE' as const,
      eta: '2026-04-05',
      etd: '2026-04-25',
      created_at: '2026-03-15T08:00:00.000Z',
      updated_at: '2026-03-15T08:00:00.000Z',
    },
  ] as Job[],

  job_assignments: [
    {
      id: 'assign-001',
      user_id: 'usr-srm-002', // Ing
      job_id: 'job-001', // 26-R-2928 GAS LOMBOK
      assigned_at: '2026-03-02T08:00:00.000Z',
    },
    {
      id: 'assign-002',
      user_id: 'usr-srm-002', // Ing
      job_id: 'job-002', // 26-R-2931 SEMERU
      assigned_at: '2026-03-06T08:00:00.000Z',
    },
    {
      id: 'assign-003',
      user_id: 'usr-srm-003', // Kamonchanok
      job_id: 'job-001', // 26-R-2928
      assigned_at: '2026-03-10T08:00:00.000Z',
    },
    {
      id: 'assign-004',
      user_id: 'usr-srm-003', // Kamonchanok
      job_id: 'job-003', // 26-R-2930
      assigned_at: '2026-03-12T08:00:00.000Z',
    },
  ] as JobAssignment[],

  shipments: [
    {
      id: 'shp-001',
      job_id: 'job-001', // 26-R-2928 GAS LOMBOK
      booking_no: 'BKG-2026-0914',
      po_no: 'PO-770413',
      awb_bl: 'TG-9821405-BKK',
      flight_vessel: 'TG-982 / MV CHAO PHRAYA',
      description_of_goods: 'Breakdown / Emergency - HFO Separator High Pressure Bowl',
      package_qty: '2 Wooden Cases (145 kg)',
      supplier: 'MAN Energy Solutions SE',
      origin: 'Copenhagen, Denmark',
      destination: 'Unithai Shipyard Laem Chabang Pier 3',
      mode: 'AIR' as const,
      eta: new Date(Date.now() + 86400000).toISOString(),
      status: 'ARRIVING_TODAY' as const,
      urgency: 'CRITICAL' as const,
      received_date: null,
      receiver_name: null,
      receiver_notes: null,
      created_at: '2026-03-15T08:00:00.000Z',
      updated_at: '2026-03-15T08:00:00.000Z',
    },
    {
      id: 'shp-002',
      job_id: 'job-001', // 26-R-2928 GAS LOMBOK
      booking_no: 'BKG-2026-0911',
      po_no: 'PO-770410',
      awb_bl: 'MSK-7740192-TH',
      flight_vessel: 'MAERSK TONG / MV SIAM GLORY',
      description_of_goods: 'Breakdown / Emergency - Valve Spindles, Guides & Seats',
      package_qty: '1 Pallet Steel Box (380 kg)',
      supplier: 'Wärtsilä Marine Power',
      origin: 'Vaasa, Finland',
      destination: 'Unithai Shipyard Heavy Mechanical Workshop',
      mode: 'SEA' as const,
      eta: new Date(Date.now() + 432000000).toISOString(),
      status: 'IN_TRANSIT' as const,
      urgency: 'URGENT' as const,
      received_date: null,
      receiver_name: null,
      receiver_notes: null,
      created_at: '2026-03-16T08:00:00.000Z',
      updated_at: '2026-03-16T08:00:00.000Z',
    },
    {
      id: 'shp-003',
      job_id: 'job-002', // 26-R-2931 SEMERU
      booking_no: 'BKG-2026-0916',
      po_no: 'PO-770415',
      awb_bl: 'DHL-4491029-SIN',
      flight_vessel: 'SQ-972 / MV GOLDEN NAVIGATOR',
      description_of_goods: 'Classification Society Inspection - Propeller Hub Seals & Bearings',
      package_qty: '3 Heavy Cartons (85 kg)',
      supplier: 'SKF Marine Technologies',
      origin: 'Singapore Hub',
      destination: 'Unithai Drydock No. 1 Toolroom',
      mode: 'COURIER' as const,
      eta: new Date(Date.now() - 86400000).toISOString(),
      status: 'DELAYED' as const,
      urgency: 'CRITICAL' as const,
      received_date: null,
      receiver_name: null,
      receiver_notes: null,
      created_at: '2026-03-14T08:00:00.000Z',
      updated_at: '2026-03-14T08:00:00.000Z',
    },
    {
      id: 'shp-004',
      job_id: 'job-003', // 26-R-2930 THOR CONFIDENCE
      booking_no: 'BKG-2026-0920',
      po_no: 'PO-770422',
      awb_bl: 'JOTUN-901844',
      flight_vessel: 'TRUCK-CHONBURI 04',
      description_of_goods: 'Ballast Tank Coating & Antifouling Marine Epoxy Paint (Grade A)',
      package_qty: '20 Steel Drums (450 kg)',
      supplier: 'Jotun Paints Thailand Ltd',
      origin: 'Amata City Chonburi',
      destination: 'Unithai Blasting & Painting Yard',
      mode: 'LAND' as const,
      eta: new Date(Date.now() - 172800000).toISOString(),
      status: 'RECEIVED' as const,
      urgency: 'NORMAL' as const,
      received_date: new Date(Date.now() - 86400000).toISOString(),
      receiver_name: 'Ing (Preecha Kittisup)',
      receiver_notes: 'Inspected and stored in Chemical Warehouse Bay 2',
      created_at: '2026-03-12T08:00:00.000Z',
      updated_at: '2026-03-14T08:00:00.000Z',
    },
  ] as Shipment[],

  notifications: [
    {
      id: 'notif-001',
      user_id: 'usr-srm-002', // Ing
      type: 'SHIPMENT_ARRIVAL',
      title: 'Shipment for 26-R-2928 has arrived at terminal',
      message: 'AWB TG-9821405-BKK (Cylinder head gaskets) is ready for customs inspection.',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'notif-002',
      user_id: 'usr-srm-002', // Ing
      type: 'JOB_ASSIGNMENT',
      title: 'New Job Assigned: 26-R-2931',
      message: 'Admin Captain Somchai assigned you as lead SRM for vessel SEMERU.',
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'notif-003',
      user_id: 'usr-srm-003', // Kamonchanok
      type: 'SHIPMENT_ARRIVAL',
      title: 'Shipment for 26-R-2928 has arrived at terminal',
      message: 'Spare parts package AWB TG-9821405-BKK is awaiting SRM receipt confirmation.',
      is_read: false,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ] as NotificationItem[],

  spare_parts: [
    {
      id: 'part-001',
      part_no: 'ME-EXH-4012',
      part_name: 'Main Engine Exhaust Valve Spindle',
      category: 'Main Engine',
      job_id: 'job-001', // 26-R-2928 GAS LOMBOK
      quantity_in_stock: 6,
      min_quantity: 4,
      unit: 'PCS',
      location: 'Toolroom No.1 / Rack A-02',
      urgency: 'CRITICAL',
      status: 'IN_STOCK',
      supplier: 'MAN Energy Solutions SE',
      unit_cost: 14500,
      notes: 'Nimonic alloy high-temp spindle for B&W 6S50MC',
      created_at: '2026-03-01T08:00:00.000Z',
      updated_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'part-002',
      part_no: 'TC-ROTOR-88',
      part_name: 'Turbocharger Rotor Shaft & Turbine Blades Assembly',
      category: 'Main Engine',
      job_id: 'job-001', // 26-R-2928 GAS LOMBOK
      quantity_in_stock: 1,
      min_quantity: 2,
      unit: 'SETS',
      location: 'Heavy Mechanical Workshop Bay 3',
      urgency: 'CRITICAL',
      status: 'LOW_STOCK',
      supplier: 'ABB Turbocharging / Accelleron',
      unit_cost: 85000,
      notes: 'Balanced with dynamic certificate for VTR 454',
      created_at: '2026-03-02T08:00:00.000Z',
      updated_at: '2026-03-02T08:00:00.000Z',
    },
    {
      id: 'part-003',
      part_no: 'ST-SEAL-550',
      part_name: 'Simplex Stern Tube Forward & Aft Seal Rings',
      category: 'Propeller & Stern Tube',
      job_id: 'job-002', // 26-R-2931 SEMERU
      quantity_in_stock: 4,
      min_quantity: 2,
      unit: 'SETS',
      location: 'Drydock No.1 Toolroom / Shelf C-11',
      urgency: 'URGENT',
      status: 'IN_STOCK',
      supplier: 'SKF Marine Technologies',
      unit_cost: 18200,
      notes: 'Viton FKM lip seals 550mm diameter',
      created_at: '2026-03-05T08:00:00.000Z',
      updated_at: '2026-03-05T08:00:00.000Z',
    },
    {
      id: 'part-004',
      part_no: 'HYD-PUMP-900',
      part_name: 'Steering Gear Axial Piston Hydraulic Pump',
      category: 'Hydraulics & Pumps',
      job_id: 'job-002', // 26-R-2931 SEMERU
      quantity_in_stock: 0,
      min_quantity: 1,
      unit: 'PCS',
      location: 'Awaiting Delivery - Dock Pier 2',
      urgency: 'CRITICAL',
      status: 'OUT_OF_STOCK',
      supplier: 'Kawasaki Precision Machinery',
      unit_cost: 62000,
      notes: 'Urgent breakdown repair for rudder torque unit',
      created_at: '2026-03-10T08:00:00.000Z',
      updated_at: '2026-03-10T08:00:00.000Z',
    },
    {
      id: 'part-005',
      part_no: 'AE-INJ-108',
      part_name: 'Auxiliary Diesel Generator Fuel Injection Nozzles',
      category: 'Auxiliary Engine',
      job_id: 'job-004', // 26-R-2940 WAN HAI 312
      quantity_in_stock: 12,
      min_quantity: 6,
      unit: 'PCS',
      location: 'Electrical & Automation Store / B-05',
      urgency: 'NORMAL',
      status: 'IN_STOCK',
      supplier: 'Daihatsu Diesel Mfg',
      unit_cost: 450,
      notes: 'Standard 2000-hour overhaul set for 6DL-20',
      created_at: '2026-03-12T08:00:00.000Z',
      updated_at: '2026-03-12T08:00:00.000Z',
    },
    {
      id: 'part-006',
      part_no: 'PAINT-EPOXY-40',
      part_name: 'Marine High-Build Epoxy Tank Primer (Grade A)',
      category: 'Hull & Deck Machinery',
      job_id: 'job-003', // 26-R-2930 THOR CONFIDENCE
      quantity_in_stock: 24,
      min_quantity: 10,
      unit: 'DRUMS',
      location: 'Blasting & Painting Yard Compound',
      urgency: 'NORMAL',
      status: 'IN_STOCK',
      supplier: 'Jotun Paints Thailand Ltd',
      unit_cost: 320,
      notes: 'Jotamastic 90 with aluminium flakes (20L drums)',
      created_at: '2026-03-14T08:00:00.000Z',
      updated_at: '2026-03-14T08:00:00.000Z',
    },
  ] as SparePart[],
};

export function getLocalDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(INITIAL_DB));
      return INITIAL_DB;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.spare_parts || parsed.spare_parts.length === 0) {
      parsed.spare_parts = INITIAL_DB.spare_parts;
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_DB;
  }
}

export function saveLocalDb(data: typeof INITIAL_DB) {
  try {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export class LocalInsertBuilder<T> {
  private data: T[];
  private error: any;

  constructor(data: T[], error: any = null) {
    this.data = data;
    this.error = error;
  }

  select(_columns = '*') {
    return this;
  }

  single(): Promise<{ data: T | null; error: any }> {
    return Promise.resolve({
      data: this.data && this.data.length > 0 ? this.data[0] : null,
      error: this.error,
    });
  }

  then<TResult1 = { data: T[]; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[]; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.data, error: this.error }).then(onfulfilled, onrejected);
  }
}

// Emulated Query Builder for seamless local DB operations matching Supabase API
export class LocalTableQuery<T> {
  private tableName: keyof typeof INITIAL_DB;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private pendingUpdate: any = null;
  private isDelete = false;

  constructor(tableName: keyof typeof INITIAL_DB) {
    this.tableName = tableName;
  }

  select(_columns = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push((item) => values.includes(item[field]));
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    this.orderField = field;
    this.orderAscending = ascending;
    return this;
  }

  update(updates: any) {
    this.pendingUpdate = updates;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  async single(): Promise<{ data: T | null; error: any }> {
    const res = await this.execute();
    return {
      data: res.data && res.data.length > 0 ? (res.data[0] as T) : null,
      error: res.error,
    };
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const db = getLocalDb();

    // Check if delete operation
    if (this.isDelete) {
      const beforeCount = db[this.tableName].length;
      db[this.tableName] = db[this.tableName].filter((item: any) => {
        for (const filter of this.filters) {
          if (filter(item)) return false; // remove
        }
        return true;
      });
      saveLocalDb(db);
      return { data: { deleted: beforeCount - db[this.tableName].length }, error: null };
    }

    // Check if update operation
    if (this.pendingUpdate) {
      let updatedRecords: any[] = [];
      db[this.tableName] = db[this.tableName].map((item: any) => {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const updated = {
            ...item,
            ...this.pendingUpdate,
            updated_at: new Date().toISOString(),
          };
          updatedRecords.push(updated);
          return updated;
        }
        return item;
      });
      saveLocalDb(db);
      return { data: updatedRecords, error: null };
    }

    // Query operation
    let records = [...(db[this.tableName] || [])];

    for (const filter of this.filters) {
      records = records.filter(filter);
    }

    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAscending;
      records.sort((a, b) => {
        if (a[field] < b[field]) return asc ? -1 : 1;
        if (a[field] > b[field]) return asc ? 1 : -1;
        return 0;
      });
    }

    return { data: records, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  insert(recordOrRecords: any | any[]): LocalInsertBuilder<any> {
    const db = getLocalDb();
    const newItems = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    const stamped = newItems.map((item) => ({
      id: item.id || `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      ...item,
    }));

    db[this.tableName] = [...db[this.tableName], ...stamped];
    saveLocalDb(db);
    return new LocalInsertBuilder(stamped, null);
  }
}

// Fallback auth implementation matching Supabase Auth contracts
const authListeners = new Set<(event: string, session: any) => void>();

export const localAuth = {
  async getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      if (!raw) return { data: { session: null }, error: null };
      const parsed = JSON.parse(raw);
      return { data: { session: parsed }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },

  async signUp({ email, password: _, options }: { email: string; password: string; options?: { emailRedirectTo?: string; redirectTo?: string; data?: any } }) {
    const db = getLocalDb();
    const existing = db.profiles.find((p: Profile) => p.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { data: { user: null, session: null }, error: { message: 'A user with this email already exists.' } };
    }

    const userId = `usr-${Date.now()}`;
    const fullName = options?.data?.full_name || options?.data?.name || 'SRM Officer';
    const name = options?.data?.name || fullName;
    const employeeId = options?.data?.employee_id || `UT-${Math.floor(10000 + Math.random() * 90000)}`;
    const role = options?.data?.role || 'SRM';
    const department = options?.data?.department || 'Ship Repair Management';

    const newProfile: Profile = {
      id: userId,
      name,
      full_name: fullName,
      employee_id: employeeId,
      role: role,
      department,
      status: 'ACTIVE',
      email: email,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.profiles.push(newProfile);
    saveLocalDb(db);

    const session: LocalUserSession = {
      user: {
        id: userId,
        email,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          employee_id: employeeId,
          role,
          department,
        },
      },
      access_token: `token-${userId}`,
    };

    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    authListeners.forEach((cb) => cb('SIGNED_IN', session));

    return { data: { user: session.user, session }, error: null };
  },

  async signInWithPassword({ email, password: _ }: { email: string; password: string }) {
    const db = getLocalDb();
    const profile = db.profiles.find((p: Profile) => p.email?.toLowerCase() === email.toLowerCase());

    if (!profile) {
      return { data: { user: null, session: null }, error: { message: 'Invalid login credentials. User not found.' } };
    }

    if (profile.status === 'INACTIVE') {
      return { data: { user: null, session: null }, error: { message: 'This account has been deactivated by the Admin.' } };
    }

    profile.last_login = new Date().toISOString();
    saveLocalDb(db);

    const session: LocalUserSession = {
      user: {
        id: profile.id,
        email: profile.email || email,
        user_metadata: {
          full_name: profile.full_name,
          name: profile.name || profile.full_name,
          employee_id: profile.employee_id,
          role: profile.role,
          department: profile.department,
        },
      },
      access_token: `token-${profile.id}`,
    };

    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    authListeners.forEach((cb) => cb('SIGNED_IN', session));

    return { data: { user: session.user, session }, error: null };
  },

  async signOut() {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    authListeners.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  },

  async resetPasswordForEmail(_email: string, _options?: { redirectTo?: string }) {
    return { data: {}, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => authListeners.delete(callback),
        },
      },
    };
  },
};

// Always export real Supabase client directly - NO mock/local state for database operations
export const supabase = realSupabase;
