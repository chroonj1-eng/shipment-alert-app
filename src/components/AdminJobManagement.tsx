import React, { useState, useEffect } from 'react';
import { supabase, getLocalDb, saveLocalDb, INITIAL_DB } from '../lib/supabase';
import { Job, Profile, JobAssignment, JobStatus } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Briefcase,
  Plus,
  Ship,
  UserCheck,
  UserMinus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Search,
  Filter,
  Calendar,
  Anchor,
  Users2,
  ClipboardList,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminCreateJob, adminUpdateJob, adminDeleteJob } from '../services/rbacService';

export const AdminJobManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const { currentUser, isAdmin } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Job Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [jobNo, setJobNo] = useState('');
  const [vessel, setVessel] = useState('');
  const [eta, setEta] = useState('');
  const [etd, setEtd] = useState('');
  const [initialSrmId, setInitialSrmId] = useState('');
  const [initialCoSrmId, setInitialCoSrmId] = useState('');
  const [initialInChargeId, setInitialInChargeId] = useState('');

  // Edit Job Modal State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobNo, setEditJobNo] = useState('');
  const [editVessel, setEditVessel] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editStatus, setEditStatus] = useState<JobStatus>('ACTIVE');
  const [editEta, setEditEta] = useState('');
  const [editEtd, setEditEtd] = useState('');
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  // Delete Job State
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('jobs').select('*').order('job_no', { ascending: true }),
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('job_assignments').select('*'),
      ]);

      const localDb = getLocalDb();

      // Profiles: Prefer remote, fallback to local registered database
      if (profilesRes.data && profilesRes.data.length > 0) {
        setProfiles(profilesRes.data);
      } else {
        setProfiles(localDb.profiles || INITIAL_DB.profiles);
      }

      // Jobs: Prefer remote, fallback to local store
      if (jobsRes.data && jobsRes.data.length > 0) {
        setJobs(jobsRes.data);
      } else {
        setJobs(localDb.jobs || INITIAL_DB.jobs);
      }

      // Assignments: Prefer remote, fallback to local store
      if (assignmentsRes.data && assignmentsRes.data.length > 0) {
        setAssignments(assignmentsRes.data);
      } else {
        setAssignments(localDb.job_assignments || INITIAL_DB.job_assignments || []);
      }
    } catch (err) {
      console.error('Error loading job management data:', err);
      const localDb = getLocalDb();
      setProfiles(localDb.profiles || INITIAL_DB.profiles);
      setJobs(localDb.jobs || INITIAL_DB.jobs);
      setAssignments(localDb.job_assignments || INITIAL_DB.job_assignments || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to custom cross-component data change event
    const handleDataChanged = () => {
      loadData();
    };
    window.addEventListener('supabase-data-changed', handleDataChanged);

    // Supabase Realtime channel for live job updates
    const channel = supabase
      .channel('jobs-management-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, () => loadData())
      .subscribe();

    return () => {
      window.removeEventListener('supabase-data-changed', handleDataChanged);
      supabase.removeChannel(channel);
    };
  }, []);

  const getJobSrms = (jobId: string): Profile[] => {
    const userIds = assignments.filter((a) => a.job_id === jobId).map((a) => a.user_id);
    return profiles.filter((p) => userIds.includes(p.id));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobNo.trim() || !vessel.trim()) return;

    const resolvedSrm = profiles.find((p) => p.id === initialSrmId);
    const resolvedCoSrm = profiles.find((p) => p.id === initialCoSrmId);
    const resolvedInCharge = profiles.find((p) => p.id === initialInChargeId);

    const newJob: Partial<Job> = {
      job_no: jobNo.trim().toUpperCase(),
      job_name: `${vessel.trim()} Job`,
      vessel: vessel.trim().toUpperCase(),
      customer: '-',
      status: 'ACTIVE',
      eta: eta || undefined,
      etd: etd || undefined,
      srm_id: initialSrmId || undefined,
      srm_name: resolvedSrm?.full_name || undefined,
      co_srm_id: initialCoSrmId || undefined,
      co_srm_name: resolvedCoSrm?.full_name || undefined,
      in_charge_id: initialInChargeId || undefined,
      in_charge_name: resolvedInCharge?.full_name || undefined,
    };

    let createdJobId = `job-${Date.now()}`;

    try {
      const { data, error } = await supabase.from('jobs').insert(newJob).select();
      if (data && (data as any[]).length > 0) {
        createdJobId = (data as any[])[0].id;
      }
    } catch (insertErr) {
      console.warn('Notice: Remote insert failed, persisting to database fallback:', insertErr);
    }

    // Always update local database records for instant re-rendering & offline sync
    const localDb = getLocalDb();
    const createdJobFull: Job = {
      id: createdJobId,
      job_no: newJob.job_no!,
      job_name: newJob.job_name!,
      vessel: newJob.vessel!,
      customer: newJob.customer!,
      status: 'ACTIVE',
      eta: newJob.eta,
      etd: newJob.etd,
      srm_id: newJob.srm_id,
      srm_name: newJob.srm_name,
      co_srm_id: newJob.co_srm_id,
      co_srm_name: newJob.co_srm_name,
      in_charge_id: newJob.in_charge_id,
      in_charge_name: newJob.in_charge_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!localDb.jobs) localDb.jobs = [];
    localDb.jobs.unshift(createdJobFull);

    // Save job assignments for any assigned officers (SRM, CO SRM, IN CHARGE)
    if (!localDb.job_assignments) localDb.job_assignments = [];
    const officersToAssign = [initialSrmId, initialCoSrmId, initialInChargeId].filter(Boolean);

    for (const offId of officersToAssign) {
      try {
        await supabase.from('job_assignments').insert({
          user_id: offId,
          job_id: createdJobId,
          assigned_at: new Date().toISOString(),
        });
      } catch {
        // Continue
      }

      localDb.job_assignments.push({
        id: `assign-${Date.now()}-${offId}`,
        user_id: offId,
        job_id: createdJobId,
        assigned_at: new Date().toISOString(),
      });
    }

    saveLocalDb(localDb);

    setIsCreateModalOpen(false);
    setJobNo('');
    setVessel('');
    setEta('');
    setEtd('');
    setInitialSrmId('');
    setInitialCoSrmId('');
    setInitialInChargeId('');
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleOpenEditJob = (job: Job) => {
    setEditingJob(job);
    setEditJobNo(job.job_no);
    setEditVessel(job.vessel);
    setEditCustomer(job.customer || '-');
    setEditStatus(job.status);
    setEditEta(job.eta || '');
    setEditEtd(job.etd || '');
  };

  const handleUpdateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !isAdmin) return;
    setIsEditingSubmitting(true);

    const updates: Partial<Job> = {
      job_no: editJobNo.trim().toUpperCase(),
      job_name: `${editVessel.trim()} Job`,
      vessel: editVessel.trim().toUpperCase(),
      customer: editCustomer.trim() || '-',
      status: editStatus,
      eta: editEta || undefined,
      etd: editEtd || undefined,
    };

    const res = await adminUpdateJob(editingJob.id, updates, currentUser);
    if (!res.success) {
      alert('Update job failed: ' + res.error);
      setIsEditingSubmitting(false);
      return;
    }

    // Update local database
    const localDb = getLocalDb();
    if (localDb.jobs) {
      const idx = localDb.jobs.findIndex((j: any) => j.id === editingJob.id);
      if (idx !== -1) {
        localDb.jobs[idx] = { ...localDb.jobs[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalDb(localDb);
      }
    }

    setEditingJob(null);
    setIsEditingSubmitting(false);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleConfirmDeleteJob = async () => {
    if (!deletingJob || !isAdmin) return;
    setIsDeleting(true);

    const res = await adminDeleteJob(deletingJob.id, currentUser);
    if (!res.success) {
      alert('Delete job failed: ' + res.error);
      setIsDeleting(false);
      return;
    }

    // Update local database
    const localDb = getLocalDb();
    if (localDb.jobs) {
      localDb.jobs = localDb.jobs.filter((j: any) => j.id !== deletingJob.id);
    }
    if (localDb.job_assignments) {
      localDb.job_assignments = localDb.job_assignments.filter((a: any) => a.job_id !== deletingJob.id);
    }
    saveLocalDb(localDb);

    setDeletingJob(null);
    setIsDeleting(false);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleAddSrmToJob = async (jobId: string, userId: string) => {
    if (!userId) return;
    const exists = assignments.some((a) => a.job_id === jobId && a.user_id === userId);
    if (exists) return;

    try {
      await supabase.from('job_assignments').insert({
        job_id: jobId,
        user_id: userId,
        assigned_at: new Date().toISOString(),
      });
    } catch {
      // Local fallback
    }

    const localDb = getLocalDb();
    if (!localDb.job_assignments) localDb.job_assignments = [];
    localDb.job_assignments.push({
      id: `assign-${Date.now()}-${userId}`,
      job_id: jobId,
      user_id: userId,
      assigned_at: new Date().toISOString(),
    });
    saveLocalDb(localDb);

    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleRemoveSrmFromJob = async (jobId: string, userId: string) => {
    const confirmMsg =
      language === 'th'
        ? 'ต้องการนำผู้รับผิดชอบท่านนี้ออกจากการดูแลเรือลำนี้หรือไม่?'
        : 'Remove this officer from this job assignment?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await supabase.from('job_assignments').delete().eq('job_id', jobId).eq('user_id', userId);
    } catch {
      // Local fallback
    }

    const localDb = getLocalDb();
    if (localDb.job_assignments) {
      localDb.job_assignments = localDb.job_assignments.filter(
        (a: any) => !(a.job_id === jobId && a.user_id === userId)
      );
      saveLocalDb(localDb);
    }

    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      j.job_no.toLowerCase().includes(q) ||
      j.vessel.toLowerCase().includes(q) ||
      j.customer.toLowerCase().includes(q) ||
      j.job_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Ship className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>{t.jobsAndAssignmentsTitle}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t.jobsAndAssignmentsDesc}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
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

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newJobBtn}</span>
          </button>
        </div>
      </div>

      {/* Grid of Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>{t.loading}</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            {language === 'th' ? 'ไม่พบ Job เรือที่ตรงกับคำค้นหา' : 'No jobs found matching your search.'}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const assignedSrms = getJobSrms(job.id);
            const unassignedSrms = profiles.filter(
              (p) => p.status === 'ACTIVE' && !assignedSrms.some((a) => a.id === p.id)
            );

            // Resolve SRM, CO SRM, IN CHARGE names
            const leadSrmName =
              job.srm_name ||
              profiles.find((p) => p.id === job.srm_id)?.full_name ||
              assignedSrms.find((p) => p.role === 'SRM')?.full_name;

            const coSrmName =
              job.co_srm_name ||
              profiles.find((p) => p.id === job.co_srm_id)?.full_name ||
              assignedSrms.find((p) => p.role === 'CO_SRM')?.full_name;

            const inChargeName =
              job.in_charge_name ||
              profiles.find((p) => p.id === job.in_charge_id)?.full_name ||
              assignedSrms.find((p) => p.role === 'IN_CHARGE')?.full_name;

            return (
              <div
                key={job.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                      {job.job_no}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          job.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditJob(job)}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 cursor-pointer transition-colors"
                            title={language === 'th' ? 'แก้ไข Job' : 'Edit Job'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingJob(job)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                            title={language === 'th' ? 'ลบ Job' : 'Delete Job'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base tracking-tight mb-3 text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    {job.vessel}
                  </h3>

                  {/* ETA & ETD Badge Ribbon */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-tight">ETA (เทียบท่า):</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-300">
                          {job.eta || (language === 'th' ? 'มอบหมายภายหลัง' : 'TBD')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-tight">ETD (ออกจากอู่):</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          {job.etd || (language === 'th' ? 'มอบหมายภายหลัง' : 'TBD')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Designated Team Summary: SRM, CO SRM, IN CHARGE */}
                  <div className="my-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-850/60 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Anchor className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        SRM:
                      </span>
                      <span className={`font-bold font-mono ${leadSrmName ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                        {leadSrmName || t.assignLater}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Users2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        CO SRM:
                      </span>
                      <span className={`font-bold font-mono ${coSrmName ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                        {coSrmName || t.assignLater}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <ClipboardList className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        IN CHARGE:
                      </span>
                      <span className={`font-bold font-mono ${inChargeName ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                        {inChargeName || t.assignLater}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Personnel Management */}
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      {t.assignedSrms} ({assignedSrms.length})
                    </span>
                  </div>

                  {assignedSrms.length === 0 ? (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
                      {t.noSrmAssigned}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {assignedSrms.map((srm) => (
                        <div
                          key={srm.id}
                          className={`flex items-center justify-between p-1.5 px-2 rounded-lg border text-xs font-mono ${
                            isDark
                              ? 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-[11px]">
                              {srm.full_name} <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal">({srm.role})</span>
                            </span>
                            <span className="text-[9px] text-slate-400">{srm.employee_id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSrmFromJob(job.id, srm.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={t.remove}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Officer to Job Dropdown */}
                  {unassignedSrms.length > 0 && (
                    <div className="pt-1.5">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSrmToJob(job.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className={`w-full p-1.5 text-[11px] rounded-lg border focus:outline-hidden ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        <option value="" disabled>
                          {t.assignSrmPlaceholder}
                        </option>
                        {unassignedSrms.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.employee_id}) - {p.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: เพิ่มรายละเอียด Job เรือ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all my-8 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>{t.newJobBtn}</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3.5 text-xs">
              {/* Job No */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t.jobNo} <span className="text-[10px] text-slate-400 font-normal">(e.g. 26-R-2948) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="26-R-2948"
                  value={jobNo}
                  onChange={(e) => setJobNo(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Vessel Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t.vesselName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GAS LOMBOK"
                  value={vessel}
                  onChange={(e) => setVessel(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* ETA & ETD Date Selectors */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{t.vesselEta}</span>
                  </label>
                  <input
                    type="date"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.vesselEtd}</span>
                  </label>
                  <input
                    type="date"
                    value={etd}
                    onChange={(e) => setEtd(e.target.value)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Team Designations: SRM, CO SRM, IN CHARGE */}
              <div className="space-y-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider block">
                  {language === 'th' ? 'ทีมงานผู้รับผิดชอบโครงการเรือ' : 'Designated Job Leadership Team'}
                </span>

                {/* SRM Dropdown */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Anchor className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{t.leadSrm}</span>
                  </label>
                  <select
                    value={initialSrmId}
                    onChange={(e) => setInitialSrmId(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">{t.assignLater}</option>
                    {profiles
                      .filter((p) => p.status === 'ACTIVE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.employee_id || 'N/A'}) - {p.role}
                        </option>
                      ))}
                  </select>
                </div>

                {/* CO SRM Dropdown */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{t.coSrm}</span>
                  </label>
                  <select
                    value={initialCoSrmId}
                    onChange={(e) => setInitialCoSrmId(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">{t.assignLater}</option>
                    {profiles
                      .filter((p) => p.status === 'ACTIVE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.employee_id || 'N/A'}) - {p.role}
                        </option>
                      ))}
                  </select>
                </div>

                {/* IN CHARGE Dropdown */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.inCharge}</span>
                  </label>
                  <select
                    value={initialInChargeId}
                    onChange={(e) => setInitialInChargeId(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">{t.assignLater}</option>
                    {profiles
                      .filter((p) => p.status === 'ACTIVE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.employee_id || 'N/A'}) - {p.role}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: แก้ไข Job เรือ (ADMIN ONLY) */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all my-8 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>{language === 'th' ? 'แก้ไขข้อมูล Job เรือ' : 'Edit Vessel Job'}</span>
              </h3>
              <button
                onClick={() => setEditingJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateJobSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t.jobNo} *
                </label>
                <input
                  type="text"
                  required
                  value={editJobNo}
                  onChange={(e) => setEditJobNo(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t.vesselName} *
                </label>
                <input
                  type="text"
                  required
                  value={editVessel}
                  onChange={(e) => setEditVessel(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {language === 'th' ? 'ลูกค้า / เจ้าของเรือ' : 'Customer'}
                  </label>
                  <input
                    type="text"
                    value={editCustomer}
                    onChange={(e) => setEditCustomer(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {language === 'th' ? 'สถานะ Job' : 'Job Status'}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value as JobStatus)}
                    className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>ETA ({language === 'th' ? 'เทียบท่า' : 'Berth'})</span>
                  </label>
                  <input
                    type="date"
                    value={editEta}
                    onChange={(e) => setEditEta(e.target.value)}
                    className={`w-full p-2 text-xs font-mono rounded-lg border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>ETD ({language === 'th' ? 'ออกจากอู่' : 'Departure'})</span>
                  </label>
                  <input
                    type="date"
                    value={editEtd}
                    onChange={(e) => setEditEtd(e.target.value)}
                    className={`w-full p-2 text-xs font-mono rounded-lg border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isEditingSubmitting ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันการลบ Job (ADMIN ONLY) */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base">
                {language === 'th' ? 'ยืนยันการลบ Job เรือ' : 'Confirm Delete Job'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {language === 'th'
                ? `คุณแน่ใจหรือไม่ว่าต้องการลบ Job หมายเลข ${deletingJob.job_no} (${deletingJob.vessel})? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
                : `Are you sure you want to delete Job ${deletingJob.job_no} (${deletingJob.vessel})? This action cannot be undone.`}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteJob}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeleting ? (language === 'th' ? 'กำลังลบ...' : 'Deleting...') : (language === 'th' ? 'ลบ Job' : 'Delete Job')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
