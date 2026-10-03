import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Wrench,
  ChevronRight,
  Sparkles,
  Phone,
  Layers,
  FileCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ClientPmView: React.FC = () => {
  const { clientScopedLifts, clientScopedPmRecords, requestPmReschedule, showToast } = useApp();
  const [activeZone, setActiveZone] = useState<'machine_room' | 'car' | 'landing' | 'pit'>('machine_room');
  const [selectedLiftId, setSelectedLiftId] = useState<string>(clientScopedLifts[0]?.id || '');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // Reschedule Form State
  const [rescheduleForm, setRescheduleForm] = useState({
    preferredDate: '',
    timeSlot: 'Morning (10:00 AM - 01:00 PM)',
    reason: '',
  });

  const currentLift = clientScopedLifts.find((l) => l.id === selectedLiftId) || clientScopedLifts[0];

  const categories = {
    machine_room: {
      title: 'Machine Room / MRL',
      items: [
        { id: 'm1', name: 'Traction Machine & Gearbox', status: 'ok', notes: 'Oil level optimal, zero oil leakage observed' },
        { id: 'm2', name: 'Electromagnetic Brake Assembly', status: 'ok', notes: 'Brake liner gap calibrated to 0.25mm' },
        { id: 'm3', name: 'Optical Rotary Encoder', status: 'ok', notes: 'Signal pulse synchronized with controller' },
        { id: 'm4', name: 'Monarch Integrated Controller', status: 'ok', notes: 'Error history cleared, all thermal sensors normal' },
        { id: 'm5', name: 'SMPS 24V Auxiliary Power', status: 'ok', notes: 'Output steady at 24.2V DC' },
        { id: 'm6', name: 'Main Power MCB & Contactors', status: 'ok', notes: 'Arc chutes clean, contact resistance tested' },
        { id: 'm7', name: 'VVVF Variable Frequency Drive', status: 'ok', notes: 'Heatsink fan operational' },
        { id: 'm8', name: 'Traction Steel Ropes 10mm', status: 'ok', notes: 'Tension equalized across all 4 suspension ropes' },
      ],
    },
    car: {
      title: 'Elevator Car & Enclosure',
      items: [
        { id: 'c1', name: 'Center Opening Car Door', status: 'ok', notes: 'Smooth gliding without hitch' },
        { id: 'c2', name: 'Door Coupler & Vane Clutch', status: 'attention', notes: 'Slight play in coupler roller — adjusted tension' },
        { id: 'c3', name: 'Infrared Multi-Beam Light Curtain Sensor', status: 'ok', notes: 'Instant obstacle sensing active' },
        { id: 'c4', name: 'Car Operating Panel (COP)', status: 'ok', notes: 'All floor push buttons illuminated' },
        { id: 'c5', name: 'Cross-Flow Fan & LED Illumination', status: 'ok', notes: 'Fan airflow normal' },
        { id: 'c6', name: 'Emergency Alarm Siren & Intercom', status: 'ok', notes: '2-way intercom verified with building lobby' },
        { id: 'c7', name: 'Automatic Rescue Device (ARD)', status: 'ok', notes: 'Rescue batteries fully charged at 52V' },
      ],
    },
    landing: {
      title: 'Landing Entrances & Hallways',
      items: [
        { id: 'l1', name: 'Landing Mechanical Door Locks', status: 'ok', notes: 'Double safety contacts locking positively on all floors' },
        { id: 'l2', name: 'Hanger Rollers & Tracks', status: 'ok', notes: 'Debris cleaned from tracks, lubed with silicone' },
        { id: 'l3', name: 'Landing Sills & Grooves', status: 'ok', notes: 'Sills clear of small stones or dust' },
        { id: 'l4', name: 'Hall Call Buttons (LOP)', status: 'ok', notes: 'Tested up and down calls on all levels' },
        { id: 'l5', name: 'Digital Position Indicators', status: 'ok', notes: 'Floor numbers and arrow directions accurate' },
      ],
    },
    pit: {
      title: 'Elevator Pit & Safety Lower',
      items: [
        { id: 'p1', name: 'Hydraulic / Spring Car & CWT Buffers', status: 'ok', notes: 'Buffer stroke free and lubricated' },
        { id: 'p2', name: 'Overtravel Limit & Final Switches', status: 'ok', notes: 'Cam operation positive' },
        { id: 'p3', name: 'Over-Speed Governor Tension Pulley', status: 'ok', notes: 'Safety switch circuit armed' },
        { id: 'p4', name: 'Traveling Cable & Counterweight Guide', status: 'ok', notes: 'Suspension loop natural' },
        { id: 'p5', name: 'Pit Emergency Stop Switch & Light', status: 'ok', notes: 'Kill switch tested' },
        { id: 'p6', name: 'Pit Dryness & Water Seepage Check', status: 'ok', notes: 'Zero water accumulation, pit dry and clean' },
      ],
    },
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleForm.preferredDate) {
      showToast('error', 'Date Required', 'Please select a preferred date for the maintenance visit.');
      return;
    }
    requestPmReschedule(
      currentLift?.id || 'lift-1',
      rescheduleForm.preferredDate,
      rescheduleForm.timeSlot,
      rescheduleForm.reason || 'Client convenience'
    );
    setIsRescheduleModalOpen(false);
    setRescheduleForm({ preferredDate: '', timeSlot: 'Morning (10:00 AM - 01:00 PM)', reason: '' });
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Top Banner with Schedule Stats */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Periodic Safety Inspection
              </span>
              <span className="text-xs text-slate-500 font-mono">Monthly Routine Cycle</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Preventive Maintenance (PM)</h1>
            <p className="text-xs text-slate-500">
              4-zone technical inspection protocol ensuring zero-breakdown reliability and ISO compliance
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsRescheduleModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-[#1976D2]" />
          <span>Request Reschedule</span>
        </button>
      </div>

      {/* Lift Selector Bar & Maintenance Timing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Lift Specific Schedule Details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1976D2]" />
              <h3 className="font-bold text-sm text-slate-900">Select Elevator Unit</h3>
            </div>
            <select
              value={selectedLiftId}
              onChange={(e) => setSelectedLiftId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
            >
              {clientScopedLifts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.liftNumber} — {l.buildingName} ({l.locationDetails})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F5F8FA] border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Last PM Date</span>
              <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
                {currentLift?.lastPmDate || '28 Aug 2026'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">✓ Passed OK</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase font-mono block font-bold">
                Next Scheduled PM
              </span>
              <span className="font-bold text-emerald-900 text-sm font-mono mt-0.5 block">
                {currentLift?.nextPmDate || '28 Sep 2026'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">● Confirmed</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5F8FA] border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Frequency</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Monthly</span>
              <span className="text-[10px] text-slate-500 font-mono">12 Visits / Year</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5F8FA] border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Tech</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">Rajesh Sharma</span>
              <span className="text-[10px] text-blue-600 font-mono">Sr. Field Engineer</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Maintenance Calendar / Timeline */}
        <div className="bg-gradient-to-br from-[#123B5D] to-[#0A2540] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-300">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Upcoming Maintenance Timeline</h3>
            </div>
            <p className="text-xs text-blue-100">
              Routine checks keep door mechanisms, brakes, and electrical safeties within certified factory limits.
            </p>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
              <span>Sep 2026 (Upcoming):</span>
              <strong className="text-emerald-300 font-bold">28 Sep 2026</strong>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
              <span>Oct 2026 (Scheduled):</span>
              <strong className="text-blue-200">28 Oct 2026</strong>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
              <span>Nov 2026 (Scheduled):</span>
              <strong className="text-blue-200">28 Nov 2026</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Zone Checklist Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#1976D2]" />
            <span>4-Zone Safety Inspection Protocol</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Click on zone tab to view live diagnostic checkpoints
          </span>
        </div>

        {/* Zone Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((k) => {
            const cat = categories[k];
            const isSelected = activeZone === k;
            return (
              <button
                key={k}
                onClick={() => setActiveZone(k)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border-[#1976D2] shadow-sm ring-2 ring-[#1976D2]/20 text-[#1976D2] font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{cat.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{cat.items.length} Checkpoints</div>
              </button>
            );
          })}
        </div>

        {/* Checkpoints Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              {categories[activeZone].title} — Checkpoints & Findings
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Status: <strong className="text-emerald-600">✓ OK</strong> •{' '}
              <strong className="text-amber-600">⚠ Attention</strong>
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {categories[activeZone].items.map((item) => (
              <div key={item.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm block">{item.name}</span>
                  {item.notes && (
                    <p className="text-[11px] text-slate-600 italic">
                      Finding: {item.notes}
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono shrink-0 ${
                    item.status === 'ok'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.status === 'ok' ? '✓ Checked OK' : '⚠ Attention'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1976D2]" />
              <span>Request PM Reschedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Select your preferred date and convenient time slot for elevator maintenance
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Elevator</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900">
                  {currentLift?.liftNumber} — {currentLift?.buildingName}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleForm.preferredDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Convenient Time Slot</label>
                <select
                  value={rescheduleForm.timeSlot}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlot: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
                >
                  <option value="Morning (10:00 AM - 01:00 PM)">Morning (10:00 AM - 01:00 PM)</option>
                  <option value="Afternoon (02:00 PM - 05:00 PM)">Afternoon (02:00 PM - 05:00 PM)</option>
                  <option value="Non-Peak Hours (09:00 PM - 11:00 PM)">Non-Peak Hours (09:00 PM - 11:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  placeholder="e.g., Society Annual General Meeting scheduled on earlier date..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
