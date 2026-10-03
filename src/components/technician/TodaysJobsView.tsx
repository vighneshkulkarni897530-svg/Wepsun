import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Clock,
  MapPin,
  Building2,
  Calendar,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Hammer,
  Search,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  Sparkles,
  Filter,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { TechnicianJob, JobType, JobPriority, JobWorkflowStatus } from '../../types';
import { apiService } from '../../services/api';

interface TodaysJobsViewProps {
  jobs: TechnicianJob[];
  selectedJobId: string;
  onSelectJob: (job: TechnicianJob) => void;
  onUpdateJobStatus: (jobId: string, nextStatus: JobWorkflowStatus) => void;
  onNavigateToTab: (tab: string) => void;
}

const JOB_TYPE_ICONS: Record<JobType, React.ReactNode> = {
  Breakdown: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  'Preventive Maintenance (PM)': <ShieldCheck className="w-4 h-4 text-emerald-500" />,
  Installation: <Hammer className="w-4 h-4 text-blue-500" />,
  Repair: <Wrench className="w-4 h-4 text-indigo-500" />,
  'Emergency Call': <Zap className="w-4 h-4 text-rose-500 animate-pulse" />,
};

const PRIORITY_BADGES: Record<JobPriority, { bg: string; text: string; border: string }> = {
  Emergency: { bg: 'bg-rose-500/15', text: 'text-rose-700', border: 'border-rose-300' },
  High: { bg: 'bg-amber-500/15', text: 'text-amber-700', border: 'border-amber-300' },
  Medium: { bg: 'bg-blue-500/15', text: 'text-blue-700', border: 'border-blue-300' },
  Low: { bg: 'bg-slate-500/15', text: 'text-slate-700', border: 'border-slate-300' },
};

const STATUS_PROGRESSION: Record<JobWorkflowStatus, { next?: JobWorkflowStatus; label: string; actionText: string; color: string }> = {
  Assigned: { next: 'Accepted', label: 'Assigned', actionText: 'Accept Job', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  Accepted: { next: 'On The Way', label: 'Accepted', actionText: 'Start Travel (En Route)', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  'On The Way': { next: 'Checked In', label: 'On The Way', actionText: 'GPS Check-In at Site', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  'Checked In': { next: 'In Progress', label: 'Checked In', actionText: 'Begin Diagnostics & Work', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  'In Progress': { next: 'Completed', label: 'In Progress', actionText: 'Complete & Verify', color: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' },
  Completed: { next: 'Checked Out', label: 'Completed', actionText: 'Check Out & Generate PDF', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  'Checked Out': { label: 'Checked Out', actionText: 'Archived / Read-Only', color: 'bg-teal-100 text-teal-800 border-teal-300' },
};

export const TodaysJobsView: React.FC<TodaysJobsViewProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onUpdateJobStatus,
  onNavigateToTab,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Type Filter
      if (selectedTypeFilter !== 'all' && job.jobType !== selectedTypeFilter) return false;
      // Priority Filter
      if (selectedPriorityFilter !== 'all' && job.priority !== selectedPriorityFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          job.jobId.toLowerCase().includes(query) ||
          job.clientName.toLowerCase().includes(query) ||
          job.buildingName.toLowerCase().includes(query) ||
          job.liftNumber.toLowerCase().includes(query) ||
          job.complaintReported.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [jobs, selectedTypeFilter, selectedPriorityFilter, searchQuery]);

  // Categories count
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: jobs.length,
      Breakdown: 0,
      'Preventive Maintenance (PM)': 0,
      Installation: 0,
      Repair: 0,
      'Emergency Call': 0,
    };
    jobs.forEach((j) => {
      if (counts[j.jobType] !== undefined) {
        counts[j.jobType]++;
      }
    });
    return counts;
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Header & Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5 text-[#1976D2]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Today's Assigned Jobs</h2>
                <p className="text-xs text-slate-500">
                  Strict Field Scoping: Showing {filteredJobs.length} work orders assigned to you
                </p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Job ID, Building, Lift ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 focus:border-[#1976D2]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 5 Job Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedTypeFilter === 'all'
                ? 'bg-[#123B5D] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Assigned</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
              {typeCounts.all}
            </span>
          </button>

          {(
            [
              'Breakdown',
              'Preventive Maintenance (PM)',
              'Emergency Call',
              'Repair',
              'Installation',
            ] as JobType[]
          ).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedTypeFilter === type
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {JOB_TYPE_ICONS[type]}
              <span>{type}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-mono">
                {typeCounts[type] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Jobs Match Selected Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            You are all caught up in this category or no active tickets are assigned to your technician account.
          </p>
          <button
            onClick={() => {
              setSelectedTypeFilter('all');
              setSelectedPriorityFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            const priorityConfig = PRIORITY_BADGES[job.priority] || PRIORITY_BADGES.Medium;
            const statusConfig = STATUS_PROGRESSION[job.jobStatus] || STATUS_PROGRESSION.Assigned;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1976D2] ring-2 ring-[#1976D2]/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-xs">
                        {job.jobId}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
                      >
                        {job.priority === 'Emergency' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                        {job.priority} Priority
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        {JOB_TYPE_ICONS[job.jobType]}
                        {job.jobType}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs whitespace-nowrap ${statusConfig.color}`}
                    >
                      {job.jobStatus}
                    </span>
                  </div>

                  {/* Complaint Title */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {job.complaintReported}
                  </h3>
                </div>

                {/* Job Metadata Body */}
                <div className="p-5 space-y-3.5 text-xs text-slate-600 flex-1">
                  {/* Client & Building */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Client / Society</span>
                      <p className="font-bold text-slate-800 truncate">{job.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {job.buildingName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Elevator ID & Wing</span>
                      <p className="font-mono font-bold text-[#1976D2] flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {job.liftNumber}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{job.locationDetails}</p>
                    </div>
                  </div>

                  {/* Schedule & Duration */}
                  <div className="grid grid-cols-3 gap-2 py-1 text-center border-y border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Scheduled Date</span>
                      <span className="font-semibold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {job.scheduledDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Scheduled Time</span>
                      <span className="font-semibold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {job.scheduledTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Est. Duration</span>
                      <span className="font-semibold text-slate-700 mt-0.5 block">{job.estimatedDuration}</span>
                    </div>
                  </div>

                  {/* Assigned By info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Assigned by: <strong className="text-slate-700">{job.assignedBy}</strong>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(job.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Status Pipeline Step Indicators */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>Workflow Progression</span>
                      <span className="text-[#1976D2]">{job.jobStatus}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[
                        'Assigned',
                        'Accepted',
                        'On The Way',
                        'Checked In',
                        'In Progress',
                        'Completed',
                        'Checked Out',
                      ].map((step, idx) => {
                        const statusOrder = [
                          'Assigned',
                          'Accepted',
                          'On The Way',
                          'Checked In',
                          'In Progress',
                          'Completed',
                          'Checked Out',
                        ];
                        const currentIdx = statusOrder.indexOf(job.jobStatus);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="text-center group relative">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isCurrent
                                  ? 'bg-[#1976D2] shadow-xs'
                                  : isDone
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <span className="text-[8px] truncate block text-slate-400 mt-1">
                              {step === 'On The Way' ? 'En Route' : step === 'In Progress' ? 'Work' : step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const msg =
                          `👷 *WEPSUN FIELD ENGINEER UPDATE*\n\n` +
                          `Hello *${job.clientName}*,\n` +
                          `Technician *Rohan Patil* is attending *${job.liftNumber}* at *${job.buildingName}*.\n` +
                          `Current Status: *${job.jobStatus}*\n` +
                          `Issue: *${job.complaintReported}*\n\n` +
                          `📞 *24x7 Control Room:* +91 98201 55432`;
                        apiService.openWhatsAppDirect('+919820155432', msg);
                      }}
                      className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs flex items-center gap-1 text-xs font-bold"
                      title="Send WhatsApp Update / ETA to Client"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden md:inline">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectJob(job);
                        onNavigateToTab('client_lift');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Next Workflow Action Button */}
                    {statusConfig.next && (
                      <button
                        onClick={() => {
                          onSelectJob(job);
                          onUpdateJobStatus(job.id, statusConfig.next!);
                          if (statusConfig.next === 'Checked In') {
                            onNavigateToTab('checkin_checkout');
                          } else if (statusConfig.next === 'In Progress') {
                            onNavigateToTab('diagnosis');
                          } else if (statusConfig.next === 'Completed') {
                            onNavigateToTab('signature_otp');
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm transition-all flex items-center gap-1.5 ${
                          job.priority === 'Emergency'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-[#1976D2] hover:bg-blue-700'
                        }`}
                      >
                        <span>{statusConfig.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {job.jobStatus === 'Checked Out' && (
                      <button
                        onClick={() => {
                          onSelectJob(job);
                          onNavigateToTab('service_report');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>View Service PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
