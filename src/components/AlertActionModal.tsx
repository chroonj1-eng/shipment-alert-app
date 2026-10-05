import React, { useState, useEffect } from 'react';
import { SparePartItem, User } from '../types';
import { Language, translations } from '../i18n/translations';
import { X, Send, Bell, CheckCircle2, Mail, Smartphone } from 'lucide-react';

interface AlertActionModalProps {
  part: SparePartItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSendAlert: (alertData: {
    partId: string;
    jobNo: string;
    vesselName: string;
    recipientName: string;
    recipientEmail: string;
    recipientRole: string;
    senderName: string;
    channel: 'email' | 'line' | 'in_app' | 'sms';
    subject: string;
    message: string;
  }) => void;
  lang: Language;
}

export const AlertActionModal: React.FC<AlertActionModalProps> = ({
  part,
  isOpen,
  onClose,
  currentUser,
  onSendAlert,
  lang,
}) => {
  if (!isOpen || !part) return null;
  const t = translations[lang];

  const [selectedRecipient, setSelectedRecipient] = useState<'srm' | 'all' | 'co_srm' | 'incharge'>('srm');
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'line' | 'in_app' | 'sms'>('email');
  const [template, setTemplate] = useState<string>('delivery_warning');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (part) {
      if (lang === 'th') {
        setCustomSubject(`[แจ้งเตือนด่วน ⚠️] Delivery Date ใกล้กำหนดส่งมอบเข้าเรือ ${part.vesselName}`);
        setCustomMessage(
          `เรียน คุณ ${part.srm} (SRM)\n\nแจ้งเตือนความเร่งด่วน: อะไหล่ ${part.descriptionOfGoods} มีกำหนดส่งมอบ (DELIVERY DATE ⚠️) ในวันที่ ${part.deliveryDate || 'ใกล้ถึงกำหนด'} สำหรับงาน ${part.repairProject} บนเรือ ${part.vesselName} (${part.jobNo})\nกรุณาประสานงานพื้นที่รับของหน้าท่า/อู่แห้งล่วงหน้าครับ`
        );
      } else {
        setCustomSubject(`[URGENT ⚠️] Approaching Delivery Date for ${part.vesselName} (${part.jobNo})`);
        setCustomMessage(
          `Dear ${part.srm} (SRM),\n\nUrgent Delivery Date alert for vessel ${part.vesselName} (${part.jobNo}):\n• Goods: ${part.descriptionOfGoods}\n• PO: ${part.poNo}\n• AWB/BL: ${part.awbBl}\n• DELIVERY DATE ⚠️: ${part.deliveryDate || 'Approaching'}\n• Container / DO Status: ${part.recieveDoAndOpenContainerDate || 'Pending'}\n\nPlease coordinate dockside readiness for receiving.`
        );
      }
    }
  }, [part, lang]);

  // Template switch handler
  const handleSelectTemplate = (tpl: string) => {
    setTemplate(tpl);
    if (!part) return;

    if (lang === 'th') {
      if (tpl === 'delivery_warning') {
        setCustomSubject(`[แจ้งเตือนด่วน ⚠️] Delivery Date ใกล้กำหนดส่งมอบเข้าเรือ ${part.vesselName}`);
        setCustomMessage(
          `เรียน คุณ ${part.srm} (SRM)\n\nแจ้งเตือนความเร่งด่วน: อะไหล่ ${part.descriptionOfGoods} มีกำหนดส่งมอบ (DELIVERY DATE ⚠️) ในวันที่ ${part.deliveryDate || 'ใกล้ถึงกำหนด'} สำหรับงาน ${part.repairProject} บนเรือ ${part.vesselName} (${part.jobNo})\nกรุณาประสานงานพื้นที่รับของหน้าท่า/อู่แห้งล่วงหน้าครับ`
        );
      } else if (tpl === 'port_arrived') {
        setCustomSubject(`[สถานะอะไหล่ 📦] สินค้าถึงท่าเรือ/สนามบินแล้ว - เรือ ${part.vesselName}`);
        setCustomMessage(
          `เรียน คุณ ${part.srm} (SRM) และทีมงาน\n\nอะไหล่ ${part.descriptionOfGoods} (P/O: ${part.poNo}) ได้เดินทางมาถึงแล้วด้วยเที่ยวบิน/เที่ยวเรือ ${part.flightVessel} (ETA: ${part.eta})\nขณะนี้อยู่ระหว่างดำเนินการรับ D/O และพิธีการนำเข้าครับ`
        );
      } else if (tpl === 'open_container') {
        setCustomSubject(`[นัดหมายตรวจรับ 🔓] ได้รับ D/O และพร้อมเปิดตู้คอนเทนเนอร์ - เรือ ${part.vesselName}`);
        setCustomMessage(
          `เรียน คุณ ${part.srm} (SRM), Co-SRM และ Incharge\n\nได้รับเอกสาร D/O เรียบร้อยแล้ว กำหนดเปิดตู้ตรวจรับสินค้าในวันที่: ${part.recieveDoAndOpenContainerDate}\nรายการ: ${part.descriptionOfGoods}\nขอเชิญร่วมตรวจนับสภาพชิ้นส่วนร่วมกับตัวแทน Supplier / Surveyor ครับ`
        );
      } else if (tpl === 'ready_dispatch') {
        setCustomSubject(`[พร้อมส่งมอบ 🚚] อะไหล่พร้อมเข้าอู่เรือ/หน้างานซ่อม - เรือ ${part.vesselName}`);
        setCustomMessage(
          `เรียน คุณ ${part.srm} (SRM)\n\nอะไหล่ ${part.descriptionOfGoods} ผ่านการตรวจรับแล้ว พร้อมขนส่งเข้าอู่เรือเพื่อประกอบลงเรือ ${part.vesselName} (${part.jobNo}) ในวันที่ ${part.deliveryDate} ตามแผนงานซ่อมบำรุงครับ`
        );
      }
    } else {
      if (tpl === 'delivery_warning') {
        setCustomSubject(`[URGENT ⚠️] Approaching Delivery Date for ${part.vesselName} (${part.jobNo})`);
        setCustomMessage(
          `Dear ${part.srm} (SRM),\n\nUrgent Delivery Date alert for vessel ${part.vesselName} (${part.jobNo}):\n• Goods: ${part.descriptionOfGoods}\n• PO: ${part.poNo}\n• AWB/BL: ${part.awbBl}\n• DELIVERY DATE ⚠️: ${part.deliveryDate || 'Approaching'}\n• Container / DO Status: ${part.recieveDoAndOpenContainerDate || 'Pending'}\n\nPlease coordinate dockside readiness for receiving.`
        );
      } else if (tpl === 'port_arrived') {
        setCustomSubject(`[ARRIVED 📦] Cargo arrived at Port / Airport - ${part.vesselName}`);
        setCustomMessage(
          `Dear ${part.srm} (SRM) and Vessel Team,\n\nSpare part ${part.descriptionOfGoods} (P/O: ${part.poNo}) has arrived on ${part.flightVessel} (ETA: ${part.eta}). Currently clearing customs and awaiting D/O release.`
        );
      } else if (tpl === 'open_container') {
        setCustomSubject(`[INSPECTION 🔓] D/O Cleared & Ready to Unbox Container - ${part.vesselName}`);
        setCustomMessage(
          `Dear ${part.srm} (SRM), Co-SRM, and Incharge,\n\nDelivery Order received. Container opening and inspection scheduled for: ${part.recieveDoAndOpenContainerDate}.\nPlease join the inspection alongside manufacturer surveyor.`
        );
      } else if (tpl === 'ready_dispatch') {
        setCustomSubject(`[DISPATCH 🚚] Spare parts ready for Yard Delivery - ${part.vesselName}`);
        setCustomMessage(
          `Dear ${part.srm} (SRM),\n\nSpare part ${part.descriptionOfGoods} is cleared and scheduled for drydock delivery on ${part.deliveryDate} for ${part.vesselName} (${part.jobNo}).`
        );
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    let recipientName = part.srm;
    let recipientEmail = `${part.srm.toLowerCase().replace(/\s+/g, '.')}@unithai.com`;
    let recipientRole = 'SRM';

    if (selectedRecipient === 'co_srm' && part.coSrm) {
      recipientName = part.coSrm;
      recipientRole = 'Co-SRM';
    } else if (selectedRecipient === 'incharge' && part.incharge) {
      recipientName = part.incharge;
      recipientRole = 'In-charge';
    } else if (selectedRecipient === 'all') {
      recipientName = `${part.srm} & Team (${part.coSrm || 'Co-SRM'}, ${part.incharge || 'In-charge'})`;
      recipientRole = 'SRM, Co-SRM & In-charge';
    }

    onSendAlert({
      partId: part.id,
      jobNo: part.jobNo,
      vesselName: part.vesselName,
      recipientName,
      recipientEmail,
      recipientRole,
      senderName: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      channel: selectedChannel,
      subject: customSubject,
      message: customMessage,
    });

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {t.alertModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.alertTargetJob}{' '}
                <span className="text-cyan-300 font-mono font-medium">{part.jobNo}</span> ·{' '}
                {t.alertTargetVessel} {part.vesselName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSent ? (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {t.alertSentSuccess}
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              {t.alertSentSub}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
            {/* Target Item Brief */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900 text-sm">
                  {part.descriptionOfGoods}
                </div>
                <div className="text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>P/O: <strong className="text-slate-700 font-mono">{part.poNo}</strong></span>
                  <span>·</span>
                  <span>Booking: <strong className="text-slate-700 font-mono">{part.bookingNo}</strong></span>
                  <span>·</span>
                  <span className="text-amber-800 font-semibold">
                    DELIVERY DATE ⚠️: {part.deliveryDate || '—'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-semibold">
                  {part.type}
                </span>
              </div>
            </div>

            {/* Recipient Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.alertRecipientsLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecipient('srm')}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    selectedRecipient === 'srm'
                      ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{t.alertRoleSrmPrimary}</div>
                  <div className="truncate text-xs">{part.srm}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRecipient('co_srm')}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    selectedRecipient === 'co_srm'
                      ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{t.alertRoleCoSrm}</div>
                  <div className="truncate text-xs">{part.coSrm || '—'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRecipient('incharge')}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    selectedRecipient === 'incharge'
                      ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{t.alertRoleIncharge}</div>
                  <div className="truncate text-xs">{part.incharge || '—'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRecipient('all')}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    selectedRecipient === 'all'
                      ? 'border-cyan-600 bg-cyan-50/70 text-cyan-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{t.alertRoleAllTeam}</div>
                  <div className="truncate text-xs">SRM + Co + IC</div>
                </button>
              </div>
            </div>

            {/* Notification Channel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.alertChannelLabel}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    checked={selectedChannel === 'email'}
                    onChange={() => setSelectedChannel('email')}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.alertChannelEmail}</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    checked={selectedChannel === 'line'}
                    onChange={() => setSelectedChannel('line')}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.alertChannelLine}</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    checked={selectedChannel === 'in_app'}
                    onChange={() => setSelectedChannel('in_app')}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.alertChannelInApp}</span>
                </label>
              </div>
            </div>

            {/* Quick Template Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.alertTemplatesLabel}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('delivery_warning')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    template === 'delivery_warning'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.tplDeliveryWarning}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('port_arrived')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    template === 'port_arrived'
                      ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.tplPortArrived}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('open_container')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    template === 'open_container'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.tplOpenContainer}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('ready_dispatch')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    template === 'ready_dispatch'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.tplReadyDispatch}
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.alertSubjectLabel}
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.alertMessageLabel}
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                {t.btnCancel}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.btnConfirmDispatch}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
