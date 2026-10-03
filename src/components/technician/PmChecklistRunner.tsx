import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  Send,
  Building,
  RotateCcw,
} from 'lucide-react';
import { PmChecklistItem, PmZone, PmItemStatus, Lift } from '../../types';
import { INITIAL_PM_CHECKLIST_TEMPLATE } from '../../data/initialData';
import { useApp } from '../../context/AppContext';
import { DigitalSignaturePad } from '../common/DigitalSignaturePad';

interface PmChecklistRunnerProps {
  lift?: Lift;
  onComplete?: () => void;
}

export const PmChecklistRunner: React.FC<PmChecklistRunnerProps> = ({ lift, onComplete }) => {
  const { lifts, submitPmRecord, currentUser } = useApp();
  const [selectedLiftId, setSelectedLiftId] = useState<string>(lift?.id || lifts[0]?.id || '');
  const [activeZone, setActiveZone] = useState<PmZone>('machine_room');
  const [items, setItems] = useState<PmChecklistItem[]>(INITIAL_PM_CHECKLIST_TEMPLATE);
  const [overallRemarks, setOverallRemarks] = useState('');
  const [technicianSignature, setTechnicianSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLift = lifts.find((l) => l.id === selectedLiftId) || lifts[0];

  const zones: { key: PmZone; label: string; icon: string; count: number }[] = [
    {
      key: 'machine_room',
      label: 'Zone 1: Machine Room / MRL',
      icon: '⚙️',
      count: items.filter((i) => i.zone === 'machine_room').length,
    },
    {
      key: 'car',
      label: 'Zone 2: Car & Cabin',
      icon: '🚪',
      count: items.filter((i) => i.zone === 'car').length,
    },
    {
      key: 'landing',
      label: 'Zone 3: Landing / Floors',
      icon: '🏢',
      count: items.filter((i) => i.zone === 'landing').length,
    },
    {
      key: 'pit',
      label: 'Zone 4: Pit & Shaft',
      icon: '🕳️',
      count: items.filter((i) => i.zone === 'pit').length,
    },
  ];

  const activeItems = items.filter((i) => i.zone === activeZone);

  const setItemStatus = (itemId: string, status: PmItemStatus) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status } : item)));
  };

  const setItemRemarks = (itemId: string, remarks: string) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, remarks } : item)));
  };

  const markZoneAllOk = (zone: PmZone) => {
    setItems((prev) =>
      prev.map((item) => (item.zone === zone ? { ...item, status: 'ok' } : item))
    );
  };

  const markAllChecklistOk = () => {
    setItems((prev) => prev.map((item) => ({ ...item, status: 'ok' })));
  };

  const faultyCount = items.filter((i) => i.status === 'faulty').length;
  const attentionCount = items.filter((i) => i.status === 'attention').length;
  const okCount = items.filter((i) => i.status === 'ok').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLift) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const overallStatus =
        faultyCount > 0 ? 'critical_issues' : attentionCount > 0 ? 'passed_with_attention' : 'passed';

      submitPmRecord({
        liftId: currentLift.id,
        liftNumber: currentLift.liftNumber,
        buildingName: currentLift.buildingName,
        clientName: currentLift.clientName,
        technicianId: currentUser.technicianId || 'tech-1',
        technicianName: currentUser.name,
        items,
        overallStatus,
        remarks: overallRemarks || 'All PM check points inspected and recorded as per WEPSUN standards.',
        technicianSignature: technicianSignature || 'Rajesh Sharma [e-Sign Verified]',
      });

      setIsSubmitting(false);
      if (onComplete) onComplete();
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1976D2] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              PREVENTIVE MAINTENANCE (PM) MODULE
            </span>
            <span className="text-xs text-slate-500 font-medium">• Monthly Safety Audit</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 mt-1">
            4-Zone Digital Inspection Checklist
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedLiftId}
            onChange={(e) => setSelectedLiftId(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-[#1976D2] shadow-sm"
          >
            {lifts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.liftNumber} ({l.buildingName})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={markAllChecklistOk}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark All OK
          </button>
        </div>
      </div>

      {/* Stats Tally Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">Items OK</span>
          </div>
          <span className="font-mono text-lg font-black text-emerald-700">{okCount}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-900">Attention Needed</span>
          </div>
          <span className="font-mono text-lg font-black text-amber-700">{attentionCount}</span>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-red-900">Faulty / Replace</span>
          </div>
          <span className="font-mono text-lg font-black text-red-700">{faultyCount}</span>
        </div>
      </div>

      {/* Zone Switcher Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {zones.map((z) => {
          const isSelected = activeZone === z.key;
          return (
            <button
              type="button"
              key={z.key}
              onClick={() => setActiveZone(z.key)}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all shadow-sm ${
                isSelected
                  ? 'bg-blue-50 border-[#1976D2] text-[#1976D2] ring-1 ring-[#1976D2]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{z.icon}</span>
                <span className="text-xs font-bold truncate">{z.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                {z.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Zone Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {zones.find((z) => z.key === activeZone)?.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => markZoneAllOk(activeZone)}
            className="text-xs font-bold text-[#1976D2] hover:text-blue-700 transition-colors"
          >
            Mark this zone OK ✓
          </button>
        </div>

        <div className="space-y-3">
          {activeItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                item.status === 'faulty'
                  ? 'bg-red-50/50 border-red-300'
                  : item.status === 'attention'
                  ? 'bg-amber-50/50 border-amber-300'
                  : 'bg-[#F5F8FA] border-slate-200'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#1976D2] font-bold">
                    #{idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {item.description}
                </p>

                {item.status !== 'ok' && (
                  <input
                    type="text"
                    value={item.remarks || ''}
                    onChange={(e) => setItemRemarks(item.id, e.target.value)}
                    placeholder="Enter technician remark or observed wear..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 mt-2 outline-none focus:border-[#1976D2]"
                  />
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setItemStatus(item.id, 'ok')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    item.status === 'ok'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> OK
                </button>

                <button
                  type="button"
                  onClick={() => setItemStatus(item.id, 'attention')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    item.status === 'attention'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Attention
                </button>

                <button
                  type="button"
                  onClick={() => setItemStatus(item.id, 'faulty')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    item.status === 'faulty'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" /> Faulty
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engineer Overall Notes & Digital Signature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-xs shadow-sm">
          <label className="font-semibold text-slate-700">
            Engineer Overall Remarks & Recommendations
          </label>
          <textarea
            rows={4}
            value={overallRemarks}
            onChange={(e) => setOverallRemarks(e.target.value)}
            placeholder="e.g. Completed all 4 zones. Cleaned door sills, adjusted brake gap to 0.3mm. Lift running smoothly."
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:border-[#1976D2] outline-none resize-none shadow-sm"
          />
        </div>

        <DigitalSignaturePad
          title="Technician Verification Signature"
          signerName={currentUser.name}
          signerRole="Authorized Elevator Engineer"
          onSave={(sig) => setTechnicianSignature(sig)}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 rounded-2xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Complete PM & Log Next Service Cycle (+30 Days)
          </>
        )}
      </button>
    </form>
  );
};
