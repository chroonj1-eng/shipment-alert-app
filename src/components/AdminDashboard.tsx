import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Job, Shipment, JobAssignment } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Users,
  UserCheck,
  Briefcase,
  Ship,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Plane,
  Truck,
  Anchor,
  Flame,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToUsers: () => void;
  onNavigateToJobs: () => void;
  onNavigateToShipments: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToUsers,
  onNavigateToJobs,
  onNavigateToShipments,
}) => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [pRes, jRes, sRes, aRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('job_assignments').select('*'),
      ]);

      if (pRes.data) setProfiles(pRes.data);
      if (jRes.data) setJobs(jRes.data);
      if (sRes.data) setShipments(sRes.data);
      if (aRes.data) setAssignments(aRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Listen to custom cross-tab data change event
    const handleDataChanged = () => {
      console.log('[AdminDashboard] supabase-data-changed event received, reloading stats...');
      loadStats();
    };
    window.addEventListener('supabase-data-changed', handleDataChanged);

    // Supabase Realtime channel for live updates
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => loadStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => loadStats()
      )
      .subscribe();

    return () => {
      window.removeEventListener('supabase-data-changed', handleDataChanged);
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute Metrics
  const totalUsers = profiles.length;
  const activeSrms = profiles.filter((p) => p.role === 'SRM' && p.status === 'ACTIVE').length;
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE').length;
  const totalShipments = shipments.length;
  const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'ARRIVING_TODAY').length;
  const delayed = shipments.filter((s) => s.status === 'DELAYED').length;
  const received = shipments.filter((s) => s.status === 'RECEIVED').length;
  const criticalCount = shipments.filter((s) => s.urgency === 'CRITICAL').length;
  const urgentCount = shipments.filter((s) => s.urgency === 'URGENT').length;

  const statCards = [
    {
      title: t.statTotalUsers,
      value: totalUsers,
      sub: `${activeSrms} ${language === 'th' ? 'SRM พร้อมดูแล' : 'Active SRMs'}`,
      icon: Users,
      color: 'text-cyan-700 dark:text-cyan-400',
      bg: 'bg-cyan-100 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-500/20',
      onClick: onNavigateToUsers,
    },
    {
      title: t.statTotalJobs,
      value: totalJobs,
      sub: `${activeJobs} ${language === 'th' ? 'โครงการกำลังซ่อม' : 'Active Projects'}`,
      icon: Ship,
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/20',
      onClick: onNavigateToJobs,
    },
    {
      title: t.statTotalShipments,
      value: totalShipments,
      sub: `${inTransit} ${language === 'th' ? 'อยู่ระหว่างเดินทาง' : 'In Transit'} • ${criticalCount} Critical 🚨`,
      icon: Package,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/20',
      onClick: onNavigateToShipments,
    },
    {
      title: t.statDelayedShipments,
      value: delayed,
      sub: `${received} ${language === 'th' ? 'ตรวจรับเข้าอู่แล้ว' : 'Received in Yard'}`,
      icon: AlertTriangle,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/20',
      onClick: onNavigateToShipments,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border-slate-800'
            : 'bg-gradient-to-r from-white via-cyan-50/70 to-blue-50/70 border-slate-300 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 mb-2 uppercase">
              Admin Master Console
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t.adminConsoleTitle}
            </h1>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t.adminConsoleDesc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStats}
              title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh stats'}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
              <span className="hidden sm:inline">{language === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
            </button>
            <button
              onClick={onNavigateToUsers}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{t.manageUsersBtn}</span>
            </button>
            <button
              onClick={onNavigateToJobs}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Briefcase className="w-4 h-4" />
              <span>{t.jobsAndSrmsBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (High Contrast Text) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={card.onClick}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer hover:scale-[1.01] hover:shadow-md ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-300">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '...' : card.value}
              </div>
              <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1 flex items-center gap-1">
                <span>{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3 Activity Columns: Recent Registrations, Recent Jobs, Recent Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Recent User Registrations */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {t.recentRegistrations}
              </h3>
              <button
                onClick={onNavigateToUsers}
                className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                {t.viewAll} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {profiles.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{p.full_name}</span>
                    <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {p.employee_id} • {p.email}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shadow-2xs ${
                      p.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                        : 'bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
                    }`}
                  >
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Recent Jobs (Crystal-Clear Text Colors) */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t.recentJobs}
              </h3>
              <button
                onClick={onNavigateToJobs}
                className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                {t.viewAll} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {jobs.slice(0, 4).map((j) => {
                const assignedCount = assignments.filter((a) => a.job_id === j.id).length;
                return (
                  <div
                    key={j.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-cyan-700 dark:text-cyan-400 text-xs">
                          {j.job_no}
                        </span>
                        {/* High-Contrast Vessel Name */}
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {j.vessel}
                        </span>
                      </div>
                      {/* High-Contrast Customer */}
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium truncate max-w-[180px]">
                        {j.customer}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                      {assignedCount} SRM{assignedCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Recent Shipments (With Urgency Badges & High-Contrast Colors) */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t.recentShipments}
              </h3>
              <button
                onClick={onNavigateToShipments}
                className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                {t.viewAll} <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {shipments.slice(0, 4).map((s) => {
                const relatedJob = jobs.find((j) => j.id === s.job_id);
                const isCritical = s.urgency === 'CRITICAL';
                const isUrgent = s.urgency === 'URGENT';

                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* AWB/BL */}
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                          {s.awb_bl}
                        </span>
                        {/* Job No */}
                        {relatedJob && (
                          <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400">
                            ({relatedJob.job_no})
                          </span>
                        )}

                        {/* Urgency Badge */}
                        {isCritical && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white animate-pulse">
                            🚨 CRITICAL
                          </span>
                        )}
                        {isUrgent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-slate-950">
                            ⚡ ด่วน (URGENT)
                          </span>
                        )}
                      </div>

                      {/* Supplier & Description */}
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">
                        {s.supplier}
                      </span>
                    </div>

                    {/* Status Pill Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shadow-2xs ${
                        s.status === 'ARRIVING_TODAY'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700'
                          : s.status === 'DELAYED'
                          ? 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700'
                          : s.status === 'RECEIVED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                          : 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
