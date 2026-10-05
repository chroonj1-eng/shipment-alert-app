import React, { useState, useEffect } from 'react';
import { SparePartItem, JobProject, DeliveryStatus } from '../types';
import { Language, translations } from '../i18n/translations';
import { X, Save, AlertTriangle } from 'lucide-react';

interface AddEditPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: Partial<SparePartItem>) => void;
  editingPart?: SparePartItem | null;
  existingJobs: JobProject[];
  lang: Language;
}

export const AddEditPartModal: React.FC<AddEditPartModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPart,
  existingJobs,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const [formData, setFormData] = useState<Partial<SparePartItem>>({
    jobNo: '',
    vesselName: '',
    repairProject: '',
    srm: '',
    coSrm: '',
    incharge: '',
    bookingNo: '',
    poNo: '',
    awbBl: '',
    flightVessel: '',
    descriptionOfGoods: '',
    shipperSupplier: '',
    from: '',
    to: '',
    package: '',
    weight: '',
    etd: '',
    eta: '',
    recieveDoAndOpenContainerDate: '',
    deliveryDate: '',
    term: 'CIF',
    type: 'Spare Part',
    status: 'In Transit',
    notes: '',
  });

  useEffect(() => {
    if (editingPart) {
      setFormData(editingPart);
    } else if (existingJobs.length > 0) {
      const first = existingJobs[0];
      setFormData({
        jobNo: first.jobNo,
        vesselName: first.vesselName,
        repairProject: first.repairProject,
        srm: first.srm,
        coSrm: first.coSrm,
        incharge: first.incharge,
        bookingNo: '',
        poNo: '',
        awbBl: '',
        flightVessel: '',
        descriptionOfGoods: '',
        shipperSupplier: '',
        from: '',
        to: 'Shipyard Pier / Drydock',
        package: '1 Wooden Box',
        weight: '',
        etd: new Date().toISOString().split('T')[0],
        eta: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        recieveDoAndOpenContainerDate: '',
        deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
        term: 'CIF',
        type: 'Spare Part',
        status: 'In Transit',
        notes: '',
      });
    }
  }, [editingPart, existingJobs]);

  const handleJobSelect = (jobNo: string) => {
    const job = existingJobs.find((j) => j.jobNo === jobNo);
    if (job) {
      setFormData((prev) => ({
        ...prev,
        jobNo: job.jobNo,
        vesselName: job.vesselName,
        repairProject: job.repairProject,
        srm: job.srm,
        coSrm: job.coSrm,
        incharge: job.incharge,
      }));
    } else {
      setFormData((prev) => ({ ...prev, jobNo }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobNo || !formData.vesselName || !formData.srm || !formData.descriptionOfGoods) {
      alert(
        lang === 'th'
          ? 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (Job No., เรือ, SRM, และ Description of Goods)'
          : 'Please complete all required fields (Job No., Vessel Name, SRM, Description of Goods)'
      );
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label="ship">🚢</span>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingPart ? t.editPartTitle : t.addPartTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.addPartSub}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Section 1: Job & Vessel & SRM Info */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              {t.secProjectTitle}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  JOB NO. *
                </label>
                {existingJobs.length > 0 ? (
                  <select
                    value={formData.jobNo}
                    onChange={(e) => handleJobSelect(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                    required
                  >
                    <option value="">{lang === 'th' ? '-- เลือกจากโปรเจคเรือที่มี --' : '-- Select Existing Job --'}</option>
                    {existingJobs.map((j) => (
                      <option key={j.jobNo} value={j.jobNo}>
                        {j.jobNo} ({j.vesselName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.jobNo}
                    onChange={(e) => setFormData({ ...formData, jobNo: e.target.value })}
                    placeholder="e.g. JOB-2026-088"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'th' ? 'ชื่อเรือ (VESSEL NAME) *' : 'VESSEL NAME *'}
                </label>
                <input
                  type="text"
                  value={formData.vesselName}
                  onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                  placeholder="e.g. MV ANDAMAN STAR"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'th' ? 'SRM ผู้รับผิดชอบ *' : 'DESIGNATED SRM *'}
                </label>
                <input
                  type="text"
                  value={formData.srm}
                  onChange={(e) => setFormData({ ...formData, srm: e.target.value })}
                  placeholder="SRM Name"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'th' ? 'ชื่องานซ่อมบำรุง (REPAIR PROJECT)' : 'REPAIR PROJECT DESCRIPTION'}
                </label>
                <input
                  type="text"
                  value={formData.repairProject}
                  onChange={(e) => setFormData({ ...formData, repairProject: e.target.value })}
                  placeholder="e.g. Main Engine 6S60MC Overhaul"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Co-SRM
                </label>
                <input
                  type="text"
                  value={formData.coSrm || ''}
                  onChange={(e) => setFormData({ ...formData, coSrm: e.target.value })}
                  placeholder="Co-SRM"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  In-charge
                </label>
                <input
                  type="text"
                  value={formData.incharge || ''}
                  onChange={(e) => setFormData({ ...formData, incharge: e.target.value })}
                  placeholder="In-charge"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  TYPE
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="Spare Part">Spare Part</option>
                  <option value="Critical Equipment">Critical Equipment</option>
                  <option value="Owner Supply">Owner Supply</option>
                  <option value="Consumable">Consumable</option>
                  <option value="Urgent Tooling">Urgent Tooling</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Goods & Docs */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              {t.secGoodsTitle}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="md:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">
                  DESCRIPTION OF GOODS *
                </label>
                <textarea
                  rows={2}
                  value={formData.descriptionOfGoods}
                  onChange={(e) => setFormData({ ...formData, descriptionOfGoods: e.target.value })}
                  placeholder="e.g. Piston Crown Assembly & Ring Packs (6 Sets) for MAN B&W 6S60MC-C"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  BOOKING NO.
                </label>
                <input
                  type="text"
                  value={formData.bookingNo}
                  onChange={(e) => setFormData({ ...formData, bookingNo: e.target.value })}
                  placeholder="e.g. BKG-SIN-88201"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  P/O (PO no. / OWNER SUPPLY)
                </label>
                <input
                  type="text"
                  value={formData.poNo}
                  onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                  placeholder="e.g. PO-2026-8801 / OWNER SUPPLY"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  AWB/BL
                </label>
                <input
                  type="text"
                  value={formData.awbBl}
                  onChange={(e) => setFormData({ ...formData, awbBl: e.target.value })}
                  placeholder="e.g. AWB 016-8921-3341"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  FLIGHT / VESSEL
                </label>
                <input
                  type="text"
                  value={formData.flightVessel}
                  onChange={(e) => setFormData({ ...formData, flightVessel: e.target.value })}
                  placeholder="e.g. SQ 972 or MSC ILONA V.26"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  SHIPPER / SUPPLIER
                </label>
                <input
                  type="text"
                  value={formData.shipperSupplier}
                  onChange={(e) => setFormData({ ...formData, shipperSupplier: e.target.value })}
                  placeholder="e.g. MAN Energy Solutions Copenhagen"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  TERM
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                >
                  <option value="CIF">CIF</option>
                  <option value="FOB">FOB</option>
                  <option value="DDP">DDP</option>
                  <option value="EXW">EXW</option>
                  <option value="CFR">CFR</option>
                  <option value="FCA">FCA</option>
                  <option value="DAP">DAP</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  FROM
                </label>
                <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  placeholder="e.g. Copenhagen, Denmark"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  TO
                </label>
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  placeholder="e.g. Bangkok Cargo / Laem Chabang Port"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  PACKAGE & WEIGHT (kg)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    placeholder="2 Crates"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="1,250"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Timeline & Delivery Date */}
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
            <h4 className="text-xs font-bold text-amber-950 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{t.secTimelineTitle}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ETD
                </label>
                <input
                  type="date"
                  value={formData.etd}
                  onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ETA
                </label>
                <input
                  type="date"
                  value={formData.eta}
                  onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  RECIEVE D/O & OPEN CONTAINER
                </label>
                <input
                  type="text"
                  value={formData.recieveDoAndOpenContainerDate}
                  onChange={(e) => setFormData({ ...formData, recieveDoAndOpenContainerDate: e.target.value })}
                  placeholder="e.g. 2026-10-03 (Ready to Open)"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div className="bg-amber-100/70 p-2 rounded-md border border-amber-300">
                <label className="block text-amber-950 font-bold mb-1 flex items-center gap-1">
                  <span>DELIVERY DATE ⚠️ *</span>
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  required
                  className="w-full px-2.5 py-1 bg-white border border-amber-400 rounded font-mono text-xs font-bold text-amber-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  STATUS
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DeliveryStatus })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="In Transit">In Transit</option>
                  <option value="Arrived Port">Arrived Port</option>
                  <option value="DO Cleared">DO Cleared</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  NOTES
                </label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Class certification required upon uncrating"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.btnSavePart}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
