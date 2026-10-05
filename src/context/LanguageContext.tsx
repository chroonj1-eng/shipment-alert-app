import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'th' | 'en';

export interface Translations {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  srmSystem: string;

  // Nav
  navDashboard: string;
  navMyDashboard: string;
  navAdminDashboard: string;
  navUserManagement: string;
  navJobAssignments: string;
  navAllShipments: string;
  navMyShipments: string;
  navSignOut: string;
  switchRoleBtn: string;

  // Common Actions
  searchPlaceholder: string;
  all: string;
  cancel: string;
  save: string;
  confirm: string;
  close: string;
  loading: string;
  actions: string;
  status: string;
  role: string;
  edit: string;
  delete: string;
  remove: string;

  // Auth View
  signInTitle: string;
  registerTitle: string;
  forgotTitle: string;
  signInSub: string;
  registerSub: string;
  forgotSub: string;
  fullName: string;
  fullNamePlaceholder: string;
  employeeId: string;
  employeeIdSub: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPasswordLink: string;
  securityRuleSRM: string;
  signInBtn: string;
  registerBtn: string;
  sendResetBtn: string;
  noAccountYet: string;
  registerHere: string;
  alreadyHaveAccount: string;
  signInInstead: string;
  quickTestAccess: string;
  adminSomchaiDesc: string;
  srmIngDesc: string;

  // Admin Dashboard
  adminConsoleTitle: string;
  adminConsoleDesc: string;
  manageUsersBtn: string;
  jobsAndSrmsBtn: string;
  statTotalUsers: string;
  statTotalJobs: string;
  statTotalShipments: string;
  statDelayedShipments: string;
  recentRegistrations: string;
  recentJobs: string;
  recentShipments: string;
  viewAll: string;

  // User Management
  userManagementTitle: string;
  userManagementDesc: string;
  colUserEmployee: string;
  colRole: string;
  colStatus: string;
  colAssignedJobs: string;
  colCreatedDate: string;
  colLastLogin: string;
  makeAdmin: string;
  demoteToSrm: string;
  activateUser: string;
  deactivateUser: string;
  assignJobModalTitle: string;
  selectJobLabel: string;
  noneAssigned: string;

  // Job Management
  jobsAndAssignmentsTitle: string;
  jobsAndAssignmentsDesc: string;
  newJobBtn: string;
  jobNo: string;
  vesselName: string;
  customerName: string;
  scopeProject: string;
  assignedSrms: string;
  assignSrmPlaceholder: string;
  noSrmAssigned: string;

  // SRM Dashboard
  srmWorkspaceTitle: string;
  srmWorkspaceDesc: string;
  myJobs: string;
  myShipments: string;
  arrivingToday: string;
  delayed: string;
  received: string;
  unreadAlerts: string;
  myAssignedJobsTitle: string;
  noAssignedJobsYet: string;
  incomingSparePartsTitle: string;
  incomingSparePartsSub: string;
  colJobVessel: string;
  colAwbBl: string;
  colSupplierOrigin: string;
  colMode: string;
  colEta: string;
  colDestination: string;
  markRead: string;
  newBadge: string;
  myNotificationsTitle: string;
  noNotifications: string;

  // Shipments List
  allConsignmentsTitle: string;
  allConsignmentsSub: string;
  newShipmentBtn: string;
  updateStatus: string;

  // Urgency, Status & Action Translations
  urgencyAll: string;
  urgencyCritical: string;
  urgencyUrgent: string;
  urgencyNormal: string;
  confirmReceivedBtn: string;
  viewDetailsBtn: string;
  changeStatusBtn: string;
  receivedSuccessMsg: string;
  thJobVessel: string;
  thSrm: string;
  thBookingNo: string;
  thPoNo: string;
  thAwbBl: string;
  thFlightVessel: string;
  thStatus: string;
  thActions: string;

  // Marine Spare Parts Tracker
  navSparePartsTracker: string;
  addPartBtn: string;
  editPartBtn: string;
  deletePartBtn: string;
  stockQuantity: string;
  minStockLevel: string;
  storageLocation: string;
  partCategory: string;
  partNo: string;
  partName: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  stockInBtn: string;
  stockOutBtn: string;
}

export const appTranslations: Record<Language, Translations> = {
  th: {
    appTitle: 'UNITHAI SHIPYARD',
    appSubtitle: 'ระบบบริหารจัดการอะไหล่เรือ & โครงการซ่อมเรือ SRM',
    srmSystem: 'ระบบ SRM',

    navDashboard: 'แดชบอร์ด',
    navMyDashboard: 'แดชบอร์ดของฉัน',
    navAdminDashboard: 'แดชบอร์ดผู้ดูแล',
    navUserManagement: 'จัดการผู้ใช้งาน & สิทธิ์',
    navJobAssignments: 'มอบหมายงาน & เรือ',
    navAllShipments: 'พัสดุและอะไหล่ทั้งหมด',
    navMyShipments: 'อะไหล่เรือของฉัน',
    navSignOut: 'ออกจากระบบ',
    switchRoleBtn: 'สลับไปเป็น',

    searchPlaceholder: 'ค้นหาเลข Job, เรือ, ผู้ผลิต, AWB/BL...',
    all: 'ทั้งหมด',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    confirm: 'ยืนยัน',
    close: 'ปิด',
    loading: 'กำลังโหลดข้อมูล...',
    actions: 'จัดการ',
    status: 'สถานะ',
    role: 'บทบาท',
    edit: 'แก้ไข',
    delete: 'ลบ',
    remove: 'นำออก',

    signInTitle: 'เข้าสู่ระบบ SRM Portal',
    registerTitle: 'ลงทะเบียนพนักงาน SRM ใหม่',
    forgotTitle: 'รีเซ็ตรหัสผ่าน',
    signInSub: 'ระบบบริหารจัดการอะไหล่เรือและโปรเจคซ่อมบำรุง Unithai Shipyard',
    registerSub: 'สร้างบัญชีผู้ใช้ใหม่ บันทึกลงฐานข้อมูล Supabase PostgreSQL ถาวร',
    forgotSub: 'ระบุอีเมลองค์กรของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน',
    fullName: 'ชื่อ - นามสกุล',
    fullNamePlaceholder: 'เช่น อิง (ปรีชา กิตติสุข)',
    employeeId: 'รหัสพนักงาน',
    employeeIdSub: '(บัตรประจำตัวอู่เรือ)',
    email: 'อีเมลองค์กร',
    password: 'รหัสผ่าน',
    confirmPassword: 'ยืนยันรหัสผ่าน',
    forgotPasswordLink: 'ลืมรหัสผ่าน?',
    securityRuleSRM: 'นโยบายความปลอดภัย: บัญชีใหม่ทั้งหมดจะได้รับสิทธิ์ SRM โดยอัตโนมัติ การแต่งตั้ง ADMIN ต้องได้รับอนุมัติ',
    signInBtn: 'เข้าสู่ระบบ',
    registerBtn: 'ลงทะเบียนบัญชีใน Supabase',
    sendResetBtn: 'ส่งลิงก์รีเซ็ตรหัสผ่าน',
    noAccountYet: 'ยังไม่มีบัญชี SRM ใช่หรือไม่?',
    registerHere: 'ลงทะเบียนที่นี่',
    alreadyHaveAccount: 'มีบัญชีอยู่แล้ว?',
    signInInstead: 'เข้าสู่ระบบแทน',
    quickTestAccess: 'ทดสอบระบบด่วน (คลิกเดียวเพื่อสลับบทบาท)',
    adminSomchaiDesc: 'ผู้ดูแลสูงสุด / จัดการผู้ใช้ทั้งหมด',
    srmIngDesc: 'SRM ประจำเรือ / เห็นเฉพาะงานตนเอง',

    adminConsoleTitle: 'ภาพรวมระบบโลจิสติกส์อะไหล่ Unithai Shipyard',
    adminConsoleDesc: 'การติดตามสถานะงานซ่อมเรือ มอบหมายผู้จัดการ SRM และอะไหล่ทางอากาศ/เรือ/บก ท่าเรือแหลมฉบังแบบเรียลไทม์',
    manageUsersBtn: 'จัดการผู้ใช้งาน',
    jobsAndSrmsBtn: 'งานเรือ & SRM',
    statTotalUsers: 'ผู้ใช้งานทั้งหมด',
    statTotalJobs: 'โปรเจคเรือในอู่',
    statTotalShipments: 'พัสดุอะไหล่ทั้งหมด',
    statDelayedShipments: 'พัสดุที่ล่าช้า',
    recentRegistrations: 'ผู้ลงทะเบียนล่าสุด',
    recentJobs: 'โครงการเรือในอู่',
    recentShipments: 'พัสดุและอะไหล่ล่าสุด',
    viewAll: 'ดูทั้งหมด',

    userManagementTitle: 'ระบบจัดการผู้ใช้งานและสิทธิ์ (User Management)',
    userManagementDesc: 'หน้าจอ Admin สำหรับจัดการบุคลากร สิทธิ์ SRM และการมอบหมายงานเรือ',
    colUserEmployee: 'ผู้ใช้ / รหัสพนักงาน',
    colRole: 'สิทธิ์ (Role)',
    colStatus: 'สถานะ',
    colAssignedJobs: 'เรือที่ได้รับมอบหมาย',
    colCreatedDate: 'วันที่สร้างบัญชี',
    colLastLogin: 'เข้าสู่ระบบล่าสุด',
    makeAdmin: 'แต่งตั้งเป็น ADMIN',
    demoteToSrm: 'ปรับเป็น SRM',
    activateUser: 'เปิดใช้งาน',
    deactivateUser: 'ระงับการใช้งาน',
    assignJobModalTitle: 'มอบหมายงานเรือให้กับ SRM',
    selectJobLabel: 'เลือกโครงการเรือในอู่',
    noneAssigned: 'ยังไม่ได้รับมอบหมาย',

    jobsAndAssignmentsTitle: 'โครงการเรือ & การมอบหมาย SRM',
    jobsAndAssignmentsDesc: 'สร้างโครงการซ่อมเรือและกำหนด SRM ประจำเรือ (เช่น Ing → 26-R-2928, 26-R-2931)',
    newJobBtn: 'เพิ่มโครงการเรือ',
    jobNo: 'เลขที่ Job No.',
    vesselName: 'ชื่อเรือ (Vessel)',
    customerName: 'ลูกค้า / เจ้าของเรือ',
    scopeProject: 'ขอบเขตงานซ่อม / รายละเอียด',
    assignedSrms: 'SRM ที่ดูแล',
    assignSrmPlaceholder: '+ มอบหมาย SRM เพิ่มเติม...',
    noSrmAssigned: 'ยังไม่มี SRM รับผิดชอบ โปรดมอบหมายด้านล่าง',

    srmWorkspaceTitle: 'พื้นที่ปฏิบัติงาน SRM (Personalized Workspace)',
    srmWorkspaceDesc: 'แสดงข้อมูลอะไหล่และการขนส่งเฉพาะโครงการเรือที่คุณได้รับมอบหมายเท่านั้น ไม่ปะปนกับผู้อื่น',
    myJobs: 'เรือที่ฉันดูแล',
    myShipments: 'พัสดุอะไหล่ของฉัน',
    arrivingToday: 'ถึงท่าเรือวันนี้',
    delayed: 'ล่าช้ากว่ากำหนด',
    received: 'รับเข้าอู่แล้ว',
    unreadAlerts: 'การแจ้งเตือนใหม่',
    myAssignedJobsTitle: 'โครงการเรือที่ฉันได้รับมอบหมาย',
    noAssignedJobsYet: 'คุณยังไม่ได้รับมอบหมายโครงการเรือ กรุณาติดต่อ Admin เพื่อมอบหมายงาน',
    incomingSparePartsTitle: 'รายการอะไหล่เข้าสำหรับเรือที่ฉันดูแล',
    incomingSparePartsSub: 'แสดงเฉพาะพัสดุที่ผูกกับ Job งานซ่อมเรือที่คุณรับผิดชอบ',
    colJobVessel: 'Job / ลำเรือ',
    colAwbBl: 'เลข AWB / B/L',
    colSupplierOrigin: 'ผู้ผลิต / ต้นทาง',
    colMode: 'ประเภทขนส่ง',
    colEta: 'กำหนดถึง (ETA)',
    colDestination: 'ปลายทางจัดส่ง',
    markRead: 'อ่านแล้ว',
    newBadge: 'ใหม่',
    myNotificationsTitle: 'การแจ้งเตือนงานและการมาถึงของอะไหล่',
    noNotifications: 'ไม่มีรายการแจ้งเตือนใหม่',

    allConsignmentsTitle: 'รายการพัสดุอะไหล่และชิ้นส่วนเรือทั้งหมด',
    allConsignmentsSub: 'ติดตามการขนส่งทางอากาศ เรือ และขนส่งในประเทศสำหรับอู่เรือแหลมฉบัง',
    newShipmentBtn: 'ลงทะเบียนพัสดุใหม่',
    updateStatus: 'เปลี่ยนสถานะ',

    // Urgency & Actions (Thai)
    urgencyAll: 'ทั้งหมด',
    urgencyCritical: '🚨 CRITICAL (วิกฤต/ฉุกเฉิน)',
    urgencyUrgent: '⚡ ด่วน (URGENT)',
    urgencyNormal: '📦 ปกติ (NORMAL)',
    confirmReceivedBtn: 'ตรวจรับอะไหล่แล้ว',
    viewDetailsBtn: 'ดูรายละเอียด',
    changeStatusBtn: 'เปลี่ยนสถานะ',
    receivedSuccessMsg: 'ตรวจรับอะไหล่เข้าอู่เรือเรียบร้อยแล้ว',
    thJobVessel: 'JOB (เรือ / งาน)',
    thSrm: 'SRM ผู้ดูแล',
    thBookingNo: 'BOOKING NO.',
    thPoNo: 'P/O (PO NO. / OWNER SUPPLY)',
    thAwbBl: 'AWB / B/L',
    thFlightVessel: 'FLIGHT / VESSEL',
    thStatus: 'STATUS (สถานะ)',
    thActions: 'แจ้งเตือน SRM / ดำเนินการ',

    // Marine Spare Parts Tracker (Thai)
    navSparePartsTracker: 'คลังอะไหล่เรือ (Tracker)',
    addPartBtn: 'เพิ่มอะไหล่ใหม่',
    editPartBtn: 'แก้ไขข้อมูลอะไหล่',
    deletePartBtn: 'ลบอะไหล่',
    stockQuantity: 'จำนวนคงเหลือ',
    minStockLevel: 'สต็อกขั้นต่ำแจ้งเตือน',
    storageLocation: 'สถานที่จัดเก็บในอู่เรือ',
    partCategory: 'หมวดหมู่อะไหล่',
    partNo: 'รหัสอะไหล่ (Part No.)',
    partName: 'ชื่อชิ้นส่วนอะไหล่ (Part Name)',
    inStock: 'มีในคลัง',
    lowStock: 'ใกล้หมด (Low Stock)',
    outOfStock: 'หมดคลัง (Out of Stock)',
    stockInBtn: 'รับเข้า (+)',
    stockOutBtn: 'เบิกจ่าย (-)',
  },

  en: {
    appTitle: 'UNITHAI SHIPYARD',
    appSubtitle: 'SRM Spare Part Management & Vessel Logistics System',
    srmSystem: 'SRM SYSTEM',

    navDashboard: 'Dashboard',
    navMyDashboard: 'My Dashboard',
    navAdminDashboard: 'Admin Dashboard',
    navUserManagement: 'User Management',
    navJobAssignments: 'Job Assignments',
    navAllShipments: 'All Shipments',
    navMyShipments: 'My Shipments',
    navSignOut: 'Sign Out',
    switchRoleBtn: 'Switch to',

    searchPlaceholder: 'Search Job no, vessel, supplier, AWB/BL...',
    all: 'ALL',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    close: 'Close',
    loading: 'Loading data...',
    actions: 'Actions',
    status: 'Status',
    role: 'Role',
    edit: 'Edit',
    delete: 'Delete',
    remove: 'Remove',

    signInTitle: 'Sign In to SRM Portal',
    registerTitle: 'New SRM Registration',
    forgotTitle: 'Reset Password',
    signInSub: 'Internal vessel spare part logistics & shipyard repair tracking',
    registerSub: 'Create a permanent account stored in Supabase PostgreSQL',
    forgotSub: 'Enter your corporate email to receive recovery instructions',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. Ing (Preecha Kittisup)',
    employeeId: 'Employee ID',
    employeeIdSub: '(Shipyard Badge ID)',
    email: 'Corporate Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPasswordLink: 'Forgot password?',
    securityRuleSRM: 'Security Rule: All new accounts default to SRM role. Admin elevation requires authorization.',
    signInBtn: 'Sign In',
    registerBtn: 'Register Account in Supabase',
    sendResetBtn: 'Send Password Reset Link',
    noAccountYet: "Don't have an SRM account yet?",
    registerHere: 'Register here',
    alreadyHaveAccount: 'Already have an account?',
    signInInstead: 'Sign In instead',
    quickTestAccess: 'Instant Test Access (One-Click Role Switch)',
    adminSomchaiDesc: 'Full Access / All Users',
    srmIngDesc: 'Assigned Jobs View Only',

    adminConsoleTitle: 'Unithai Shipyard Spare Part Logistics Overview',
    adminConsoleDesc: 'Real-time monitoring of shipyard jobs, SRM personnel assignments, and incoming international air/sea freight at Laem Chabang Port.',
    manageUsersBtn: 'Manage Users',
    jobsAndSrmsBtn: 'Jobs & SRMs',
    statTotalUsers: 'Total Users',
    statTotalJobs: 'Shipyard Jobs',
    statTotalShipments: 'Total Shipments',
    statDelayedShipments: 'Delayed Shipments',
    recentRegistrations: 'Recent Registrations',
    recentJobs: 'Shipyard Jobs',
    recentShipments: 'Recent Shipments',
    viewAll: 'View All',

    userManagementTitle: 'User Management Console',
    userManagementDesc: 'Admin screen for managing registered shipyard personnel, SRM role authorizations, and job assignments',
    colUserEmployee: 'User / Employee',
    colRole: 'Role',
    colStatus: 'Status',
    colAssignedJobs: 'Assigned Jobs',
    colCreatedDate: 'Created Date',
    colLastLogin: 'Last Login',
    makeAdmin: 'Make ADMIN',
    demoteToSrm: 'Demote to SRM',
    activateUser: 'Activate User',
    deactivateUser: 'Deactivate User',
    assignJobModalTitle: 'Assign Job Project to SRM',
    selectJobLabel: 'Select Job Project',
    noneAssigned: 'None assigned',

    jobsAndAssignmentsTitle: 'Shipyard Jobs & SRM Assignments',
    jobsAndAssignmentsDesc: 'Create vessel repair projects and designate lead SRMs (e.g. Ing → 26-R-2928, 26-R-2931)',
    newJobBtn: 'New Job',
    jobNo: 'Job Number',
    vesselName: 'Vessel Name',
    customerName: 'Customer / Owner',
    scopeProject: 'Scope / Project Name',
    assignedSrms: 'Assigned SRMs',
    assignSrmPlaceholder: '+ Assign an SRM to this job...',
    noSrmAssigned: 'No SRM assigned yet. Assign an officer below.',

    srmWorkspaceTitle: 'SRM Logged-In Workspace',
    srmWorkspaceDesc: 'Displaying spare part shipments exclusively for your assigned shipyard repair projects without cross-project exposure.',
    myJobs: 'My Jobs',
    myShipments: 'My Shipments',
    arrivingToday: 'Arriving Today',
    delayed: 'Delayed',
    received: 'Received',
    unreadAlerts: 'Unread Alerts',
    myAssignedJobsTitle: 'My Assigned Shipyard Jobs',
    noAssignedJobsYet: 'You do not currently have any active jobs assigned to your SRM account. Please contact an Admin to assign repair projects.',
    incomingSparePartsTitle: 'Incoming Spare Parts for My Jobs',
    incomingSparePartsSub: 'Only showing shipments connected to your assigned shipyard jobs',
    colJobVessel: 'Job / Vessel',
    colAwbBl: 'AWB / B/L No.',
    colSupplierOrigin: 'Supplier / Origin',
    colMode: 'Mode',
    colEta: 'ETA',
    colDestination: 'Destination',
    markRead: 'Mark Read',
    newBadge: 'NEW',
    myNotificationsTitle: 'My Dispatch & Arrival Notifications',
    noNotifications: 'No notifications on file.',

    allConsignmentsTitle: 'All Shipyard Consignments & Shipments',
    allConsignmentsSub: 'Complete shipyard air freight, sea cargo, and local supplier deliveries',
    newShipmentBtn: 'New Shipment',
    updateStatus: 'Update Status',

    // Urgency & Actions (English)
    urgencyAll: 'All',
    urgencyCritical: '🚨 CRITICAL (Emergency)',
    urgencyUrgent: '⚡ URGENT (Express)',
    urgencyNormal: '📦 NORMAL (Routine)',
    confirmReceivedBtn: 'Confirm Received',
    viewDetailsBtn: 'View Details',
    changeStatusBtn: 'Change Status',
    receivedSuccessMsg: 'Spare parts received into shipyard successfully',
    thJobVessel: 'JOB (VESSEL / WORK)',
    thSrm: 'SRM IN-CHARGE',
    thBookingNo: 'BOOKING NO.',
    thPoNo: 'P/O (PO NO. / OWNER SUPPLY)',
    thAwbBl: 'AWB / B/L',
    thFlightVessel: 'FLIGHT / VESSEL',
    thStatus: 'STATUS',
    thActions: 'ACTIONS / STATUS',

    // Marine Spare Parts Tracker (English)
    navSparePartsTracker: 'Spare Parts Tracker',
    addPartBtn: 'Add Spare Part',
    editPartBtn: 'Edit Part',
    deletePartBtn: 'Delete Part',
    stockQuantity: 'Stock Remaining',
    minStockLevel: 'Min Reorder Level',
    storageLocation: 'Yard Storage Location',
    partCategory: 'Part Category',
    partNo: 'Part Number',
    partName: 'Part Description',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    stockInBtn: 'Stock In (+)',
    stockOutBtn: 'Stock Out (-)',
  },
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('srm_lang_pref');
      if (saved === 'th' || saved === 'en') return saved;
      return 'th'; // Default to Thai for Unithai Shipyard
    } catch {
      return 'th';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('srm_lang_pref', language);
    } catch {
      // ignore
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: appTranslations[language],
        toggleLanguage,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
