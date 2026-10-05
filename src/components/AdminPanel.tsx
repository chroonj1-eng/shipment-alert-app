import React, { useState } from 'react';
import { User, JobProject, AlertRuleConfig, UserRole } from '../types';
import { Language, translations } from '../i18n/translations';
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';
import {
  X,
  Users,
  BellRing,
  Database,
  Shield,
  Plus,
  CheckCircle,
  Save,
  RotateCcw,
  Mail,
  Smartphone,
  Anchor,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlertRuleConfig;
  onSaveConfig: (cfg: AlertRuleConfig) => void;
  users: User[];
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  jobs: JobProject[];
  onAddJob: (job: JobProject) => void;
  onResetEmptyDatabase: () => void;
  onLoadSampleDatabase: () => void;
  lang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  users,
  onUpdateUser,
  jobs,
  onAddJob,
  onResetEmptyDatabase,
  onLoadSampleDatabase,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'alerts' | 'users' | 'jobs' | 'database'>('alerts');

  // Alert Settings state
  const [deliveryWarningDays, setDeliveryWarningDays] = useState(config.deliveryWarningDays);
  const [etaPendingDoDays, setEtaPendingDoDays] = useState(config.etaPendingDoDays);
  const [enableAutoEmail, setEnableAutoEmail] = useState(config.enableAutoEmail);
  const [enableAutoLine, setEnableAutoLine] = useState(config.enableAutoLine);
  const [enableInAppBadge, setEnableInAppBadge] = useState(config.enableInAppBadge);
  const [companyEmailDomain, setCompanyEmailDomain] = useState(config.companyEmailDomain);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Job state
  const [newJobNo, setNewJobNo] = useState('');
  const [newVesselName, setNewVesselName] = useState('');
  const [newRepairProject, setNewRepairProject] = useState('');
  const [newSrm, setNewSrm] = useState('');
  const [newCoSrm, setNewCoSrm] = useState('');
  const [newIncharge, setNewIncharge] = useState('');
  const [jobCreatedSuccess, setJobCreatedSuccess] = useState(false);

  // User editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedJobNumbers, setSelectedJobNumbers] = useState<string[]>([]);

  const handleSaveAlertConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      deliveryWarningDays,
      etaPendingDoDays,
      enableAutoEmail,
      enableAutoLine,
      enableInAppBadge,
      companyEmailDomain,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobNo || !newVesselName || !newSrm) {
      alert(lang === 'th' ? 'กรุณากรอก Job No., ชื่อเรือ และ SRM' : 'Please enter Job No., Vessel Name, and SRM');
      return;
    }

    onAddJob({
      jobNo: newJobNo.toUpperCase(),
      vesselName: newVesselName.toUpperCase(),
      repairProject: newRepairProject || 'Routine Drydocking & Repair',
      srm: newSrm,
      coSrm: newCoSrm,
      incharge: newIncharge,
      status: 'Active',
    });

    setJobCreatedSuccess(true);
    setNewJobNo('');
    setNewVesselName('');
    setNewRepairProject('');
    setNewSrm('');
    setNewCoSrm('');
    setNewIncharge('');
    setTimeout(() => setJobCreatedSuccess(false), 2000);
  };

  const startEditUserJobs = (u: User) => {
    setEditingUserId(u.id);
    setSelectedJobNumbers(u.assignedJobs || []);
  };

  const toggleJobAssignment = (jobNo: string) => {
    if (selectedJobNumbers.includes(jobNo)) {
      setSelectedJobNumbers(selectedJobNumbers.filter((j) => j !== jobNo));
    } else {
      setSelectedJobNumbers([...selectedJobNumbers, jobNo]);
    }
  };

  const saveUserJobs = (userId: string) => {
    onUpdateUser(userId, { assignedJobs: selectedJobNumbers });
    setEditingUserId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-indigo-400/50 bg-white p-0.5 shrink-0 shadow-sm">
              <img
                src={unithaiLogo}
                alt="Unithai Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.adminModalTitle}</h3>
              <p className="text-xs text-slate-400">{t.adminModalSub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs px-6 pt-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'alerts'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{t.tabAdminAlerts}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabAdminUsers} ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-2 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'jobs'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>{t.tabAdminJobs} ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-2 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'database'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{t.tabAdminDatabase}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* TAB 1: Alert Rules Engine */}
          {activeTab === 'alerts' && (
            <form onSubmit={handleSaveAlertConfig} className="space-y-5">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'th' ? 'บันทึกการตั้งค่าระบบแจ้งเตือนอัตโนมัติสำเร็จแล้ว!' : 'Alert trigger rules saved successfully!'}
                  </span>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h4 className="text-xs font-bold text-slate-900">
                  {lang === 'th' ? 'เกณฑ์การแจ้งเตือนความเร่งด่วน (Urgency Threshold Rules)' : 'Urgency Threshold Trigger Rules'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {lang === 'th' ? 'แจ้งเตือน DELIVERY DATE ⚠️ ล่วงหน้า (วัน):' : 'DELIVERY DATE ⚠️ Advance Alert (Days):'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={deliveryWarningDays}
                        onChange={(e) => setDeliveryWarningDays(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-xs font-bold"
                      />
                      <span className="text-slate-500">
                        {lang === 'th' ? 'วันก่อนถึงกำหนดส่งมอบเข้าเรือ' : 'days before shipyard delivery deadline'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {lang === 'th'
                        ? '* ระบบจะแสดงสัญลักษณ์ ⚠️ และส่งเตือน SRM ประจำเรือโดยอัตโนมัติ'
                        : '* System triggers ⚠️ badge and automated SRM dispatch'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {lang === 'th' ? 'แจ้งเตือนเมื่อ ETA ถึงแล้วแต่ยังไม่ได้รับ D/O (วัน):' : 'ETA Cleared without D/O Alert (Days):'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={etaPendingDoDays}
                        onChange={(e) => setEtaPendingDoDays(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-xs font-bold"
                      />
                      <span className="text-slate-500">
                        {lang === 'th' ? 'วันหลังเรือ/เครื่องบินลงจอด' : 'days after carrier arrival'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-slate-900">
                  {lang === 'th' ? 'ช่องทางการส่งสัญญาณอัตโนมัติ (Automated Notification Channels)' : 'Automated Dispatch Channels'}
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAutoEmail}
                      onChange={(e) => setEnableAutoEmail(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-800">
                      {lang === 'th'
                        ? 'ส่งอีเมลอัตโนมัติเข้า Corporate Mail ของ SRM และ Incharge ประจำโปรเจค'
                        : 'Send automated email dispatch to project SRM & Incharge'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAutoLine}
                      onChange={(e) => setEnableAutoLine(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-800">
                      {lang === 'th'
                        ? 'ส่งแจ้งเตือนผ่าน LINE Official / Webhook กลุ่มงานช่างเรือ'
                        : 'Send alerts via LINE Official / Webhook broadcast'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableInAppBadge}
                      onChange={(e) => setEnableInAppBadge(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <BellRing className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-800">
                      {lang === 'th'
                        ? 'แสดงตัวเลขแจ้งเตือนด่วน (Badge Counter) บนแถบเมนูของผู้ใช้'
                        : 'Display urgent alert counter badge on user navigation'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-slate-900">
                  {lang === 'th' ? 'ข้อกำหนดโดเมนอีเมลบริษัท (Company Domain Policy)' : 'Company Email Domain Policy'}
                </h4>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={companyEmailDomain}
                    onChange={(e) => setCompanyEmailDomain(e.target.value)}
                    placeholder="@shipyard.co.th"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs font-semibold text-cyan-900"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  {lang === 'th'
                    ? 'ระบบจะอนุญาตให้ลงทะเบียนเฉพาะอีเมลที่มีนามสกุลนี้เท่านั้น เพื่อความปลอดภัยสูงสุด'
                    : 'System strictly allows employee registration only with this domain.'}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.btnSaveAdminSettings}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Users & Job Assignments */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-blue-900 text-xs">
                💡 {lang === 'th'
                  ? 'ระบบสิทธิ์แยกโปรเจค: SRM, Co-SRM และ In-charge จะมองเห็นเฉพาะ Job No. ที่ท่านกำหนดไว้ด้านล่างนี้เท่านั้น โดยไม่ปะปนกับงานของ SRM, Co-SRM หรือ In-charge ท่านอื่น'
                  : 'Project Isolation: SRM, Co-SRM, and In-charge will strictly view only the Job Numbers assigned below.'}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">{lang === 'th' ? 'ชื่อ - แผนก' : 'Name & Dept'}</th>
                      <th className="py-2.5 px-3">{lang === 'th' ? 'อีเมลบริษัท' : 'Email'}</th>
                      <th className="py-2.5 px-3">{lang === 'th' ? 'ตำแหน่ง (Role)' : 'Role'}</th>
                      <th className="py-2.5 px-3">{lang === 'th' ? 'งานเรือที่มอบหมาย (Assigned Jobs)' : 'Assigned Jobs'}</th>
                      <th className="py-2.5 px-3 text-center">{lang === 'th' ? 'สถานะ' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {users.map((u) => {
                      const isEditing = editingUserId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{u.department}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                            {u.email}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={u.role}
                              onChange={(e) => onUpdateUser(u.id, { role: e.target.value as UserRole })}
                              className="px-2 py-1 border border-slate-300 rounded font-semibold text-[11px]"
                            >
                              <option value="admin">Admin</option>
                              <option value="srm">SRM</option>
                              <option value="co_srm">Co-SRM</option>
                              <option value="incharge">In-charge</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            {isEditing ? (
                              <div className="space-y-2 p-2 bg-slate-50 border border-slate-300 rounded">
                                <span className="font-semibold text-slate-800 block text-[11px]">
                                  {lang === 'th' ? 'เลือกโปรเจคเรือที่มอบหมาย:' : 'Select Assigned Jobs:'}
                                </span>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {jobs.map((j) => (
                                    <label key={j.jobNo} className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedJobNumbers.includes(j.jobNo)}
                                        onChange={() => toggleJobAssignment(j.jobNo)}
                                        className="rounded text-cyan-600"
                                      />
                                      <span className="font-mono font-semibold">{j.jobNo}</span>
                                      <span className="text-slate-500 truncate">({j.vesselName})</span>
                                    </label>
                                  ))}
                                </div>
                                <div className="flex gap-1.5 pt-1">
                                  <button
                                    onClick={() => saveUserJobs(u.id)}
                                    className="px-2 py-0.5 bg-cyan-700 text-white rounded text-[11px] font-semibold"
                                  >
                                    {lang === 'th' ? 'บันทึก' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px]"
                                  >
                                    {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                {u.assignedJobs && u.assignedJobs.length > 0 ? (
                                  u.assignedJobs.map((j) => (
                                    <span
                                      key={j}
                                      className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-900 border border-cyan-200"
                                    >
                                      {j}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">
                                    {lang === 'th' ? 'ยังไม่มอบหมาย Job' : 'No jobs assigned'}
                                  </span>
                                )}
                                <button
                                  onClick={() => startEditUserJobs(u)}
                                  className="text-cyan-700 hover:text-cyan-900 text-[10px] font-semibold underline ml-1"
                                >
                                  {lang === 'th' ? 'แก้ไขงานที่ดูแล' : 'Edit Assignments'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Vessel Projects */}
          {activeTab === 'jobs' && (
            <div className="space-y-5">
              {jobCreatedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'th' ? 'เพิ่มโปรเจคเรือใหม่เข้าสู่ฐานข้อมูลสำเร็จ!' : 'New vessel project created successfully!'}
                  </span>
                </div>
              )}

              {/* Add New Job Form */}
              <form onSubmit={handleCreateJob} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-cyan-700" />
                  <span>{lang === 'th' ? 'เพิ่มโปรเจคเรือใหม่ (New Vessel Project)' : 'Add New Vessel Project'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      JOB NO. *
                    </label>
                    <input
                      type="text"
                      value={newJobNo}
                      onChange={(e) => setNewJobNo(e.target.value)}
                      placeholder="e.g. JOB-2026-095"
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {lang === 'th' ? 'ชื่อเรือ (VESSEL NAME) *' : 'VESSEL NAME *'}
                    </label>
                    <input
                      type="text"
                      value={newVesselName}
                      onChange={(e) => setNewVesselName(e.target.value)}
                      placeholder="e.g. MV CHAO PHRAYA"
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {lang === 'th' ? 'SRM ผู้รับผิดชอบ *' : 'DESIGNATED SRM *'}
                    </label>
                    <input
                      type="text"
                      value={newSrm}
                      onChange={(e) => setNewSrm(e.target.value)}
                      placeholder="SRM Name"
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 font-semibold mb-1">
                      {lang === 'th' ? 'ชื่องานซ่อมบำรุง' : 'Maintenance Description'}
                    </label>
                    <input
                      type="text"
                      value={newRepairProject}
                      onChange={(e) => setNewRepairProject(e.target.value)}
                      placeholder="e.g. Drydocking Special Survey & Stern Tube Seal"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded transition-colors shadow-xs"
                  >
                    + {lang === 'th' ? 'บันทึกโปรเจคเรือ' : 'Save Project'}
                  </button>
                </div>
              </form>

              {/* List of Existing Jobs */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2 px-3">JOB NO.</th>
                      <th className="py-2 px-3">{lang === 'th' ? 'ชื่อเรือ' : 'Vessel Name'}</th>
                      <th className="py-2 px-3">{lang === 'th' ? 'ชื่องานซ่อมบำรุง' : 'Maintenance Project'}</th>
                      <th className="py-2 px-3">SRM</th>
                      <th className="py-2 px-3">Co-SRM</th>
                      <th className="py-2 px-3">Incharge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {jobs.map((j) => (
                      <tr key={j.jobNo} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-900">{j.jobNo}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <span role="img" aria-label="ship">🚢</span>
                          <span>{j.vesselName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{j.repairProject}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{j.srm}</td>
                        <td className="py-2.5 px-3 text-slate-600">{j.coSrm || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{j.incharge || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Database Management & Backup */}
          {activeTab === 'database' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  {lang === 'th'
                    ? 'การจัดการข้อมูลระบบ (System Data Management)'
                    : 'System Data Management & Operations'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {lang === 'th'
                    ? 'ระบบถูกออกแบบให้ทำงานแบบ Standalone พร้อมโครงสร้างข้อมูลมาตรฐานสำหรับงานซ่อมบำรุงเรือ คุณสามารถจัดการล้างข้อมูลทั้งหมดเพื่อเริ่มใช้งานจริง (Clean Slate) หรือโหลดชุดข้อมูลจำลองเพื่อสาธิตการทำงานของระบบ'
                    : 'Standalone enterprise architecture with standard marine vessel data structures. You can clear all data to start with a clean production slate, or reload sample data for demonstration.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <span>{t.btnEmptySlate}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">
                        {lang === 'th'
                          ? 'ลบรายการอะไหล่และโปรเจคทั้งหมด เพื่อให้เริ่มกรอกข้อมูลจริงขององค์กรตั้งแต่ชิ้นส่วนแรก'
                          : 'Clear all parts to start fresh with real company records.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(lang === 'th' ? 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดให้เป็นฐานข้อมูลว่างเปล่า?' : 'Reset to completely empty database?')) {
                          onResetEmptyDatabase();
                          onClose();
                        }
                      }}
                      className="w-full py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                    >
                      {t.btnEmptySlate}
                    </button>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                        <Database className="w-4 h-4 text-cyan-600" />
                        <span>{t.btnLoadSample}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">
                        {lang === 'th'
                          ? 'โหลดชิ้นส่วนจำลองเครื่องจักรเรือ (MAN B&W, Yanmar, Jotun) เพื่อสาธิตการทำงานและทดสอบระบบการจัดเรียง'
                          : 'Load realistic marine spare parts (MAN B&W, Yanmar, SKF, Jotun) for demonstration.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadSampleDatabase();
                        onClose();
                      }}
                      className="w-full py-2 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded transition-colors"
                    >
                      {t.btnLoadSample}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
          >
            {lang === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
