import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
  FileCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AmcContract, AmcType } from '../../types';
import { AMCRenewalPipeline } from './AMCRenewalPipeline';

export const AmcManager: React.FC = () => {
  const { amcContracts, buildings, lifts, createAmcContract, renewAmcContract } = useApp();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contracts'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New contract state
  const [buildingId, setBuildingId] = useState(buildings[0]?.id || '');
  const [amcType, setAmcType] = useState<AmcType>('Comprehensive');
  const [contractValue, setContractValue] = useState(180000);
  const [selectedLiftIds, setSelectedLiftIds] = useState<string[]>([]);

  const filteredContracts = amcContracts.filter(
    (c) =>
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.buildingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBuilding = buildings.find((b) => b.id === buildingId) || buildings[0];
  const buildingLifts = lifts.filter((l) => l.buildingId === selectedBuilding?.id);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;

    createAmcContract({
      clientId: selectedBuilding.clientId,
      clientName: selectedBuilding.clientName,
      buildingId: selectedBuilding.id,
      buildingName: selectedBuilding.name,
      liftIds: selectedLiftIds.length > 0 ? selectedLiftIds : buildingLifts.map((l) => l.id),
      amcType,
      contractValue,
    });

    setIsAddModalOpen(false);
  };

  const expiringCount = amcContracts.filter((c) => {
    const days = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 90;
  }).length;

  return (
    <div className="space-y-5 text-slate-800">
      {/* Top Header Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-[#0b2545] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>30/60/90-Day Renewal Pipeline</span>
            {expiringCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {expiringCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'contracts'
                ? 'bg-[#0b2545] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>All Active Contracts ({amcContracts.length})</span>
          </button>
        </div>

        {activeTab === 'contracts' && (
          <button
            onClick={() => {
              setSelectedLiftIds(buildingLifts.map((l) => l.id));
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Issue New AMC Contract
          </button>
        )}
      </div>

      {activeTab === 'pipeline' ? (
        <AMCRenewalPipeline />
      ) : (
        <>
          {/* Search Header for Contracts Tab */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AMC number, society, client..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] focus:ring-1 focus:ring-[#1976D2] outline-none shadow-sm"
            />
          </div>

      {/* Contracts Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Contract No.</th>
              <th className="p-3.5">Society & Building</th>
              <th className="p-3.5">Plan Type</th>
              <th className="p-3.5">Validity Period</th>
              <th className="p-3.5 text-right">Value (₹)</th>
              <th className="p-3.5 text-center">PM Completed</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Renewal Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredContracts.map((amc) => {
              const isExpiringSoon = amc.status === 'expiring_soon';
              return (
                <tr key={amc.id} className="hover:bg-blue-50/50 text-slate-700 transition-colors">
                  <td className="p-3.5 font-bold text-[#1976D2] font-mono">
                    <span className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      {amc.contractNumber}
                    </span>
                  </td>
                  <td className="p-3.5 font-sans">
                    <div className="font-bold text-slate-900">{amc.buildingName}</div>
                    <div className="text-[11px] text-slate-500">
                      {amc.liftIds.length} Lifts covered
                    </div>
                  </td>
                  <td className="p-3.5 font-sans font-semibold text-slate-800">{amc.amcType}</td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                    {amc.startDate} to <strong className="text-slate-900">{amc.endDate}</strong>
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                    ₹{amc.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded font-mono">
                      {amc.pmVisitsDone}/{amc.pmVisitsTotal}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                        amc.status === 'active'
                          ? 'bg-emerald-100 text-[#2E7D32]'
                          : isExpiringSoon
                          ? 'bg-amber-100 text-[#F9A825]'
                          : 'bg-red-100 text-[#D32F2F]'
                      }`}
                    >
                      ● {amc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-sans">
                    <button
                      onClick={() => {
                        const newYear = new Date(amc.endDate);
                        newYear.setFullYear(newYear.getFullYear() + 1);
                        renewAmcContract(amc.id, newYear.toISOString().split('T')[0]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#1976D2] text-xs font-bold border border-slate-200 hover:border-blue-300 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Extend 1-Yr
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Contract Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-slate-800 flex flex-col gap-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Issue Annual Maintenance Contract (AMC)
                </h3>
                <p className="text-xs text-slate-500">
                  Bind lifts under comprehensive maintenance plan
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Target Building / Society</label>
                <select
                  value={buildingId}
                  onChange={(e) => {
                    setBuildingId(e.target.value);
                    const b = buildings.find((bld) => bld.id === e.target.value);
                    const bLifts = lifts.filter((l) => l.buildingId === b?.id);
                    setSelectedLiftIds(bLifts.map((l) => l.id));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-[#1976D2]"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">AMC Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Comprehensive', 'Semi-Comprehensive', 'Non-Comprehensive'] as AmcType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAmcType(t)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        amcType === t
                          ? 'bg-[#1976D2] text-white border-[#1976D2] shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.split('-')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Annual Contract Base Price (₹)</label>
                <input
                  type="number"
                  value={contractValue}
                  onChange={(e) => setContractValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  + 18% GST (Total: ₹{Math.round(contractValue * 1.18).toLocaleString('en-IN')})
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Activate AMC Contract
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
