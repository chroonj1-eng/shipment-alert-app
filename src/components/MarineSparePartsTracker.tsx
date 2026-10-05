import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SparePart, Job, UrgencyLevel, StockStatus } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Ship,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  MapPin,
  Tag,
  Building,
  ArrowUpDown,
  X,
  Save,
  PlusCircle,
  MinusCircle,
  Layers,
  Filter,
} from 'lucide-react';

export const MarineSparePartsTracker: React.FC = () => {
  const { isDark } = useTheme();
  const { currentUser, isAdmin } = useAuth();
  const { t, language } = useLanguage();

  const [parts, setParts] = useState<SparePart[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL');
  const [selectedJobId, setSelectedJobId] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'stock' | 'partNo' | 'urgency'>('urgency');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [partNo, setPartNo] = useState('');
  const [partName, setPartName] = useState('');
  const [category, setCategory] = useState('Main Engine');
  const [jobId, setJobId] = useState('');
  const [quantityInStock, setQuantityInStock] = useState(1);
  const [minQuantity, setMinQuantity] = useState(2);
  const [unit, setUnit] = useState('PCS');
  const [location, setLocation] = useState('Toolroom No.1 / Rack A-01');
  const [urgency, setUrgency] = useState<UrgencyLevel>('NORMAL');
  const [supplier, setSupplier] = useState('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Delete Confirmation Modal
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);

  // Load Data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch Jobs
      const { data: jobsData } = await supabase.from('jobs').select('*').order('job_no', { ascending: true });
      if (jobsData) setJobs(jobsData);

      // Fetch Spare Parts
      const { data: partsData, error } = await supabase.from('spare_parts').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Notice: spare_parts table query notice:', error.message);
      } else if (partsData) {
        setParts(partsData);
      }
    } catch (err) {
      console.error('Error loading spare parts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to custom cross-component data change event
    const handleDataChanged = () => {
      console.log('[MarineSparePartsTracker] supabase-data-changed event received, reloading...');
      loadData();
    };
    window.addEventListener('supabase-data-changed', handleDataChanged);

    // Supabase Realtime channel for live updates
    const channel = supabase
      .channel('spare-parts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spare_parts' },
        () => loadData()
      )
      .subscribe();

    return () => {
      window.removeEventListener('supabase-data-changed', handleDataChanged);
      supabase.removeChannel(channel);
    };
  }, []);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setModalError(null);
    setEditingPart(null);
    setPartNo('');
    setPartName('');
    setCategory('Main Engine');
    setJobId(jobs[0]?.id || '');
    setQuantityInStock(1);
    setMinQuantity(2);
    setUnit('PCS');
    setLocation('Toolroom No.1 / Shelf A-01');
    setUrgency('NORMAL');
    setSupplier('');
    setUnitCost('');
    setNotes('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (part: SparePart) => {
    setModalError(null);
    setEditingPart(part);
    setPartNo(part.part_no);
    setPartName(part.part_name);
    setCategory(part.category);
    setJobId(part.job_id || '');
    setQuantityInStock(part.quantity_in_stock);
    setMinQuantity(part.min_quantity);
    setUnit(part.unit);
    setLocation(part.location);
    setUrgency(part.urgency);
    setSupplier(part.supplier);
    setUnitCost(part.unit_cost ?? '');
    setNotes(part.notes || '');
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // SECURITY CHECK: Only ADMIN is permitted to add or edit spare parts
    if (!isAdmin) {
      setModalError(language === 'th' ? 'ไม่มีสิทธิ์: เฉพาะ ADMIN เท่านั้น' : 'Access Denied: Only ADMIN can modify spare parts.');
      return;
    }

    if (!partNo.trim() || !partName.trim()) {
      setModalError(language === 'th' ? 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน' : 'Please fill in required fields (*)');
      return;
    }

    // Calculate Stock Status
    let computedStatus: StockStatus = 'IN_STOCK';
    if (quantityInStock === 0) {
      computedStatus = 'OUT_OF_STOCK';
    } else if (quantityInStock <= minQuantity) {
      computedStatus = 'LOW_STOCK';
    }

    const payload = {
      part_no: partNo.trim().toUpperCase(),
      part_name: partName.trim(),
      category,
      job_id: jobId || null,
      quantity_in_stock: Number(quantityInStock),
      min_quantity: Number(minQuantity),
      unit: unit.trim().toUpperCase(),
      location: location.trim(),
      urgency,
      status: computedStatus,
      supplier: supplier.trim(),
      unit_cost: unitCost !== '' ? Number(unitCost) : null,
      notes: notes.trim(),
    };

    if (editingPart) {
      // Update
      const { error } = await supabase.from('spare_parts').update(payload).eq('id', editingPart.id);
      if (error) {
        console.error('Update spare part error:', error);
        setModalError(`Failed to update spare part: ${error.message}`);
        return;
      }
    } else {
      // Insert
      const { data, error } = await supabase.from('spare_parts').insert(payload).select();
      if (error) {
        console.error('Insert spare part error:', error);
        setModalError(`Failed to save spare part: ${error.message}. Ensure table public.spare_parts exists.`);
        return;
      }
      if (data && data.length > 0) {
        setParts((prev) => [data[0], ...prev]);
      }
    }

    setIsModalOpen(false);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  // Quick adjust stock quantity (+1 or -1) - Only ADMIN permitted
  const handleAdjustStock = async (part: SparePart, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const newQty = Math.max(0, part.quantity_in_stock + delta);
    let newStatus: StockStatus = 'IN_STOCK';
    if (newQty === 0) newStatus = 'OUT_OF_STOCK';
    else if (newQty <= part.min_quantity) newStatus = 'LOW_STOCK';

    await supabase.from('spare_parts').update({
      quantity_in_stock: newQty,
      status: newStatus,
    }).eq('id', part.id);

    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  // Delete Part - Only ADMIN permitted
  const handleDeleteConfirm = async () => {
    if (!isAdmin || !deletingPartId) return;
    await supabase.from('spare_parts').delete().eq('id', deletingPartId);
    setDeletingPartId(null);
    await loadData();
    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
  };

  // Categories list
  const categories = [
    'Main Engine',
    'Auxiliary Engine',
    'Propeller & Stern Tube',
    'Hydraulics & Pumps',
    'Electrical & Automation',
    'Hull & Deck Machinery',
    'Safety & Firefighting',
  ];

  // Filtering
  const filteredParts = parts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const relatedJob = jobs.find((j) => j.id === p.job_id);

    const matchesSearch =
      p.part_no.toLowerCase().includes(q) ||
      p.part_name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      (relatedJob && (relatedJob.vessel.toLowerCase().includes(q) || relatedJob.job_no.toLowerCase().includes(q)));

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'ALL' || p.urgency === selectedUrgency;
    const matchesStock =
      selectedStockStatus === 'ALL' ||
      (selectedStockStatus === 'LOW_STOCK' && p.quantity_in_stock <= p.min_quantity && p.quantity_in_stock > 0) ||
      (selectedStockStatus === 'OUT_OF_STOCK' && p.quantity_in_stock === 0) ||
      (selectedStockStatus === 'IN_STOCK' && p.quantity_in_stock > p.min_quantity);
    const matchesJob = selectedJobId === 'ALL' || p.job_id === selectedJobId;

    return matchesSearch && matchesCategory && matchesUrgency && matchesStock && matchesJob;
  });

  // Sorting
  filteredParts.sort((a, b) => {
    if (sortField === 'stock') {
      return sortAsc ? a.quantity_in_stock - b.quantity_in_stock : b.quantity_in_stock - a.quantity_in_stock;
    }
    if (sortField === 'partNo') {
      return sortAsc ? a.part_no.localeCompare(b.part_no) : b.part_no.localeCompare(a.part_no);
    }
    if (sortField === 'urgency') {
      const rank = { CRITICAL: 3, URGENT: 2, NORMAL: 1 };
      const rankA = rank[a.urgency] || 0;
      const rankB = rank[b.urgency] || 0;
      return sortAsc ? rankB - rankA : rankA - rankB;
    }
    return sortAsc ? a.part_name.localeCompare(b.part_name) : b.part_name.localeCompare(a.part_name);
  });

  // KPI Metrics
  const totalPartTypes = parts.length;
  const totalStockUnits = parts.reduce((acc, curr) => acc + curr.quantity_in_stock, 0);
  const lowStockCount = parts.filter((p) => p.quantity_in_stock <= p.min_quantity && p.quantity_in_stock > 0).length;
  const outOfStockCount = parts.filter((p) => p.quantity_in_stock === 0).length;
  const criticalSparesCount = parts.filter((p) => p.urgency === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-600/15 text-cyan-900 dark:text-cyan-300 border border-cyan-500/30 mb-1.5 uppercase">
            <Package className="w-3.5 h-3.5" />
            <span>UNITHAI SHIPYARD • MARINE SPARE PARTS TRACKER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {language === 'th' ? 'ระบบบริหารและติดตามอะไหล่เรือ (Marine Spare Parts Tracker)' : 'Marine Spare Parts Tracker & Inventory'}
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
            {language === 'th'
              ? 'จัดการสต็อกอะไหล่เครื่องกลเรือ เพิ่ม/แก้ไข/ลบ ตรวจสอบจำนวนคงเหลือ และเชื่อมโยงโครงการซ่อมเรือ'
              : 'Track vessel machinery spares, monitor stock on hand, record adjustments, and manage reorders.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addPartBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards (High Contrast, Bold, Friendly) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Total Part Catalog */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
            <span>{language === 'th' ? 'รายการอะไหล่ทั้งหมด' : 'Total Part Catalog'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
            {loading ? '...' : totalPartTypes}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ชนิดอะไหล่ในแคตตาล็อก' : 'Distinct part numbers'}
          </span>
        </div>

        {/* Stat 2: Total Units In Stock */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>{language === 'th' ? 'ยอดอะไหล่คงเหลือรวม' : 'Total Stock On Hand'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-800 dark:text-emerald-400">
            {loading ? '...' : `${totalStockUnits}`}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ชิ้น/ชุด พร้อมใช้งานในอู่' : 'Units available in yard'}
          </span>
        </div>

        {/* Stat 3: Low & Out of Stock */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{language === 'th' ? 'ใกล้หมด / ต้องสั่งเพิ่ม' : 'Low Stock Reorder'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-800 dark:text-amber-400">
            {loading ? '...' : lowStockCount + outOfStockCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {lowStockCount} {language === 'th' ? 'ใกล้หมด' : 'low'} • {outOfStockCount} {language === 'th' ? 'หมดคลัง' : 'out of stock'}
          </span>
        </div>

        {/* Stat 4: Critical Items */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-700 dark:text-red-400" />
            <span>{language === 'th' ? 'อะไหล่ระดับวิกฤต (Critical)' : 'Critical Spares'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-red-700 dark:text-red-400">
            {loading ? '...' : criticalSparesCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'จำเป็นต่อระบบขับเคลื่อนเรือ' : 'Crucial navigation parts'}
          </span>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div
        className={`p-4 rounded-2xl border transition-all shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          {/* Text Search */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={language === 'th' ? 'ค้นหารหัส, ชื่ออะไหล่, ลำเรือ, คลังจัดเก็บ...' : 'Search part no, description, vessel, bin...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Vessel Filter */}
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className={`p-2 text-xs font-bold rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="ALL">{language === 'th' ? '⚓ ทุกโครงการเรือ' : '⚓ All Vessels'}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.vessel} ({j.job_no})
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`p-2 text-xs font-bold rounded-xl border focus:outline-hidden ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="ALL">{language === 'th' ? '📁 ทุกหมวดหมู่' : '📁 All Categories'}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Urgency Filter */}
            <div className="flex items-center gap-1 text-[11px] font-mono border-l border-slate-300 dark:border-slate-700 pl-2">
              <button
                type="button"
                onClick={() => setSelectedUrgency('ALL')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                  selectedUrgency === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                {t.all}
              </button>
              <button
                type="button"
                onClick={() => setSelectedUrgency('CRITICAL')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                  selectedUrgency === 'CRITICAL'
                    ? 'bg-red-600 text-white border-red-700 animate-pulse'
                    : 'bg-red-100 dark:bg-red-950/40 text-red-950 dark:text-red-300 border-red-300 dark:border-red-800'
                }`}
              >
                🚨 CRITICAL
              </button>
              <button
                type="button"
                onClick={() => setSelectedUrgency('URGENT')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                  selectedUrgency === 'URGENT'
                    ? 'bg-amber-400 text-slate-950 border-amber-600'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                ⚡ ด่วน
              </button>
              <button
                type="button"
                onClick={() => setSelectedUrgency('NORMAL')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                  selectedUrgency === 'NORMAL'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                📦 ปกติ
              </button>
            </div>

            {/* Stock Level Filter */}
            <div className="flex items-center gap-1 text-[11px] font-mono border-l border-slate-300 dark:border-slate-700 pl-2">
              <button
                type="button"
                onClick={() => setSelectedStockStatus('ALL')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                  selectedStockStatus === 'ALL'
                    ? 'bg-cyan-700 text-white border-cyan-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                {language === 'th' ? 'ทุกสถานะ' : 'All Stock'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedStockStatus('LOW_STOCK')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                  selectedStockStatus === 'LOW_STOCK'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                ⚠️ {language === 'th' ? 'ใกล้หมด' : 'Low Stock'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedStockStatus('OUT_OF_STOCK')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                  selectedStockStatus === 'OUT_OF_STOCK'
                    ? 'bg-red-600 text-white border-red-700 font-black'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-950 dark:text-red-300 border-red-300 dark:border-red-800'
                }`}
              >
                ❌ {language === 'th' ? 'หมดคลัง' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spare Parts Main Inventory Table (High Contrast, Bold, Friendly) */}
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
                {/* 1. Part No & Details */}
                <th
                  onClick={() => {
                    setSortField('partNo');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 font-black cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-400 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.partNo} / {t.partName}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 2. Vessel / Project */}
                <th className="py-3.5 px-3 font-black">
                  <div className="flex items-center gap-1">
                    <Ship className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                    <span>{language === 'th' ? 'ลำเรือ / โครงการ' : 'Vessel / Job'}</span>
                  </div>
                </th>

                {/* 3. Category */}
                <th className="py-3.5 px-3 font-black">{t.partCategory}</th>

                {/* 4. Stock Remaining (แสดงจำนวนคงเหลือ) */}
                <th
                  onClick={() => {
                    setSortField('stock');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 font-black cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{t.stockQuantity}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 5. Storage Location */}
                <th className="py-3.5 px-3 font-black">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                    <span>{t.storageLocation}</span>
                  </div>
                </th>

                {/* 6. Urgency */}
                <th
                  onClick={() => {
                    setSortField('urgency');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-3 font-black cursor-pointer hover:text-red-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{language === 'th' ? 'ความด่วน' : 'Urgency'}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </div>
                </th>

                {/* 7. Supplier */}
                <th className="py-3.5 px-3 font-black">{language === 'th' ? 'ผู้ผลิต / ซัพพลายเออร์' : 'Supplier'}</th>

                {/* 8. Quick Actions (Stock In/Out, Edit, Delete) - Only ADMIN */}
                {isAdmin && (
                  <th className="py-3.5 px-4 font-black text-right">{t.actions}</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-700 dark:text-slate-300">
                    <div className="inline-block w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="font-bold">{t.loading}</p>
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-sm">
                      {language === 'th' ? 'ไม่พบรายการอะไหล่ที่ตรงกับเงื่อนไขการค้นหา' : 'No spare parts match current filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const relatedJob = jobs.find((j) => j.id === part.job_id);
                  const isLow = part.quantity_in_stock <= part.min_quantity && part.quantity_in_stock > 0;
                  const isOut = part.quantity_in_stock === 0;

                  return (
                    <tr
                      key={part.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/80' : 'hover:bg-cyan-50/60'
                      }`}
                    >
                      {/* 1. Part No & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-xs text-cyan-950 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800 w-fit">
                            {part.part_no}
                          </span>
                          <span className="font-black text-xs text-slate-950 dark:text-white mt-1 leading-snug">
                            {part.part_name}
                          </span>
                          {part.notes && (
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 italic mt-0.5">
                              {part.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Vessel / Job */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xs text-slate-950 dark:text-slate-100">
                            {relatedJob?.vessel || 'General Shipyard Stock'}
                          </span>
                          {relatedJob && (
                            <span className="font-mono font-bold text-[10px] text-slate-600 dark:text-slate-400">
                              {relatedJob.job_no}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                          {part.category}
                        </span>
                      </td>

                      {/* 4. Stock Remaining (แสดงจำนวนคงเหลือ & ปรับเพิ่มลด) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            {/* Prominent Stock Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border inline-flex items-center gap-1 ${
                                isOut
                                  ? 'bg-red-100 text-red-950 border-red-400 dark:bg-red-950/70 dark:text-red-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950/70 dark:text-amber-200'
                                  : 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-200'
                              }`}
                            >
                              <span>{part.quantity_in_stock}</span>
                              <span className="text-[10px]">{part.unit}</span>
                            </span>

                            {/* Min Level Alert */}
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                              Min: {part.min_quantity} {part.unit}
                            </span>
                          </div>

                          {/* Quick Adjust Buttons - ADMIN ONLY */}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleAdjustStock(part, 1, e)}
                                className="p-1 rounded bg-slate-200 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                                title={language === 'th' ? 'รับเข้า +1' : 'Stock in +1'}
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={part.quantity_in_stock <= 0}
                                onClick={(e) => handleAdjustStock(part, -1, e)}
                                className="p-1 rounded bg-slate-200 hover:bg-amber-600 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-600 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer disabled:opacity-30"
                                title={language === 'th' ? 'เบิกจ่าย -1' : 'Stock out -1'}
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Location */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400 shrink-0" />
                          <span>{part.location}</span>
                        </span>
                      </td>

                      {/* 6. Urgency */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {part.urgency === 'CRITICAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                            🚨 CRITICAL
                          </span>
                        )}
                        {part.urgency === 'URGENT' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-600">
                            ⚡ ด่วน
                          </span>
                        )}
                        {part.urgency === 'NORMAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                            📦 ปกติ
                          </span>
                        )}
                      </td>

                      {/* 7. Supplier */}
                      <td className="py-3.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {part.supplier}
                      </td>

                      {/* 8. Actions (Edit & Delete) - Only ADMIN */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(part)}
                              className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-cyan-700 hover:border-cyan-500 transition-colors cursor-pointer"
                              title={t.editPartBtn}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingPartId(part.id)}
                              className="p-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                              title={t.deletePartBtn}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
                <span>{editingPart ? t.editPartBtn : t.addPartBtn}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 font-bold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {t.partNo} *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. ME-EXH-4012"
                    value={partNo}
                    onChange={(e) => setPartNo(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono font-bold rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {t.partCategory} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                  {t.partName} *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Main Engine Exhaust Valve Spindle (Nimonic Alloy)"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {language === 'th' ? 'โครงการเรือเป้าหมาย' : 'Assigned Vessel / Job'}
                  </label>
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  >
                    <option value="">{language === 'th' ? '-- สต็อกส่วนกลางอู่เรือ (General) --' : '-- General Yard Stock --'}</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.vessel} ({j.job_no})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {language === 'th' ? 'ระดับความด่วน (Urgency)' : 'Urgency Level'}
                  </label>
                  <select
                    value={urgency}
                    onChange={(e: any) => setUrgency(e.target.value)}
                    className={`w-full p-2.5 text-xs font-black rounded-xl border focus:outline-hidden ${
                      urgency === 'CRITICAL'
                        ? 'bg-red-100 text-red-950 border-red-500'
                        : urgency === 'URGENT'
                        ? 'bg-amber-100 text-amber-950 border-amber-500'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  >
                    <option value="CRITICAL">🚨 CRITICAL (วิกฤต / ฉุกเฉิน)</option>
                    <option value="URGENT">⚡ URGENT (ด่วน)</option>
                    <option value="NORMAL">📦 NORMAL (ปกติ)</option>
                  </select>
                </div>
              </div>

              {/* Stock Numbers (จำนวนคงเหลือ & เกณฑ์สต็อกขั้นต่ำ) */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-black mb-1">
                    {t.stockQuantity} *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={quantityInStock}
                    onChange={(e) => setQuantityInStock(Number(e.target.value))}
                    className={`w-full p-2 text-xs font-mono font-black rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-black mb-1">
                    {t.minStockLevel} *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    className={`w-full p-2 text-xs font-mono font-black rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-black mb-1">
                    {language === 'th' ? 'หน่วยนับ' : 'Unit'} *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="PCS / SETS / DRUMS"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full p-2 text-xs font-mono font-black rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {t.storageLocation} *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Toolroom No.1 / Rack A-02"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full p-2.5 text-xs font-bold rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {language === 'th' ? 'ผู้ผลิต / ซัพพลายเออร์' : 'Supplier'} *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. MAN Energy Solutions"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className={`w-full p-2.5 text-xs font-bold rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {language === 'th' ? 'ราคาต่อหน่วย (ประมาณการ)' : 'Est. Unit Cost (THB)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full p-2.5 text-xs font-mono font-bold rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    {language === 'th' ? 'หมายเหตุเพิ่มเติม' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Material test cert included"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPart ? language === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes' : language === 'th' ? 'เพิ่มอะไหล่' : 'Add Spare Part'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPartId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
            }`}
          >
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-base">
                {language === 'th' ? 'ยืนยันการลบอะไหล่' : 'Confirm Part Deletion'}
              </h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-4 leading-relaxed">
              {language === 'th'
                ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการอะไหล่นี้ออกจากฐานข้อมูล Supabase? การกระทำนี้ไม่สามารถย้อนกลับได้'
                : 'Are you sure you want to delete this spare part record from the database? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPartId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md"
              >
                {language === 'th' ? 'ยืนยันลบ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
