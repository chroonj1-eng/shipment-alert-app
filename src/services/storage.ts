import {
  SparePartItem,
  User,
  JobProject,
  NotificationLog,
  AlertRuleConfig,
  UserRole,
} from '../types';
import {
  INITIAL_SPARE_PARTS,
  INITIAL_USERS,
  INITIAL_JOB_PROJECTS,
  INITIAL_COMPANY_CONFIG,
} from '../data/mockData';

const STORAGE_KEYS = {
  PARTS: 'unithai_parts_items_v3',
  USERS: 'unithai_users_v3',
  JOBS: 'unithai_jobs_v3',
  LOGS: 'unithai_notification_logs_v3',
  CONFIG: 'unithai_company_config_v3',
  CURRENT_USER: 'unithai_current_user_v3',
  HAS_INITIALIZED: 'unithai_has_initialized_v3',
};

// Check if localStorage has data or if user prefers clean slate
export function initializeStorage(forceClean: boolean = false) {
  if (typeof window === 'undefined') return;

  const hasInit = localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED);
  if (!hasInit || forceClean) {
    // Default initial load is a clean, empty app as requested (0 parts, 0 logs)
    localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(INITIAL_JOB_PROJECTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_COMPANY_CONFIG));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0])); // Default logged in as admin
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, 'true');
  }
}

// ----------------- Spare Parts -----------------

export function getSpareParts(): SparePartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read parts from localStorage', err);
    return [];
  }
}

export function saveSpareParts(items: SparePartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(items));
}

export function addSparePart(part: Omit<SparePartItem, 'id' | 'notificationCount'>): SparePartItem {
  const parts = getSpareParts();
  const newPart: SparePartItem = {
    ...part,
    id: `PART-${Date.now().toString().slice(-5)}`,
    notificationCount: 0,
  };
  const updated = [newPart, ...parts];
  saveSpareParts(updated);
  return newPart;
}

export function updateSparePart(id: string, updates: Partial<SparePartItem>): SparePartItem | null {
  const parts = getSpareParts();
  const index = parts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const updatedItem = { ...parts[index], ...updates };
  parts[index] = updatedItem;
  saveSpareParts(parts);
  return updatedItem;
}

export function deleteSparePart(id: string): boolean {
  const parts = getSpareParts();
  const filtered = parts.filter((p) => p.id !== id);
  saveSpareParts(filtered);
  return true;
}

// ----------------- Users & Authentication -----------------

export function getUsers(): User[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function registerUser(newUser: {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
  assignedJobs?: string[];
}): { success: boolean; user?: User; error?: string } {
  const config = getCompanyConfig();
  const emailDomain = '@' + newUser.email.split('@')[1];

  // Validate company email domain
  if (!newUser.email.toLowerCase().endsWith(config.companyEmailDomain.toLowerCase())) {
    return {
      success: false,
      error: `กรุณาใช้อีเมลนามสกุลของบริษัท (${config.companyEmailDomain}) เท่านั้น`,
    };
  }

  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
    return {
      success: false,
      error: 'อีเมลนี้ได้ทำการลงทะเบียนในระบบแล้ว',
    };
  }

  const createdUser: User = {
    id: `USR-${Date.now().toString().slice(-6)}`,
    name: newUser.name,
    email: newUser.email.toLowerCase(),
    role: newUser.role,
    assignedJobs: newUser.assignedJobs || [],
    department: newUser.department || 'Ship Maintenance & Engineering',
    phone: newUser.phone,
    verified: true, // OTP verified in the UI step
    approved: newUser.role === 'admin' ? true : true, // Auto-activate or admin approval
    createdAt: new Date().toISOString().split('T')[0],
  };

  users.push(createdUser);
  saveUsers(users);
  setCurrentUser(createdUser);
  return { success: true, user: createdUser };
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);

  // If updating current user, refresh in storage
  const current = getCurrentUser();
  if (current && current.id === id) {
    setCurrentUser(users[idx]);
  }
  return users[idx];
}

export function getCurrentUser(): User {
  if (typeof window === 'undefined') return INITIAL_USERS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  } catch {
    return INITIAL_USERS[0];
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

// ----------------- Jobs / Vessels -----------------

export function getJobs(): JobProject[] {
  if (typeof window === 'undefined') return INITIAL_JOB_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOBS);
    return raw ? JSON.parse(raw) : INITIAL_JOB_PROJECTS;
  } catch {
    return INITIAL_JOB_PROJECTS;
  }
}

export function saveJobs(jobs: JobProject[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

export function addJob(job: JobProject): void {
  const jobs = getJobs();
  const exists = jobs.find((j) => j.jobNo === job.jobNo);
  if (!exists) {
    jobs.push(job);
    saveJobs(jobs);
  }
}

// ----------------- Notifications & Logs -----------------

export function getNotificationLogs(): NotificationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logNotification(log: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>): NotificationLog {
  const logs = getNotificationLogs();
  const newLog: NotificationLog = {
    ...log,
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: 'delivered',
  };
  const updatedLogs = [newLog, ...logs];
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));

  // Also update part's notification count and lastNotifiedDate
  const part = getSpareParts().find((p) => p.id === log.partId);
  if (part) {
    updateSparePart(part.id, {
      notificationCount: (part.notificationCount || 0) + 1,
      lastNotifiedDate: newLog.timestamp,
    });
  }

  return newLog;
}

// ----------------- Company Configuration -----------------

export function getCompanyConfig(): AlertRuleConfig {
  if (typeof window === 'undefined') return INITIAL_COMPANY_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? JSON.parse(raw) : INITIAL_COMPANY_CONFIG;
  } catch {
    return INITIAL_COMPANY_CONFIG;
  }
}

export function saveCompanyConfig(config: AlertRuleConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

// ----------------- Database Reset & Demo Loading -----------------

export function resetToEmptyDatabase(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
}

export function loadSampleDataset(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(INITIAL_SPARE_PARTS));
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(INITIAL_JOB_PROJECTS));
}
