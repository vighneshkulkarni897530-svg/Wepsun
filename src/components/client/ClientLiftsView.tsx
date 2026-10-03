import React, { useState } from 'react';
import {
  Layers,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
  Building,
  FileCheck,
  Download,
  Activity,
} from 'lucide-react';
import { Lift } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadLiftPassportPdf } from '../../services/pdfGenerator';
import { IoTLiftSimulationModal } from '../common/IoTLiftSimulationModal';

interface ClientLiftsViewProps {
  lifts: Lift[];
  onOpenPassport: (lift: Lift) => void;
  onRaiseComplaint: (liftId?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const ClientLiftsView: React.FC<ClientLiftsViewProps> = ({
  lifts,
  onOpenPassport,
  onRaiseComplaint,
  onNavigateTab,
}) => {
  const { activeCompany } = useApp();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'under_maintenance' | 'breakdown'>('all');
  const [selectedIoTLift, setSelectedIoTLift] = useState<Lift | null>(null);

  const filteredLifts = lifts.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      l.liftNumber.toLowerCase().includes(q) ||
      l.buildingName.toLowerCase().includes(q) ||
      (l.brand && l.brand.toLowerCase().includes(q)) ||
      (l.model && l.model.toLowerCase().includes(q)) ||
      (l.locationDetails && l.locationDetails.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || l.currentStatus === statusFilter;
    return matchQuery && matchStatus;
  });

  const getStatusBadge = (status: Lift['currentStatus']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Running / Operational
          </span>
        );
      case 'under_maintenance':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Under Maintenance
          </span>
        );
      case 'breakdown':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            Breakdown / Offline
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700">
            Inactive
          </span>
        );
    }
  };

  const getAmcBadge = (amcStatus: Lift['amcStatus']) => {
    if (amcStatus === 'active') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold font-mono text-[10px] border border-emerald-200">
          AMC Active
        </span>
      );
    }
    if (amcStatus === 'expiring_soon') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold font-mono text-[10px] border border-amber-200">
          AMC Expiring Soon
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold font-mono text-[10px] border border-rose-200">
        AMC Expired
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Header & Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#1976D2]">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">My Lifts Fleet</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              All registered passenger and service elevators under active maintenance for your society
            </p>
          </div>

          {/* Quick Right Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onRaiseComplaint()}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Raise Breakdown Ticket</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Lift Number, Building, Location, Brand..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
            >
              <option value="all">All Operational Status</option>
              <option value="operational">Running / Operational</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="breakdown">Breakdown</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#1976D2] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1976D2] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lifts Content */}
      {filteredLifts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-sm text-slate-700">No Lifts Matching Filter</h3>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or filter tags.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLifts.map((lift) => (
            <div
              key={lift.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3.5">
                {/* Card Top Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {lift.liftNumber}
                  </span>
                  {getStatusBadge(lift.currentStatus)}
                </div>

                {/* Building & Details */}
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-[#1976D2] transition-colors">
                    {lift.buildingName}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <span>{lift.locationDetails || 'Main Passenger Shaft'}</span>
                    <span>•</span>
                    <span>{lift.type}</span>
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#F5F8FA] border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">Brand & Model</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {lift.brand} ({lift.model})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">Rated Capacity</span>
                    <span className="font-bold text-slate-800 block">
                      {lift.capacityPersons} Pers / {lift.capacityKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">Last PM Date</span>
                    <span className="font-semibold text-slate-700 block font-mono">{lift.lastPmDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">Next PM Date</span>
                    <span className="font-bold text-emerald-700 block font-mono">{lift.nextPmDate}</span>
                  </div>
                </div>

                {/* AMC & Warranty Strip */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">AMC Status</span>
                    {getAmcBadge(lift.amcStatus)}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block font-mono">Warranty Status</span>
                    <span className="font-semibold text-slate-700 font-mono text-[11px]">
                      {new Date(lift.warrantyExpiry) > new Date() ? 'Under Warranty' : 'Post-Warranty AMC'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedIoTLift(lift)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title="Real-time IoT Telemetry & 3D Simulation"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>IoT Live</span>
                </button>
                <button
                  onClick={() => onOpenPassport(lift)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-[#1976D2] font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  onClick={() => downloadLiftPassportPdf(lift, activeCompany)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                  title="Download Specification Passport PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRaiseComplaint(lift.id)}
                  className="flex-1 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-700 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">Lift ID / Number</th>
                  <th className="p-4 font-bold">Building & Location</th>
                  <th className="p-4 font-bold">Type & Capacity</th>
                  <th className="p-4 font-bold">Brand & Model</th>
                  <th className="p-4 font-bold">Operational Status</th>
                  <th className="p-4 font-bold">Last PM</th>
                  <th className="p-4 font-bold">Next PM</th>
                  <th className="p-4 font-bold">AMC Status</th>
                  <th className="p-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLifts.map((lift) => (
                  <tr key={lift.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#1976D2]">
                      <span className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {lift.liftNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{lift.buildingName}</span>
                      <span className="text-[11px] text-slate-500">{lift.locationDetails}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{lift.type}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {lift.capacityPersons} Pers / {lift.capacityKg} kg
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{lift.brand}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{lift.model}</span>
                    </td>
                    <td className="p-4">{getStatusBadge(lift.currentStatus)}</td>
                    <td className="p-4 font-mono text-slate-600">{lift.lastPmDate}</td>
                    <td className="p-4 font-mono font-bold text-emerald-700">{lift.nextPmDate}</td>
                    <td className="p-4">{getAmcBadge(lift.amcStatus)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedIoTLift(lift)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition-all flex items-center gap-1 shadow-sm"
                          title="Real-time IoT Telemetry & 3D Simulation"
                        >
                          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          <span>IoT</span>
                        </button>
                        <button
                          onClick={() => onOpenPassport(lift)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onRaiseComplaint(lift.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-sm"
                        >
                          Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real-time IoT 3D Simulation & Telemetry Modal */}
      <IoTLiftSimulationModal
        lift={selectedIoTLift}
        isOpen={!!selectedIoTLift}
        onClose={() => setSelectedIoTLift(null)}
      />
    </div>
  );
};
