import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  AlertCircle,
  HelpCircle,
  Search,
  ArrowRight,
  Save,
  Check,
  Zap,
} from 'lucide-react';
import { TechnicianJob, LiftSafetyMarker, AiErrorCode } from '../../types';

interface FaultDiagnosisFormProps {
  job: TechnicianJob;
  aiErrorCodes?: AiErrorCode[];
  onUpdateJob: (updated: Partial<TechnicianJob>) => void;
  onNavigateToTab: (tab: string) => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

const FAULT_CATEGORIES = [
  'Door System & Landing Locks',
  'VVVF Inverter Drive & Controller',
  'Safety Circuit & Governors',
  'Leveling & Magnetic Position Sensors',
  'Mechanical Brake & Traction Machine',
  'Car Operating Panel (COP) & Buttons',
  'Automatic Rescue Device (ARD)',
  'Shaft Wire Ropes & Counterweight',
  'Routine PM Periodic Inspection',
  'Passenger Entrapment Emergency',
];

const COMMON_SYMPTOMS = [
  'Door bouncing back / not closing',
  'Continuous warning beeping',
  'Error code on controller display',
  'Floor leveling overshoot / undershoot (>10mm)',
  'Metallic screeching in hoistway',
  'COP / LOP buttons not responding',
  'Brake sluggish / brake coil warm',
  'Light curtain sensor flickering',
  'ARD power failure trip',
  'Slow inspection speed only',
];

const PRESET_FAULT_CODES = [
  { code: 'Monarch E33', name: 'Door Interlock Safety Open During Flight', category: 'Door System & Landing Locks' },
  { code: 'Monarch E02', name: 'Overcurrent Acceleration Trip', category: 'VVVF Inverter Drive & Controller' },
  { code: 'Step E02', name: 'Floor Leveling Pulse Time-out Fault', category: 'Leveling & Magnetic Position Sensors' },
  { code: 'Step E53', name: 'Door Lock Short-Circuit Bypass Protection', category: 'Door System & Landing Locks' },
  { code: 'Kone 0021', name: 'Safety Circuit Open / Governor Trip', category: 'Safety Circuit & Governors' },
  { code: 'Schindler F1', name: 'Safety Chain Break at Final Limit Switch', category: 'Safety Circuit & Governors' },
  { code: 'Otis NAV-04', name: 'Inverter Overtemperature Thermal Protection', category: 'VVVF Inverter Drive & Controller' },
];

export const FaultDiagnosisForm: React.FC<FaultDiagnosisFormProps> = ({
  job,
  aiErrorCodes = [],
  onUpdateJob,
  onNavigateToTab,
  showToast,
}) => {
  const [complaint, setComplaint] = useState(job?.complaintReported || '');
  const [faultCategory, setFaultCategory] = useState(job?.faultCategory || FAULT_CATEGORIES[0]);
  const [faultCode, setFaultCode] = useState(job?.faultCode || 'Monarch E33');
  const [symptoms, setSymptoms] = useState<string[]>(
    job?.symptomsObserved && job.symptomsObserved.length > 0
      ? job.symptomsObserved
      : ['Door bouncing back / not closing', 'Error code on controller display']
  );
  const [diagnosis, setDiagnosis] = useState(job?.diagnosis || '');
  const [rootCause, setRootCause] = useState(job?.rootCause || '');
  const [safetyIssues, setSafetyIssues] = useState(job?.safetyIssuesIdentified || '');
  const [inspectionFindings, setInspectionFindings] = useState(job?.inspectionFindings || '');
  const [correctiveAction, setCorrectiveAction] = useState(job?.correctiveAction || '');
  const [workPerformed, setWorkPerformed] = useState(job?.workPerformed || '');
  const [technicianRemarks, setTechnicianRemarks] = useState(job?.technicianRemarks || '');
  const [recommendations, setRecommendations] = useState(job?.recommendations || '');
  const [furtherActionRequired, setFurtherActionRequired] = useState(!!job?.furtherActionRequired);
  const [followUpDate, setFollowUpDate] = useState(job?.followUpDate || '2026-09-28');
  const [liftSafetyStatus, setLiftSafetyStatus] = useState<LiftSafetyMarker>(
    job?.liftSafetyStatus || 'Safe to Operate'
  );

  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const toggleSymptom = (sym: string) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter((s) => s !== sym));
    } else {
      setSymptoms([...symptoms, sym]);
    }
  };

  const handleSaveDiagnosis = (proceedToParts = false) => {
    if (!diagnosis.trim()) {
      showToast('error', 'Missing Diagnosis', 'Please enter inspection diagnosis before saving.');
      return;
    }

    onUpdateJob({
      complaintReported: complaint,
      faultCategory,
      faultCode,
      symptomsObserved: symptoms,
      diagnosis,
      rootCause,
      safetyIssuesIdentified: safetyIssues,
      inspectionFindings,
      correctiveAction,
      workPerformed,
      technicianRemarks,
      recommendations,
      furtherActionRequired,
      followUpDate: furtherActionRequired ? followUpDate : undefined,
      liftSafetyStatus,
      jobStatus: 'In Progress',
    });

    showToast('success', 'Diagnosis Saved', 'Fault analysis and corrective actions updated.');
    if (proceedToParts) {
      onNavigateToTab('parts');
    }
  };

  const applyPresetCode = (preset: { code: string; name: string; category: string }) => {
    setFaultCode(`${preset.code} - ${preset.name}`);
    setFaultCategory(preset.category);
    if (!diagnosis) {
      setDiagnosis(`Diagnostic fault detected: ${preset.code} (${preset.name}). Inspecting subsystem.`);
    }
    showToast('info', 'Code Applied', `Selected ${preset.code}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Fault Diagnosis & Technical Remarks</h2>
              <p className="text-xs text-slate-500">
                Root Cause Analysis, Safety Hazards Assessment & Lift Safe/Unsafe Designation
              </p>
            </div>
          </div>

          {/* Lift Safety Status Quick Badge */}
          <span
            className={`text-xs font-bold px-3.5 py-1 rounded-full border self-start sm:self-auto ${
              liftSafetyStatus === 'Safe to Operate'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : liftSafetyStatus === 'Temporarily Unsafe'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            Lift Status: {liftSafetyStatus}
          </span>
        </div>
      </div>

      {/* Main Form Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
        {/* 1. Lift Safety Marker Radio Group */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <label className="text-[11px] font-black uppercase text-slate-700 block tracking-wider">
            Critical Lift Operating Status Handover *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'Safe to Operate',
                title: 'Safe to Operate',
                desc: 'All safety circuits, door interlocks & brakes passed tests.',
                color: 'border-emerald-500 bg-emerald-50/70 text-emerald-950',
                radio: 'accent-emerald-600',
              },
              {
                id: 'Temporarily Unsafe',
                title: 'Temporarily Unsafe',
                desc: 'Operable only on inspection mode under attendant observation.',
                color: 'border-amber-500 bg-amber-50/70 text-amber-950',
                radio: 'accent-amber-600',
              },
              {
                id: 'Out of Service',
                title: 'Out of Service',
                desc: 'Main power isolated, lock-out tag-out applied, parts pending.',
                color: 'border-rose-500 bg-rose-50/70 text-rose-950',
                radio: 'accent-rose-600',
              },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  liftSafetyStatus === option.id
                    ? option.color + ' shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="liftSafetyMarker"
                  value={option.id}
                  checked={liftSafetyStatus === option.id}
                  onChange={() => setLiftSafetyStatus(option.id as LiftSafetyMarker)}
                  className={`mt-0.5 ${option.radio}`}
                />
                <div>
                  <strong className="block font-black text-xs">{option.title}</strong>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                    {option.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Reported Problem & Fault Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Complaint / Problem Reported *
            </label>
            <input
              type="text"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
              placeholder="e.g. Lift door bouncing back at 7th floor..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Fault Category *
            </label>
            <select
              value={faultCategory}
              onChange={(e) => setFaultCategory(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            >
              {FAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Controller Fault Code & Quick AI Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase text-slate-500">
              Controller Diagnostic Fault Code
            </label>
            <span className="text-[10px] text-slate-400">Quick-apply OEM error codes:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {PRESET_FAULT_CODES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => applyPresetCode(item)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-bold transition-all"
              >
                {item.code}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={faultCode}
            onChange={(e) => setFaultCode(e.target.value)}
            className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            placeholder="e.g. Monarch E33 - Door Interlock Safety Open During Flight"
          />
        </div>

        {/* 4. Symptoms Observed (Interactive Multi-Select Chips) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-slate-500 block">
            Symptoms Observed at Site
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((sym) => {
              const isSelected = symptoms.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1976D2] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{sym}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Diagnosis & Root Cause */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Field Engineer Diagnosis *
            </label>
            <textarea
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Detailed explanation of the mechanical or electrical failure found..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Root Cause Analysis *
            </label>
            <textarea
              rows={3}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Underlying origin (e.g. spring fatigue, sill dust, voltage surge)..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>
        </div>

        {/* 6. Safety Hazards & Inspection Findings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Safety Issues Identified
            </label>
            <textarea
              rows={2}
              value={safetyIssues}
              onChange={(e) => setSafetyIssues(e.target.value)}
              placeholder="Hazard risks identified (e.g. lock-out tag-out, interlock bypass)..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Inspection Findings
            </label>
            <textarea
              rows={2}
              value={inspectionFindings}
              onChange={(e) => setInspectionFindings(e.target.value)}
              placeholder="Observations on brake clearance, guide rollers, cables, sills..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>
        </div>

        {/* 7. Corrective Action & Work Performed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Corrective Action Carried Out
            </label>
            <textarea
              rows={3}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="Replaced worn lock beak, realigned light curtain optical sensors..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Detailed Work Performed
            </label>
            <textarea
              rows={3}
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              placeholder="Step-by-step actions: isolated 415V breaker, installed OEM spare, tested 15 runs..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>
        </div>

        {/* 8. Remarks & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Technician Remarks
            </label>
            <textarea
              rows={2}
              value={technicianRemarks}
              onChange={(e) => setTechnicianRemarks(e.target.value)}
              placeholder="General observations and performance summary..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Recommendations for Building Management
            </label>
            <textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="e.g. Keep door sills dry, avoid heavy trolley door wedging..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            />
          </div>
        </div>

        {/* 9. Further Action Required Toggle */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <strong className="block font-bold text-slate-800">Further Action Required?</strong>
            <span className="text-[11px] text-slate-500">
              Does this elevator require a follow-up revisit, spare part procurement, or safety audit?
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={furtherActionRequired}
                onChange={(e) => setFurtherActionRequired(e.target.checked)}
                className="w-4 h-4 accent-[#1976D2] rounded"
              />
              <span>Yes, Follow-up Required</span>
            </label>

            {furtherActionRequired && (
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
              />
            )}
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => handleSaveDiagnosis(false)}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Save Draft Diagnosis</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveDiagnosis(true)}
            className="px-6 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>Save & Proceed to Spare Parts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
