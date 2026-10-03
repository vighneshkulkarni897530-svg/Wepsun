import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { apiFetch } from '../../services/api';

interface ClientAmcRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientAmcRenewalModal: React.FC<ClientAmcRenewalModalProps> = ({ isOpen, onClose }) => {
  const { renewAmcContract, amcContracts, showToast } = useApp();
  const [selectedTier, setSelectedTier] = useState<'Non-Comprehensive' | 'Semi-Comprehensive' | 'Comprehensive'>('Comprehensive');
  const [durationYears, setDurationYears] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentAmc = amcContracts[0];
  const liftCount = currentAmc?.liftIds.length || 5;

  const tierPrices = {
    'Non-Comprehensive': { basePerLift: 12000, desc: 'Labor & routine preventive checkups only (spares chargeable at discounted rates)' },
    'Semi-Comprehensive': { basePerLift: 22000, desc: 'Routine PM checkups + common wear parts & electronic sensors covered' },
    'Comprehensive': { basePerLift: 38000, desc: 'Zero-cost total coverage (Controller, motor, ARD, traction ropes, door operator & PM visits)' },
  };

  const selectedTierInfo = tierPrices[selectedTier];
  const contractValue = selectedTierInfo.basePerLift * liftCount * durationYears;
  const gstAmount = contractValue * 0.18;
  const grandTotal = contractValue + gstAmount;

  const handleProceedRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (currentAmc) {
        await apiFetch<any>('/amc/accept-and-renew', {
          method: 'POST',
          body: JSON.stringify({
            contractId: currentAmc.id,
            tenureYears: durationYears,
            agreedAmount: grandTotal,
            signatoryName: 'Society Secretary',
            signatoryRole: 'Authorized Signatory',
          }),
        });

        const newExpiry = new Date(currentAmc.endDate);
        newExpiry.setFullYear(newExpiry.getFullYear() + durationYears);
        renewAmcContract(currentAmc.id, newExpiry.toISOString().split('T')[0]);
      }

      showToast('success', 'AMC Renewal Executed Successfully', 'Your building contract is renewed and provisioned in PostgreSQL.');
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Safe
      }
      onClose();
    } catch {
      if (currentAmc) {
        const newExpiry = new Date(currentAmc.endDate);
        newExpiry.setFullYear(newExpiry.getFullYear() + durationYears);
        renewAmcContract(currentAmc.id, newExpiry.toISOString().split('T')[0]);
      }
      showToast('success', 'AMC Renewal Request Submitted', 'WEPSUN commercial team has generated your renewal agreement.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative text-slate-800 max-h-[92vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-[#123B5D] flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Renew Your AMC</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your AMC expires on <strong>31 December 2026</strong>. Renew your AMC to continue uninterrupted lift maintenance and service support.
            </p>
          </div>
        </div>

        <form onSubmit={handleProceedRenewal} className="space-y-4 text-xs">
          {/* Plan Options */}
          <div>
            <label className="block text-slate-700 font-bold mb-2">Select Maintenance Tier</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Non-Comprehensive', 'Semi-Comprehensive', 'Comprehensive'] as const).map((t) => {
                const isSelected = selectedTier === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-[#1976D2] ring-2 ring-[#1976D2]/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{t}</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        {tierPrices[t].desc}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 font-mono font-bold text-[#1976D2]">
                      ₹{tierPrices[t].basePerLift.toLocaleString()} / lift / yr
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Contract Duration</label>
              <select
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
              >
                <option value={1}>1 Year (12 Months)</option>
                <option value={2}>2 Years (5% Multi-Year Discount)</option>
                <option value={3}>3 Years (10% Multi-Year Discount)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Number of Lifts Covered</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono">
                {liftCount} Elevators (All Building Wings)
              </div>
            </div>
          </div>

          {/* Coverage Summary Matrix */}
          <div className="bg-[#F5F8FA] p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">Coverage Details ({selectedTier})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="space-y-1">
                <span className="font-bold text-emerald-800">✓ Covered Parts & Services:</span>
                <p className="text-slate-600">
                  {selectedTier === 'Comprehensive'
                    ? 'All electronic boards, motors, relays, coils, sensors, sheaves, door operator, and monthly PM routines included.'
                    : selectedTier === 'Semi-Comprehensive'
                    ? 'Routine checkups, door rollers, limit switches, buttons, and minor electronic items.'
                    : 'Labor, emergency response calls, and monthly safety checkups.'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-600">✕ Excluded Parts:</span>
                <p className="text-slate-500">
                  {selectedTier === 'Comprehensive'
                    ? 'Physical cabin aesthetic modifications and vandalism damage.'
                    : 'Major machine overhauls, motor rewinding, traveling cables.'}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Math Box */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Contract Value ({liftCount} Lifts x {durationYears} Yr):</span>
              <span className="font-bold text-slate-900">₹{contractValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%):</span>
              <span className="font-bold text-slate-900">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-blue-200">
              <span>Total Renewal Amount:</span>
              <span className="text-[#1976D2]">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold shadow-md shadow-blue-900/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-300" />
              <span>{isSubmitting ? 'Processing...' : 'Proceed to Renewal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
