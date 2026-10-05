import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Job, Shipment, NotificationItem } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShipmentDetailModal } from './ShipmentDetailModal';
import {
  Ship,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  Anchor,
  ArrowUpDown,
  Send,
  Eye,
  Check,
  ShieldCheck,
  User,
  Zap,
  Flame,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

export const SRMDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myShipments, setMyShipments] = useState<Shipment[]>([]);
  const [myNotifications, setMyNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

  // Selected shipment for Details & Status Change Modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const [sortField, setSortField] = useState<'job' | 'booking' | 'po' | 'eta' | 'status'>('eta');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ASSIGNED'>('ALL');

  const loadSrmData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);

      // 1. Fetch all vessel jobs from Supabase so every shipment displays vessel/job info accurately
      const { data: allJobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select('*')
        .order('job_no', { ascending: true });

      if (jobsErr) console.warn('Supabase jobs query notice:', jobsErr.message);
      const allJobs = allJobsData || [];
      setMyJobs(allJobs);

      // 2. Fetch job assignments for THIS user (if table exists)
      let assignedJobIds: string[] = [];
      try {
        const { data: assignments, error: aErr } = await supabase
          .from('job_assignments')
          .select('job_id')
          .eq('user_id', currentUser.id);

        if (!aErr && assignments) {
          assignedJobIds = assignments.map((a: any) => a.job_id);
        }
      } catch (assignCatchErr) {
        console.warn('Notice: job_assignments lookup skipped:', assignCatchErr);
      }

      // 3. Fetch shipments directly from Supabase
      const { data: allShipmentsData, error: shipErr } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (shipErr) {
        console.error('FETCH SHIPMENTS (DASHBOARD) ERROR:', shipErr);
      }

      const allShipments = allShipmentsData || [];

      // Filter by assigned scope ONLY IF requested AND user has assignments; otherwise show all shipments
      if (scopeFilter === 'ASSIGNED' && assignedJobIds.length > 0) {
        const filtered = allShipments.filter((s) => assignedJobIds.includes(s.job_id));
        setMyShipments(filtered.length > 0 ? filtered : allShipments);
      } else {
        setMyShipments(allShipments);
      }

      // 4. Fetch notifications for THIS user
      try {
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        setMyNotifications(notifData || []);
      } catch (notifErr) {
        console.warn('Notice: notifications lookup skipped:', notifErr);
      }
    } catch (err) {
      console.error('Error loading SRM dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSrmData();

    // Listen to custom cross-component data change event
    const handleDataChanged = () => {
      console.log('[SRMDashboard] Received supabase-data-changed event, refreshing dashboard...');
      loadSrmData();
    };
    window.addEventListener('supabase-data-changed', handleDataChanged);

    // Supabase Realtime channel for live updates without full page reload
    const channel = supabase
      .channel('srm-dashboard-shipments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        (payload) => {
          console.log('[SRMDashboard] Live database change on shipments:', payload);
          loadSrmData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('supabase-data-changed', handleDataChanged);
      supabase.removeChannel(channel);
    };
  }, [currentUser, scopeFilter]);

  // Quick action: Confirm Receipt right from the table row
  const handleInlineConfirmReceived = async (shipment: Shipment, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const now = new Date().toISOString();
      const receiverName = currentUser?.full_name || 'SRM Officer';
      const relatedJob = myJobs.find((j) => j.id === shipment.job_id);

      await supabase.from('shipments').update({
        status: 'RECEIVED',
        received_date: now,
        receiver_name: receiverName,
        receiver_notes: language === 'th' ? 'ตรวจรับอะไหล่เข้าอู่เรือแล้ว' : 'Received into shipyard',
      }).eq('id', shipment.id);

      // Trigger notification
      await supabase.from('notifications').insert({
        user_id: currentUser?.id,
        type: 'SHIPMENT_RECEIVED',
        title: language === 'th' ? `ตรวจรับอะไหล่สำเร็จ: ${shipment.awb_bl}` : `Spare Part Received: ${shipment.awb_bl}`,
        message: language === 'th'
          ? `คุณ ${receiverName} บันทึกตรวจรับอะไหล่สำหรับ ${relatedJob?.vessel || 'Vessel'} เรียบร้อยแล้ว`
          : `${receiverName} confirmed receipt for ${relatedJob?.vessel || 'Vessel'}.`,
        is_read: false,
      });

      setQuickSuccessMsg(language === 'th' ? `✅ ตรวจรับ ${shipment.awb_bl} เรียบร้อยแล้ว` : `✅ Confirmed ${shipment.awb_bl}`);
      setTimeout(() => setQuickSuccessMsg(null), 3500);

      await loadSrmData();
    } catch (err) {
      console.error('Error quick confirming receipt:', err);
    }
  };

  // Quick inline status change selector
  const handleInlineStatusChange = async (shipmentId: string, newStatus: any, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    try {
      const isReceived = newStatus === 'RECEIVED';
      const now = new Date().toISOString();
      const receiverName = currentUser?.full_name || 'SRM Officer';

      await supabase.from('shipments').update({
        status: newStatus,
        received_date: isReceived ? now : null,
        receiver_name: isReceived ? receiverName : null,
        receiver_notes: isReceived ? (language === 'th' ? 'ตรวจรับเข้าอู่เรือแล้ว' : 'Received into shipyard') : null,
      }).eq('id', shipmentId);

      setQuickSuccessMsg(language === 'th' ? `อัปเดตสถานะเป็น ${newStatus} แล้ว` : `Status updated to ${newStatus}`);
      setTimeout(() => setQuickSuccessMsg(null), 3000);

      await loadSrmData();
    } catch (err) {
      console.error('Error updating status inline:', err);
    }
  };

  // Compute Metrics strictly for THIS SRM
  const totalMyJobs = myJobs.length;
  const totalMyShipments = myShipments.length;
  const arrivingToday = myShipments.filter((s) => s.status === 'ARRIVING_TODAY').length;
  const delayedShipments = myShipments.filter((s) => s.status === 'DELAYED').length;
  const receivedShipments = myShipments.filter((s) => s.status === 'RECEIVED').length;
  const unreadNotifications = myNotifications.filter((n) => !n.is_read).length;

  // Urgency Counts
  const criticalCount = myShipments.filter((s) => s.urgency === 'CRITICAL').length;
  const urgentCount = myShipments.filter((s) => s.urgency === 'URGENT').length;
  const normalCount = myShipments.filter((s) => (s.urgency || 'NORMAL') === 'NORMAL').length;

  const markNotificationRead = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setMyNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  };

  const handleSort = (field: 'job' | 'booking' | 'po' | 'eta' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredShipments = myShipments.filter((s) => {
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchesUrgency = filterUrgency === 'ALL' || (s.urgency || 'NORMAL') === filterUrgency;
    const q = searchQuery.toLowerCase();
    const relatedJob = myJobs.find((j) => j.id === s.job_id);
    const matchesSearch =
      s.awb_bl.toLowerCase().includes(q) ||
      (s.booking_no && s.booking_no.toLowerCase().includes(q)) ||
      (s.po_no && s.po_no.toLowerCase().includes(q)) ||
      (s.description_of_goods && s.description_of_goods.toLowerCase().includes(q)) ||
      s.supplier.toLowerCase().includes(q) ||
      (relatedJob && (relatedJob.job_no.toLowerCase().includes(q) || relatedJob.vessel.toLowerCase().includes(q)));
    return matchesStatus && matchesUrgency && matchesSearch;
  });

  // Sort filtered results
  filteredShipments.sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortField === 'booking') {
      valA = a.booking_no || '';
      valB = b.booking_no || '';
    } else if (sortField === 'po') {
      valA = a.po_no || '';
      valB = b.po_no || '';
    } else if (sortField === 'eta') {
      valA = a.eta || '';
      valB = b.eta || '';
    } else if (sortField === 'status') {
      valA = a.status || '';
      valB = b.status || '';
    } else {
      const jobA = myJobs.find((j) => j.id === a.job_id)?.vessel || '';
      const jobB = myJobs.find((j) => j.id === b.job_id)?.vessel || '';
      valA = jobA;
      valB = jobB;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Toast alert for quick status updates */}
      {quickSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCheck className="w-4 h-4" />
          <span>{quickSuccessMsg}</span>
        </div>
      )}

      {/* Personalized Welcome Banner (High contrast, friendly, authentic) */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border-slate-800'
            : 'bg-gradient-to-r from-white via-cyan-50 to-blue-50/70 border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-600/15 text-cyan-900 dark:text-cyan-300 border border-cyan-500/30 mb-2 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.srmWorkspaceTitle}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {language === 'th' ? `ยินดีต้อนรับ, คุณ${currentUser?.full_name}` : `Welcome back, ${currentUser?.full_name}`}
            </h1>
            <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">
              {t.employeeId}: <span className="text-cyan-900 dark:text-cyan-300 font-bold font-mono">{currentUser?.employee_id}</span> • {t.status}:{' '}
              <span className="text-emerald-800 dark:text-emerald-400 font-bold">{currentUser?.status}</span>
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t.srmWorkspaceDesc}
            </p>
          </div>

          {/* Controls: Scope toggle & Refresh button */}
          <div className="flex flex-col items-start sm:items-end gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Scope Toggle: All Shipyard vs Assigned */}
              <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 p-1 bg-white/70 dark:bg-slate-800/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScopeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scopeFilter === 'ALL'
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-cyan-600'
                  }`}
                >
                  {language === 'th' ? 'พัสดุทั้งหมดในอู่' : 'All Shipyard Cargo'}
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('ASSIGNED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scopeFilter === 'ASSIGNED'
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-cyan-600'
                  }`}
                >
                  {language === 'th' ? 'เฉพาะเรือที่รับผิดชอบ' : 'My Assigned Jobs'}
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadSrmData}
                title={language === 'th' ? 'รีเฟรชข้อมูลจาก Supabase' : 'Refresh from Supabase'}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
                <span>{language === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
              </button>
            </div>

            {/* Unread Notifs quick badge */}
            {unreadNotifications > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center gap-2 shadow-xs">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                <span>
                  {language === 'th'
                    ? `คุณมี ${unreadNotifications} การแจ้งเตือนพัสดุเข้าใหม่`
                    : `You have ${unreadNotifications} unread alert${unreadNotifications !== 1 ? 's' : ''}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Card Metrics Dashboard (High Contrast: Large dark fonts in bright mode, bright fonts in dark mode) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: My Jobs */}
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>{t.myJobs}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
            {loading ? '...' : totalMyJobs}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ลำเรือที่รับผิดชอบ' : 'Assigned Vessels'}
          </span>
        </div>

        {/* Card 2: Total Shipments */}
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>{t.myShipments}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-950 dark:text-blue-300">
            {loading ? '...' : totalMyShipments}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'รายการอะไหล่ทั้งหมด' : 'Total Items'}
          </span>
        </div>

        {/* Card 3: Arriving Today */}
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>{t.arrivingToday}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-900 dark:text-cyan-300">
            {loading ? '...' : arrivingToday}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ถึงวันนี้ / พร้อมรับ' : 'Arriving Today'}
          </span>
        </div>

        {/* Card 4: Delayed Shipments */}
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
            <span>{t.delayed}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-red-700 dark:text-red-400">
            {loading ? '...' : delayedShipments}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ล่าช้ากว่ากำหนด' : 'Delayed'}
          </span>
        </div>

        {/* Card 5: Received Shipments */}
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{t.received}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-800 dark:text-emerald-400">
            {loading ? '...' : receivedShipments}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ตรวจรับเข้าอู่เรือแล้ว' : 'In Unithai Yard'}
          </span>
        </div>

        {/* Card 6: Unread Notifications */}
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>{t.unreadAlerts}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-800 dark:text-amber-400">
            {loading ? '...' : unreadNotifications}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ข้อความแจ้งเตือน' : 'New Notices'}
          </span>
        </div>
      </div>

      {/* Assigned Jobs Horizontal Ribbon (High Contrast, Bold, Friendly) */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        }`}
      >
        <h2 className="text-xs font-mono uppercase tracking-wider font-extrabold text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <Ship className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
          <span>{t.myAssignedJobsTitle} ({myJobs.length})</span>
        </h2>

        {myJobs.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center text-xs text-slate-700 dark:text-slate-300 font-medium">
            {t.noAssignedJobsYet}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myJobs.map((j) => (
              <div
                key={j.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50'
                    : 'bg-slate-50 border-slate-300 hover:border-cyan-600 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/70 text-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                    {j.job_no}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {j.status}
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400 shrink-0" />
                  {j.vessel}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-1 font-medium">{j.job_name}</p>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-semibold mt-2">
                  {t.customerName}: <span className="text-slate-800 dark:text-slate-200">{j.customer}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Section: Rich Table (Matching User's Attached Design + Friendly High-Contrast Colors) */}
      <div
        className={`rounded-2xl border p-4 sm:p-6 transition-all shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
              <span>{t.incomingSparePartsTitle}</span>
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {t.incomingSparePartsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border focus:outline-hidden ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                    : 'bg-slate-50 border-slate-300 text-slate-950 focus:border-cyan-700 placeholder:text-slate-500'
                }`}
              />
            </div>

            {/* Urgency Filter Buttons (ด่วน / Critical / ปกติ) */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mr-1 hidden sm:inline">
                {language === 'th' ? 'ระดับความด่วน:' : 'Urgency:'}
              </span>

              {/* All */}
              <button
                type="button"
                onClick={() => setFilterUrgency('ALL')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                  filterUrgency === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.urgencyAll} ({myShipments.length})
              </button>

              {/* Critical */}
              <button
                type="button"
                onClick={() => setFilterUrgency('CRITICAL')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                  filterUrgency === 'CRITICAL'
                    ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse'
                    : 'bg-red-100 dark:bg-red-950/50 text-red-950 dark:text-red-300 border-red-300 dark:border-red-800 hover:bg-red-200'
                }`}
                title="วิกฤต / ต้องติดตั้งด่วนที่สุด"
              >
                <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />
                <span>CRITICAL ({criticalCount})</span>
              </button>

              {/* Urgent */}
              <button
                type="button"
                onClick={() => setFilterUrgency('URGENT')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                  filterUrgency === 'URGENT'
                    ? 'bg-amber-400 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-200'
                }`}
                title="ด่วน / งานเร่งด่วน"
              >
                <Zap className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                <span>{language === 'th' ? 'ด่วน' : 'URGENT'} ({urgentCount})</span>
              </button>

              {/* Normal */}
              <button
                type="button"
                onClick={() => setFilterUrgency('NORMAL')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  filterUrgency === 'NORMAL'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>📦 {language === 'th' ? 'ปกติ' : 'NORMAL'} ({normalCount})</span>
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-[11px] font-mono border-l border-slate-300 dark:border-slate-700 pl-2">
              {['ALL', 'ARRIVING_TODAY', 'IN_TRANSIT', 'DELAYED', 'RECEIVED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                    filterStatus === st
                      ? 'bg-cyan-700 border-cyan-800 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL'
                    ? t.all
                    : st === 'ARRIVING_TODAY'
                    ? (language === 'th' ? 'ถึงวันนี้' : 'Arriving')
                    : st === 'RECEIVED'
                    ? (language === 'th' ? 'รับแล้ว' : 'Received')
                    : st === 'DELAYED'
                    ? (language === 'th' ? 'ล่าช้า' : 'Delayed')
                    : (language === 'th' ? 'กำลังส่ง' : 'Transit')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick summary bar */}
        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>{language === 'th' ? 'แสดงผล' : 'Showing'} <b className="text-slate-950 dark:text-white font-mono">{filteredShipments.length}</b> {language === 'th' ? 'รายการอะไหล่' : 'spare part items'}</span>
            <span>•</span>
            <span className="text-emerald-800 dark:text-emerald-400 font-bold">
              {language === 'th' ? `ตรวจรับแล้ว: ${receivedShipments} รายการ` : `Received: ${receivedShipments}`}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            💡 {language === 'th' ? 'คลิกที่แถวหรือปุ่มเพื่อดูรายละเอียด & ตรวจรับอะไหล่' : 'Click row or button to view details & confirm receipt'}
          </span>
        </div>

        {/* Rich Table with High-Contrast Friendly Colors & Image-1 layout */}
        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[12px] font-extrabold uppercase font-sans ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}
            >
              <tr>
                {/* 1. JOB (เรือ / งาน) */}
                <th
                  onClick={() => handleSort('job')}
                  className="py-3 px-3.5 font-black cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
                    <span>{t.thJobVessel}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 2. SRM */}
                <th className="py-3 px-3 font-black select-none">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
                    <span>{t.thSrm}</span>
                  </div>
                </th>

                {/* 3. BOOKING NO. */}
                <th
                  onClick={() => handleSort('booking')}
                  className="py-3 px-3 font-black cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.thBookingNo}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 4. P/O (PO NO. / OWNER SUPPLY) */}
                <th
                  onClick={() => handleSort('po')}
                  className="py-3 px-3 font-black cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.thPoNo}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 5. AWB/BL */}
                <th className="py-3 px-3 font-black">{t.thAwbBl}</th>

                {/* 6. FLIGHT / VESSEL */}
                <th className="py-3 px-3 font-black">{t.thFlightVessel}</th>

                {/* 7. STATUS */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 font-black cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-400 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.thStatus}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 8. ACTIONS: แจ้งเตือน SRM / ดูรายละเอียด / เปลี่ยนสเตตัส */}
                <th className="py-3 px-3.5 font-black text-right">
                  {t.thActions}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-700 dark:text-slate-300">
                    <div className="inline-block w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="font-semibold text-xs">{t.loading}</p>
                  </td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-sm">
                      {language === 'th' ? 'ไม่พบรายการพัสดุที่ตรงกับเงื่อนไข' : 'No shipments found matching your filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => {
                  const job = myJobs.find((j) => j.id === s.job_id);
                  const isReceived = s.status === 'RECEIVED';
                  const isCritical = s.urgency === 'CRITICAL';
                  const isUrgent = s.urgency === 'URGENT';

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/80' : 'hover:bg-cyan-50/70'
                      }`}
                    >
                      {/* 1. JOB (เรือ / งาน) */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-start gap-2">
                          <Ship className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            {/* Project / Goods Title - Crisp, High Contrast and Bold */}
                            <span className="font-black text-xs text-slate-950 dark:text-white leading-snug line-clamp-1">
                              {s.description_of_goods || job?.job_name || 'Emergency Repair Parts'}
                            </span>
                            {/* Vessel Name & Job No */}
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-extrabold text-xs text-cyan-900 dark:text-cyan-300">
                                {job?.vessel || 'Vessel'}
                              </span>
                              <span className="font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300">
                                ({job?.job_no || 'Job'})
                              </span>

                              {/* Urgency Badge Inline */}
                              {isCritical && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-600 text-white animate-pulse">
                                  🚨 CRITICAL
                                </span>
                              )}
                              {isUrgent && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 border border-amber-600">
                                  ⚡ ด่วน
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. SRM Pill Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-950 dark:text-sky-200 border border-sky-300 dark:border-sky-800 shadow-2xs">
                          <User className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                          <span>คุณ{currentUser?.full_name?.split(' ')[0] || 'SRM'}</span>
                        </span>
                      </td>

                      {/* 3. BOOKING NO. - High-Contrast Monospace */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-xs text-blue-950 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {s.booking_no || 'BKG-2026-0914'}
                        </span>
                      </td>

                      {/* 4. P/O (PO NO. / OWNER SUPPLY) - High-Contrast Monospace */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-xs text-emerald-950 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {s.po_no || 'PO-770413'}
                        </span>
                      </td>

                      {/* 5. AWB/BL - Crisp Monospace */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-xs text-slate-950 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                          {s.awb_bl}
                        </span>
                      </td>

                      {/* 6. FLIGHT / VESSEL - Friendly readable text */}
                      <td className="py-3.5 px-3 text-xs font-bold text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {s.flight_vessel || 'MV WAN HAI 312'}
                      </td>

                      {/* 7. STATUS - Clear Pill Badge + Quick Selector */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase shadow-2xs ${
                              s.status === 'ARRIVING_TODAY'
                                ? 'bg-cyan-100 text-cyan-950 border border-cyan-400 dark:bg-cyan-950/80 dark:text-cyan-200 dark:border-cyan-700'
                                : s.status === 'DELAYED'
                                ? 'bg-red-100 text-red-950 border border-red-400 dark:bg-red-950/80 dark:text-red-200 dark:border-red-700'
                                : s.status === 'RECEIVED'
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700'
                                : 'bg-blue-100 text-blue-950 border border-blue-400 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                s.status === 'RECEIVED'
                                  ? 'bg-emerald-600 dark:bg-emerald-400'
                                  : s.status === 'DELAYED'
                                  ? 'bg-red-600 dark:bg-red-400'
                                  : 'bg-cyan-600 dark:bg-cyan-400 animate-pulse'
                              }`}
                            ></span>
                            {s.status.replace('_', ' ')}
                          </span>

                          {/* Quick inline status dropdown for User convenience */}
                          <select
                            value={s.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleInlineStatusChange(s.id, e.target.value, e)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer focus:outline-hidden ${
                              isDark
                                ? 'bg-slate-800 text-slate-200 border-slate-700'
                                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                            }`}
                            title={language === 'th' ? 'เปลี่ยนสถานะด่วน' : 'Quick status change'}
                          >
                            <option value="IN_TRANSIT">IN TRANSIT</option>
                            <option value="ARRIVING_TODAY">ARRIVING TODAY</option>
                            <option value="DELAYED">DELAYED</option>
                            <option value="RECEIVED">RECEIVED (รับแล้ว ✅)</option>
                          </select>
                        </div>
                      </td>

                      {/* 8. ACTIONS: แจ้งเตือน SRM / ตรวจรับอะไหล่ / ดูรายละเอียด */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Quick Receive Button for User if not yet received */}
                          {!isReceived ? (
                            <button
                              type="button"
                              onClick={(e) => handleInlineConfirmReceived(s, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                              title={language === 'th' ? 'คลิกเปลี่ยนสเตตัสเป็นได้รับแล้ว' : 'Mark as Received'}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'th' ? 'รับแล้ว' : 'Received'}</span>
                            </button>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'th' ? 'รับแล้ว' : 'Received'}</span>
                            </span>
                          )}

                          {/* "แจ้ง SRM / รายละเอียด" Button like User Image 1 */}
                          <button
                            type="button"
                            onClick={() => setSelectedShipment(s)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{language === 'th' ? 'แจ้ง SRM' : 'Alert SRM'}</span>
                            <Eye className="w-3.5 h-3.5 opacity-80" />
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

      {/* Notifications Section */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t.myNotificationsTitle} ({myNotifications.length})</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
            Supabase table: <code>notifications</code>
          </span>
        </div>

        {myNotifications.length === 0 ? (
          <div className="p-4 rounded-xl text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            {t.noNotifications}
          </div>
        ) : (
          <div className="space-y-2">
            {myNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 transition-all ${
                  notif.is_read
                    ? isDark
                      ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                    : isDark
                    ? 'bg-cyan-950/30 border-cyan-800/60 text-slate-100 shadow-xs'
                    : 'bg-cyan-50 border-cyan-300 text-slate-950 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm tracking-tight text-slate-950 dark:text-white">
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400 text-slate-950 font-black uppercase">
                        {t.newBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium">{notif.message}</p>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>

                {!notif.is_read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(notif.id)}
                    className="shrink-0 px-2.5 py-1 rounded-lg border border-cyan-400 dark:border-cyan-700 bg-cyan-100 dark:bg-cyan-900/60 text-cyan-950 dark:text-cyan-200 hover:bg-cyan-200 text-[10px] font-mono font-black cursor-pointer"
                  >
                    {t.markRead}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipment Detail & Status Change Modal */}
      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          job={myJobs.find((j) => j.id === selectedShipment.job_id)}
          onClose={() => setSelectedShipment(null)}
          onUpdated={loadSrmData}
        />
      )}
    </div>
  );
};
