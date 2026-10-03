import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { PartReplacementRecord } from '../../types';
import { useApp } from '../../context/AppContext';

interface ClientPartsReplacementViewProps {
  partsHistory?: PartReplacementRecord[];
}

export const ClientPartsReplacementView: React.FC<ClientPartsReplacementViewProps> = ({ partsHistory }) => {
  const { clientScopedPartsHistory, clientScopedLifts } = useApp();
  const records = partsHistory || clientScopedPartsHistory;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLiftFilter, setSelectedLiftFilter] = useState('all');

  const filteredRecords = records.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      rec.partName.toLowerCase().includes(q) ||
      rec.partNumber.toLowerCase().includes(q) ||
      rec.liftNumber.toLowerCase().includes(q) ||
      rec.technicianName.toLowerCase().includes(q) ||
      rec.reason.toLowerCase().includes(q);

    const matchLift = selectedLiftFilter === 'all' || rec.liftNumber === selectedLiftFilter;
    return matchQuery && matchLift;
  });

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const amcCoveredCount = records.filter((r) => r.isAmcCovered).length;

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                Parts Replacement Ledger
              </span>
              <span className="text-xs text-slate-500 font-mono">OEM Certified Components</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Elevator Spare Parts History</h1>
            <p className="text-xs text-slate-500">
              Complete traceable record of replaced mechanical, electronic, and safety components
            </p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Total Parts Replaced</span>
            <span className="text-lg font-black text-slate-900 font-mono">{records.length} Units</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-[10px] text-emerald-800 block uppercase font-mono font-bold">Covered Under AMC</span>
            <span className="text-lg font-black text-emerald-700 font-mono">{amcCoveredCount} Parts (₹0 Billable)</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Part Name, Part No, Serial No, Technician..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none"
          />
        </div>

        <select
          value={selectedLiftFilter}
          onChange={(e) => setSelectedLiftFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
        >
          <option value="all">All Elevators</option>
          {clientScopedLifts.map((l) => (
            <option key={l.id} value={l.liftNumber}>
              {l.liftNumber} ({l.buildingName})
            </option>
          ))}
        </select>
      </div>

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-2">
          <Wrench className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-700">No Parts Replacement Records Found</p>
          <p className="text-xs text-slate-400">All original components are currently intact and operational.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header Strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    ID: {rec.id}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{rec.partName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lift: <strong className="text-slate-800">{rec.liftNumber}</strong> • {rec.buildingName} • Replaced on {rec.replacementDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                      rec.isAmcCovered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {rec.isAmcCovered ? '✓ Covered under AMC' : 'Billable Replacement'}
                  </span>
                </div>
              </div>

              {/* Technical & Commercial Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 text-[10px] block font-mono">Part Number / HSN</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{rec.partNumber}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 text-[10px] block font-mono">Old vs New Serial</span>
                  <span className="font-medium text-slate-700 font-mono mt-0.5 block text-[11px]">
                    {rec.oldPartSerial || 'Old Part'} → <strong className="text-slate-900 font-bold">{rec.newPartSerial || 'OEM New'}</strong>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 text-[10px] block font-mono">Technician & Job Ref</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{rec.technicianName} ({rec.jobId})</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 text-[10px] block font-mono">Cost & Warranty</span>
                  <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                    ₹ {rec.cost.toLocaleString('en-IN')} • <span className="text-emerald-700 font-sans text-[11px]">{rec.warranty}</span>
                  </span>
                </div>
              </div>

              {/* Reason For Replacement Note */}
              <div className="p-3.5 rounded-2xl bg-[#F5F8FA] border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Reason for Replacement:</span>
                <p className="text-slate-800 mt-0.5">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
