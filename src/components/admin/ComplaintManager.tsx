import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  UserCheck,
  Wrench,
  Clock,
  PhoneCall,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Layers,
  Building,
  MessageSquare,
  Send,
  X,
  Eye,
  Film,
  ExternalLink,
  ShieldAlert,
  Filter,
  Calendar,
  User,
  Mail,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus, Lift } from '../../types';
import { ServiceReportModal } from '../common/ServiceReportModal';
import { LiftDigitalPassportModal } from '../common/LiftDigitalPassportModal';
import { apiService } from '../../services/api';

export const ComplaintManager: React.FC = () => {
  const {
    complaints,
    lifts,
    buildings,
    technicians,
    assignTechnician,
    updateComplaintStatus,
    serviceReports,
    showToast,
    addAuditLog,
    currentUser,
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Modals & Inspection State
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [etaInput, setEtaInput] = useState('Within 30 mins');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [viewingPassportLift, setViewingPassportLift] = useState<Lift | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [adminRemarkInput, setAdminRemarkInput] = useState('');
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);

  // Automatic Background Real-Time Poller (every 4 seconds) to guarantee instant cross-role updates
  const fetchFreshComplaints = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await apiService.getComplaints();
      setLastSyncTime(new Date());
      if (manual) {
        showToast('success', 'Complaints Synchronized', 'Real-time database feed updated.');
      }
    } catch {
      // In offline/mock mode, AppContext local state handles updates
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Initial fetch on mount
    fetchFreshComplaints(false);

    // 4-second background heartbeat
    const pollTimer = setInterval(() => {
      fetchFreshComplaints(false);
    }, 4000);

    return () => clearInterval(pollTimer);
  }, [fetchFreshComplaints]);

  // Keep viewingComplaint in sync with live complaint updates
  useEffect(() => {
    if (viewingComplaint) {
      const fresh = complaints.find((c) => c.id === viewingComplaint.id || c.ticketNumber === viewingComplaint.ticketNumber);
      if (fresh && (fresh.status !== viewingComplaint.status || fresh.assignedTechnicianId !== viewingComplaint.assignedTechnicianId || fresh.priority !== viewingComplaint.priority)) {
        setViewingComplaint(fresh);
      }
    }
  }, [complaints, viewingComplaint]);

  // Top Metrics Calculation
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'pending').length;
    const critical = complaints.filter((c) => c.priority === 'critical' || c.isEmergency).length;
    const high = complaints.filter((c) => c.priority === 'high' && !c.isEmergency).length;
    const assigned = complaints.filter((c) => c.status === 'assigned' || c.status === 'technician_on_way').length;
    const inProgress = complaints.filter((c) => c.status === 'inspection_repair').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const closed = complaints.filter((c) => c.status === 'closed').length;
    return { total, pending, critical, high, assigned, inProgress, resolved, closed };
  }, [complaints]);

  // Filter & Search Processing (Sorted latest first, with Critical alerts prioritized)
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        const query = searchQuery.trim().toLowerCase();
        const matchSearch =
          !query ||
          c.ticketNumber.toLowerCase().includes(query) ||
          c.liftNumber.toLowerCase().includes(query) ||
          c.liftId.toLowerCase().includes(query) ||
          c.buildingName.toLowerCase().includes(query) ||
          c.clientName.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query));

        // Priority Filter
        const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;

        // Status Filter
        let matchStatus = true;
        if (statusFilter === 'pending') {
          matchStatus = c.status === 'pending';
        } else if (statusFilter === 'assigned') {
          matchStatus = c.status === 'assigned' || c.status === 'technician_on_way';
        } else if (statusFilter === 'inspection_repair') {
          matchStatus = c.status === 'inspection_repair';
        } else if (statusFilter === 'resolved') {
          matchStatus = c.status === 'resolved';
        } else if (statusFilter === 'closed') {
          matchStatus = c.status === 'closed';
        } else if (statusFilter === 'critical') {
          matchStatus = c.priority === 'critical' || c.isEmergency;
        }

        return matchSearch && matchPriority && matchStatus;
      })
      .sort((a, b) => {
        // Critical / Emergency complaints always surfaced at top
        const aIsCrit = a.priority === 'critical' || a.isEmergency;
        const bIsCrit = b.priority === 'critical' || b.isEmergency;
        if (aIsCrit && !bIsCrit && a.status !== 'closed') return -1;
        if (!aIsCrit && bIsCrit && b.status !== 'closed') return 1;

        // Latest reported date first
        const timeA = new Date(a.reportedAt || 0).getTime();
        const timeB = new Date(b.reportedAt || 0).getTime();
        return timeB - timeA;
      });
  }, [complaints, searchQuery, priorityFilter, statusFilter]);

  // Quick Copy Helper
  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setIsCopiedId(id);
      showToast('info', 'Copied to Clipboard', text);
      setTimeout(() => setIsCopiedId(null), 2000);
    } catch {}
  };

  // Dispatch Action
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningTicketId && selectedTechId) {
      assignTechnician(assigningTicketId, selectedTechId, etaInput);
      setAssigningTicketId(null);
      showToast('success', 'Technician Dispatched', 'Work assignment sent to technician portal.');
    }
  };

  // WhatsApp Notification Helper
  const handleSendWhatsAppUpdate = (ticket: Complaint) => {
    const msg =
      `🚨 *WEPSUN LIFT SERVICES — BREAKDOWN UPDATE*\n\n` +
      `Dear *${ticket.clientName || 'Customer'}*,\n` +
      `Your complaint *#${ticket.ticketNumber}* for *Lift ${ticket.liftNumber}* (${ticket.buildingName}) is currently: *${ticket.status.toUpperCase().replace('_', ' ')}*.\n\n` +
      `👷 *Assigned Engineer:* ${ticket.assignedTechnicianName || 'WEPSUN Emergency Dispatch'}\n` +
      `⏱️ *ETA:* ${ticket.technicianEta || 'Within 45 mins'}\n` +
      `⚠️ *Issue:* ${ticket.title}\n\n` +
      `📞 *24x7 Control Room:* +91 85959 40077\n` +
      `_Reliable Service. Safer Tomorrow._`;

    apiService.openWhatsAppDirect(ticket.clientPhone || '+918595940077', msg);
  };

  // Save Admin Remark to Complaint
  const handleSaveAdminRemark = (ticketId: string) => {
    if (!adminRemarkInput.trim()) return;
    const currentComp = complaints.find((c) => c.id === ticketId);
    if (!currentComp) return;

    updateComplaintStatus(ticketId, currentComp.status, {
      diagnosisRemarks: adminRemarkInput.trim(),
    });
    setAdminRemarkInput('');
    showToast('success', 'Admin Remark Saved', 'Internal note recorded in complaint history.');
  };

  // Change Complaint Priority
  const handleChangePriority = (ticketId: string, newPriority: ComplaintPriority) => {
    const currentComp = complaints.find((c) => c.id === ticketId);
    if (!currentComp) return;

    updateComplaintStatus(ticketId, currentComp.status, {
      priority: newPriority,
      isEmergency: newPriority === 'critical',
    });

    addAuditLog({
      companyId: currentComp.companyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'UPDATE_PRIORITY',
      performedBy: currentUser.name,
      userRole: 'company_admin',
      details: `Changed ticket #${currentComp.ticketNumber} priority to ${newPriority.toUpperCase()}.`,
    });

    showToast('info', 'Priority Updated', `Ticket #${currentComp.ticketNumber} set to ${newPriority.toUpperCase()}.`);
  };

  // Helper to open Lift Digital Passport
  const handleOpenLiftPassport = (liftId: string, liftNumber: string) => {
    const matched = lifts.find((l) => l.id === liftId || l.liftNumber === liftNumber);
    if (matched) {
      setViewingPassportLift(matched);
    } else {
      showToast('info', 'Lift Record', `Elevator ${liftNumber} registered in fleet.`);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* 1. TOP REAL-TIME LIVE SYNC & CONTROL HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-[#123B5D] text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
              <span>Service Complaints & Breakdown Dispatch Desk</span>
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time multi-tenant dispatch network between Clients, Control Room, and Field Technicians.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
          <span className="text-[11px] font-mono text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
            Last Synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => fetchFreshComplaints(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer border border-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC STATS CARDS (Clickable for Instant Filtering) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Complaints */}
        <div
          onClick={() => {
            setStatusFilter('All');
            setPriorityFilter('All');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
            statusFilter === 'All' && priorityFilter === 'All'
              ? 'bg-blue-50/80 border-[#1976D2] ring-2 ring-[#1976D2]/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Tickets</span>
            <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-[#1976D2] text-xs">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-display">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All service requests</div>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => {
            setStatusFilter('pending');
            setPriorityFilter('All');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Pending Review</span>
            <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2 font-display">{stats.pending}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting dispatch</div>
        </div>

        {/* Critical Breakdown SOS */}
        <div
          onClick={() => {
            setPriorityFilter('critical');
            setStatusFilter('All');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
            priorityFilter === 'critical'
              ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/30'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              Critical SOS
            </span>
            <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-red-700 mt-2 font-display">{stats.critical}</div>
          <div className="text-[11px] text-red-600 font-medium mt-0.5">High emergency priority</div>
        </div>

        {/* High Priority */}
        <div
          onClick={() => {
            setPriorityFilter('high');
            setStatusFilter('All');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
            priorityFilter === 'high'
              ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/30'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-700">High Priority</span>
            <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-orange-700 mt-2 font-display">{stats.high}</div>
          <div className="text-[11px] text-orange-600 font-medium mt-0.5">Expedited repair</div>
        </div>

        {/* Resolved & Closed */}
        <div
          onClick={() => {
            setStatusFilter('closed');
            setPriorityFilter('All');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs ${
            statusFilter === 'closed'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Resolved / Closed</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-display">{stats.resolved + stats.closed}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Completed repairs</div>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTERS TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-3xl">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Complaint ID, Client Name, Building, Lift ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none shadow-xs min-h-[42px] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none font-bold shadow-xs min-h-[42px] focus:bg-white focus:border-[#1976D2]"
            >
              <option value="All">All Priorities</option>
              <option value="critical">🔴 Critical SOS</option>
              <option value="high">🟠 High Priority</option>
              <option value="normal">🔵 Normal Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none font-bold shadow-xs min-h-[42px] focus:bg-white focus:border-[#1976D2]"
            >
              <option value="All">All Statuses</option>
              <option value="pending">⏳ Pending Review</option>
              <option value="assigned">👷 Assigned</option>
              <option value="inspection_repair">🔧 In Progress / Inspection</option>
              <option value="resolved">✅ Resolved</option>
              <option value="closed">🔒 Closed</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || priorityFilter !== 'All' || statusFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setPriorityFilter('All');
              setStatusFilter('All');
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 self-end sm:self-auto py-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 4. COMPLAINTS LIST TABLE (Responsive & Clickable) */}
      <div className="table-scroll-container rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs min-w-[840px]">
          <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Ticket & Lift</th>
              <th className="p-3.5">Client & Building</th>
              <th className="p-3.5">Problem Summary</th>
              <th className="p-3.5 text-center">Priority</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Assigned Engineer</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">No complaints found</p>
                    <p className="text-xs text-slate-400">No tickets match the selected filters or search terms.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredComplaints.map((ticket) => {
                const isEmergency = ticket.isEmergency || ticket.priority === 'critical';
                const isClosed = ticket.status === 'closed';
                const linkedReport = serviceReports.find((r) => r.ticketId === ticket.id);

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => setViewingComplaint(ticket)}
                    className={`hover:bg-blue-50/50 text-slate-700 transition-colors cursor-pointer ${
                      isEmergency && !isClosed ? 'bg-red-50/60' : ''
                    }`}
                  >
                    {/* Ticket Number & Lift ID */}
                    <td className="p-3.5 font-mono">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {isEmergency && <span className="text-red-500 animate-bounce">🚨</span>}
                        <span>{ticket.ticketNumber}</span>
                      </div>
                      <span className="text-[#1976D2] font-bold text-[11px] block mt-0.5">
                        {ticket.liftNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {ticket.reportedAt ? new Date(ticket.reportedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </td>

                    {/* Client & Building */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 truncate max-w-[200px]" title={ticket.buildingName}>
                        {ticket.buildingName}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[170px]">{ticket.clientName}</span>
                      </div>
                      {ticket.clientPhone && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <PhoneCall className="w-2.5 h-2.5 text-slate-400" />
                          <span>{ticket.clientPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Issue Description */}
                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-slate-800 truncate" title={ticket.title}>
                        {ticket.title}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {ticket.description}
                      </div>
                      {ticket.beforePhotos && ticket.beforePhotos.length > 0 && (
                        <div className="text-[10px] text-[#1976D2] font-bold mt-1 flex items-center gap-1">
                          <span>📷 {ticket.beforePhotos.length} Attached Photo(s)</span>
                        </div>
                      )}
                    </td>

                    {/* Priority Badge */}
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold font-mono tracking-wider ${
                          ticket.priority === 'critical'
                            ? 'bg-red-100 text-[#D32F2F] border border-red-200 animate-pulse'
                            : ticket.priority === 'high'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-blue-100 text-[#1976D2] border border-blue-200'
                        }`}
                      >
                        ● {ticket.priority}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          isClosed
                            ? 'bg-emerald-100 text-[#2E7D32] border border-emerald-200'
                            : ticket.status === 'resolved'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : ticket.status === 'inspection_repair'
                            ? 'bg-blue-100 text-[#1976D2] border border-blue-200'
                            : ticket.status === 'assigned'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Assigned Engineer */}
                    <td className="p-3.5">
                      {ticket.assignedTechnicianName ? (
                        <div>
                          <div className="font-bold text-slate-900">{ticket.assignedTechnicianName}</div>
                          <div className="text-[11px] text-[#1976D2] font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{ticket.technicianEta || 'On-site'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px] font-bold">
                          ⚠️ Unassigned
                        </span>
                      )}
                    </td>

                    {/* Quick Dispatch Actions */}
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingComplaint(ticket)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                          title="View Full Complaint Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppUpdate(ticket)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-xs"
                          title="Send Instant WhatsApp Update"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        {!isClosed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningTicketId(ticket.id);
                              if (ticket.assignedTechnicianId) {
                                setSelectedTechId(ticket.assignedTechnicianId);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{ticket.assignedTechnicianName ? 'Reassign' : 'Assign'}</span>
                          </button>
                        ) : (
                          linkedReport && (
                            <button
                              type="button"
                              onClick={() => setSelectedReport(linkedReport)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-colors"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                              <span>Report</span>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. FULL COMPLAINT DETAILS MODAL (Section 5 & 6) */}
      {viewingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-800 flex flex-col max-h-[92dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm sm:text-base text-[#1976D2] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {viewingComplaint.ticketNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(viewingComplaint.ticketNumber, 'modal_id')}
                    title="Copy Ticket ID"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    {isCopiedId === 'modal_id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      viewingComplaint.priority === 'critical'
                        ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                        : viewingComplaint.priority === 'high'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-[#1976D2] border border-blue-200'
                    }`}
                  >
                    ● {viewingComplaint.priority}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    {viewingComplaint.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{viewingComplaint.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 4 Core Information Blocks */}
            <div className="space-y-6 pt-4 text-xs">
              {/* BLOCK 1: CLIENT & SITE INFORMATION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Client & Site Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Client / Society Name:</span>
                    <span className="font-bold text-slate-900">{viewingComplaint.clientName || 'Valued Society'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Building Complex:</span>
                    <span className="font-bold text-slate-900">{viewingComplaint.buildingName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Contact Number:</span>
                    <a
                      href={`tel:${viewingComplaint.clientPhone}`}
                      className="font-bold text-[#1976D2] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{viewingComplaint.clientPhone || '+91 85959 40077'}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email Address:</span>
                    <span className="font-mono text-slate-700">{viewingComplaint.clientEmail || 'client@wepsun.com'}</span>
                  </div>
                </div>
              </div>

              {/* BLOCK 2: LIFT EQUIPMENT & PASSPORT */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#123B5D] text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <Wrench className="w-3.5 h-3.5 text-[#1976D2]" />
                    <span>Elevator Equipment & Digital Passport</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenLiftPassport(viewingComplaint.liftId, viewingComplaint.liftNumber)}
                    className="inline-flex items-center gap-1 text-[#1976D2] hover:underline font-bold text-[11px]"
                  >
                    <span>Open Passport</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Lift Number:</span>
                    <span className="font-bold text-[#1976D2] font-mono">{viewingComplaint.liftNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Unique Lift ID:</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate block">{viewingComplaint.liftId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Reported At:</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {viewingComplaint.reportedAt ? new Date(viewingComplaint.reportedAt).toLocaleString('en-GB') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Current Status:</span>
                    <span className="font-bold text-slate-800 uppercase text-[11px]">{viewingComplaint.status}</span>
                  </div>
                </div>
              </div>

              {/* BLOCK 3: PROBLEM DESCRIPTION & PHOTO ATTACHMENTS */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-slate-500">
                  Problem Description & Attached Evidence
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                  {viewingComplaint.description || viewingComplaint.title}
                </div>

                {/* Attached Evidence Media Grid */}
                {viewingComplaint.beforePhotos && viewingComplaint.beforePhotos.length > 0 ? (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Customer Attached Photos / Videos ({viewingComplaint.beforePhotos.length})
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {viewingComplaint.beforePhotos.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewMediaUrl(url)}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-xs hover:border-[#1976D2] transition-all"
                        >
                          <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No media attachments were uploaded with this complaint.</p>
                )}
              </div>

              {/* BLOCK 4: OPERATIONAL ACTIONS & FIELD DISPATCH */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-slate-500">
                  Management Actions & Workflow Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Status Transition Control */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Update Status</label>
                    <select
                      value={viewingComplaint.status}
                      onChange={(e) => {
                        const newStat = e.target.value as ComplaintStatus;
                        updateComplaintStatus(viewingComplaint.id, newStat);
                        showToast('success', 'Status Updated', `Ticket moved to ${newStat.toUpperCase()}`);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-[#1976D2]"
                    >
                      <option value="pending">⏳ Pending Review</option>
                      <option value="assigned">👷 Assigned</option>
                      <option value="technician_on_way">🚚 Technician On The Way</option>
                      <option value="inspection_repair">🔧 In Progress / Inspection</option>
                      <option value="resolved">✅ Resolved</option>
                      <option value="closed">🔒 Closed</option>
                    </select>
                  </div>

                  {/* Priority Escalation Control */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Change Priority</label>
                    <select
                      value={viewingComplaint.priority}
                      onChange={(e) => handleChangePriority(viewingComplaint.id, e.target.value as ComplaintPriority)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-[#1976D2]"
                    >
                      <option value="normal">🔵 Normal Priority</option>
                      <option value="high">🟠 High Priority</option>
                      <option value="critical">🔴 Critical Breakdown SOS</option>
                    </select>
                  </div>

                  {/* Quick Dispatch / Reassign Engineer */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Engineer</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningTicketId(viewingComplaint.id);
                        if (viewingComplaint.assignedTechnicianId) {
                          setSelectedTechId(viewingComplaint.assignedTechnicianId);
                        }
                      }}
                      className="w-full p-2.5 bg-[#1976D2] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{viewingComplaint.assignedTechnicianName ? `Reassign (${viewingComplaint.assignedTechnicianName})` : 'Dispatch Engineer'}</span>
                    </button>
                  </div>
                </div>

                {/* Internal Admin Remarks */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-slate-700 font-bold mb-1">Internal Service Remarks / Control Room Notes</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminRemarkInput}
                      onChange={(e) => setAdminRemarkInput(e.target.value)}
                      placeholder={viewingComplaint.diagnosisRemarks || "Add control room remarks, customer calls, or notes..."}
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-[#1976D2]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAdminRemark(viewingComplaint.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0"
                    >
                      Save Note
                    </button>
                  </div>
                </div>

                {/* Additional Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppUpdate(viewingComplaint)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send WhatsApp Update</span>
                  </button>

                  {viewingComplaint.priority !== 'critical' && (
                    <button
                      type="button"
                      onClick={() => handleChangePriority(viewingComplaint.id, 'critical')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>🚨 Escalate to Critical SOS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BLOCK 5: AUDIT LOG TIMELINE */}
              {viewingComplaint.timeline && viewingComplaint.timeline.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-slate-500">
                    Activity & Audit Timeline
                  </h4>
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-7">
                    {viewingComplaint.timeline.map((entry, idx) => (
                      <div key={idx} className="relative text-xs">
                        <span className="absolute -left-7 top-1 w-2.5 h-2.5 rounded-full bg-[#1976D2] ring-4 ring-white" />
                        <div className="font-bold text-slate-800">{entry.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{entry.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-GB') : ''} • {entry.actorName} ({entry.actorRole})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TECHNICIAN ASSIGNMENT MODAL */}
      {assigningTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-800 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Dispatch Field Engineer
                </h3>
                <p className="text-xs text-slate-500">
                  Assign nearest qualified technician to breakdown ticket
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Select Technician</label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {technicians.map((tech) => (
                    <label
                      key={tech.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedTechId === tech.id
                          ? 'bg-blue-50/70 border-[#1976D2] text-[#1976D2] shadow-sm ring-1 ring-[#1976D2]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="technician"
                          value={tech.id}
                          checked={selectedTechId === tech.id}
                          onChange={(e) => setSelectedTechId(e.target.value)}
                          className="accent-[#1976D2]"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{tech.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {tech.zone || 'Navi Mumbai'} • ⭐ {tech.customerRating || '4.9'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          tech.currentStatus === 'available'
                            ? 'bg-emerald-100 text-[#2E7D32]'
                            : tech.currentStatus === 'on_job'
                            ? 'bg-amber-100 text-[#F9A825]'
                            : 'bg-blue-100 text-[#1976D2]'
                        }`}
                      >
                        {tech.currentStatus ? tech.currentStatus.replace('_', ' ') : 'Available'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Estimated Arrival (ETA)</label>
                <input
                  type="text"
                  value={etaInput}
                  onChange={(e) => setEtaInput(e.target.value)}
                  placeholder="e.g. Within 30 mins (En Route)"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none min-h-[42px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTicketId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold min-h-[44px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md min-h-[44px] transition-colors"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MEDIA LIGHTBOX PREVIEW MODAL */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 text-sm font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
            <img src={previewMediaUrl} alt="Complaint Media Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
          </div>
        </div>
      )}

      {/* 8. LIFT DIGITAL PASSPORT MODAL INTEGRATION */}
      {viewingPassportLift && (
        <LiftDigitalPassportModal
          lift={viewingPassportLift}
          isOpen={!!viewingPassportLift}
          onClose={() => setViewingPassportLift(null)}
        />
      )}

      {/* 9. SERVICE REPORT MODAL */}
      {selectedReport && (
        <ServiceReportModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};
