import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shipment, Job, Profile } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShipmentDetailModal } from './ShipmentDetailModal';
import {
  updateShipmentUrgency,
  markShipmentReceived,
  adminCreateShipment,
  adminUpdateShipment,
  adminDeleteShipment,
} from '../services/rbacService';
import {
  Package,
  Plane,
  Anchor,
  Truck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  Plus,
  Eye,
  Check,
  Ship,
  Flame,
  Zap,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ShipmentsList: React.FC = () => {
  const { isDark } = useTheme();
  const { currentUser, isAdmin, isSRM } = useAuth();
  const { t, language } = useLanguage();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  // Selected shipment for modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // New Shipment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState('');
  const [bookingNo, setBookingNo] = useState('');
  const [poNo, setPoNo] = useState('');
  const [awbBl, setAwbBl] = useState('');
  const [flightVessel, setFlightVessel] = useState('');
  const [descriptionOfGoods, setDescriptionOfGoods] = useState('');
  const [packageQty, setPackageQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('Unithai Shipyard Laem Chabang');
  const [mode, setMode] = useState<'AIR' | 'SEA' | 'COURIER' | 'LAND'>('AIR');
  const [urgency, setUrgency] = useState<'CRITICAL' | 'URGENT' | 'NORMAL'>('NORMAL');
  const [eta, setEta] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [status, setStatus] = useState<'IN_TRANSIT' | 'ARRIVING_TODAY' | 'RECEIVED' | 'DELAYED'>('IN_TRANSIT');

  // Admin Edit Shipment Modal State
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [editJobId, setEditJobId] = useState('');
  const [editBookingNo, setEditBookingNo] = useState('');
  const [editPoNo, setEditPoNo] = useState('');
  const [editAwbBl, setEditAwbBl] = useState('');
  const [editFlightVessel, setEditFlightVessel] = useState('');
  const [editDescriptionOfGoods, setEditDescriptionOfGoods] = useState('');
  const [editPackageQty, setEditPackageQty] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editOrigin, setEditOrigin] = useState('');
  const [editDestination, setEditDestination] = useState('Unithai Shipyard Laem Chabang');
  const [editMode, setEditMode] = useState<'AIR' | 'SEA' | 'COURIER' | 'LAND'>('AIR');
  const [editUrgency, setEditUrgency] = useState<'CRITICAL' | 'URGENT' | 'NORMAL'>('NORMAL');
  const [editEta, setEditEta] = useState('');
  const [editStatus, setEditStatus] = useState<'IN_TRANSIT' | 'ARRIVING_TODAY' | 'RECEIVED' | 'DELAYED'>('IN_TRANSIT');
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Strictly ensure non-admin users (SRM) cannot retain or open edit modal
  useEffect(() => {
    if (!isAdmin && editingShipment) {
      setEditingShipment(null);
    }
  }, [isAdmin, editingShipment]);

  // Admin Delete Shipment State
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const BASELINE_JOBS: Job[] = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      job_no: '26-R-2928',
      job_name: 'Main Engine Overhaul & Drydocking Survey',
      vessel: 'GAS LOMBOK',
      customer: 'PT Pertamina International Shipping',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      job_no: '26-R-2931',
      job_name: 'Propeller Shaft & Stern Tube Survey & Seals',
      vessel: 'SEMERU',
      customer: 'Samudera Indonesia',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      job_no: '26-R-2930',
      job_name: 'Cargo Holds Blasting & Tank Coating',
      vessel: 'THOR CONFIDENCE',
      customer: 'Thoresen Shipping',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000004',
      job_no: '26-R-2940',
      job_name: 'Auxiliary Engine Crankshaft Replacement',
      vessel: 'WAN HAI 312',
      customer: 'Wan Hai Lines',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const jobsRes = await supabase.from('jobs').select('*');
      if (jobsRes.data && jobsRes.data.length > 0) {
        setJobs(jobsRes.data);
      } else {
        if (jobsRes.error) {
          console.warn('FETCH JOBS (using baseline fallback):', jobsRes.error.message);
        }
        setJobs(BASELINE_JOBS);
      }

      if (isAdmin) {
        // Admin sees all shipments
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('FETCH SHIPMENTS (ADMIN) ERROR:', error);
        } else if (data) {
          console.log('FETCH SHIPMENTS (ADMIN) SUCCESS:', data.length, 'records');
          setShipments(data);
        }
      } else if (currentUser?.id) {
        // SRM sees assigned jobs or all active shipments
        const { data: assignments, error: assignErr } = await supabase
          .from('job_assignments')
          .select('job_id')
          .eq('user_id', currentUser.id);

        if (assignErr) {
          console.warn('FETCH JOB ASSIGNMENTS WARN:', assignErr);
        }

        const assignedJobIds = (assignments || []).map((a: any) => a.job_id);
        if (assignedJobIds.length > 0) {
          const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .in('job_id', assignedJobIds)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('FETCH SHIPMENTS (SRM) ERROR:', error);
          } else if (data) {
            setShipments(data);
          }
        } else {
          // If no job assignments exist for this user, fetch all shipments so view is not empty
          const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('FETCH ALL SHIPMENTS (SRM FALLBACK) ERROR:', error);
          } else if (data) {
            setShipments(data);
          }
        }
      } else {
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('FETCH SHIPMENTS ERROR:', error);
        } else if (data) {
          setShipments(data);
        }
      }
    } catch (err) {
      console.error('Error loading shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to custom cross-component data change event
    const handleDataChanged = () => {
      console.log('[ShipmentsList] Received supabase-data-changed event, refreshing...');
      loadData();
    };
    window.addEventListener('supabase-data-changed', handleDataChanged);

    // Supabase Realtime channel for live updates across all tabs and devices
    const channel = supabase
      .channel('shipments-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => loadData()
      )
      .subscribe();

    return () => {
      window.removeEventListener('supabase-data-changed', handleDataChanged);
      supabase.removeChannel(channel);
    };
  }, [currentUser, isAdmin]);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // SECURITY CHECK: Only ADMIN is permitted to add a new shipment
    if (!isAdmin) {
      setModalError(language === 'th' ? 'ไม่มีสิทธิ์: เฉพาะ ADMIN เท่านั้นที่สามารถเพิ่ม Shipment ได้' : 'Access Denied: Only ADMIN can create new shipments.');
      return;
    }

    // Validation
    if (!jobId) {
      setModalError(language === 'th' ? 'กรุณาเลือกโครงการเรือเป้าหมาย' : 'Please select a target vessel job');
      return;
    }
    if (!awbBl.trim()) {
      setModalError(language === 'th' ? 'กรุณาระบุ AWB / B/L NO.' : 'Please enter AWB / B/L NO.');
      return;
    }
    if (!supplier.trim()) {
      setModalError(language === 'th' ? 'กรุณาระบุผู้ผลิต (Supplier)' : 'Please enter Supplier');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure target job exists in public.jobs if database enforces foreign key constraint
      const selectedJob = jobs.find((j) => j.id === jobId);
      if (selectedJob) {
        try {
          const { data: existingJob } = await supabase.from('jobs').select('id').eq('id', jobId).maybeSingle();
          if (!existingJob) {
            // Upsert the baseline job into jobs table so foreign key constraint passes
            await supabase.from('jobs').upsert({
              id: selectedJob.id,
              job_no: selectedJob.job_no,
              job_name: selectedJob.job_name || 'Ship Repair Project',
              vessel: selectedJob.vessel,
              customer: selectedJob.customer || 'Unithai Client',
              status: selectedJob.status || 'ACTIVE',
            });
          }
        } catch (jobCheckErr) {
          console.warn('Job pre-check notice (safe to continue):', jobCheckErr);
        }
      }

      const etaIso = eta ? new Date(eta).toISOString() : new Date(Date.now() + 86400000).toISOString();

      // Full payload matching database schema & UI form
      const payload: any = {
        job_id: jobId,
        booking_no: bookingNo.trim() || `BKG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        po_no: poNo.trim() || `PO-${Math.floor(100000 + Math.random() * 900000)}`,
        awb_bl: awbBl.trim().toUpperCase(),
        flight_vessel: flightVessel.trim() || 'MV WAN HAI 312 / TG-920',
        description_of_goods: descriptionOfGoods.trim() || 'Main Engine Exhaust Valve Spindles & Gaskets',
        package_qty: packageQty.trim() || '1 Crate',
        supplier: supplier.trim(),
        origin: origin.trim() || 'Copenhagen, Denmark',
        destination: destination.trim() || 'Unithai Shipyard Laem Chabang',
        mode,
        urgency,
        eta: etaIso,
        status,
        received_date: status === 'RECEIVED' ? new Date().toISOString() : null,
      };

      console.log('[CreateShipment] Submitting payload to Supabase public.shipments:', payload);

      // Perform REAL INSERT with .select() to return created row
      let { data, error } = await supabase
        .from('shipments')
        .insert(payload)
        .select();

      // If database is on base schema without extended columns (booking_no, urgency, etc.), retry with core columns
      if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist'))) {
        console.warn('[CreateShipment] Extended columns not present in Supabase table, retrying with core columns:', error.message);
        const corePayload = {
          job_id: jobId,
          awb_bl: awbBl.trim().toUpperCase(),
          supplier: supplier.trim(),
          origin: origin.trim() || 'Copenhagen, Denmark',
          destination: destination.trim() || 'Unithai Shipyard Laem Chabang',
          mode,
          eta: etaIso,
          status,
          received_date: status === 'RECEIVED' ? new Date().toISOString() : null,
        };
        const retryRes = await supabase.from('shipments').insert(corePayload).select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.error('[CreateShipment] SUPABASE INSERT ERROR:', error);
        let errorMsg = `${error.code ? `[Error ${error.code}] ` : ''}${error.message || JSON.stringify(error)}`;
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('row-level security')) {
          errorMsg = language === 'th'
            ? 'Supabase RLS Policy ปฏิเสธการบันทึก (42501 Permission Denied by RLS) — กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้ หรือตรวจสอบ RLS Policy สำหรับตาราง shipments'
            : 'Supabase RLS Policy rejected the insert (42501 Permission Denied). Please check table shipments RLS policies or ensure you are logged in.';
        } else if (error.code === '23503' || error.message?.includes('foreign key')) {
          errorMsg = language === 'th'
            ? `ไม่พบโครงการเรือรหัส ${jobId} ในตาราง jobs (Foreign key constraint violation)`
            : `Target job ID ${jobId} does not exist in public.jobs table.`;
        } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
          errorMsg = language === 'th'
            ? 'ตาราง public.shipments ยังไม่ถูกสร้างบน Supabase (42P01: Relation does not exist). กรุณารัน SQL Migration ใน Supabase SQL Editor'
            : 'Table public.shipments does not exist on Supabase. Please run the SQL migration.';
        }
        setModalError(errorMsg);
        return; // KEEP MODAL OPEN SO USER CAN SEE ERROR AND FIX
      }

      console.log('[CreateShipment] INSERT SUCCESSFUL:', data);

      // Immediately prepend to local state so user sees data without delay
      if (data && data.length > 0) {
        setShipments((prev) => [data[0], ...prev]);
      }

      // Close modal and reset fields
      setIsModalOpen(false);
      setAwbBl('');
      setBookingNo('');
      setPoNo('');
      setDescriptionOfGoods('');
      setFlightVessel('');
      setSupplier('');
      setOrigin('');
      setUrgency('NORMAL');
      setStatus('IN_TRANSIT');
      setMode('AIR');

      // Refresh data from database
      await loadData();
      window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    } catch (err: any) {
      console.error('UNEXPECTED INSERT ERROR:', err);
      setModalError(err.message || 'An unexpected error occurred while saving shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (shipmentId: string, newStatus: any, e: React.MouseEvent | React.ChangeEvent<any>) => {
    e.stopPropagation();
    // SECURITY RULE: SRM may change a shipment ONLY to RECEIVED. Cannot change back or to any other status.
    if (!isAdmin && newStatus !== 'RECEIVED') {
      console.warn('[RBAC Denied] SRM is not authorized to change status to:', newStatus);
      return;
    }

    if (newStatus === 'RECEIVED') {
      await markShipmentReceived(shipmentId, currentUser);
    } else if (isAdmin) {
      await supabase.from('shipments').update({
        status: newStatus,
        received_date: null,
      }).eq('id', shipmentId);
    }

    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const handleUpdateUrgency = async (shipmentId: string, newUrgency: 'CRITICAL' | 'URGENT' | 'NORMAL', e: React.ChangeEvent<any>) => {
    e.stopPropagation();
    // SECURITY RULE: SRM may change ONLY urgency between CRITICAL, URGENT, NORMAL
    if (!['CRITICAL', 'URGENT', 'NORMAL'].includes(newUrgency)) return;
    await updateShipmentUrgency(shipmentId, newUrgency, currentUser);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  // ADMIN ONLY: Open Edit Shipment Modal
  const handleOpenEditShipment = (shipment: Shipment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingShipment(shipment);
    setEditJobId(shipment.job_id || '');
    setEditBookingNo(shipment.booking_no || '');
    setEditPoNo(shipment.po_no || '');
    setEditAwbBl(shipment.awb_bl || '');
    setEditFlightVessel(shipment.flight_vessel || '');
    setEditDescriptionOfGoods(shipment.description_of_goods || '');
    setEditPackageQty(shipment.package_qty || '');
    setEditSupplier(shipment.supplier || '');
    setEditOrigin(shipment.origin || '');
    setEditDestination(shipment.destination || 'Unithai Shipyard Laem Chabang');
    setEditMode(shipment.mode || 'AIR');
    setEditUrgency(shipment.urgency || 'NORMAL');
    setEditEta(shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '');
    setEditStatus(shipment.status || 'IN_TRANSIT');
    setEditModalError(null);
  };

  // ADMIN ONLY: Save Edited Shipment
  const handleSaveEditShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingShipment) return;
    setIsEditingSubmitting(true);
    setEditModalError(null);

    const updates: Partial<Shipment> = {
      job_id: editJobId,
      booking_no: editBookingNo.trim(),
      po_no: editPoNo.trim(),
      awb_bl: editAwbBl.trim().toUpperCase(),
      flight_vessel: editFlightVessel.trim(),
      description_of_goods: editDescriptionOfGoods.trim(),
      package_qty: editPackageQty.trim(),
      supplier: editSupplier.trim(),
      origin: editOrigin.trim(),
      destination: editDestination.trim(),
      mode: editMode,
      urgency: editUrgency,
      status: editStatus,
      eta: editEta ? new Date(editEta).toISOString() : editingShipment.eta,
      received_date: editStatus === 'RECEIVED' ? (editingShipment.received_date || new Date().toISOString()) : null,
    };

    const res = await adminUpdateShipment(editingShipment.id, updates, currentUser);
    if (!res.success) {
      setEditModalError(res.error || 'Failed to update shipment');
      setIsEditingSubmitting(false);
      return;
    }

    setEditingShipment(null);
    setIsEditingSubmitting(false);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  // ADMIN ONLY: Delete Shipment
  const handleConfirmDeleteShipment = async () => {
    if (!isAdmin || !deletingShipment) return;
    setIsDeleting(true);
    const res = await adminDeleteShipment(deletingShipment.id, currentUser);
    if (!res.success) {
      alert('Delete failed: ' + res.error);
      setIsDeleting(false);
      return;
    }
    setDeletingShipment(null);
    setIsDeleting(false);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  const filtered = shipments.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'ALL' || (s.urgency || 'NORMAL') === urgencyFilter;
    const q = searchQuery.toLowerCase();
    const relatedJob = jobs.find((j) => j.id === s.job_id);
    const matchesSearch =
      s.awb_bl.toLowerCase().includes(q) ||
      (s.booking_no && s.booking_no.toLowerCase().includes(q)) ||
      (s.po_no && s.po_no.toLowerCase().includes(q)) ||
      (s.description_of_goods && s.description_of_goods.toLowerCase().includes(q)) ||
      s.supplier.toLowerCase().includes(q) ||
      (relatedJob && (relatedJob.job_no.toLowerCase().includes(q) || relatedJob.vessel.toLowerCase().includes(q)));
    return matchesStatus && matchesUrgency && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-700 dark:text-cyan-400" />
            <span>{isAdmin ? t.allConsignmentsTitle : t.myShipments}</span>
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
            {isAdmin ? t.allConsignmentsSub : t.incomingSparePartsSub}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950 shadow-xs'
              }`}
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newShipmentBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Urgency Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        {/* Urgency Filter */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mr-1">
            {language === 'th' ? 'ระดับความด่วน:' : 'Urgency:'}
          </span>
          <button
            onClick={() => setUrgencyFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
              urgencyFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            {t.urgencyAll}
          </button>
          <button
            onClick={() => setUrgencyFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
              urgencyFilter === 'CRITICAL'
                ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse'
                : 'bg-red-100 dark:bg-red-950/50 text-red-950 dark:text-red-300 border-red-300 dark:border-red-800'
            }`}
          >
            <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span>{language === 'th' ? 'ด่วนมาก' : 'CRITICAL'}</span>
          </button>
          <button
            onClick={() => setUrgencyFilter('URGENT')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
              urgencyFilter === 'URGENT'
                ? 'bg-amber-400 text-slate-950 border-amber-600 shadow-sm'
                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            <span>{language === 'th' ? 'ด่วน' : 'URGENT'}</span>
          </button>
          <button
            onClick={() => setUrgencyFilter('NORMAL')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
              urgencyFilter === 'NORMAL'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            <span>📦 {language === 'th' ? 'ปกติ' : 'NORMAL'}</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {['ALL', 'ARRIVING_TODAY', 'IN_TRANSIT', 'DELAYED', 'RECEIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap font-bold ${
                statusFilter === st
                  ? 'bg-cyan-700 border-cyan-800 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-800 hover:text-slate-950 shadow-xs'
              }`}
            >
              {st === 'ALL'
                ? (language === 'th' ? 'Shipment ทั้งหมด' : 'ALL SHIPMENTS')
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

      {/* Main Table with High Contrast Friendly Colors */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all shadow-md ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[12px] font-extrabold uppercase font-sans ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}
            >
              <tr>
                <th className="py-3.5 px-4 font-black">{t.colJobVessel}</th>
                <th className="py-3.5 px-4 font-black">BOOKING / PO</th>
                <th className="py-3.5 px-4 font-black">{t.colAwbBl}</th>
                <th className="py-3.5 px-4 font-black">{t.colSupplierOrigin}</th>
                <th className="py-3.5 px-4 font-black">{t.colMode}</th>
                <th className="py-3.5 px-4 font-black">{t.colEta}</th>
                <th className="py-3.5 px-3 font-black">{language === 'th' ? 'ระดับความด่วน' : 'Urgency'}</th>
                <th className="py-3.5 px-4 font-black">{t.status}</th>
                <th className="py-3.5 px-4 font-black text-right">{language === 'th' ? 'การดำเนินการ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-700 dark:text-slate-300">
                    <div className="inline-block w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="font-bold">{t.loading}</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-sm">
                      {language === 'th' ? 'ไม่พบรายการพัสดุที่ตรงกับเงื่อนไข' : 'No shipments found matching current filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const job = jobs.find((j) => j.id === s.job_id);
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
                      {/* Job & Vessel */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-xs text-slate-950 dark:text-white line-clamp-1">
                            {s.description_of_goods || job?.job_name || 'Marine Spare Part'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="font-extrabold text-xs text-cyan-900 dark:text-cyan-300">
                              {job?.vessel || 'Vessel'}
                            </span>
                            <span className="font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300">
                              ({job?.job_no || 'Job'})
                            </span>

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
                      </td>

                      {/* Booking / PO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-black text-blue-950 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs border border-blue-200 dark:border-blue-800">
                            {s.booking_no || 'BKG-2026-0914'}
                          </span>
                          <span className="font-mono font-black text-emerald-950 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-200 dark:border-emerald-800">
                            {s.po_no || 'PO-770413'}
                          </span>
                        </div>
                      </td>

                      {/* AWB/BL */}
                      <td className="py-3.5 px-4 font-mono font-black text-xs text-slate-950 dark:text-slate-100 whitespace-nowrap">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                          {s.awb_bl}
                        </span>
                      </td>

                      {/* Supplier & Origin */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-950 dark:text-white text-xs">{s.supplier}</span>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{s.origin}</span>
                        </div>
                      </td>

                      {/* Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-950 dark:text-white">
                          {s.mode === 'AIR' && <Plane className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />}
                          {s.mode === 'SEA' && <Anchor className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                          {s.mode === 'LAND' && <Truck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                          {s.mode}
                        </span>
                      </td>

                      {/* ETA */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {new Date(s.eta).toLocaleDateString()}
                      </td>

                      {/* Urgency Level (CRITICAL / URGENT / NORMAL) - SRM & Admin can modify */}
                      <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={s.urgency || s.urgency_level || 'NORMAL'}
                          onChange={(e) => handleUpdateUrgency(s.id, e.target.value as any, e)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer focus:outline-hidden ${
                            (s.urgency || s.urgency_level) === 'CRITICAL'
                              ? 'bg-red-100 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-200'
                              : (s.urgency || s.urgency_level) === 'URGENT'
                              ? 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-950 dark:text-amber-200'
                              : isDark
                              ? 'bg-slate-800 text-slate-200 border-slate-700'
                              : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                          }`}
                          title={language === 'th' ? 'ระดับความด่วน (คลิกเพื่อเปลี่ยน)' : 'Urgency Level (Click to change)'}
                        >
                          <option value="NORMAL">ปกติ</option>
                          <option value="URGENT">ด่วน</option>
                          <option value="CRITICAL">ด่วนมาก</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                                : 'bg-cyan-600 dark:bg-cyan-400'
                            }`}
                          ></span>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isReceived ? (
                            <button
                              type="button"
                              onClick={(e) => handleUpdateStatus(s.id, 'RECEIVED', e)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                              title={language === 'th' ? 'เปลี่ยนสถานะเป็นได้รับแล้ว' : 'Mark Received'}
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

                          {/* ADMIN ONLY: Edit & Delete buttons */}
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditShipment(s, e)}
                                className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-cyan-700 hover:border-cyan-500 transition-colors cursor-pointer"
                                title={language === 'th' ? 'แก้ไข Shipment (Admin)' : 'Edit Shipment (Admin)'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingShipment(s);
                                }}
                                className="p-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                                title={language === 'th' ? 'ลบ Shipment (Admin)' : 'Delete Shipment (Admin)'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShipment(s);
                            }}
                            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-cyan-700 hover:border-cyan-500 transition-colors cursor-pointer"
                            title={language === 'th' ? 'ดูรายละเอียด' : 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Shipment Details & Status Change Modal */}
      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          job={jobs.find((j) => j.id === selectedShipment.job_id)}
          onClose={() => setSelectedShipment(null)}
          onUpdated={loadData}
        />
      )}

      {/* New Shipment Modal for Admin */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header: matches screenshot exactly */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
                <Package className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                <span>{language === 'th' ? 'ลงทะเบียน Shipment ใหม่' : 'New Shipment Registration'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner in Modal if INSERT fails */}
            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <span className="font-bold block mb-0.5">
                    {language === 'th' ? 'บันทึกข้อมูลไม่สำเร็จ:' : 'Failed to save shipment:'}
                  </span>
                  <span className="break-all font-mono text-[11px]">{modalError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateShipment} className="mt-4 space-y-3.5 text-xs">
              {/* 1. เลือกโครงการเรือเป้าหมาย */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {language === 'th' ? 'เลือกโครงการเรือเป้าหมาย' : 'Target Shipyard Job'}
                </label>
                <select
                  required
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer transition-all ${
                    isDark ? 'bg-slate-800/90 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                >
                  <option value="">{language === 'th' ? '-- เลือกงานเรือ --' : '-- Select Vessel Job --'}</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_no} - {j.vessel}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. ระดับความด่วน (Urgency) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {language === 'th' ? 'ระดับความด่วน (Urgency)' : 'Urgency Level'}
                </label>
                <select
                  value={urgency}
                  onChange={(e: any) => setUrgency(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer transition-all ${
                    isDark ? 'bg-slate-800/90 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                >
                  <option value="NORMAL">📦 NORMAL (ปกติ)</option>
                  <option value="URGENT">⚡ URGENT (ด่วน)</option>
                  <option value="CRITICAL">🚨 CRITICAL (วิกฤต / ฉุกเฉิน)</option>
                </select>
              </div>

              {/* 3. BOOKING NO. | P/O NO. / SUPPLY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    BOOKING NO.
                  </label>
                  <input
                    type="text"
                    placeholder="BKG-2026-XXXX"
                    value={bookingNo}
                    onChange={(e) => setBookingNo(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    P/O NO. / SUPPLY
                  </label>
                  <input
                    type="text"
                    placeholder="PO-XXXXXX"
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    }`}
                  />
                </div>
              </div>

              {/* 4. AWB / B/L NO. * | FLIGHT / VESSEL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    AWB / B/L NO. *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="TG-XXXXXXX / BL-XXXX"
                    value={awbBl}
                    onChange={(e) => setAwbBl(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    FLIGHT / VESSEL
                  </label>
                  <input
                    type="text"
                    placeholder="MV WAN HAI 312 / TG-920"
                    value={flightVessel}
                    onChange={(e) => setFlightVessel(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    }`}
                  />
                </div>
              </div>

              {/* 5. รายการอะไหล่ / คำอธิบาย */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {language === 'th' ? 'รายการอะไหล่ / คำอธิบาย' : 'Description of Goods'}
                </label>
                <input
                  type="text"
                  placeholder="Main Engine Exhaust Valve Spindles & Gaskets"
                  value={descriptionOfGoods}
                  onChange={(e) => setDescriptionOfGoods(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden transition-all ${
                    isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                  }`}
                />
              </div>

              {/* 6. ผู้ผลิต (Supplier) * | ต้นทาง (Origin) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {language === 'th' ? 'ผู้ผลิต (Supplier) *' : 'Supplier *'}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="MAN Energy Solutions / Wärtsilä"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {language === 'th' ? 'ต้นทาง (Origin)' : 'Origin'}
                  </label>
                  <input
                    type="text"
                    placeholder="Copenhagen, Denmark"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    }`}
                  />
                </div>
              </div>

              {/* 7. ประเภทขนส่ง | กำหนดถึง (ETA) | สถานะเริ่มต้น */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {language === 'th' ? 'ประเภทขนส่ง' : 'Mode'}
                  </label>
                  <select
                    value={mode}
                    onChange={(e: any) => setMode(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  >
                    <option value="AIR">AIR (ทางอากาศ)</option>
                    <option value="SEA">SEA (ทางเรือ)</option>
                    <option value="COURIER">COURIER (พัสดุด่วน)</option>
                    <option value="LAND">LAND (ทางบก)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {language === 'th' ? 'กำหนดถึง (ETA)' : 'ETA'}
                  </label>
                  <input
                    type="date"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {language === 'th' ? 'สถานะเริ่มต้น' : 'Initial Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer transition-all ${
                      isDark ? 'bg-slate-800/90 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  >
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="ARRIVING_TODAY">ARRIVING TODAY</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="RECEIVED">RECEIVED</option>
                  </select>
                </div>
              </div>

              {/* 8. Action Buttons: ยกเลิก & บันทึกพัสดุ */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl border font-semibold text-xs cursor-pointer transition-all ${
                    isDark
                      ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
                      : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-cyan-600/20 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>{language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{language === 'th' ? 'บันทึก Shipment' : 'Save Shipment'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ONLY: Edit Shipment Modal */}
      {isAdmin && editingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2 text-slate-900 dark:text-white">
                <Edit2 className="w-5 h-5 text-cyan-500" />
                <span>{language === 'th' ? 'แก้ไขข้อมูล Shipment (Admin)' : 'Edit Shipment (Admin)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingShipment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditShipment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {language === 'th' ? 'โครงการเรือเป้าหมาย' : 'Target Shipyard Job'}
                </label>
                <select
                  required
                  value={editJobId}
                  onChange={(e) => setEditJobId(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">{language === 'th' ? '-- เลือกงานเรือ --' : '-- Select Job --'}</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_no} - {j.vessel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">BOOKING NO.</label>
                  <input
                    type="text"
                    value={editBookingNo}
                    onChange={(e) => setEditBookingNo(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">P/O NO. / SUPPLY</label>
                  <input
                    type="text"
                    value={editPoNo}
                    onChange={(e) => setEditPoNo(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">AWB / B/L NO. *</label>
                  <input
                    required
                    type="text"
                    value={editAwbBl}
                    onChange={(e) => setEditAwbBl(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">FLIGHT / VESSEL</label>
                  <input
                    type="text"
                    value={editFlightVessel}
                    onChange={(e) => setEditFlightVessel(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  {language === 'th' ? 'รายการอะไหล่ / คำอธิบาย' : 'Description of Goods'}
                </label>
                <input
                  type="text"
                  value={editDescriptionOfGoods}
                  onChange={(e) => setEditDescriptionOfGoods(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {language === 'th' ? 'ผู้ผลิต (Supplier) *' : 'Supplier *'}
                  </label>
                  <input
                    required
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {language === 'th' ? 'ต้นทาง (Origin)' : 'Origin'}
                  </label>
                  <input
                    type="text"
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {language === 'th' ? 'ระดับความด่วน' : 'Urgency'}
                  </label>
                  <select
                    value={editUrgency}
                    onChange={(e: any) => setEditUrgency(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="NORMAL">📦 NORMAL</option>
                    <option value="URGENT">⚡ URGENT</option>
                    <option value="CRITICAL">🚨 CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {language === 'th' ? 'สถานะ' : 'Status'}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                    <option value="ARRIVING_TODAY">ARRIVING TODAY</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="RECEIVED">RECEIVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {language === 'th' ? 'กำหนดถึง (ETA)' : 'ETA'}
                  </label>
                  <input
                    type="date"
                    value={editEta}
                    onChange={(e) => setEditEta(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isEditingSubmitting ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (language === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ONLY: Delete Confirmation Modal */}
      {isAdmin && deletingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">
                  {language === 'th' ? 'ยืนยันการลบ Shipment?' : 'Delete Shipment?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'th' ? 'การดำเนินการนี้ไม่สามารถยกเลิกได้' : 'This action cannot be undone.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 mb-5 font-mono">
              AWB/BL: <strong>{deletingShipment.awb_bl}</strong><br />
              Supplier: <strong>{deletingShipment.supplier}</strong>
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingShipment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteShipment}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (language === 'th' ? 'กำลังลบ...' : 'Deleting...') : (language === 'th' ? 'ยืนยันลบ' : 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
