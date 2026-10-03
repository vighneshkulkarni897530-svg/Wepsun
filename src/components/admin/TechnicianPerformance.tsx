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
  const { technicians } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  const technicianMetrics = [
    {
      id: 'tech-1',
      name: 'Raj Kumar',
      phone: '+91 98201 11223',
      zone: 'Mumbai West Suburbs',
      assignedJobs: 5,
      completedJobs: 3,
      pendingJobs: 2,
      responseTime: '14 mins',
      resolutionTime: '38 mins',
      pmCompletion: '98.5%',
      customerRating: '4.9 ★',
      status: 'On Job',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'tech-2',
      name: 'Ramesh Kumar',
      phone: '+91 98202 33445',
      zone: 'Navi Mumbai & Thane',
      assignedJobs: 4,
      completedJobs: 4,
      pendingJobs: 0,
      responseTime: '18 mins',
      resolutionTime: '42 mins',
      pmCompletion: '100%',
      customerRating: '4.8 ★',
      status: 'Available',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'tech-3',
      name: 'Suresh Patel',
      phone: '+91 98203 55667',
      zone: 'Pune Central & Baner',
      assignedJobs: 6,
      completedJobs: 4,
      pendingJobs: 2,
      responseTime: '16 mins',
      resolutionTime: '45 mins',
      pmCompletion: '96.0%',
      customerRating: '4.7 ★',
      status: 'On Job',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'tech-4',
      name: 'Ajay Singh',
      phone: '+91 98204 77889',
      zone: 'Pune Hinjewadi Tech Park',
      assignedJobs: 3,
      completedJobs: 2,
      pendingJobs: 1,
      responseTime: '12 mins',
      resolutionTime: '32 mins',
      pmCompletion: '99.0%',
      customerRating: '5.0 ★',
      status: 'Emergency Dispatched',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'tech-5',
      name: 'Vikram Yadav',
      phone: '+91 98205 99001',
      zone: 'Bengaluru East Hub',
      assignedJobs: 4,
      completedJobs: 3,
      pendingJobs: 1,
      responseTime: '20 mins',
      resolutionTime: '44 mins',
      pmCompletion: '95.0%',
      customerRating: '4.8 ★',
      status: 'Available',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const filteredTechs = technicianMetrics.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery)
  );

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
          <div className="text-2xl font-bold text-slate-900 mt-1">18 Engineers</div>
          <span className="text-[11px] text-emerald-600 font-semibold">14 Active On-Duty</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Avg Response Time</span>
          <div className="text-2xl font-bold text-[#1976D2] mt-1">15.2 mins</div>
          <span className="text-[11px] text-emerald-600 font-semibold">↓ 3 mins faster</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Mean Resolution Time</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">38.4 mins</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Under 45m target</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Overall CSAT Rating</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">4.86 / 5.0</div>
          <span className="text-[11px] text-slate-400">Based on 340 ratings</span>
        </div>
      </div>

      {/* View Mode: Table (Page 27 Exact Columns) */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
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
                {filteredTechs.map((tech) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTechs.map((tech) => (
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Customer Rating:</span>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {tech.customerRating}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
