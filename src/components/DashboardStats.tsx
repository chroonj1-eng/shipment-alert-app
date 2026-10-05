import React from 'react';
import { SparePartItem } from '../types';
import { Language, translations } from '../i18n/translations';
import { PlaneTakeoff, Ship, Box, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DashboardStatsProps {
  parts: SparePartItem[];
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  lang: Language;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  parts,
  currentFilter,
  onSelectFilter,
  lang,
}) => {
  const t = translations[lang];
  const total = parts.length;

  const inTransitCount = parts.filter(
    (p) => p.status === 'In Transit' || !p.recieveDoAndOpenContainerDate.includes('Completed')
  ).length;

  const arrivedPortCount = parts.filter(
    (p) => p.status === 'Arrived Port' || p.status === 'DO Cleared'
  ).length;

  // Items with urgent delivery date or nearing deadline
  const urgentDeliveryCount = parts.filter((p) => {
    if (p.status === 'Delivered') return false;
    if (p.urgentLevel === 'critical' || p.urgentLevel === 'urgent') return true;
    if (!p.deliveryDate) return false;
    const diffDays = Math.ceil(
      (new Date(p.deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    return diffDays <= 3;
  }).length;

  const deliveredCount = parts.filter((p) => p.status === 'Delivered').length;

  const stats = [
    {
      id: 'all',
      label: t.statAll,
      value: total,
      subtext: t.statAllSub,
      icon: Box,
      accent: 'border-slate-200 text-slate-900',
      activeRing: 'border-slate-800 bg-slate-50/50 shadow-sm',
    },
    {
      id: 'in_transit',
      label: t.statInTransit,
      value: inTransitCount,
      subtext: t.statInTransitSub,
      icon: PlaneTakeoff,
      accent: 'border-blue-200 text-blue-700',
      activeRing: 'border-blue-600 bg-blue-50/50 shadow-sm',
    },
    {
      id: 'port_ready',
      label: t.statPortReady,
      value: arrivedPortCount,
      subtext: t.statPortReadySub,
      icon: Ship,
      accent: 'border-cyan-200 text-cyan-800',
      activeRing: 'border-cyan-600 bg-cyan-50/50 shadow-sm',
    },
    {
      id: 'urgent_delivery',
      label: t.statUrgentDelivery,
      value: urgentDeliveryCount,
      subtext: t.statUrgentDeliverySub,
      icon: AlertTriangle,
      accent: 'border-amber-200 text-amber-700',
      activeRing: 'border-amber-500 bg-amber-50/60 shadow-sm ring-1 ring-amber-400',
    },
    {
      id: 'delivered',
      label: t.statDelivered,
      value: deliveredCount,
      subtext: t.statDeliveredSub,
      icon: CheckCircle2,
      accent: 'border-emerald-200 text-emerald-700',
      activeRing: 'border-emerald-600 bg-emerald-50/50 shadow-sm',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {stats.map((item) => {
        const Icon = item.icon;
        const isActive = currentFilter === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectFilter(item.id)}
            className={`text-left p-3.5 rounded-lg border transition-all relative ${
              isActive
                ? item.activeRing
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600 truncate pr-2">
                {item.label}
              </span>
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {item.value}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{t.itemsUnit}</span>
            </div>

            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {item.subtext}
            </div>

            {isActive && (
              <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
