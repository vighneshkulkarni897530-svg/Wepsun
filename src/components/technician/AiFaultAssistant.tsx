import React, { useState } from 'react';
import {
  Wrench,
  Search,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AiFaultAssistantProps {
  onSelectPart?: (partName: string) => void;
}

export const AiFaultAssistant: React.FC<AiFaultAssistantProps> = () => {
  const { aiErrorCodes } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCodeId, setSelectedCodeId] = useState<string>(aiErrorCodes[0]?.id || '');
  const [customSymptom, setCustomSymptom] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const brands = ['All', 'Monarch', 'Step', 'Otis', 'Kone', 'Schindler', 'Arkel'];

  const filteredCodes = aiErrorCodes.filter((item) => {
    const matchBrand = selectedBrand === 'All' || item.driveBrand === selectedBrand;
    const matchQuery =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.errorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchBrand && matchQuery;
  });

  const activeCode = aiErrorCodes.find((c) => c.id === selectedCodeId) || filteredCodes[0] || aiErrorCodes[0];

  const handleRunAiDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymptom.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiAnalysisResult(
        `Suggested Troubleshooting for "${customSymptom}":\n\n` +
        `• Probable Cause: Safety circuit intermittent drop or landing door interlock microswitch contact wear.\n` +
        `• Recommended Action: Check 110V DC safety loop across landing door beaks using a multimeter in continuity mode. Inspect door clutch skate clearance (keep 6-8mm clearance).\n` +
        `• Safety Notice: Always engage inspection STOP switch and lock out main 415V breaker before touching door motor contacts.`
      );
    }, 500);
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              AI Fault Assistant & Diagnostic Guide
            </h2>
            <p className="text-xs text-slate-500">
              Lookup error codes, symptoms, and step-by-step remedies for Monarch, Step, Arkel, Otis, Kone, and Schindler
            </p>
          </div>
        </div>
      </div>

      {/* Safety Mandatory Disclaimer (PRD Section 14) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-amber-950">Safety Mandatory Notice (PRD Section 14):</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            AI is strictly an assistive diagnostic tool. All high-voltage electrical, brake adjustments, and shaft safety operations must be verified and executed on-site by a qualified, certified elevator engineer/technician.
          </p>
        </div>
      </div>

      {/* Symptom Search Bar */}
      <form
        onSubmit={handleRunAiDiagnostic}
        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <HelpCircle className="w-4 h-4 text-[#1976D2]" />
          <span>Describe the problem or symptom for suggested checks:</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            placeholder="e.g. Lift stops at 5th floor with error E33, door is beeping..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] outline-none shadow-sm"
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-4 py-2 bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
          >
            {isAnalyzing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Get Suggestions</span>
            )}
          </button>
        </div>

        {aiAnalysisResult && (
          <div className="bg-[#F5F8FA] border border-blue-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
            {aiAnalysisResult}
          </div>
        )}
      </form>

      {/* Controller Brand Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
                selectedBrand === b
                  ? 'bg-[#1976D2] text-white border-[#1976D2] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search error code (e.g. E02, 0021)..."
            className="w-full sm:w-60 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] outline-none font-mono shadow-sm"
          />
        </div>
      </div>

      {/* 2-Column Code Viewer & Step-by-Step Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code List Column */}
        <div className="lg:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredCodes.map((code) => {
            const isSelected = code.id === activeCode?.id;
            return (
              <button
                key={code.id}
                onClick={() => setSelectedCodeId(code.id)}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 shadow-sm ${
                  isSelected
                    ? 'bg-blue-50 border-[#1976D2] text-[#1976D2]'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#1976D2]">{code.code}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                      {code.driveBrand}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                      code.severity === 'critical'
                        ? 'bg-red-100 text-[#D32F2F]'
                        : 'bg-amber-100 text-[#F9A825]'
                    }`}
                  >
                    {code.severity}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 truncate">{code.errorName}</div>
              </button>
            );
          })}
        </div>

        {/* Detailed Remedy Card */}
        {activeCode && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-[#1976D2]">
                    {activeCode.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeCode.driveBrand} Controller
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{activeCode.errorName}</h3>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                  activeCode.severity === 'critical'
                    ? 'bg-red-100 text-[#D32F2F]'
                    : 'bg-amber-100 text-[#F9A825]'
                }`}
              >
                {activeCode.severity}
              </span>
            </div>

            {/* Recognized Symptoms */}
            <div className="space-y-1.5 text-xs">
              <span className="text-slate-500 font-semibold">Common Symptoms:</span>
              <ul className="space-y-1">
                {activeCode.symptoms.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="text-[#1976D2] font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Probable Causes */}
            <div className="space-y-1.5 text-xs">
              <span className="text-slate-500 font-semibold">Probable Root Causes:</span>
              <ul className="space-y-1">
                {activeCode.possibleCauses.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="text-slate-400">→</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step-by-step remedies */}
            <div className="space-y-2 text-xs bg-[#F5F8FA] p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#1976D2]" />
                Step-by-Step Field Remedy
              </span>
              <div className="space-y-2 pt-1">
                {activeCode.stepByStepRemedy.map((step, idx) => (
                  <div key={idx} className="text-slate-700 leading-relaxed font-medium">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-700">
                <ShieldAlert className="w-4 h-4" /> Safety Protocol
              </div>
              <ul className="space-y-1 pt-1">
                {activeCode.safetyPrecautions.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>⚠️</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Spares */}
            {activeCode.suggestedParts && (
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Suggested Spare Part:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeCode.suggestedParts.map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#1976D2] font-semibold text-xs"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
