import React from 'react';
import { NotificationLog, User } from '../types';
import { Language, translations } from '../i18n/translations';
import { X, Bell, Mail, Smartphone, Clock } from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
  currentUser: User;
  lang: Language;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  logs,
  currentUser,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  // Filter logs for this user if not admin
  const visibleLogs = currentUser.role === 'admin'
    ? logs
    : logs.filter((l) => currentUser.assignedJobs.includes(l.jobNo));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.notifyCenterTitle}</h3>
              <p className="text-xs text-slate-400">
                {currentUser.role === 'admin'
                  ? lang === 'th' ? 'บันทึกการส่งข้อความแจ้งเตือนทั้งหมดในระบบ' : 'All alert transmissions recorded in system'
                  : lang === 'th'
                  ? `บันทึกการแจ้งเตือนเฉพาะโปรเจคที่คุณดูแล (${currentUser.assignedJobs.join(', ')})`
                  : `Alert logs scoped to your assigned jobs (${currentUser.assignedJobs.join(', ')})`}
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

        {/* List */}
        <div className="p-6 text-xs max-h-[70vh] overflow-y-auto space-y-3">
          {visibleLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <Bell className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-700">{t.notifyEmpty}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'th'
                  ? 'เมื่อกดปุ่ม "แจ้งเตือน SRM (Action)" ในตารางอะไหล่ รายการจะถูกบันทึกที่นี่'
                  : 'When clicking "Alert SRM (Action)" in the table, transmissions will be logged here.'}
              </p>
            </div>
          ) : (
            visibleLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-200">
                      {log.jobNo}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {log.vesselName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="font-semibold text-slate-800 text-xs mb-1">
                  {log.subject}
                </div>

                <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed mb-2">
                  {log.message}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span>
                      {lang === 'th' ? 'ผู้รับ:' : 'Recipient:'} <strong className="text-slate-700">{log.recipientName}</strong> ({log.recipientRole})
                    </span>
                    <span>·</span>
                    <span>
                      {lang === 'th' ? 'ผู้ส่ง:' : 'Sender:'} <strong className="text-slate-700">{log.senderName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-800 font-medium capitalize">
                    {log.channel === 'email' && <Mail className="w-3 h-3" />}
                    {log.channel === 'line' && <Smartphone className="w-3 h-3" />}
                    {log.channel === 'in_app' && <Bell className="w-3 h-3" />}
                    <span>{log.channel}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
          >
            {lang === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
