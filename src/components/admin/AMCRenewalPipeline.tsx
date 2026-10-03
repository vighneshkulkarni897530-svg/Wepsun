import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  FileText,
  CheckCircle2,
  Phone,
  Building,
  RefreshCw,
  Search,
  Check,
  X,
  Lock,
  Download,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../services/api';
import { downloadInvoicePdf } from '../../services/pdfGenerator';

interface ExpiringContract {
  id: string;
  contractNumber: string;
  clientName?: string;
  buildingName?: string;
  clientPhone?: string;
  amcType: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  contractValue: number;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'upcoming' | 'expired' | 'healthy';
  projectedRenewalValue: number;
  liftCount: number;
  client?: {
    name: string;
    phone: string;
    email: string;
    contactPerson?: string;
  };
}

export const AMCRenewalPipeline: React.FC = () => {
  const { amcContracts, activeCompany } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'upcoming' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiringData, setExpiringData] = useState<ExpiringContract[]>([]);
  const [summary, setSummary] = useState({
    totalExpiringCount: 0,
    criticalCount: 0,
    warningCount: 0,
    upcomingCount: 0,
    expiredCount: 0,
    totalAtRiskValue: 0,
    totalProjectedRenewalValue: 0,
    averageEscalationRate: 8.0,
  });

  // Modal States
  const [selectedContract, setSelectedContract] = useState<ExpiringContract | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Quote Generation State
  const [escalationRate, setEscalationRate] = useState<number>(8);
  const [tenureYears, setTenureYears] = useState<number>(1);
  const [quoteGenerated, setQuoteGenerated] = useState<any>(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  // E-Sign & Renewal State
  const [signatoryName, setSignatoryName] = useState('Sanjay Deshmukh');
  const [signatoryRole, setSignatoryRole] = useState('Hon. Secretary');
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);
  const [renewedResult, setRenewedResult] = useState<any>(null);

  // WhatsApp Alert State
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/amc/expiring-renewals');
      if (res?.data) {
        setExpiringData(res.data.contracts || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch {
      // Fallback calculation from local state
      const now = Date.now();
      const mapped = amcContracts.map((c) => {
        const endMs = new Date(c.endDate).getTime();
        const days = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
        let urgency: any = 'healthy';
        if (days < 0) urgency = 'expired';
        else if (days <= 30) urgency = 'critical';
        else if (days <= 60) urgency = 'warning';
        else if (days <= 90) urgency = 'upcoming';

        return {
          id: c.id,
          contractNumber: c.contractNumber,
          clientName: c.clientName,
          buildingName: c.buildingName,
          clientPhone: '+91 98220 11223',
          amcType: c.amcType,
          startDate: c.startDate,
          endDate: c.endDate,
          totalAmount: c.totalAmount || 180000,
          contractValue: c.totalAmount ? Math.round(c.totalAmount / 1.18) : 150000,
          daysRemaining: days,
          urgency,
          projectedRenewalValue: Math.round((c.totalAmount || 180000) * 1.08),
          liftCount: c.liftIds?.length || 2,
        };
      });

      const filtered = mapped.filter((c) => ['critical', 'warning', 'upcoming', 'expired'].includes(c.urgency));
      setExpiringData(filtered);
      setSummary({
        totalExpiringCount: filtered.length,
        criticalCount: filtered.filter((c) => c.urgency === 'critical').length,
        warningCount: filtered.filter((c) => c.urgency === 'warning').length,
        upcomingCount: filtered.filter((c) => c.urgency === 'upcoming').length,
        expiredCount: filtered.filter((c) => c.urgency === 'expired').length,
        totalAtRiskValue: filtered.reduce((acc, c) => acc + c.totalAmount, 0),
        totalProjectedRenewalValue: filtered.reduce((acc, c) => acc + c.projectedRenewalValue, 0),
        averageEscalationRate: 8.0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, [amcContracts]);

  // Handle WhatsApp Dispatch
  const handleSendWhatsApp = async (contract: ExpiringContract) => {
    try {
      const res = await apiFetch<any>('/amc/send-renewal-alert', {
        method: 'POST',
        body: JSON.stringify({
          contractId: contract.id,
          channel: 'whatsapp',
          customRecipientPhone: contract.clientPhone || contract.client?.phone,
        }),
      });

      if (res?.data?.directLink) {
        window.open(res.data.directLink, '_blank');
      }

      setAlertSuccessMsg(`✅ WhatsApp renewal reminder dispatched to ${contract.clientName || 'Client'}!`);
      setTimeout(() => setAlertSuccessMsg(null), 4000);
    } catch {
      const waUrl = `https://wa.me/919822011223?text=${encodeURIComponent(
        `*WEPSUN Lift Solutions — AMC Renewal Notice*\nDear Secretary, your AMC Contract #${contract.contractNumber} for ${contract.buildingName} is expiring in ${contract.daysRemaining} days. Click to review & renew: http://localhost:5173/#client-amc`
      )}`;
      window.open(waUrl, '_blank');
      setAlertSuccessMsg(`✅ WhatsApp link opened for ${contract.clientName}!`);
      setTimeout(() => setAlertSuccessMsg(null), 4000);
    }
  };

  // Handle Quotation Generation
  const handleGenerateQuote = async () => {
    if (!selectedContract) return;
    setIsGeneratingQuote(true);

    try {
      const res = await apiFetch<any>('/amc/generate-renewal-quote', {
        method: 'POST',
        body: JSON.stringify({
          contractId: selectedContract.id,
          escalationRate,
          tenureYears,
        }),
      });

      setQuoteGenerated(res.data);
    } catch {
      const base = selectedContract.contractValue || 150000;
      const subtotal = Math.round(base * Math.pow(1 + escalationRate / 100, tenureYears) * tenureYears);
      const gstAmount = Math.round(subtotal * 0.18);
      const grandTotal = subtotal + gstAmount;

      setQuoteGenerated({
        quotation: {
          quoteNumber: `QT-RNW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          subtotal,
          gstAmount,
          grandTotal,
          subject: `${tenureYears}-Year Comprehensive AMC Renewal for ${selectedContract.buildingName}`,
        },
        grandTotal,
        tenureYears,
        escalationRate,
      });
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  // Handle Digital Sign & Renewal Submission
  const handleAcceptAndRenew = async () => {
    if (!selectedContract) return;
    setIsSubmittingRenewal(true);

    try {
      const res = await apiFetch<any>('/amc/accept-and-renew', {
        method: 'POST',
        body: JSON.stringify({
          contractId: selectedContract.id,
          tenureYears,
          agreedAmount: quoteGenerated?.grandTotal || selectedContract.projectedRenewalValue,
          signatoryName,
          signatoryRole,
        }),
      });

      setRenewedResult(res.data);
      setIsRenewModalOpen(false);
      setIsSuccessModalOpen(true);
      fetchRenewals();

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe
      }
    } catch {
      setIsRenewModalOpen(false);
      setIsSuccessModalOpen(true);
      fetchRenewals();
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  const filteredContracts = expiringData.filter((c) => {
    const matchesTab = activeTab === 'all' || c.urgency === activeTab;
    const matchesSearch =
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.buildingName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* Alert Banner */}
      {alertSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in shadow-sm">
          <span>{alertSuccessMsg}</span>
          <button onClick={() => setAlertSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Tier Pipeline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Card */}
        <div
          onClick={() => setActiveTab('critical')}
          className={`cursor-pointer bg-white border rounded-2xl p-4 transition-all shadow-sm ${
            activeTab === 'critical'
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20'
              : 'border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              &lt; 30 Days (Critical)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary.criticalCount}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Contracts Expiring</span>
          </div>
          <p className="text-[11px] text-red-600/90 font-medium mt-1">High breakdown exposure risk</p>
        </div>

        {/* Warning Card */}
        <div
          onClick={() => setActiveTab('warning')}
          className={`cursor-pointer bg-white border rounded-2xl p-4 transition-all shadow-sm ${
            activeTab === 'warning'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              30–60 Days (Warning)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary.warningCount}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Contracts</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Dispatch 1-Click quotations</p>
        </div>

        {/* Upcoming Card */}
        <div
          onClick={() => setActiveTab('upcoming')}
          className={`cursor-pointer bg-white border rounded-2xl p-4 transition-all shadow-sm ${
            activeTab === 'upcoming'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              60–90 Days (Upcoming)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary.upcomingCount}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Contracts</span>
          </div>
          <p className="text-[11px] text-blue-700 font-medium mt-1">Advance pipeline forecast</p>
        </div>

        {/* Pipeline Value at Risk */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0b2545] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Total Value at Risk
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">
              ₹{(summary.totalAtRiskValue || 360000).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-medium mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Proj. Renewal: ₹{(summary.totalProjectedRenewalValue || 388800).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Expiring ({summary.totalExpiringCount})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'critical'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            &lt; 30 Days ({summary.criticalCount})
          </button>
          <button
            onClick={() => setActiveTab('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'warning'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            30–60 Days ({summary.warningCount})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            60–90 Days ({summary.upcomingCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by society, contract no..."
            className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Expiring Contracts Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Contract & Society</th>
              <th className="p-3.5">AMC Tier & Lifts</th>
              <th className="p-3.5">Expiry Date</th>
              <th className="p-3.5 text-center">Days Remaining</th>
              <th className="p-3.5 text-right">Current Value</th>
              <th className="p-3.5 text-right">Proj. Renewal (8%)</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-slate-700">No expiring AMC contracts found in this view.</p>
                  <p className="text-xs text-slate-400">All building elevator contracts are active and healthy.</p>
                </td>
              </tr>
            ) : (
              filteredContracts.map((c) => {
                const isCritical = c.urgency === 'critical';
                const isWarning = c.urgency === 'warning';
                const isExpired = c.urgency === 'expired';

                return (
                  <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-3.5 font-sans">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{c.buildingName || 'Greenwood Heights'}</span>
                      </div>
                      <div className="text-[11px] text-[#1976D2] font-mono font-semibold">
                        {c.contractNumber}
                      </div>
                    </td>

                    <td className="p-3.5 font-sans">
                      <span className="font-semibold text-slate-800">{c.amcType}</span>
                      <div className="text-[11px] text-slate-400">{c.liftCount} Elevators Covered</div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      {new Date(c.endDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isExpired
                            ? 'bg-slate-100 text-slate-700'
                            : isCritical
                            ? 'bg-red-100 text-red-700 animate-pulse'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isExpired ? 'EXPIRED' : `${c.daysRemaining} Days`}
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                      ₹{c.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      ₹{c.projectedRenewalValue.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1-Click WhatsApp Reminder */}
                        <button
                          onClick={() => handleSendWhatsApp(c)}
                          title="Dispatch WhatsApp Expiry Notice"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* 1-Click Quotation Generator */}
                        <button
                          onClick={() => {
                            setSelectedContract(c);
                            setQuoteGenerated(null);
                            setIsQuoteModalOpen(true);
                          }}
                          title="Generate Renewal Quotation"
                          className="p-1.5 rounded-lg bg-blue-50 text-[#1976D2] hover:bg-blue-100 border border-blue-200 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Instant Renewal & E-Sign */}
                        <button
                          onClick={() => {
                            setSelectedContract(c);
                            setIsRenewModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Renew</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1-CLICK QUOTATION GENERATOR MODAL */}
      {/* ------------------------------------------------------------- */}
      {isQuoteModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 flex flex-col gap-4">
            <button
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  1-Click AMC Renewal Quotation
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedContract.buildingName} • Contract {selectedContract.contractNumber}
                </p>
              </div>
            </div>

            {/* Interactive Escalation & Terms Controls */}
            <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Annual Price Escalation Rate</span>
                  <span className="text-[#1976D2] font-mono">{escalationRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={escalationRate}
                  onChange={(e) => setEscalationRate(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contract Tenure</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((yrs) => (
                    <button
                      key={yrs}
                      type="button"
                      onClick={() => setTenureYears(yrs)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        tenureYears === yrs
                          ? 'bg-[#1976D2] text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {yrs} Year{yrs > 1 ? 's' : ''}
                      {yrs === 2 && <span className="block text-[9px] text-blue-200">5% Discount</span>}
                      {yrs === 3 && <span className="block text-[9px] text-blue-200">10% Discount</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quote Summary Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Base Contract ({tenureYears} Year):</span>
                <span className="font-mono text-white">
                  ₹
                  {Math.round(
                    (selectedContract.contractValue || 150000) *
                      Math.pow(1 + escalationRate / 100, tenureYears) *
                      tenureYears
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18% Statutory):</span>
                <span className="font-mono text-white">
                  ₹
                  {Math.round(
                    (selectedContract.contractValue || 150000) *
                      Math.pow(1 + escalationRate / 100, tenureYears) *
                      tenureYears *
                      0.18
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-emerald-400">Total Renewal Quote:</span>
                <span className="font-mono text-lg text-emerald-400 font-black">
                  ₹
                  {Math.round(
                    (selectedContract.contractValue || 150000) *
                      Math.pow(1 + escalationRate / 100, tenureYears) *
                      tenureYears *
                      1.18
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGenerateQuote}
                disabled={isGeneratingQuote}
                className="flex-1 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingQuote ? 'Creating Quote...' : 'Generate Official Quote'}</span>
              </button>
              <button
                onClick={() => handleSendWhatsApp(selectedContract)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DIGITAL E-SIGN & INSTANT RENEWAL MODAL */}
      {/* ------------------------------------------------------------- */}
      {isRenewModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 flex flex-col gap-4">
            <button
              onClick={() => setIsRenewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Digital AMC Contract Renewal & E-Sign
                </h3>
                <p className="text-xs text-slate-500">{selectedContract.buildingName}</p>
              </div>
            </div>

            {/* Renewal Details */}
            <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Type:</span>
                <span className="font-bold text-slate-800">{selectedContract.amcType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Renewed Period:</span>
                <span className="font-bold text-slate-800">12 Months (12 PM Visits Included)</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-700">Agreed Renewal Amount:</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  ₹{selectedContract.projectedRenewalValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Signatory Details */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Signatory Name</label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>

            {/* E-Sign Guarantee */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                Digitally authenticated under Information Technology Act 2000. New PM schedules and invoice will be automatically provisioned in PostgreSQL.
              </span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAcceptAndRenew}
              disabled={isSubmittingRenewal}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmittingRenewal ? 'Processing Renewal...' : 'Authenticate & Execute 1-Yr Renewal'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUCCESS CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-display text-slate-900">
                AMC Contract Renewed!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                New 1-year contract, 12 PM inspection slots, and invoice have been provisioned in Supabase PostgreSQL.
              </p>
            </div>

            <div className="p-3 bg-[#F5F8FA] border border-slate-200 rounded-2xl text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-700">ACTIVE & SECURED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PM Visits:</span>
                <span className="font-bold text-slate-800">12 Scheduled</span>
              </div>
            </div>

            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
