import React, { useState, useMemo } from 'react';
import { SparePartItem, User } from '../types';
import { Language, translations } from '../i18n/translations';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  AlertTriangle,
  Send,
  Edit2,
  Trash2,
  Eye,
  Ship,
  Plane,
  Filter,
} from 'lucide-react';

interface SparePartsTableProps {
  parts: SparePartItem[];
  currentUser: User;
  onOpenAlertModal: (part: SparePartItem) => void;
  onOpenDetailModal: (part: SparePartItem) => void;
  onOpenEditModal: (part: SparePartItem) => void;
  onDeletePart: (partId: string) => void;
  onAddNewPart: () => void;
  onLoadSampleData: () => void;
  lang: Language;
}

type SortField = 'job' | 'srm' | 'deliveryDate' | 'eta' | 'weight' | 'bookingNo';
type SortDirection = 'asc' | 'desc';

export const SparePartsTable: React.FC<SparePartsTableProps> = ({
  parts,
  currentUser,
  onOpenAlertModal,
  onOpenDetailModal,
  onOpenEditModal,
  onDeletePart,
  onAddNewPart,
  onLoadSampleData,
  lang,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('job');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const isAdmin = currentUser.role === 'admin';

  // Toggle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort items
  const filteredAndSortedParts = useMemo(() => {
    let result = [...parts];

    // Text search across all fields
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.jobNo.toLowerCase().includes(q) ||
          p.vesselName.toLowerCase().includes(q) ||
          p.repairProject.toLowerCase().includes(q) ||
          p.srm.toLowerCase().includes(q) ||
          (p.coSrm && p.coSrm.toLowerCase().includes(q)) ||
          (p.incharge && p.incharge.toLowerCase().includes(q)) ||
          p.bookingNo.toLowerCase().includes(q) ||
          p.poNo.toLowerCase().includes(q) ||
          p.awbBl.toLowerCase().includes(q) ||
          p.flightVessel.toLowerCase().includes(q) ||
          p.descriptionOfGoods.toLowerCase().includes(q) ||
          p.shipperSupplier.toLowerCase().includes(q) ||
          p.from.toLowerCase().includes(q) ||
          p.to.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((p) => p.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter((p) => p.status === selectedStatus);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'job') {
        const valA = `${a.vesselName} ${a.jobNo}`.toLowerCase();
        const valB = `${b.vesselName} ${b.jobNo}`.toLowerCase();
        comparison = valA.localeCompare(valB, lang === 'th' ? 'th' : 'en');
      } else if (sortField === 'srm') {
        comparison = a.srm.localeCompare(b.srm, lang === 'th' ? 'th' : 'en');
      } else if (sortField === 'deliveryDate') {
        comparison = (a.deliveryDate || '').localeCompare(b.deliveryDate || '');
      } else if (sortField === 'eta') {
        comparison = (a.eta || '').localeCompare(b.eta || '');
      } else if (sortField === 'bookingNo') {
        comparison = a.bookingNo.localeCompare(b.bookingNo);
      } else if (sortField === 'weight') {
        const wA = parseFloat(String(a.weight).replace(/,/g, '')) || 0;
        const wB = parseFloat(String(b.weight).replace(/,/g, '')) || 0;
        comparison = wA - wB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [parts, searchTerm, sortField, sortDirection, selectedType, selectedStatus, lang]);

  // Check if delivery date is within warning threshold (<= 3 days or passed)
  const isDeliveryUrgent = (dateStr: string, status: string) => {
    if (status === 'Delivered') return false;
    if (!dateStr) return false;
    const delivery = new Date(dateStr);
    const now = new Date();
    const diffTime = delivery.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const uniqueTypes = Array.from(new Set(parts.map((p) => p.type).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(parts.map((p) => p.status).filter(Boolean)));

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Top Filter and Search Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-slate-400"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              {lang === 'th' ? 'ล้าง' : 'Clear'}
            </button>
          )}
        </div>

        {/* Filters and Counters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'th' ? 'ประเภท:' : 'Type:'}</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1 px-2 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">{t.filterTypeAll}</option>
              {uniqueTypes.map((typeVal) => (
                <option key={typeVal} value={typeVal}>
                  {typeVal}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span>{lang === 'th' ? 'สถานะ:' : 'Status:'}</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-2 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">{t.filterStatusAll}</option>
              {uniqueStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 font-mono pl-2 border-l border-slate-300 tabular-nums">
            {t.tableShowing} {filteredAndSortedParts.length} / {parts.length} {t.tableTotal}
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {filteredAndSortedParts.length === 0 ? (
        <div className="py-14 text-center px-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto mb-3 text-cyan-700 shadow-xs">
            <Ship className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {parts.length === 0 ? t.tableEmptyTitle : t.tableNoResults}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {parts.length === 0
              ? t.tableEmptySubtitle
              : lang === 'th'
              ? 'ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองประเภทและสถานะ'
              : 'Try adjusting your search query or reset the filters.'}
          </p>

          {parts.length === 0 && (
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-cyan-900 flex items-center gap-1.5">
                <span>💡</span>
                <span>{t.standaloneTitle}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                {t.standaloneNotice}
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            {isAdmin && (
              <button
                onClick={onAddNewPart}
                className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 rounded-md hover:bg-cyan-600 transition-colors shadow-xs"
              >
                + {t.btnNewPart}
              </button>
            )}
            {parts.length === 0 && (
              <button
                onClick={onLoadSampleData}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
              >
                📦 {t.btnLoadSampleDb}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 divide-x divide-slate-200 whitespace-nowrap">
                {/* 1. JOB (เรือ / งาน) - Sortable */}
                <th
                  onClick={() => handleSort('job')}
                  className="py-3 px-3.5 bg-slate-200/60 hover:bg-slate-200 cursor-pointer select-none transition-colors min-w-[210px]"
                  title="Click to sort A-Z / Z-A"
                >
                  <div className="flex items-center justify-between gap-1.5 text-slate-900">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="text-base" role="img" aria-label="ship">🚢</span>
                      {t.colJob}
                    </span>
                    <span className="text-cyan-700">
                      {sortField === 'job' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 2. SRM - Sortable */}
                <th
                  onClick={() => handleSort('srm')}
                  className="py-3 px-3.5 bg-slate-200/60 hover:bg-slate-200 cursor-pointer select-none transition-colors min-w-[150px]"
                  title="Click to sort SRM A-Z / Z-A"
                >
                  <div className="flex items-center justify-between gap-1.5 text-slate-900">
                    <span className="font-bold">{t.colSrm}</span>
                    <span className="text-cyan-700">
                      {sortField === 'srm' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 3. BOOKING NO. */}
                <th
                  onClick={() => handleSort('bookingNo')}
                  className="py-3 px-3 hover:bg-slate-200/50 cursor-pointer select-none transition-colors min-w-[130px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colBookingNo}</span>
                    {sortField === 'bookingNo' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* 4. P/O (PO no. / OWNER SUPPLY) */}
                <th className="py-3 px-3 min-w-[160px]">
                  {t.colPoNo}
                </th>

                {/* 5. AWB/BL */}
                <th className="py-3 px-3 min-w-[130px]">
                  {t.colAwbBl}
                </th>

                {/* 6. FLIGHT / VESSEL */}
                <th className="py-3 px-3 min-w-[140px]">
                  {t.colFlightVessel}
                </th>

                {/* 7. DESCRIPTION OF GOODS */}
                <th className="py-3 px-3.5 min-w-[240px]">
                  {t.colDescription}
                </th>

                {/* 8. SHIPPER/SUPPLIER */}
                <th className="py-3 px-3 min-w-[160px]">
                  {t.colShipper}
                </th>

                {/* 9. FROM */}
                <th className="py-3 px-3 min-w-[120px]">
                  {t.colFrom}
                </th>

                {/* 10. TO */}
                <th className="py-3 px-3 min-w-[130px]">
                  {t.colTo}
                </th>

                {/* 11. PACKAGE */}
                <th className="py-3 px-3 min-w-[110px]">
                  {t.colPackage}
                </th>

                {/* 12. WEIGHT (kg) */}
                <th
                  onClick={() => handleSort('weight')}
                  className="py-3 px-3 text-right hover:bg-slate-200/50 cursor-pointer select-none transition-colors min-w-[95px]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{t.colWeight}</span>
                    {sortField === 'weight' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* 13. ETD */}
                <th className="py-3 px-3 min-w-[95px]">
                  {t.colEtd}
                </th>

                {/* 14. ETA */}
                <th
                  onClick={() => handleSort('eta')}
                  className="py-3 px-3 hover:bg-slate-200/50 cursor-pointer select-none transition-colors min-w-[95px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colEta}</span>
                    {sortField === 'eta' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* 15. RECIEVE D/O AND OPEN CONTAINER DATE */}
                <th className="py-3 px-3 min-w-[170px]">
                  {t.colReceiveDo}
                </th>

                {/* 16. DELIVERY DATE ⚠️ */}
                <th
                  onClick={() => handleSort('deliveryDate')}
                  className="py-3 px-3 bg-amber-50/70 text-amber-950 hover:bg-amber-100/70 cursor-pointer select-none transition-colors min-w-[130px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold flex items-center gap-1">
                      {t.colDeliveryDate}
                    </span>
                    {sortField === 'deliveryDate' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-800" /> : <ArrowDown className="w-3 h-3 text-amber-800" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                </th>

                {/* 17. TERM */}
                <th className="py-3 px-2.5 text-center min-w-[70px]">
                  {t.colTerm}
                </th>

                {/* 18. TYPE */}
                <th className="py-3 px-3 min-w-[110px]">
                  {t.colType}
                </th>

                {/* 19. แจ้งเตือน SRM (Action) */}
                <th className="py-3 px-3.5 bg-cyan-900 text-white text-center font-bold min-w-[160px] sticky right-0 z-10 shadow-l">
                  {t.colAction}
                </th>

                {/* Admin Management Column */}
                {isAdmin && (
                  <th className="py-3 px-2 text-center min-w-[65px] bg-slate-100 text-slate-600">
                    {t.colAdminManage}
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedParts.map((item, index) => {
                const urgent = isDeliveryUrgent(item.deliveryDate, item.status);
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-cyan-50/40 transition-colors divide-x divide-slate-100 ${
                      urgent ? 'bg-amber-50/30' : isEven ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    {/* 1. JOB (เรือ / งาน) */}
                    <td className="py-2.5 px-3.5 align-top">
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-tight mt-0.5 shrink-0" role="img" aria-label="vessel">
                          🚢
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-tight">
                            {item.vesselName}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-cyan-800 mt-0.5">
                            {item.jobNo}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[210px] mt-0.5" title={item.repairProject}>
                            {item.repairProject}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. SRM */}
                    <td className="py-2.5 px-3.5 align-top">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-tight">
                          {item.srm}
                        </span>
                        {item.coSrm && (
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Co: {item.coSrm}
                          </span>
                        )}
                        {item.incharge && (
                          <span className="text-[10px] text-slate-400">
                            IC: {item.incharge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. BOOKING NO. */}
                    <td className="py-2.5 px-3 align-top font-mono font-medium text-slate-800 text-[11px]">
                      {item.bookingNo || '—'}
                    </td>

                    {/* 4. P/O (PO no. / OWNER SUPPLY) */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] font-semibold text-slate-900">
                          {item.poNo}
                        </span>
                        {item.poNo.includes('OWNER SUPPLY') && (
                          <span className="text-[10px] font-medium text-purple-700">
                            (Owner Supply)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. AWB/BL */}
                    <td className="py-2.5 px-3 align-top font-mono text-[11px] text-slate-700">
                      {item.awbBl || '—'}
                    </td>

                    {/* 6. FLIGHT / VESSEL */}
                    <td className="py-2.5 px-3 align-top text-slate-800">
                      <div className="flex items-center gap-1">
                        {item.flightVessel.toLowerCase().includes('sq') ||
                        item.flightVessel.toLowerCase().includes('air') ||
                        item.flightVessel.toLowerCase().includes('nh') ||
                        item.flightVessel.toLowerCase().includes('lh') ||
                        item.flightVessel.toLowerCase().includes('ba') ? (
                          <Plane className="w-3 h-3 text-sky-600 shrink-0" />
                        ) : (
                          <Ship className="w-3 h-3 text-cyan-600 shrink-0" />
                        )}
                        <span className="text-[11px] font-medium truncate max-w-[130px]">
                          {item.flightVessel}
                        </span>
                      </div>
                    </td>

                    {/* 7. DESCRIPTION OF GOODS */}
                    <td className="py-2.5 px-3.5 align-top">
                      <div className="text-slate-900 font-medium leading-relaxed max-w-[250px]">
                        {item.descriptionOfGoods}
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* 8. SHIPPER/SUPPLIER */}
                    <td className="py-2.5 px-3 align-top text-slate-700 text-[11px]">
                      {item.shipperSupplier}
                    </td>

                    {/* 9. FROM */}
                    <td className="py-2.5 px-3 align-top text-slate-600 text-[11px]">
                      {item.from}
                    </td>

                    {/* 10. TO */}
                    <td className="py-2.5 px-3 align-top text-slate-600 text-[11px]">
                      {item.to}
                    </td>

                    {/* 11. PACKAGE */}
                    <td className="py-2.5 px-3 align-top text-slate-700 text-[11px]">
                      {item.package}
                    </td>

                    {/* 12. WEIGHT (kg) */}
                    <td className="py-2.5 px-3 align-top text-right font-mono tabular-nums text-slate-800 text-[11px]">
                      {item.weight ? Number(String(item.weight).replace(/,/g, '')).toLocaleString() : '—'}
                    </td>

                    {/* 13. ETD */}
                    <td className="py-2.5 px-3 align-top font-mono text-[11px] text-slate-600 tabular-nums">
                      {item.etd || '—'}
                    </td>

                    {/* 14. ETA */}
                    <td className="py-2.5 px-3 align-top font-mono text-[11px] font-medium text-slate-800 tabular-nums">
                      {item.eta || '—'}
                    </td>

                    {/* 15. RECIEVE D/O AND OPEN CONTAINER DATE */}
                    <td className="py-2.5 px-3 align-top text-[11px]">
                      <span className="text-slate-800 font-mono">
                        {item.recieveDoAndOpenContainerDate || '—'}
                      </span>
                    </td>

                    {/* 16. DELIVERY DATE ⚠️ */}
                    <td
                      className={`py-2.5 px-3 align-top font-mono tabular-nums text-[11px] ${
                        urgent ? 'bg-amber-100/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {urgent && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                        )}
                        <span
                          className={`font-semibold ${
                            urgent ? 'text-amber-900 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {item.deliveryDate || '—'}
                        </span>
                      </div>
                      {urgent && (
                        <span className="text-[10px] text-amber-700 font-sans block mt-0.5 font-medium">
                          {t.tableUrgentTag}
                        </span>
                      )}
                    </td>

                    {/* 17. TERM */}
                    <td className="py-2.5 px-2.5 align-top text-center font-mono font-semibold text-[10px] text-slate-600">
                      {item.term || '—'}
                    </td>

                    {/* 18. TYPE */}
                    <td className="py-2.5 px-3 align-top">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {item.type}
                      </span>
                    </td>

                    {/* 19. แจ้งเตือน SRM (Action) */}
                    <td className="py-2.5 px-3 align-top text-center sticky right-0 bg-white/95 backdrop-blur-xs shadow-l">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => onOpenAlertModal(item)}
                          className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800 rounded transition-colors shadow-xs"
                          title={`Send alert to ${item.srm}`}
                        >
                          <Send className="w-3 h-3 shrink-0" />
                          <span>{t.btnAlertAction}</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          {item.lastNotifiedDate ? (
                            <span title={`Last alert: ${item.lastNotifiedDate}`}>
                              {t.alertCountText} {item.notificationCount} {t.timesUnit}
                            </span>
                          ) : (
                            <span className="text-slate-400">{t.notAlertedYet}</span>
                          )}
                          <button
                            onClick={() => onOpenDetailModal(item)}
                            className="text-cyan-700 hover:underline inline-flex items-center gap-0.5 ml-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{t.viewDetails}</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <td className="py-2.5 px-1.5 align-middle text-center bg-slate-50/50">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenEditModal(item)}
                            className="p-1 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded"
                            title={lang === 'th' ? 'แก้ไข' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(lang === 'th' ? `ยืนยันการลบรายการ ${item.descriptionOfGoods}?` : `Delete ${item.descriptionOfGoods}?`)) {
                                onDeletePart(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title={lang === 'th' ? 'ลบ' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span>
            🚢 <strong>{lang === 'th' ? 'คอลัมน์ 1:' : 'Col 1:'}</strong> {t.colJob} &nbsp;·&nbsp;{' '}
            <strong>{lang === 'th' ? 'คอลัมน์ 2:' : 'Col 2:'}</strong> {t.colSrm} &nbsp;·&nbsp;{' '}
            ⚠️ <strong>{lang === 'th' ? 'คอลัมน์ 16:' : 'Col 16:'}</strong> {t.colDeliveryDate}
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {t.tableSortHint}
        </div>
      </div>
    </div>
  );
};
