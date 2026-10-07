import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Layers,
  FileText,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  HardHat,
  Package,
  CreditCard,
  Star,
  Clock,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ReportCategory =
  | 'complaints'
  | 'service'
  | 'amc'
  | 'technicians'
  | 'inventory'
  | 'consumption'
  | 'payments'
  | 'feedback'
  | 'lift_history';

export const AdminReportsView: React.FC = () => {
  const { lifts, branches, technicians, users, buildings, showSuccessModal } = useApp();

  const [activeReport, setActiveReport] = useState<ReportCategory>('complaints');

  // Filters: Date | Branch | Client | Building | Lift | Technician
  const [dateRange, setDateRange] = useState('This Month (Sep 2026)');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [selectedBuilding, setSelectedBuilding] = useState('All Buildings');
  const [selectedLift, setSelectedLift] = useState('All Lifts');
  const [selectedTech, setSelectedTech] = useState('All Technicians');

  const reportTabs: { id: ReportCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'complaints', label: 'Complaint Reports', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
    { id: 'service', label: 'Service Reports', icon: <FileText className="w-4 h-4 text-blue-500" /> },
    { id: 'amc', label: 'AMC Reports', icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
    { id: 'technicians', label: 'Technician Reports', icon: <HardHat className="w-4 h-4 text-amber-500" /> },
    { id: 'inventory', label: 'Inventory Reports', icon: <Package className="w-4 h-4 text-indigo-500" /> },
    { id: 'consumption', label: 'Parts Consumption', icon: <TrendingUp className="w-4 h-4 text-cyan-500" /> },
    { id: 'payments', label: 'Payment Reports', icon: <CreditCard className="w-4 h-4 text-purple-500" /> },
    { id: 'feedback', label: 'Customer Feedback', icon: <Star className="w-4 h-4 text-yellow-500" /> },
    { id: 'lift_history', label: 'Lift History', icon: <Layers className="w-4 h-4 text-teal-500" /> },
  ];

  const handleExport = (format: 'pdf' | 'csv') => {
    showSuccessModal(
      'Report Export Ready',
      `Exporting ${activeReport.toUpperCase()} Report in ${format.toUpperCase()} format with all active filters applied.`
    );
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#1976D2]" />
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational intelligence, SLA metrics, customer satisfaction, and financial breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* 9 Report Category Nav Buttons */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeReport === tab.id
                ? 'bg-[#1976D2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Multi-Filters: Date | Branch | Client | Building | Lift | Technician */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
          <Filter className="w-3.5 h-3.5 text-[#1976D2]" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Date Filter */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Date Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-800 font-medium outline-none focus:border-[#1976D2]"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month (Sep 2026)</option>
              <option>Last 3 Months</option>
              <option>Financial Year 2026-27</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-800 font-medium outline-none focus:border-[#1976D2]"
            >
              <option>All Branches</option>
              {branches.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-800 font-medium outline-none focus:border-[#1976D2]"
            >
              <option>All Clients</option>
              <option>Skyline Heights CHS</option>
              <option>Sunrise Heights Society</option>
              <option>Royal Residency Phase II</option>
              <option>Galaxy Commercial Complex</option>
              <option>Green Valley Cooperative Housing</option>
            </select>
          </div>

          {/* Building Filter */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Building</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-800 font-medium outline-none focus:border-[#1976D2]"
            >
              <option>All Buildings</option>
              <option>Skyline Towers</option>
              <option>Sunrise Apartments</option>
              <option>Royal Residency</option>
              <option>Galaxy Heights</option>
              <option>Green Valley Towers</option>
            </select>
          </div>

          {/* Lift Filter */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Lift Unit</label>
            <select
              value={selectedLift}
              onChange={(e) => setSelectedLift(e.target.value)}
              className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-800 font-medium outline-none focus:border-[#1976D2]"
            >
              <option>All Lifts</option>
              <option>WEPSUN-001 (LFT-001)</option>
              <option>WEPSUN-002 (LFT-002)</option>
              <option>WEPSUN-003 (LFT-003)</option>
              <option>WEPSUN-004 (LFT-004)</option>
              <option>WEPSUN-005 (LFT-005)</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Technician</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2 text-slate-800 font-medium outline-none focus:border-[#1976D2]"
            >
              <option>All Technicians</option>
              <option>Raj Kumar</option>
              <option>Ramesh Kumar</option>
              <option>Suresh Patel</option>
              <option>Ajay Singh</option>
              <option>Vikram Yadav</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Highlights for active report */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Events Recorded</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">128</div>
          <span className="text-[11px] text-emerald-600 font-semibold">↑ 14% vs last month</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Avg Resolution Time</span>
          <div className="text-2xl font-bold text-[#1976D2] mt-1">42 mins</div>
          <span className="text-[11px] text-emerald-600 font-semibold">SLA Target &lt; 60 mins</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">First-Time-Fix Ratio</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">94.8%</div>
          <span className="text-[11px] text-slate-400">High precision repairs</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Customer Satisfaction</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">4.9 / 5.0</div>
          <span className="text-[11px] text-amber-600 font-semibold">★★★★★ (182 ratings)</span>
        </div>
      </div>

      {/* Dynamic Report Content Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 capitalize">
            {activeReport.replace('_', ' ')} Master Log
          </h3>
          <span className="text-xs text-slate-500">Showing 5 of 128 records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Lift / Site</th>
                <th className="py-3 px-4">Type / Description</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">SLA Time</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono font-bold text-[#1976D2]">#CMP-10245</td>
                <td className="py-3 px-4 font-medium text-slate-800">WEPSUN-001 (Skyline Towers)</td>
                <td className="py-3 px-4 text-slate-600">Door sensor alignment & IR beam recalibration</td>
                <td className="py-3 px-4 font-semibold text-slate-800">Raj Kumar</td>
                <td className="py-3 px-4 text-slate-500">21 Sep 2026, 10:30 AM</td>
                <td className="py-3 px-4 font-mono text-emerald-600 font-bold">35 mins</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    RESOLVED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono font-bold text-[#1976D2]">#SR-10025</td>
                <td className="py-3 px-4 font-medium text-slate-800">WEPSUN-002 (Sunrise Apts)</td>
                <td className="py-3 px-4 text-slate-600">Routine Monthly Preventive Maintenance (28 Points)</td>
                <td className="py-3 px-4 font-semibold text-slate-800">Ramesh Kumar</td>
                <td className="py-3 px-4 text-slate-500">20 Sep 2026, 02:15 PM</td>
                <td className="py-3 px-4 font-mono text-slate-600 font-bold">45 mins</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    COMPLETED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono font-bold text-[#1976D2]">#EMG-10021</td>
                <td className="py-3 px-4 font-medium text-slate-800">WEPSUN-004 (Royal Residency)</td>
                <td className="py-3 px-4 text-slate-600">Passenger entrapment between 4th & 5th floor - ARD failure</td>
                <td className="py-3 px-4 font-semibold text-slate-800">Ajay Singh</td>
                <td className="py-3 px-4 text-slate-500">18 Sep 2026, 08:45 PM</td>
                <td className="py-3 px-4 font-mono text-emerald-600 font-bold">18 mins</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    CLOSED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono font-bold text-[#1976D2]">#QT-10025</td>
                <td className="py-3 px-4 font-medium text-slate-800">WEPSUN-001 (Skyline Towers)</td>
                <td className="py-3 px-4 text-slate-600">Door Optical Sensor Replacement Kit + Bracket</td>
                <td className="py-3 px-4 font-semibold text-slate-800">Service Desk</td>
                <td className="py-3 px-4 text-slate-500">16 Sep 2026, 11:20 AM</td>
                <td className="py-3 px-4 font-mono text-slate-400">—</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                    APPROVED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-mono font-bold text-[#1976D2]">#AMC-2026-09</td>
                <td className="py-3 px-4 font-medium text-slate-800">WEPSUN-005 (Green Valley)</td>
                <td className="py-3 px-4 text-slate-600">Comprehensive AMC Contract Renewal (1 Year)</td>
                <td className="py-3 px-4 font-semibold text-slate-800">Finance Dept</td>
                <td className="py-3 px-4 text-slate-500">15 Sep 2026, 04:00 PM</td>
                <td className="py-3 px-4 font-mono text-slate-400">—</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    ACTIVE 🟢
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
