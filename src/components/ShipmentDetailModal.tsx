import React, { useState } from 'react';
import { Shipment, Job, Profile } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { markShipmentReceived, updateShipmentUrgency, adminUpdateShipment, adminDeleteShipment } from '../services/rbacService';
import {
  X,
  Package,
  Ship,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plane,
  Anchor,
  Truck,
  FileText,
  MapPin,
  Save,
  Check,
  Flame,
  Zap,
  Tag,
  Trash2,
  Edit2,
} from 'lucide-react';

interface ShipmentDetailModalProps {
  shipment: Shipment;
  job?: Job;
  assignedSrms?: Profile[];
  onClose: () => void;
  onUpdated: () => void;
}

export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({
  shipment,
  job,
  assignedSrms = [],
  onClose,
  onUpdated,
}) => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const { currentUser, isAdmin } = useAuth();

  const [currentStatus, setCurrentStatus] = useState<string>(shipment.status);
  const [currentUrgency, setCurrentUrgency] = useState<any>(shipment.urgency || 'NORMAL');
  const [receiverNotes, setReceiverNotes] = useState<string>(shipment.receiver_notes || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ADMIN ONLY: Edit mode for general shipment details
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBookingNo, setEditBookingNo] = useState(shipment.booking_no || '');
  const [editPoNo, setEditPoNo] = useState(shipment.po_no || '');
  const [editAwbBl, setEditAwbBl] = useState(shipment.awb_bl || '');
  const [editFlightVessel, setEditFlightVessel] = useState(shipment.flight_vessel || '');
  const [editDescriptionOfGoods, setEditDescriptionOfGoods] = useState(shipment.description_of_goods || '');
  const [editPackageQty, setEditPackageQty] = useState(shipment.package_qty || '');
  const [editSupplier, setEditSupplier] = useState(shipment.supplier || '');
  const [editOrigin, setEditOrigin] = useState(shipment.origin || '');
  const [editDestination, setEditDestination] = useState(shipment.destination || 'Unithai Shipyard Laem Chabang');
  const [editMode, setEditMode] = useState<any>(shipment.mode || 'AIR');
  const [editEta, setEditEta] = useState(shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '');

  // Quick action: Confirm Received (Available to both SRM and Admin)
  const handleQuickReceive = async () => {
    try {
      setSaving(true);
      const res = await markShipmentReceived(shipment.id, currentUser, receiverNotes);
      if (!res.success) {
        alert('Update failed: ' + (res.error || 'Unknown error'));
        return;
      }

      window.dispatchEvent(new CustomEvent('supabase-data-changed'));
      setCurrentStatus('RECEIVED');
      setSaveSuccess(true);
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Error confirming receipt:', err);
      alert('Error confirming receipt: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // ADMIN ONLY: Delete Shipment
  const handleDeleteShipment = async () => {
    if (!isAdmin) return;
    const confirmMsg = language === 'th'
      ? `ยืนยันการลบ Shipment ${shipment.awb_bl}?`
      : `Are you sure you want to delete shipment ${shipment.awb_bl}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSaving(true);
      const res = await adminDeleteShipment(shipment.id, currentUser);
      if (!res.success) {
        alert('Delete failed: ' + (res.error || 'Unknown error'));
        return;
      }

      window.dispatchEvent(new CustomEvent('supabase-data-changed'));
      onUpdated();
      onClose();
    } catch (err: any) {
      alert('Delete error: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Save handler: handles both SRM (Urgency + Received) and ADMIN (Full edit / Status)
  const handleUpdateStatus = async () => {
    try {
      setSaving(true);

      // SECURITY RULE: SRM is allowed to modify ONLY status (to RECEIVED) and urgency level (CRITICAL / URGENT / NORMAL)
      if (!isAdmin) {
        // SRM: update urgency level
        const urgRes = await updateShipmentUrgency(shipment.id, currentUrgency, currentUser);
        if (!urgRes.success) {
          alert('Update failed: ' + urgRes.error);
          return;
        }

        // If user also marked as received in this dialog
        if (currentStatus === 'RECEIVED' && shipment.status !== 'RECEIVED') {
          await markShipmentReceived(shipment.id, currentUser);
        }
      } else {
        // ADMIN: full update capability
        if (isEditMode) {
          const updates: Partial<Shipment> = {
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
            urgency: currentUrgency,
            status: currentStatus as any,
            eta: editEta ? new Date(editEta).toISOString() : shipment.eta,
            received_date: currentStatus === 'RECEIVED' ? (shipment.received_date || new Date().toISOString()) : null,
            receiver_notes: receiverNotes,
          };

          const res = await adminUpdateShipment(shipment.id, updates, currentUser);
          if (!res.success) {
            alert('Update failed: ' + res.error);
            return;
          }
        } else {
          const isReceived = currentStatus === 'RECEIVED';
          const now = new Date().toISOString();

          const { error: updateErr } = await supabase.from('shipments').update({
            status: currentStatus,
            urgency: currentUrgency,
            received_date: isReceived ? (shipment.received_date || now) : null,
            receiver_name: isReceived ? (shipment.receiver_name || currentUser?.full_name) : null,
            receiver_notes: receiverNotes,
          }).eq('id', shipment.id);

          if (updateErr) {
            console.error('Update status error:', updateErr);
            alert('Update failed: ' + updateErr.message);
            return;
          }
        }
      }

      window.dispatchEvent(new CustomEvent('supabase-data-changed'));
      setSaveSuccess(true);
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Error updating status: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl transition-all ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
        }`}
      >
        {/* Header (High Contrast) */}
        <div
          className={`sticky top-0 z-10 px-5 py-4 border-b flex items-start justify-between gap-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-950 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-700">
                {job?.job_no || '26-R-XXXX'}
              </span>
              <span className="font-black text-sm sm:text-base text-slate-950 dark:text-white flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                <span>{job?.vessel || 'Vessel Name'}</span>
              </span>

              {/* Urgency Badge Header */}
              {currentUrgency === 'CRITICAL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                  🚨 {language === 'th' ? 'ด่วนมาก' : 'CRITICAL'}
                </span>
              )}
              {currentUrgency === 'URGENT' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-600">
                  ⚡ {language === 'th' ? 'ด่วน' : 'URGENT'}
                </span>
              )}
              {currentUrgency === 'NORMAL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  📦 {language === 'th' ? 'ปกติ' : 'NORMAL'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">
              {shipment.description_of_goods || job?.job_name || 'Spare Parts Shipment Record'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              currentStatus === 'RECEIVED'
                ? isDark
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-100'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-950'
                : currentStatus === 'ARRIVING_TODAY'
                ? isDark
                  ? 'bg-cyan-950/60 border-cyan-700 text-cyan-100'
                  : 'bg-cyan-50 border-cyan-400 text-cyan-950'
                : currentStatus === 'DELAYED'
                ? isDark
                  ? 'bg-red-950/60 border-red-700 text-red-100'
                  : 'bg-red-50 border-red-400 text-red-950'
                : isDark
                ? 'bg-blue-950/60 border-blue-700 text-blue-100'
                : 'bg-blue-50 border-blue-400 text-blue-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {currentStatus === 'RECEIVED' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {currentStatus === 'ARRIVING_TODAY' && <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 animate-pulse" />}
              {currentStatus === 'DELAYED' && <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />}
              {currentStatus === 'IN_TRANSIT' && <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
              <div>
                <span className="font-black uppercase font-mono tracking-wider text-xs block">
                  {language === 'th' ? 'สถานะปัจจุบัน: ' : 'Current Status: '}
                  {currentStatus.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold opacity-95">
                  {currentStatus === 'RECEIVED'
                    ? language === 'th'
                      ? `ตรวจรับโดย ${shipment.receiver_name || currentUser?.full_name} (${shipment.received_date ? new Date(shipment.received_date).toLocaleDateString() : 'Today'})`
                      : `Received by ${shipment.receiver_name || currentUser?.full_name}`
                    : language === 'th'
                    ? `กำหนดถึง (ETA): ${new Date(shipment.eta).toLocaleDateString()}`
                    : `Estimated Arrival: ${new Date(shipment.eta).toLocaleDateString()}`}
                </span>
              </div>
            </div>

            {/* Quick Action button for SRM to confirm received */}
            {currentStatus !== 'RECEIVED' && (
              <button
                type="button"
                disabled={saving}
                onClick={handleQuickReceive}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'th' ? 'ตรวจรับพัสดุเข้าอู่ (Mark as Received) ✅' : 'Confirm & Mark as Received ✅'}</span>
              </button>
            )}
          </div>

          {/* Section 1: Documentation & Identifiers */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                <span>{language === 'th' ? 'ข้อมูลเอกสารอ้างอิงและพัสดุ (Documentation)' : 'Documentation & Tracking Numbers'}</span>
              </h4>

              {/* ADMIN ONLY: Toggle Edit General Information */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    isEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-600'
                      : 'border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditMode ? (language === 'th' ? 'ยกเลิกโหมดแก้ไข' : 'Cancel Edit') : (language === 'th' ? 'แก้ไขข้อมูล (Admin)' : 'Edit Details (Admin)')}</span>
                </button>
              )}
            </div>

            {/* If ADMIN is in Edit Mode: render editable inputs */}
            {isAdmin && isEditMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      BOOKING NO.
                    </label>
                    <input
                      type="text"
                      value={editBookingNo}
                      onChange={(e) => setEditBookingNo(e.target.value)}
                      className={`w-full p-2 text-xs font-mono rounded-lg border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      P/O NO. / SUPPLY
                    </label>
                    <input
                      type="text"
                      value={editPoNo}
                      onChange={(e) => setEditPoNo(e.target.value)}
                      className={`w-full p-2 text-xs font-mono rounded-lg border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      AWB / B/L NO. *
                    </label>
                    <input
                      type="text"
                      required
                      value={editAwbBl}
                      onChange={(e) => setEditAwbBl(e.target.value)}
                      className={`w-full p-2 text-xs font-mono rounded-lg border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      FLIGHT / VESSEL
                    </label>
                    <input
                      type="text"
                      value={editFlightVessel}
                      onChange={(e) => setEditFlightVessel(e.target.value)}
                      className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'th' ? 'รายการอะไหล่ / คำอธิบาย' : 'Description of Goods'}
                  </label>
                  <input
                    type="text"
                    value={editDescriptionOfGoods}
                    onChange={(e) => setEditDescriptionOfGoods(e.target.value)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PACKAGE & WEIGHT
                    </label>
                    <input
                      type="text"
                      value={editPackageQty}
                      onChange={(e) => setEditPackageQty(e.target.value)}
                      className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      MODE OF TRANSPORT
                    </label>
                    <select
                      value={editMode}
                      onChange={(e: any) => setEditMode(e.target.value)}
                      className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="AIR">AIR</option>
                      <option value="SEA">SEA</option>
                      <option value="COURIER">COURIER</option>
                      <option value="LAND">LAND</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* SRM & Non-Edit Mode: Strictly READ-ONLY spans */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    BOOKING NO.
                  </span>
                  <span className="font-mono font-black text-blue-950 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs border border-blue-200 dark:border-blue-800 inline-block">
                    {shipment.booking_no || 'BKG-2026-0914'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    P/O NO. / SUPPLY
                  </span>
                  <span className="font-mono font-black text-emerald-950 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs border border-emerald-200 dark:border-emerald-800 inline-block">
                    {shipment.po_no || 'PO-770413'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    AWB / B/L NO.
                  </span>
                  <span className="font-mono font-black text-slate-950 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-300 dark:border-slate-700 inline-block">
                    {shipment.awb_bl}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    FLIGHT / VESSEL
                  </span>
                  <span className="font-bold text-slate-950 dark:text-white text-xs">
                    {shipment.flight_vessel || 'MV WAN HAI / TG-920'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    PACKAGE & WEIGHT
                  </span>
                  <span className="font-bold text-slate-950 dark:text-white text-xs">
                    {shipment.package_qty || '2 Wooden Crates (140 kg)'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    MODE OF TRANSPORT
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-black text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-950 dark:text-white">
                    {shipment.mode === 'AIR' && <Plane className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />}
                    {shipment.mode === 'SEA' && <Anchor className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                    {shipment.mode === 'LAND' && <Truck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                    {shipment.mode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Logistics & Supplier Info */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span>{language === 'th' ? 'ต้นทางและปลายทาง (Logistics & Route)' : 'Logistics Route & Supplier'}</span>
            </h4>

            {isAdmin && isEditMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'th' ? 'ผู้ผลิต (Supplier) *' : 'Supplier *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2 mb-1">
                    {language === 'th' ? 'ต้นทาง (Origin)' : 'Origin'}
                  </label>
                  <input
                    type="text"
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'th' ? 'จุดหมายปลายทาง (Destination)' : 'Destination'}
                  </label>
                  <input
                    type="text"
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-hidden ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2 mb-1">
                    {language === 'th' ? 'กำหนดถึง (ETA)' : 'ETA'}
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
              </div>
            ) : (
              /* SRM: Strictly READ-ONLY */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    {language === 'th' ? 'ผู้ผลิต / ซัพพลายเออร์ (Supplier)' : 'Shipper / Supplier'}
                  </span>
                  <span className="font-black text-slate-950 dark:text-white text-xs block">
                    {shipment.supplier}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block font-mono">
                    {shipment.origin}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    {language === 'th' ? 'จุดหมายปลายทางในอู่เรือ (Destination)' : 'Yard Destination'}
                  </span>
                  <span className="font-black text-slate-950 dark:text-white text-xs block">
                    {shipment.destination}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block">
                    Unithai Shipyard Laem Chabang Deep Sea Port
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Status Changer & Urgency for User */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
            }`}
          >
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Save className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span>{language === 'th' ? 'ปรับปรุงสถานะและระดับความด่วน (Update Status & Urgency)' : 'Update Status & Urgency'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {/* Urgency selector: Critical, Urgent, Normal (Allowed for both SRM and Admin) */}
              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1 text-xs">
                  {language === 'th' ? 'ระดับความด่วน (Urgency)' : 'Urgency Level'}
                </label>
                <select
                  value={currentUrgency}
                  onChange={(e: any) => setCurrentUrgency(e.target.value)}
                  className={`w-full p-2.5 text-xs font-black rounded-xl border focus:outline-hidden ${
                    currentUrgency === 'CRITICAL'
                      ? 'bg-red-100 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-200'
                      : currentUrgency === 'URGENT'
                      ? 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-950 dark:text-amber-200'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                >
                  <option value="NORMAL">ปกติ</option>
                  <option value="URGENT">ด่วน</option>
                  <option value="CRITICAL">ด่วนมาก</option>
                </select>
              </div>

              {/* Status Section: Admin sees full dropdown; SRM sees Mark as Received or Received badge */}
              {isAdmin ? (
                <>
                  {/* Status Selector for ADMIN */}
                  <div>
                    <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1 text-xs">
                      {language === 'th' ? 'เลือกสถานะ (Status - ADMIN)' : 'Select Status (Admin)'}
                    </label>
                    <select
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      className={`w-full p-2.5 text-xs font-black rounded-xl border focus:outline-hidden ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-950'
                      }`}
                    >
                      <option value="IN_TRANSIT">IN TRANSIT (กำลังเดินทาง)</option>
                      <option value="ARRIVING_TODAY">ARRIVING TODAY (ถึงท่าเรือวันนี้ / รอเคลียร์)</option>
                      <option value="DELAYED">DELAYED (ล่าช้ากว่ากำหนด)</option>
                      <option value="RECEIVED">RECEIVED (ได้รับเข้าอู่เรือแล้ว ✅)</option>
                    </select>
                  </div>

                  {/* Notes / Storage Location for ADMIN */}
                  <div>
                    <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1 text-xs">
                      {language === 'th' ? 'บันทึกการจัดเก็บ / ผู้รับ (Notes / Location)' : 'Notes / Storage Location'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'th' ? 'เช่น ตรวจรับแล้ว เก็บเข้า Toolroom 1' : 'e.g. Stored in Toolroom No.1'}
                      value={receiverNotes}
                      onChange={(e) => setReceiverNotes(e.target.value)}
                      className={`w-full p-2.5 text-xs font-medium rounded-xl border focus:outline-hidden ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-500'
                      }`}
                    />
                  </div>
                </>
              ) : (
                /* SRM Receiving Status Control */
                <div className="sm:col-span-2">
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1 text-xs">
                    {language === 'th' ? 'การตรวจรับเข้าอู่เรือ (Receiving Status)' : 'Receiving Confirmation'}
                  </label>
                  {currentStatus !== 'RECEIVED' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleQuickReceive}
                      className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{language === 'th' ? 'ตรวจรับพัสดุเข้าอู่ (Mark as Received) ✅' : 'Confirm & Mark as Received ✅'}</span>
                    </button>
                  ) : (
                    <div className="w-full p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 font-black text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>RECEIVED — ตรวจรับอะไหล่เรียบร้อยแล้ว</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                        {shipment.received_date ? new Date(shipment.received_date).toLocaleDateString() : 'Confirmed'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/20 text-emerald-950 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  {language === 'th' ? 'บันทึกการเปลี่ยนแปลงสถานะเรียบร้อยแล้ว!' : 'Status successfully updated!'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-4 border-t flex items-center justify-between gap-2.5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}
        >
          <div>
            {/* ADMIN ONLY: Delete button */}
            {isAdmin && (
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteShipment}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                title={language === 'th' ? 'ลบ Shipment นี้ออกจากระบบ' : 'Delete this shipment'}
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'th' ? 'ลบ Shipment' : 'Delete Shipment'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              {t.close}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleUpdateStatus}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {!isAdmin
                  ? (language === 'th' ? 'บันทึกระดับความด่วน (Save Urgency)' : 'Save Urgency Level')
                  : (language === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
