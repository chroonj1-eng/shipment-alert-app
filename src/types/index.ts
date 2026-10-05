export type UserRole = 'admin' | 'srm' | 'co_srm' | 'incharge';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedJobs: string[]; // Job numbers assigned to this user, e.g. ['JOB-2026-088']
  department: string;
  phone: string;
  verified: boolean;
  approved: boolean;
  createdAt: string;
}

export interface JobProject {
  jobNo: string;
  vesselName: string;
  repairProject: string;
  vesselType?: string;
  drydockBay?: string;
  srm: string;
  srmEmail?: string;
  srmPhone?: string;
  coSrm: string;
  coSrmEmail?: string;
  incharge: string;
  inchargeEmail?: string;
  status: 'Active' | 'Docked' | 'Completed' | 'Pending';
}

export interface NotificationLog {
  id: string;
  partId: string;
  jobNo: string;
  vesselName: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  senderName: string;
  channel: 'email' | 'line' | 'in_app' | 'sms';
  subject: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered';
}

export type DeliveryStatus = 'In Transit' | 'Arrived Port' | 'DO Cleared' | 'Delivered' | 'Delayed';

export interface SparePartItem {
  id: string;
  // Col 1: JOB (เรือ / งาน)
  jobNo: string;
  vesselName: string;
  repairProject: string;

  // Col 2: SRM
  srm: string;
  coSrm?: string;
  incharge?: string;

  // Col 3: BOOKING NO.
  bookingNo: string;

  // Col 4: P/O (PO no. / OWNER SUPPLY)
  poNo: string;

  // Col 5: AWB/BL
  awbBl: string;

  // Col 6: FLIGHT / VESSEL
  flightVessel: string;

  // Col 7: DESCRIPTION OF GOODS
  descriptionOfGoods: string;

  // Col 8: SHIPPER/SUPPLIER
  shipperSupplier: string;

  // Col 9: FROM
  from: string;

  // Col 10: TO
  to: string;

  // Col 11: PACKAGE
  package: string;

  // Col 12: WEIGHT (kg)
  weight: number | string;

  // Col 13: ETD
  etd: string;

  // Col 14: ETA
  eta: string;

  // Col 15: RECIEVE D/O AND OPEN CONTAINER DATE
  recieveDoAndOpenContainerDate: string;

  // Col 16: DELIVERY DATE ⚠️
  deliveryDate: string;

  // Col 17: TERM
  term: string; // FOB, CIF, DDP, EXW, FCA, etc.

  // Col 18: TYPE
  type: string; // Spare Part, Owner Supply, Critical Equipment, Consumable, etc.

  // Additional tracking & state
  status: DeliveryStatus;
  urgentLevel?: 'normal' | 'urgent' | 'critical';
  notes?: string;
  lastNotifiedDate?: string;
  notificationCount: number;
}

export interface AlertRuleConfig {
  deliveryWarningDays: number; // e.g. 3 days before Delivery Date
  etaPendingDoDays: number;    // e.g. 2 days after ETA without D/O
  enableAutoEmail: boolean;
  enableAutoLine: boolean;
  enableInAppBadge: boolean;
  companyEmailDomain: string;  // e.g. "@shipyard.co.th"
  allowAnyCompanySubdomain: boolean;
}
