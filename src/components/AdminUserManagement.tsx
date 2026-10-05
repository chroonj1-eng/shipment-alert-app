import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Job, JobAssignment, RoleType } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Plus,
  Briefcase,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesRes, jobsRes, assignmentsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').order('job_no', { ascending: true }),
        supabase.from('job_assignments').select('*'),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (jobsRes.data) setJobs(jobsRes.data);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    } catch (err) {
      console.error('Error loading user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getUserJobs = (userId: string): Job[] => {
    const userJobIds = assignments.filter((a) => a.user_id === userId).map((a) => a.job_id);
    return jobs.filter((j) => userJobIds.includes(j.id));
  };

  const handleSelectRole = async (userId: string, newRole: RoleType) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    await loadData();
  };

  const handleChangeRole = async (userId: string, currentRole: RoleType) => {
    const roles: RoleType[] = ['ADMIN', 'SRM', 'CO_SRM', 'IN_CHARGE'];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);
    await loadData();
  };

  const handleToggleStatus = async (userId: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    await loadData();
  };

  const handleOpenAssignModal = (userId: string) => {
    setAssigningUserId(userId);
    setSelectedJobId('');
    setIsAssignModalOpen(true);
  };

  const handleAssignJob = async () => {
    if (!assigningUserId || !selectedJobId) return;

    const exists = assignments.some(
      (a) => a.user_id === assigningUserId && a.job_id === selectedJobId
    );
    if (exists) {
      alert(language === 'th' ? 'โครงการเรือนี้ได้รับการมอบหมายให้ผู้ใช้นี้อยู่แล้ว' : 'This job is already assigned to this user.');
      return;
    }

    await supabase.from('job_assignments').insert({
      user_id: assigningUserId,
      job_id: selectedJobId,
      assigned_at: new Date().toISOString(),
    });

    setIsAssignModalOpen(false);
    await loadData();
  };

  const handleRemoveAssignment = async (userId: string, jobId: string) => {
    const confirmMsg = language === 'th' ? 'ต้องการลบการมอบหมายงานเรือนี้หรือไม่?' : 'Remove this job assignment?';
    if (!window.confirm(confirmMsg)) return;

    await supabase
      .from('job_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);

    await loadData();
  };

  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.employee_id && p.employee_id.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-500" />
            {t.userManagementTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.userManagementDesc}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white focus:border-cyan-500'
                : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 shadow-xs'
            }`}
          />
        </div>
      </div>

      {/* Main Table */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all shadow-md ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[11px] uppercase tracking-wider font-mono ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <tr>
                <th className="py-3 px-4 font-semibold">{t.colUserEmployee}</th>
                <th className="py-3 px-4 font-semibold">{t.colRole}</th>
                <th className="py-3 px-4 font-semibold">{t.colStatus}</th>
                <th className="py-3 px-4 font-semibold">{t.colAssignedJobs}</th>
                <th className="py-3 px-4 font-semibold">{t.colCreatedDate}</th>
                <th className="py-3 px-4 font-semibold">{t.colLastLogin}</th>
                <th className="py-3 px-4 font-semibold text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="inline-block w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>{t.loading}</p>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {language === 'th' ? `ไม่พบผู้ใช้ที่ตรงกับ "${searchQuery}"` : `No users found matching "${searchQuery}".`}
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((user) => {
                  const userJobs = getUserJobs(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                            {user.full_name}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                            {user.employee_id}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{user.email || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleSelectRole(user.id, e.target.value as RoleType)}
                          className={`text-[10px] font-mono font-bold uppercase rounded-lg px-2 py-1 border cursor-pointer focus:outline-hidden transition-all ${
                            user.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                              : user.role === 'CO_SRM'
                              ? 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30'
                              : user.role === 'IN_CHARGE'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                              : user.role === 'ENGINEER'
                              ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                              : user.role === 'USER'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                              : 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
                          }`}
                        >
                          <option value="ADMIN">👑 ADMIN</option>
                          <option value="SRM">⚓ SRM</option>
                          <option value="CO_SRM">🤝 CO SRM</option>
                          <option value="IN_CHARGE">📋 IN CHARGE</option>
                          <option value="ENGINEER">🔧 ENGINEER</option>
                          <option value="USER">👤 USER</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'ACTIVE' ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-red-600 dark:bg-red-400'
                            }`}
                          ></span>
                          {user.status}
                        </span>
                      </td>

                      {/* Assigned Jobs */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs items-center">
                          {userJobs.length > 0 ? (
                            userJobs.map((j) => (
                              <span
                                key={j.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                                    : 'bg-slate-100 border-slate-300 text-slate-900'
                                }`}
                              >
                                <span>{j.job_no}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssignment(user.id, j.id)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer ml-0.5"
                                  title={`${t.remove} ${j.job_no}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">{t.noneAssigned}</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(user.id)}
                            className="p-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] cursor-pointer"
                            title={t.assignJobModalTitle}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium">
                        {user.last_login ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              ({new Date(user.last_login).toLocaleDateString()})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">{language === 'th' ? 'ยังไม่เคยเข้าสู่ระบบ' : 'Never'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className={`p-1.5 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                              user.status === 'ACTIVE'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={user.status === 'ACTIVE' ? t.deactivateUser : t.activateUser}
                          >
                            {user.status === 'ACTIVE' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Change Role */}
                          <button
                            type="button"
                            onClick={() => handleChangeRole(user.id, user.role)}
                            className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold cursor-pointer"
                            title={user.role === 'ADMIN' ? t.demoteToSrm : t.makeAdmin}
                          >
                            {user.role === 'ADMIN' ? t.demoteToSrm : t.makeAdmin}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Job Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                {t.assignJobModalTitle}
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.selectJobLabel}</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">{language === 'th' ? '-- เลือกโครงการเรือ --' : '-- Choose a Job --'}</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_no} - {j.vessel} ({j.job_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px]">
                {language === 'th'
                  ? 'หมายเหตุ: เมื่อมอบหมายแล้ว SRM ท่านนี้จะมองเห็นโครงการและพัสดุอะไหล่เข้าของเรือลำนี้บนหน้าจอทันที'
                  : 'Note: Once assigned, this SRM will immediately see this job and its incoming spare part shipments on their personalized SRM Dashboard.'}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={!selectedJobId}
                onClick={handleAssignJob}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs cursor-pointer shadow-md"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
