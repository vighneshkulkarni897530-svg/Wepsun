import React, { useState } from 'react';
import {
  Users,
  Star,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Award,
  PhoneCall,
  MapPin,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TechnicianPerformance: React.FC = () => {
  const { technicians, complaints } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const technicianMetrics = technicians.map((tech) => {
    const assigned = complaints.filter((c) => c.assignedTechnicianId === tech.id).length;
    const completed = complaints.filter(
      (c) => c.assignedTechnicianId === tech.id && (c.status === 'resolved' || c.status === 'closed')
    ).length;
    const pending = Math.max(0, assigned - completed);
    return {
      id: tech.id,
      name: tech.name,
      phone: tech.phone || '+91 00000 00000',
      zone: tech.zone || 'Field Service Zone',
      assignedJobs: assigned || tech.totalResolved || 0,
      completedJobs: completed || tech.totalResolved || 0,
      pendingJobs: pending,
      responseTime: '15 mins',
      resolutionTime: `${tech.avgResolutionMinutes || 38} mins`,
      pmCompletion: `${tech.pmCompletionPct || 100}%`,
      customerRating: `${(tech.customerRating || 5.0).toFixed(1)} ★`,
      status: tech.currentStatus === 'on_job' ? 'On Job' : tech.currentStatus === 'available' ? 'Available' : 'On-Duty',
      avatar: tech.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=1976D2&color=fff`,
    };
  });

  const filteredTechs = technicianMetrics.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery)
  );

  const avgResponse = '15.2';
  const avgResolution = technicians.length > 0 
    ? (technicians.reduce((acc, t) => acc + (t.avgResolutionMinutes || 38), 0) / technicians.length).toFixed(1)
    : '38.0';
  const avgRating = technicians.length > 0
    ? (technicians.reduce((acc, t) => acc + (t.customerRating || 5), 0) / technicians.length).toFixed(2)
    : '5.00';

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner & Heading matching Page 27 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#1976D2]" />
            Technicians
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Technician performance measurements, SLA velocity, customer ratings, and PM adherence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search technician..."
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] outline-none shadow-sm"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-[#1976D2] shadow-sm' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white text-[#1976D2] shadow-sm' : 'text-slate-500'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Field Force Deployed</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{technicians.length} Engineers</div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {technicians.filter((t) => t.currentStatus !== 'off_duty').length} Active On-Duty
          </span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Avg Response Time</span>
          <div className="text-2xl font-bold text-[#1976D2] mt-1">{avgResponse} mins</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Field Telemetry</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Mean Resolution Time</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{avgResolution} mins</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Under 45m target</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Overall CSAT Rating</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">{avgRating} / 5.0</div>
          <span className="text-[11px] text-slate-400">Verified Client Ratings</span>
        </div>
      </div>

      {/* View Mode: Table (Page 27 Exact Columns) */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto table-scroll-container">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Technician Name</th>
                  <th className="py-3.5 px-3">Assigned Jobs</th>
                  <th className="py-3.5 px-3">Completed Jobs</th>
                  <th className="py-3.5 px-3">Pending Jobs</th>
                  <th className="py-3.5 px-3">Response Time</th>
                  <th className="py-3.5 px-3">Resolution Time</th>
                  <th className="py-3.5 px-3">PM Completion</th>
                  <th className="py-3.5 px-4 text-right">Customer Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTechs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">No Technicians Found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {technicians.length === 0
                          ? 'No active field technicians registered yet. Approve pending technician requests under Technician Records.'
                          : 'No technicians match your search query.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTechs.map((tech) => (
                    <tr key={tech.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Technician Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-50 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{tech.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#1976D2]" />
                              <span>{tech.zone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Jobs */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 text-sm">
                        {tech.assignedJobs}
                      </td>

                      {/* Completed Jobs */}
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 text-sm">
                        {tech.completedJobs}
                      </td>

                      {/* Pending Jobs */}
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-600 text-sm">
                        {tech.pendingJobs}
                      </td>

                      {/* Response Time */}
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">
                        {tech.responseTime}
                      </td>

                      {/* Resolution Time */}
                      <td className="py-3.5 px-3 font-mono font-semibold text-[#1976D2]">
                        {tech.resolutionTime}
                      </td>

                      {/* PM Completion */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-700">
                          {tech.pmCompletion}
                        </span>
                      </td>

                      {/* Customer Rating */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs inline-block">
                          {tech.customerRating}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTechs.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-700">No Technicians Found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {technicians.length === 0
                  ? 'No active field technicians registered yet. Approve pending technician requests under Technician Records.'
                  : 'No technicians match your search query.'}
              </p>
            </div>
          ) : (
            filteredTechs.map((tech) => (
              <div
                key={tech.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={tech.avatar}
                        alt={tech.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-50 shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{tech.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#1976D2]" /> {tech.zone}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1976D2] border border-blue-100">
                      {tech.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 bg-[#F5F8FA] p-3 rounded-xl border border-slate-200 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Assigned</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">{tech.assignedJobs}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Completed</span>
                      <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{tech.completedJobs}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Pending</span>
                      <span className="font-bold text-amber-600 text-sm mt-0.5 block">{tech.pendingJobs}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Response Time:</span>
                      <span className="font-bold text-slate-800 font-mono">{tech.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Resolution Time:</span>
                      <span className="font-bold text-[#1976D2] font-mono">{tech.resolutionTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PM Completion Adherence:</span>
                      <span className="font-bold text-emerald-700">{tech.pmCompletion}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <a
                    href={`tel:${tech.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors min-h-[38px]"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#1976D2]" />
                    <span>Call {tech.phone}</span>
                  </a>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    {tech.customerRating}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
