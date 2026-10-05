import React from 'react';
import { User, JobProject } from '../types';
import { Language, translations } from '../i18n/translations';
import { ShieldCheck, Anchor, AlertTriangle, Database, RotateCcw } from 'lucide-react';

interface RoleScopeBannerProps {
  currentUser: User;
  allJobs: JobProject[];
  totalPartsInScope: number;
  totalPartsOverall: number;
  urgentAlertsCount: number;
  onResetEmpty: () => void;
  onLoadSample: () => void;
  isEmpty: boolean;
  lang: Language;
}

export const RoleScopeBanner: React.FC<RoleScopeBannerProps> = ({
  currentUser,
  allJobs,
  totalPartsInScope,
  totalPartsOverall,
  urgentAlertsCount,
  onResetEmpty,
  onLoadSample,
  isEmpty,
  lang,
}) => {
  const t = translations[lang];
  const isAdmin = currentUser.role === 'admin';

  // Find vessels assigned to this user
  const assignedVessels = allJobs
    .filter((j) => currentUser.assignedJobs.includes(j.jobNo))
    .map((j) => `${j.jobNo} (${j.vesselName})`);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Anchor className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                    isAdmin
                      ? 'bg-indigo-100 text-indigo-800'
                      : currentUser.role === 'srm'
                      ? 'bg-cyan-100 text-cyan-900'
                      : currentUser.role === 'co_srm'
                      ? 'bg-teal-100 text-teal-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {currentUser.role.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500 font-mono">{currentUser.department}</span>
              </div>

              <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                {isAdmin ? (
                  <span>
                    {t.bannerAdminDesc} ({totalPartsOverall} {t.itemsUnit})
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-800 font-medium">{t.bannerUserDesc}</strong>{' '}
                    {assignedVessels.length > 0 ? (
                      <span className="text-cyan-950 font-medium">
                        {assignedVessels.join(' | ')}
                      </span>
                    ) : (
                      <span className="text-amber-700">{t.bannerNoJobs}</span>
                    )}
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="text-emerald-700 font-medium">
                      {t.bannerScopeIsolated}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick dataset controls */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            {urgentAlertsCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {t.bannerUrgentWarning} {urgentAlertsCount} {t.itemsUnit}
                </span>
              </div>
            )}

            {/* Database State Selector (Empty vs Sample) */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
              <button
                type="button"
                onClick={onResetEmpty}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isEmpty
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="เริ่มด้วยฐานข้อมูลว่างเปล่าทั้งหมด"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.btnStartEmptyDb}</span>
              </button>
              <button
                type="button"
                onClick={onLoadSample}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  !isEmpty
                    ? 'bg-cyan-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="โหลดข้อมูลตัวอย่างเพื่อการทดสอบ"
              >
                <Database className="w-3 h-3" />
                <span>{t.btnLoadSampleDb}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Standalone Storage Notice Callout */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-start sm:items-center gap-1.5 leading-relaxed">
            <span className="font-semibold text-cyan-800 shrink-0">💡 {t.standaloneTitle}:</span>
            <span>{t.standaloneNotice}</span>
          </div>
          <div className="shrink-0 font-mono font-medium">
            <span className={isEmpty ? 'text-emerald-700 font-semibold' : 'text-cyan-800 font-semibold'}>
              {isEmpty ? t.dbStatusEmpty : t.dbStatusSample}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
