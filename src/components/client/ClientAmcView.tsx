import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Sparkles,
  Building,
  Wrench,
  AlertTriangle,
  Download,
  Eye,
  X,
  CreditCard,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { AmcContract, Lift } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadAmcAgreementPdf } from '../../services/pdfGenerator';
import { ClientAmcRenewalModal } from './ClientAmcRenewalModal';

interface ClientAmcViewProps {
  contracts?: AmcContract[];
  lifts?: Lift[];
  onOpenRenewalModal?: () => void;
  onOpenFeedbackModal?: () => void;
}

export const ClientAmcView: React.FC<ClientAmcViewProps> = ({
  contracts,
  lifts,
  onOpenRenewalModal,
  onOpenFeedbackModal,
}) => {
  const { clientScopedAmcContracts, clientScopedLifts, activeCompany } = useApp();
  const amcContracts = contracts || clientScopedAmcContracts;
  const clientLifts = lifts || clientScopedLifts;

  const [activeContractId, setActiveContractId] = useState<string>(amcContracts[0]?.id || '');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRenewalModalOpenLocal, setIsRenewalModalOpenLocal] = useState(false);

  const activeContract = amcContracts.find((c) => c.id === activeContractId) || amcContracts[0];

  if (amcContracts.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-500 text-xs shadow-sm space-y-3">
        <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="font-bold text-base text-slate-800">No Active AMC Contract</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          You currently have no active annual maintenance agreements registered for your buildings.
        </p>
      </div>
    );
  }

  // Days to Expiry Calculation
  const expiryDate = new Date(activeContract?.endDate || Date.now());
  const today = new Date();
  const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysToExpiry <= 90 && daysToExpiry > 0;
  const isExpired = daysToExpiry <= 0;

  const handleOpenRenewal = () => {
    if (onOpenRenewalModal) {
      onOpenRenewalModal();
    } else {
      setIsRenewalModalOpenLocal(true);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Expiry Warning Reminder Banner */}
      {(isExpiringSoon || isExpired) && (
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
            isExpired
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {isExpired
                  ? 'AMC Contract Expired — Immediate Renewal Recommended'
                  : `AMC Renewal Reminder: Contract Expires in ${daysToExpiry} Days`}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                Expiry Date: <strong>{activeContract?.endDate}</strong> • Renewal Amount: ₹{' '}
                {activeContract?.totalAmount.toLocaleString('en-IN')} (Inclusive of 18% GST)
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenRenewal}
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm shrink-0 flex items-center gap-1.5 transition-all ${
              isExpired
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Renew AMC Now</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {activeContract?.contractNumber}
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  activeContract?.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                ● {activeContract?.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {activeContract?.amcType} Annual Maintenance Contract
            </h1>
            <p className="text-xs text-slate-500">
              Site: <strong>{activeContract?.buildingName}</strong> • Validity: {activeContract?.startDate} to{' '}
              <strong className="text-slate-900">{activeContract?.endDate}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>View Agreement</span>
          </button>
          <button
            onClick={() => downloadAmcAgreementPdf(activeContract, activeCompany)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-[#1976D2]" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleOpenRenewal}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Renew AMC</span>
          </button>
        </div>
      </div>

      {/* Commercial & Visits Meter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
            Contract Value
          </span>
          <div className="text-2xl font-black font-mono text-slate-900">
            ₹ {activeContract?.contractValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">
            + 18% GST (Total: ₹ {activeContract?.totalAmount.toLocaleString('en-IN')})
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
            Lifts Covered Under AMC
          </span>
          <div className="text-2xl font-black font-mono text-[#1976D2]">
            {activeContract?.liftIds.length || clientLifts.length} Elevators
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold font-mono block">
            24x7 Priority Breakdown Response
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
              PM Visits Completed
            </span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {activeContract?.pmVisitsDone} / {activeContract?.pmVisitsTotal}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  ((activeContract?.pmVisitsDone || 0) / (activeContract?.pmVisitsTotal || 12)) * 100
                )}%`,
              }}
            />
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">
            {activeContract?.pmFrequency}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
            Payment Status
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700 uppercase">
            {activeContract?.paymentStatus}
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">
            Valid until {activeContract?.endDate}
          </span>
        </div>
      </div>

      {/* Scope of Work: Services Included vs Excluded */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Included Services */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Services & Components Included (Covered)</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {activeContract?.coveredParts.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-800 flex items-start gap-2.5"
              >
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Excluded Services */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <XCircle className="w-4 h-4 text-amber-600" />
            <span>Excluded Services & Billable Repairs</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {activeContract?.excludedParts.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-slate-800 flex items-start gap-2.5"
              >
                <span className="text-amber-600 font-bold">✕</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Covered Elevators Grid */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Layers className="w-4 h-4 text-[#1976D2]" />
          <span>Elevators Covered Under This Agreement</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientLifts.map((lift) => (
            <div
              key={lift.id}
              className="p-4 rounded-2xl border border-slate-200 bg-[#F5F8FA] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#1976D2]">{lift.liftNumber}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  Covered
                </span>
              </div>
              <div className="text-slate-900 font-bold">{lift.buildingName}</div>
              <div className="text-slate-500">{lift.brand} ({lift.capacityPersons} Pers / {lift.capacityKg} kg)</div>
            </div>
          ))}
        </div>
      </div>

      {/* View Agreement Full Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeContract.amcType} Annual Maintenance Contract Agreement
                </h3>
                <span className="font-mono text-xs text-[#1976D2]">
                  Agreement Number: {activeContract.contractNumber}
                </span>
              </div>
            </div>

            <div className="py-5 space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Agreement Clauses & Service Level Agreement (SLA):</h4>
                <p>
                  1. WEPSUN Engineering Solution agrees to provide comprehensive inspection, lubrication, and 24x7 emergency response services for {activeContract.buildingName}.
                </p>
                <p>
                  2. Response time for breakdown rescue calls is within 30 minutes in municipal corporation limits.
                </p>
                <p>
                  3. All repairs are executed by factory-certified elevator technicians following ISO 9001:2015 safety checklists.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Contract Period</span>
                  <span className="font-bold text-slate-900">{activeContract.startDate} to {activeContract.endDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Annual Fee</span>
                  <span className="font-bold text-slate-900 font-mono">₹ {activeContract.totalAmount.toLocaleString('en-IN')} (Incl. GST)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  downloadAmcAgreementPdf(activeContract, activeCompany);
                  setIsPreviewModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Agreement PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {isRenewalModalOpenLocal && (
        <ClientAmcRenewalModal
          isOpen={isRenewalModalOpenLocal}
          onClose={() => setIsRenewalModalOpenLocal(false)}
        />
      )}
    </div>
  );
};
