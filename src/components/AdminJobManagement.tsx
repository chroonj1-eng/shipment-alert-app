import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Profile, JobAssignment } from '../types/database';
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
} from 'lucide-react';

export const AdminJobManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Job Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [jobNo, setJobNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [vessel, setVessel] = useState('');
  const [customer, setCustomer] = useState('');
  const [initialSrmId, setInitialSrmId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('jobs').select('*').order('job_no', { ascending: true }),
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('job_assignments').select('*'),
      ]);

      if (jobsRes.data) setJobs(jobsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    } catch (err) {
      console.error('Error loading job management data:', err);
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
    if (!jobNo.trim() || !vessel.trim() || !customer.trim()) return;

    const newJob: Partial<Job> = {
      job_no: jobNo.trim().toUpperCase(),
      job_name: jobName.trim() || `${vessel.trim()} Repair & Survey`,
      vessel: vessel.trim().toUpperCase(),
      customer: customer.trim(),
      status: 'ACTIVE',
    };

    const { data, error } = await supabase.from('jobs').insert(newJob).select();

    if (error) {
      alert('Error creating job: ' + error.message);
      return;
    }

    // If an SRM was selected on creation, assign them
    if (initialSrmId && data && (data as any[]).length > 0) {
      const createdJobId = (data as any[])[0].id;
      await supabase.from('job_assignments').insert({
        user_id: initialSrmId,
        job_id: createdJobId,
        assigned_at: new Date().toISOString(),
      });
    }

    setIsCreateModalOpen(false);
    setJobNo('');
    setJobName('');
    setVessel('');
    setCustomer('');
    setInitialSrmId('');
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleAddSrmToJob = async (jobId: string, userId: string) => {
    if (!userId) return;
    const exists = assignments.some((a) => a.job_id === jobId && a.user_id === userId);
    if (exists) return;

    await supabase.from('job_assignments').insert({
      job_id: jobId,
      user_id: userId,
      assigned_at: new Date().toISOString(),
    });
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleRemoveSrmFromJob = async (jobId: string, userId: string) => {
    const confirmMsg = language === 'th' ? 'ต้องการนำ SRM ท่านนี้ออกจากการดูแลเรือลำนี้หรือไม่?' : 'Remove this SRM from this job assignment?';
    if (!window.confirm(confirmMsg)) return;
    await supabase.from('job_assignments').delete().eq('job_id', jobId).eq('user_id', userId);
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
            <Ship className="w-6 h-6 text-cyan-500" />
            {t.jobsAndAssignmentsTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
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
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
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
            {language === 'th' ? 'ไม่พบโครงการเรือที่ตรงกับคำค้นหา' : 'No jobs found matching your search.'}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const assignedSrms = getJobSrms(job.id);
            const unassignedSrms = profiles.filter(
              (p) => p.status === 'ACTIVE' && !assignedSrms.some((a) => a.id === p.id)
            );

            return (
              <div
                key={job.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-sm font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {job.job_no}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base tracking-tight mb-1 text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-cyan-500 shrink-0" />
                    {job.vessel}
                  </h3>
                  <p className="text-xs text-slate-400 mb-2 font-medium">{job.job_name}</p>

                  <div className="text-[11px] text-slate-400 font-mono mb-4 pb-3 border-b border-slate-800/40">
                    <span className="text-slate-500">{t.customerName}:</span> {job.customer}
                  </div>
                </div>

                {/* Assigned SRMs Section */}
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      {t.assignedSrms} ({assignedSrms.length})
                    </span>
                  </div>

                  {assignedSrms.length === 0 ? (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
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
                            <span className="font-bold text-[11px]">{srm.full_name}</span>
                            <span className="text-[9px] text-slate-400">{srm.employee_id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSrmFromJob(job.id, srm.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={t.remove}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add SRM Dropdown */}
                  {unassignedSrms.length > 0 && (
                    <div className="pt-2">
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
                            {p.full_name} ({p.employee_id})
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

      {/* Create Job Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-400" />
                {t.newJobBtn}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t.jobNo} <span className="text-[10px] text-slate-400">(e.g. 26-R-2948)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="26-R-2948"
                  value={jobNo}
                  onChange={(e) => setJobNo(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.vesselName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GAS LOMBOK"
                  value={vessel}
                  onChange={(e) => setVessel(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.customerName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PT Pertamina / Thoresen"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.scopeProject}</label>
                <input
                  type="text"
                  placeholder="e.g. Main Engine Overhaul & Drydocking"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{language === 'th' ? 'กำหนด SRM เริ่มต้น' : 'Initial Lead SRM Assignment'}</label>
                <select
                  value={initialSrmId}
                  onChange={(e) => setInitialSrmId(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">{language === 'th' ? '-- มอบหมายภายหลัง --' : '-- Assign Later --'}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.employee_id}) - {p.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
