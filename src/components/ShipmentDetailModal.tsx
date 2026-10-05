import React, { useState } from 'react';
import { Shipment, Job, Profile } from '../types/database';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
  const { currentUser } = useAuth();

  const [currentStatus, setCurrentStatus] = useState<string>(shipment.status);
  const [currentUrgency, setCurrentUrgency] = useState<any>(shipment.urgency || 'NORMAL');
  const [receiverNotes, setReceiverNotes] = useState<string>(shipment.receiver_notes || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick action: Confirm Received by user
  const handleQuickReceive = async () => {
    try {
      setSaving(true);
      const now = new Date().toISOString();
      const receiverName = currentUser?.full_name || 'SRM Officer';
      const notes = receiverNotes || (language === 'th' ? 'ตรวจรับพัสดุและจัดเก็บเข้าอู่เรือเรียบร้อย' : 'Received and stored in shipyard toolroom');

      const { error: updateErr } = await supabase.from('shipments').update({
        status: 'RECEIVED',
        received_date: now,
        receiver_name: receiverName,
        receiver_notes: notes,
      }).eq('id', shipment.id);

      if (updateErr) {
        console.error('Confirm receipt error:', updateErr);
        alert('Update failed: ' + updateErr.message);
        return;
      }

      // Create a notification for the team
      if (currentUser?.id) {
        try {
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            type: 'SHIPMENT_RECEIVED',
            title: language === 'th' ? `ตรวจรับอะไหล่สำเร็จ: ${shipment.awb_bl}` : `Spare Part Received: ${shipment.awb_bl}`,
            message: language === 'th'
              ? `คุณ ${receiverName} ได้ทำการตรวจรับอะไหล่สำหรับ ${job?.vessel || 'Vessel'} (${job?.job_no || ''}) เรียบร้อยแล้ว`
              : `${receiverName} confirmed receipt of spare parts for ${job?.vessel || 'Vessel'} (${job?.job_no || ''}).`,
            is_read: false,
          });
        } catch (notifErr) {
          console.warn('Notice: notification insert skipped:', notifErr);
        }
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

  // Custom status update
  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
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
                  🚨 CRITICAL (วิกฤต)
                </span>
              )}
              {currentUrgency === 'URGENT' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-600">
                  ⚡ ด่วน (URGENT)
                </span>
              )}
              {currentUrgency === 'NORMAL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  📦 ปกติ (NORMAL)
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

            {/* Quick Action button for USER to confirm received */}
            {currentStatus !== 'RECEIVED' && (
              <button
                type="button"
                disabled={saving}
                onClick={handleQuickReceive}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'th' ? 'คลิกเมื่อได้รับอะไหล่แล้ว ✅' : 'Confirm Spare Part Received'}</span>
              </button>
            )}
          </div>

          {/* Section 1: Documentation & Identifiers (High Contrast, Bold, Friendly) */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span>{language === 'th' ? 'ข้อมูลเอกสารอ้างอิงและพัสดุ (Documentation)' : 'Documentation & Tracking Numbers'}</span>
            </h4>

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
              {/* Urgency selector: Critical, Urgent, Normal */}
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
                  <option value="CRITICAL">🚨 CRITICAL (วิกฤต / ฉุกเฉิน)</option>
                  <option value="URGENT">⚡ URGENT (ด่วน)</option>
                  <option value="NORMAL">📦 NORMAL (ปกติ)</option>
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1 text-xs">
                  {language === 'th' ? 'เลือกสถานะ (Status)' : 'Select Status'}
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

              {/* Notes / Storage Location */}
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
          className={`px-5 py-4 border-t flex items-center justify-end gap-2.5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}
        >
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
            <span>{language === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Status Change'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
