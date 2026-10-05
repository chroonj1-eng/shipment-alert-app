import React from 'react';
import { SparePartItem } from '../types';
import { Language, translations } from '../i18n/translations';
import { X, Bell, AlertTriangle, UserCheck, MapPin } from 'lucide-react';

interface PartDetailModalProps {
  part: SparePartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerAlert: (part: SparePartItem) => void;
  lang: Language;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({
  part,
  isOpen,
  onClose,
  onTriggerAlert,
  lang,
}) => {
  if (!isOpen || !part) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="ship">🚢</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{part.vesselName}</h3>
                <span className="font-mono text-xs text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  {part.jobNo}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{part.repairProject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Key Product Header */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                  DESCRIPTION OF GOODS
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                  {part.descriptionOfGoods}
                </h4>
                <div className="text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{lang === 'th' ? 'ผู้ส่งมอบ:' : 'Supplier:'} <strong>{part.shipperSupplier}</strong></span>
                  <span>·</span>
                  <span>{lang === 'th' ? 'ประเภท:' : 'Type:'} <strong className="text-cyan-800">{part.type}</strong></span>
                  <span>·</span>
                  <span>{lang === 'th' ? 'เงื่อนไข:' : 'Term:'} <strong className="font-mono">{part.term}</strong></span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onTriggerAlert(part);
                }}
                className="shrink-0 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{t.btnAlertAction}</span>
              </button>
            </div>
          </div>

          {/* Delivery Warning Box */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                  DELIVERY DATE ⚠️ ({lang === 'th' ? 'กำหนดส่งมอบเข้าเรือ' : 'Shipyard Delivery Due'})
                </span>
                <div className="text-sm font-bold font-mono text-amber-900">
                  {part.deliveryDate || '—'}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-amber-800 font-medium">
              <div>{lang === 'th' ? 'สถานะ:' : 'Status:'} {part.status}</div>
              {part.lastNotifiedDate && (
                <div className="text-[10px] text-slate-500">
                  {lang === 'th' ? 'เตือน SRM ล่าสุด:' : 'Last Alerted:'} {part.lastNotifiedDate} ({part.notificationCount} {t.timesUnit})
                </div>
              )}
            </div>
          </div>

          {/* Assigned Engineers */}
          <div>
            <h5 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-cyan-700" />
              <span>{lang === 'th' ? 'SRM, Co-SRM และ In-charge ผู้รับผิดชอบโปรเจคนี้' : 'Assigned SRM, Co-SRM & In-charge Team'}</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 border border-slate-200 rounded-md bg-white">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  SRM
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  {part.srm}
                </span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-md bg-white">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Co-SRM
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  {part.coSrm || '—'}
                </span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-md bg-white">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  In-charge
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  {part.incharge || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Logistics Milestones Grid */}
          <div>
            <h5 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-700" />
              <span>{lang === 'th' ? 'ข้อมูลการเดินทางและพิธีการศุลกากร' : 'Transit & Customs Milestones'}</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">BOOKING NO.</span>
                <span className="font-mono font-semibold text-slate-900">{part.bookingNo || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">P/O NO.</span>
                <span className="font-mono font-semibold text-slate-900">{part.poNo || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">AWB / BL</span>
                <span className="font-mono font-semibold text-slate-900">{part.awbBl || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">CARRIER</span>
                <span className="font-medium text-slate-900 truncate block">{part.flightVessel || '—'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">FROM</span>
                <span className="text-slate-800">{part.from || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">TO</span>
                <span className="text-slate-800">{part.to || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">PACKAGE</span>
                <span className="text-slate-800">{part.package || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">WEIGHT (kg)</span>
                <span className="font-mono font-semibold text-slate-900">{part.weight || '—'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">ETD</span>
                <span className="font-mono text-slate-800">{part.etd || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">ETA</span>
                <span className="font-mono text-slate-800">{part.eta || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">D/O & CONTAINER</span>
                <span className="font-mono font-semibold text-slate-900">{part.recieveDoAndOpenContainerDate || '—'}</span>
              </div>
            </div>
          </div>

          {part.notes && (
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-950">
              <span className="text-[10px] font-bold uppercase font-mono block text-blue-800 mb-0.5">
                {lang === 'th' ? 'หมายเหตุงานซ่อมบำรุง' : 'Engineering Notes'}
              </span>
              <p className="text-xs leading-relaxed">{part.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
          >
            {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
