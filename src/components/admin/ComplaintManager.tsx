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
  ShieldCheck,
  Zap,
  FileDown,
  Archive,
  FolderArchive,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus, Lift } from '../../types';
import { ServiceReportModal } from '../common/ServiceReportModal';
import { LiftDigitalPassportModal } from '../common/LiftDigitalPassportModal';
import { apiService } from '../../services/api';
import { downloadEmergencyServiceReportPdf } from '../../services/pdfGenerator';

export type ComplaintQueueSection =
  | 'all'
  | 'emergency'
  | 'routine'
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'archived';

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
    refreshComplaints,
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeQueueTab, setActiveQueueTab] = useState<ComplaintQueueSection>('all');
  const [emergencyFilter, setEmergencyFilter] = useState<string>('all');
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

  // Automatic Background Real-Time Poller (every 3 seconds) to guarantee instant cross-role updates
  const fetchFreshComplaints = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      await refreshComplaints();
      setLastSyncTime(new Date());
      if (manual) {
        showToast('success', 'Complaints Synchronized', 'Real-time database feed updated.');
      }
    } catch {
      // In offline/mock mode, AppContext local state handles updates
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, [refreshComplaints, showToast]);

  useEffect(() => {
    // Initial fetch on mount
    fetchFreshComplaints(false);

    // 3-second background heartbeat
    const pollTimer = setInterval(() => {
      fetchFreshComplaints(false);
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [fetchFreshComplaints]);

  // Keep viewingComplaint in sync with live complaint updates
  useEffect(() => {
    if (viewingComplaint) {
      const fresh = complaints.find((c) => c.id === viewingComplaint.id || c.ticketNumber === viewingComplaint.ticketNumber);
      if (fresh && (fresh.status !== viewingComplaint.status || fresh.assignedTechnicianId !== viewingComplaint.assignedTechnicianId || fresh.priority !== viewingComplaint.priority || fresh.diagnosisRemarks !== viewingComplaint.diagnosisRemarks)) {
        setViewingComplaint(fresh);
      }
    }
  }, [complaints, viewingComplaint]);

  // Top Metrics Calculation across all 9 sections
  const stats = useMemo(() => {
    const total = complaints.filter((c) => c.status !== 'archived' && !c.isArchived).length;
    const totalWithArchived = complaints.length;
    const activeEmergencies = complaints.filter(
      (c) => (c.isEmergency || c.priority === 'critical') && c.status !== 'resolved' && c.status !== 'closed' && c.status !== 'archived' && !c.isArchived
    );
    const routine = complaints.filter(
      (c) => !c.isEmergency && c.priority !== 'critical' && c.status !== 'archived' && !c.isArchived
    );
    const pending = complaints.filter(
      (c) => (c.status === 'pending' || c.status === 'new') && !c.isArchived
    );
    const assigned = complaints.filter(
      (c) => (c.status === 'assigned' || c.status === 'accepted' || c.status === 'technician_on_way' || c.status === 'en_route') && !c.isArchived
    );
    const inProgress = complaints.filter(
      (c) => (c.status === 'inspection_repair' || c.status === 'in_progress' || c.status === 'arrived') && !c.isArchived
    );
    const resolved = complaints.filter(
      (c) => c.status === 'resolved' && !c.isArchived
    );
    const closed = complaints.filter(
      (c) => c.status === 'closed' && !c.isArchived
    );
    const archived = complaints.filter(
      (c) => c.status === 'archived' || !!c.isArchived
    );
    const critical = complaints.filter((c) => (c.priority === 'critical' || c.isEmergency) && c.status !== 'archived' && !c.isArchived);
    const high = complaints.filter((c) => c.priority === 'high' && !c.isEmergency && c.status !== 'archived' && !c.isArchived);
    const trappedPassengersTotal = activeEmergencies.reduce((acc, c) => acc + (c.trappedPassengerCount || 0), 0);

    return {
      total,
      totalWithArchived,
      routineCount: routine.length,
      pending: pending.length,
      assigned: assigned.length,
      inProgress: inProgress.length,
      resolved: resolved.length,
      closed: closed.length,
      archived: archived.length,
      critical: critical.length,
      high: high.length,
      activeEmergenciesCount: activeEmergencies.length,
      trappedPassengersTotal,
    };
  }, [complaints]);

  // Elapsed time formatter for Emergency Response Audit
  const getElapsedTime = (reportedAt?: string) => {
    if (!reportedAt) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(reportedAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now (<1m)';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return 'Recently';
    }
  };

  // Dedicated Real-Time Emergency Breakdown Queue
  const emergencyBreakdowns = useMemo(() => {
    return complaints
      .filter((c) => (c.isEmergency || c.priority === 'critical') && c.status !== 'archived' && !c.isArchived)
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
          (c.emergencyType && c.emergencyType.toLowerCase().includes(query)) ||
          (c.description && c.description.toLowerCase().includes(query));

        if (!matchSearch) return false;

        if (emergencyFilter === 'new') return c.status === 'pending' || c.status === 'new';
        if (emergencyFilter === 'unassigned') return !c.assignedTechnicianId && c.status !== 'closed' && c.status !== 'resolved';
        if (emergencyFilter === 'assigned') return c.status === 'assigned' || c.status === 'accepted';
        if (emergencyFilter === 'en_route') return c.status === 'technician_on_way' || c.status === 'en_route';
        if (emergencyFilter === 'arrived') return c.status === 'inspection_repair' || c.status === 'in_progress' || c.status === 'arrived';
        if (emergencyFilter === 'in_progress') return c.status === 'technician_on_way' || c.status === 'inspection_repair' || c.status === 'in_progress' || c.status === 'arrived';
        if (emergencyFilter === 'resolved') return c.status === 'resolved';
        if (emergencyFilter === 'closed') return c.status === 'closed';
        return true;
      })
      .sort((a, b) => {
        // Unresolved emergencies always on top
        const aOpen = a.status !== 'resolved' && a.status !== 'closed';
        const bOpen = b.status !== 'resolved' && b.status !== 'closed';
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;

        // Entrapments first
        const aTrapped = (a.trappedPassengerCount || 0) > 0;
        const bTrapped = (b.trappedPassengerCount || 0) > 0;
        if (aTrapped && !bTrapped) return -1;
        if (!aTrapped && bTrapped) return 1;

        // Oldest unresolved first (highest urgency)
        const timeA = new Date(a.reportedAt || 0).getTime();
        const timeB = new Date(b.reportedAt || 0).getTime();
        return timeA - timeB;
      });
  }, [complaints, searchQuery, emergencyFilter]);

  // Filter & Search Processing for all 9 sections
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

        if (!matchSearch) return false;

        const isArchived = c.status === 'archived' || !!c.isArchived;

        // 9 Mandatory Queue Section Tabs
        if (activeQueueTab === 'all') {
          // All active complaints (show all non-archived; or show archived if user explicitly searches for it)
          if (isArchived && !query) return false;
        } else if (activeQueueTab === 'emergency') {
          const isEmg = (c.isEmergency || c.priority === 'critical') && c.status !== 'resolved' && c.status !== 'closed' && !isArchived;
          if (!isEmg) return false;
        } else if (activeQueueTab === 'routine') {
          const isRoutine = !c.isEmergency && c.priority !== 'critical' && !isArchived;
          if (!isRoutine) return false;
        } else if (activeQueueTab === 'pending') {
          const isPending = (c.status === 'pending' || c.status === 'new') && !isArchived;
          if (!isPending) return false;
        } else if (activeQueueTab === 'assigned') {
          const isAssigned = (c.status === 'assigned' || c.status === 'accepted' || c.status === 'technician_on_way' || c.status === 'en_route') && !isArchived;
          if (!isAssigned) return false;
        } else if (activeQueueTab === 'in_progress') {
          const isInProg = (c.status === 'inspection_repair' || c.status === 'in_progress' || c.status === 'arrived') && !isArchived;
          if (!isInProg) return false;
        } else if (activeQueueTab === 'resolved') {
          if (c.status !== 'resolved' || isArchived) return false;
        } else if (activeQueueTab === 'closed') {
          if (c.status !== 'closed' || isArchived) return false;
        } else if (activeQueueTab === 'archived') {
          if (!isArchived) return false;
        }

        // Priority Filter
        const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;
        if (!matchPriority) return false;

        // Additional Status Filter dropdown
        let matchStatus = true;
        if (statusFilter === 'pending') {
          matchStatus = (c.status === 'pending' || c.status === 'new') && !isArchived;
        } else if (statusFilter === 'assigned') {
          matchStatus = (c.status === 'assigned' || c.status === 'accepted' || c.status === 'technician_on_way' || c.status === 'en_route') && !isArchived;
        } else if (statusFilter === 'inspection_repair') {
          matchStatus = (c.status === 'inspection_repair' || c.status === 'in_progress' || c.status === 'arrived') && !isArchived;
        } else if (statusFilter === 'resolved') {
          matchStatus = c.status === 'resolved' && !isArchived;
        } else if (statusFilter === 'closed') {
          matchStatus = c.status === 'closed' && !isArchived;
        } else if (statusFilter === 'archived') {
          matchStatus = isArchived;
        } else if (statusFilter === 'critical') {
          matchStatus = c.priority === 'critical' || c.isEmergency;
        }

        return matchStatus;
      })
      .sort((a, b) => {
        // Critical / Emergency complaints always surfaced at top if not closed/archived
        const aIsCrit = (a.priority === 'critical' || a.isEmergency) && a.status !== 'closed' && a.status !== 'archived';
        const bIsCrit = (b.priority === 'critical' || b.isEmergency) && b.status !== 'closed' && b.status !== 'archived';
        if (aIsCrit && !bIsCrit) return -1;
        if (!aIsCrit && bIsCrit) return 1;

        // Latest reported date first
        const timeA = new Date(a.reportedAt || 0).getTime();
        const timeB = new Date(b.reportedAt || 0).getTime();
        return timeB - timeA;
      });
  }, [complaints, searchQuery, priorityFilter, statusFilter, activeQueueTab]);

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

  // Archive Complaint (Permanent storage retained in DB & history)
  const handleArchiveComplaint = (ticketId: string) => {
    const comp = complaints.find((c) => c.id === ticketId);
    if (!comp) return;

    updateComplaintStatus(ticketId, 'archived', {
      isArchived: true,
      archivedAt: new Date().toISOString(),
      closedAt: comp.closedAt || new Date().toISOString(),
    });

    addAuditLog({
      companyId: comp.companyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'ARCHIVE_COMPLAINT',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Ticket #${comp.ticketNumber} moved to archived storage.`,
    });

    showToast('info', 'Complaint Archived', `Ticket #${comp.ticketNumber} archived. Available under Archived section.`);
  };

  // Restore Complaint from Archive
  const handleRestoreComplaint = (ticketId: string) => {
    const comp = complaints.find((c) => c.id === ticketId);
    if (!comp) return;

    updateComplaintStatus(ticketId, 'closed', {
      isArchived: false,
    });

    addAuditLog({
      companyId: comp.companyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'RESTORE_COMPLAINT',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Ticket #${comp.ticketNumber} restored from archive.`,
    });

    showToast('success', 'Complaint Restored', `Ticket #${comp.ticketNumber} restored to Closed tickets.`);
  };

  // Quick Lifecycle Stage Advance
  const handleQuickStatusChange = (ticketId: string, nextStatus: ComplaintStatus, remarks?: string) => {
    const comp = complaints.find((c) => c.id === ticketId);
    if (!comp) return;

    updateComplaintStatus(ticketId, nextStatus, {
      diagnosisRemarks: remarks || comp.diagnosisRemarks,
      arrivedAt: (nextStatus === 'inspection_repair' || nextStatus === 'in_progress') && !comp.arrivedAt ? new Date().toISOString() : comp.arrivedAt,
      resolvedAt: nextStatus === 'resolved' && !comp.resolvedAt ? new Date().toISOString() : comp.resolvedAt,
      closedAt: (nextStatus === 'closed' || nextStatus === 'archived') && !comp.closedAt ? new Date().toISOString() : comp.closedAt,
      isArchived: nextStatus === 'archived',
    });

    addAuditLog({
      companyId: comp.companyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'UPDATE_STATUS',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Status of ticket #${comp.ticketNumber} moved to ${nextStatus.toUpperCase()}.`,
    });

    showToast('success', 'Status Updated', `Ticket #${comp.ticketNumber} moved to ${nextStatus.replace(/_/g, ' ').toUpperCase()}.`);
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

      
      {/* 2. TOP QUEUE MODE SELECTOR: 9 MANDATORY COMPLAINT LIFECYCLE TABS */}
      <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200 flex flex-col gap-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all' as ComplaintQueueSection, label: 'All Complaints', icon: Layers, count: stats.total, badgeBg: 'bg-blue-100 text-blue-800' },
            { id: 'emergency' as ComplaintQueueSection, label: 'Emergency Queue', icon: AlertTriangle, count: stats.activeEmergenciesCount, badgeBg: 'bg-red-100 text-red-800', isAlert: stats.activeEmergenciesCount > 0 },
            { id: 'routine' as ComplaintQueueSection, label: 'Routine Complaints', icon: FileText, count: stats.routineCount, badgeBg: 'bg-slate-200 text-slate-800' },
            { id: 'pending' as ComplaintQueueSection, label: 'Pending Review', icon: Clock, count: stats.pending, badgeBg: 'bg-amber-100 text-amber-800' },
            { id: 'assigned' as ComplaintQueueSection, label: 'Assigned', icon: UserCheck, count: stats.assigned, badgeBg: 'bg-indigo-100 text-indigo-800' },
            { id: 'in_progress' as ComplaintQueueSection, label: 'In Progress', icon: Wrench, count: stats.inProgress, badgeBg: 'bg-purple-100 text-purple-800' },
            { id: 'resolved' as ComplaintQueueSection, label: 'Resolved', icon: CheckCircle2, count: stats.resolved, badgeBg: 'bg-emerald-100 text-emerald-800' },
            { id: 'closed' as ComplaintQueueSection, label: 'Closed', icon: Archive, count: stats.closed, badgeBg: 'bg-slate-200 text-slate-800' },
            { id: 'archived' as ComplaintQueueSection, label: 'Archived', icon: FolderArchive, count: stats.archived, badgeBg: 'bg-zinc-200 text-zinc-800' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeQueueTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveQueueTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#123B5D] text-white shadow-md shadow-blue-900/30 ring-2 ring-blue-400'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.isAlert && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeBg
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {stats.trappedPassengersTotal > 0 && (
          <div className="p-3 bg-red-600 text-white rounded-xl flex items-center justify-between gap-3 shadow-md animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-black text-xs sm:text-sm">
                ⚠️ CRITICAL SOS: {stats.trappedPassengersTotal} Passenger(s) Trapped In Cabin
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveQueueTab('emergency')}
              className="px-3 py-1.5 rounded-lg bg-white text-red-700 font-extrabold text-xs shadow-sm hover:bg-red-50 cursor-pointer shrink-0"
            >
              Open Emergency Desk →
            </button>
          </div>
        )}
      </div>

      {/* Emergency Active Alert Bar when viewing other sections */}
      {activeQueueTab !== 'emergency' && stats.activeEmergenciesCount > 0 && (
        <div className="p-3.5 bg-red-50 border-2 border-red-400 rounded-2xl flex items-center justify-between gap-3 text-red-950 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-xs block text-red-900">
                ⚠️ URGENT: {stats.activeEmergenciesCount} Active Emergency Breakdown(s) Awaiting Attention!
              </span>
              <span className="text-[11px] text-red-700">
                Elevator passenger entrapments require immediate response under safety protocol.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveQueueTab('emergency')}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            Open Emergency Queue →
          </button>
        </div>
      )}

      {/* 3. EMERGENCY BREAKDOWN QUEUE SECTION (Section 4) */}
      {activeQueueTab === 'emergency' ? (
        <div className="space-y-4">
          {/* Emergency Toolbar & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Emergency ID, Building, Lift ID, Client..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 outline-none shadow-xs"
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

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Total Emergencies:</span>
                <span className="font-mono font-bold text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-lg">
                  {emergencyBreakdowns.length}
                </span>
              </div>
            </div>

            {/* Emergency Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Emergencies' },
                { id: 'new', label: 'New / Pending' },
                { id: 'unassigned', label: '⚠️ Unassigned' },
                { id: 'assigned', label: 'Technician Assigned' },
                { id: 'en_route', label: 'En Route' },
                { id: 'arrived', label: 'Arrived / In Progress' },
                { id: 'resolved', label: 'Resolved' },
                { id: 'closed', label: 'Closed' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setEmergencyFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    emergencyFilter === pill.id
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Cards Grid */}
          {emergencyBreakdowns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">No Emergency Breakdowns Active</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active passenger entrapments or critical emergency breakdowns at this moment.
              </p>
              {(stats.total - stats.activeEmergenciesCount) > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveQueueTab('all')}
                    className="px-4 py-2 rounded-xl bg-[#123B5D] text-white font-bold text-xs hover:bg-[#0e2f4a] transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>View All Service Complaints ({stats.total})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyBreakdowns.map((emergency) => {
                const isUnassigned = !emergency.assignedTechnicianId && emergency.status !== 'resolved' && emergency.status !== 'closed';
                const hasTrapped = (emergency.trappedPassengerCount || 0) > 0 || emergency.emergencyType?.toLowerCase().includes('trapped');
                const isClosed = emergency.status === 'closed' || emergency.status === 'resolved';

                return (
                  <div
                    key={emergency.id}
                    className={`bg-white rounded-3xl border-2 transition-all p-5 space-y-4 shadow-sm relative overflow-hidden ${
                      isClosed
                        ? 'border-emerald-200'
                        : isUnassigned
                        ? 'border-red-500 ring-2 ring-red-400/20'
                        : 'border-amber-300'
                    }`}
                  >
                    {/* Top Emergency Bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white shadow-xs">
                          {emergency.ticketNumber}
                        </span>
                        <span className="font-bold text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                          CRITICAL
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          ⏱️ {getElapsedTime(emergency.reportedAt)}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          emergency.status === 'resolved' || emergency.status === 'closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emergency.status === 'inspection_repair'
                            ? 'bg-purple-100 text-purple-800'
                            : emergency.status === 'technician_on_way'
                            ? 'bg-blue-100 text-blue-800'
                            : emergency.status === 'assigned'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800 animate-pulse'
                        }`}
                      >
                        {emergency.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Trapped Passenger Warning Strip */}
                    {hasTrapped && (
                      <div className="p-2.5 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>⚠️ {emergency.trappedPassengerCount || 1} Person(s) Trapped Inside Lift Cabin</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-white/20 px-1.5 py-0.5 rounded">
                          RESCUE PRIORITY
                        </span>
                      </div>
                    )}

                    {/* Core Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Building & Site</span>
                        <span className="font-bold text-slate-800 block truncate" title={emergency.buildingName}>
                          {emergency.buildingName}
                        </span>
                        <span className="text-slate-500 text-[11px] block truncate">
                          {emergency.clientName}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Lift ID & Location</span>
                        <span className="font-mono font-bold text-[#1976D2] block truncate">
                          {emergency.liftNumber}
                        </span>
                        <span className="text-slate-500 text-[11px] block truncate">
                          {emergency.currentLocation || 'Shaft Cabin'}
                        </span>
                      </div>
                    </div>

                    {/* Emergency Type & Description */}
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-700 font-bold">
                        <Zap className="w-3.5 h-3.5 text-red-600" />
                        <span>{emergency.emergencyType || 'Emergency Breakdown'}</span>
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {emergency.description || 'Elevator halted abruptly with passengers in cabin.'}
                      </p>
                    </div>

                    {/* Assigned Technician Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Assigned Engineer</span>
                        {emergency.assignedTechnicianName ? (
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{emergency.assignedTechnicianName}</span>
                            {emergency.technicianEta && (
                              <span className="text-[10px] font-mono text-slate-500">({emergency.technicianEta})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-600 font-bold flex items-center gap-1 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                            ⚠️ Unassigned — Dispatch Now
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${emergency.clientPhone || '+918595940077'}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-blue-700 transition-colors"
                          title="Call Client Caller"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppUpdate(emergency)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Send WhatsApp Update"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons Strip */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningTicketId(emergency.id);
                          if (emergency.assignedTechnicianId) {
                            setSelectedTechId(emergency.assignedTechnicianId);
                          }
                        }}
                        className="py-2.5 px-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{emergency.assignedTechnicianName ? 'Reassign' : 'Dispatch'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingComplaint(emergency)}
                        className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadEmergencyServiceReportPdf(emergency)}
                        className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ROUTINE COMPLAINTS SECTION */
        <div className="space-y-6">
          {/* Summary Metric Stats Cards for Permanent Lifecycle Tracking */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div
              onClick={() => {
                setActiveQueueTab('all');
                setStatusFilter('All');
                setPriorityFilter('All');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                activeQueueTab === 'all' && statusFilter === 'All'
                  ? 'bg-blue-50/90 border-[#1976D2] ring-2 ring-[#1976D2]/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 truncate">Total Tickets</span>
                <span className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center text-[#1976D2] text-[10px]">
                  <Layers className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-1.5 font-display">{stats.total}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">All active tickets</div>
            </div>

            <div
              onClick={() => {
                setActiveQueueTab('pending');
                setStatusFilter('All');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                activeQueueTab === 'pending'
                  ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/30'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 truncate">Pending Review</span>
                <span className="w-5 h-5 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-[10px]">
                  <Clock className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-amber-800 mt-1.5 font-display">{stats.pending}</div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5 truncate">Awaiting dispatch</div>
            </div>

            <div
              onClick={() => {
                setActiveQueueTab('assigned');
                setStatusFilter('All');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                activeQueueTab === 'assigned'
                  ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700 truncate">Assigned</span>
                <span className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px]">
                  <UserCheck className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-indigo-800 mt-1.5 font-display">{stats.assigned}</div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5 truncate">Dispatched / En route</div>
            </div>

            <div
              onClick={() => {
                setActiveQueueTab('in_progress');
                setStatusFilter('All');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                activeQueueTab === 'in_progress'
                  ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-white border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 truncate">In Progress</span>
                <span className="w-5 h-5 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-[10px]">
                  <Wrench className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-purple-800 mt-1.5 font-display">{stats.inProgress}</div>
              <div className="text-[10px] text-purple-600 font-medium mt-0.5 truncate">Active inspection</div>
            </div>

            <div
              onClick={() => {
                setActiveQueueTab('resolved');
                setStatusFilter('All');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                activeQueueTab === 'resolved'
                  ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 truncate">Resolved</span>
                <span className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-emerald-800 mt-1.5 font-display">{stats.resolved}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5 truncate">Repairs completed</div>
            </div>

            <div
              onClick={() => {
                setActiveQueueTab('closed');
                setStatusFilter('All');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                activeQueueTab === 'closed'
                  ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-400/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 truncate">Closed</span>
                <span className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-[10px]">
                  <Archive className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-800 mt-1.5 font-display">{stats.closed}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">Closed tickets</div>
            </div>

            <div
              onClick={() => {
                setActiveQueueTab('emergency');
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs ${
                (activeQueueTab as string) === 'emergency'
                  ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/30'
                  : 'bg-white border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-700 truncate flex items-center gap-1">
                  {stats.activeEmergenciesCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />}
                  Emergency
                </span>
                <span className="w-5 h-5 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-[10px]">
                  <AlertTriangle className="w-3 h-3" />
                </span>
              </div>
              <div className="text-xl font-black text-red-700 mt-1.5 font-display">{stats.activeEmergenciesCount}</div>
              <div className="text-[10px] text-red-600 font-medium mt-0.5 truncate">Active SOS calls</div>
            </div>
          </div>

          {/* Routine Search & Advanced Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-3xl">
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

              <div className="flex items-center gap-1.5">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none font-bold shadow-xs min-h-[42px] focus:bg-white focus:border-[#1976D2]"
                >
                  <option value="All">All Priorities</option>
                  <option value="critical">🔴 Critical SOS</option>
                  <option value="high">🟠 High Priority</option>
                  <option value="normal">🔵 Normal</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none font-bold shadow-xs min-h-[42px] focus:bg-white focus:border-[#1976D2]"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">⏳ Pending Review</option>
                  <option value="assigned">👨‍🔧 Dispatched / Assigned</option>
                  <option value="inspection_repair">🔧 In Progress</option>
                  <option value="resolved">✅ Resolved</option>
                  <option value="closed">📁 Closed</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-slate-500 font-medium">Filtered:</span>
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                {filteredComplaints.length} tickets
              </span>
            </div>
          </div>

          {/* Routine Complaints Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Client & Building</th>
                  <th className="py-3 px-4">Lift Unit</th>
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Engineer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <span className="font-bold text-sm text-slate-700">No Complaints Match Filter</span>
                        <span className="text-xs text-slate-500">All registered elevator units are running smoothly.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((ticket) => {
                    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
                    const isCrit = ticket.priority === 'critical' || ticket.isEmergency;
                    const linkedReport = serviceReports.find((r) => r.ticketId === ticket.id || r.id === ticket.serviceReportId);

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setViewingComplaint(ticket)}
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                          isCrit ? 'bg-red-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="text-[#1976D2] hover:underline flex items-center gap-1.5">
                            {ticket.ticketNumber}
                            {isCrit && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">{ticket.buildingName}</span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">{ticket.clientName}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {ticket.liftNumber}
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <span className="font-medium text-slate-900 line-clamp-1">{ticket.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{ticket.description}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              ticket.priority === 'critical'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : ticket.priority === 'high'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-blue-100 text-[#1976D2] border border-blue-200'
                            }`}
                          >
                            ● {ticket.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              ticket.status === 'resolved' || ticket.status === 'closed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ticket.status === 'inspection_repair'
                                ? 'bg-purple-100 text-purple-800'
                                : ticket.status === 'technician_on_way'
                                ? 'bg-blue-100 text-blue-800'
                                : ticket.status === 'assigned'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {ticket.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {ticket.assignedTechnicianName ? (
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {ticket.assignedTechnicianName}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppUpdate(ticket)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-xs"
                              title="Send Instant WhatsApp Update"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            {ticket.status === 'archived' || ticket.isArchived ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreComplaint(ticket.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1976D2] font-bold text-xs border border-blue-200 transition-colors shadow-xs"
                                title="Restore Complaint to Closed"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : ticket.status === 'closed' ? (
                              <div className="flex items-center gap-1">
                                {linkedReport && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReport(linkedReport)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-colors"
                                  >
                                    <FileCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                                    <span>Report</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleArchiveComplaint(ticket.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors shadow-xs"
                                  title="Archive Complaint"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Archive</span>
                                </button>
                              </div>
                            ) : ticket.status === 'resolved' ? (
                              <div className="flex items-center gap-1">
                                {linkedReport && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReport(linkedReport)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-colors"
                                  >
                                    <FileCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                                    <span>Report</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(ticket.id, 'closed')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors shadow-xs"
                                  title="Close Verified Ticket"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Close</span>
                                </button>
                              </div>
                            ) : (
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
        </div>
      )}
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

            {/* EMERGENCY BREAKDOWN PROMINENT BANNER (Section 4 & 6) */}
            {(viewingComplaint.isEmergency || viewingComplaint.priority === 'critical') && (
              <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-xs space-y-3 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                    <div>
                      <span className="font-black text-red-900 text-sm block">
                        🚨 EMERGENCY BREAKDOWN: {(viewingComplaint.emergencyType || 'Critical Breakdown').toUpperCase()}
                      </span>
                      <span className="text-[11px] text-red-700">
                        High Priority Safety Queue • Rapid Field Response Protocol
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadEmergencyServiceReportPdf(viewingComplaint)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Emergency Report (PDF)</span>
                  </button>
                </div>

                {/* Trapped Passenger Alert Strip */}
                {((viewingComplaint.trappedPassengerCount || 0) > 0 || viewingComplaint.emergencyType?.toLowerCase().includes('trapped')) && (
                  <div className="p-3 bg-red-600 text-white rounded-xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        ⚠️ {viewingComplaint.trappedPassengerCount || 1} PERSON(S) TRAPPED IN CABIN — RESCUE VERIFICATION REQUIRED
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-white/25 px-2 py-0.5 rounded self-start sm:self-auto">
                      {viewingComplaint.status === 'resolved' || viewingComplaint.status === 'closed'
                        ? '✅ RESCUE CONFIRMED & EVACUATED'
                        : 'RESCUE IN PROGRESS'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-red-900/60 block font-medium">Specific Location:</span>
                    <span className="font-bold text-red-950">{viewingComplaint.currentLocation || 'Passenger Shaft'}</span>
                  </div>
                  <div>
                    <span className="text-red-900/60 block font-medium">Elapsed Response:</span>
                    <span className="font-bold text-red-950">{getElapsedTime(viewingComplaint.reportedAt)}</span>
                  </div>
                  <div>
                    <span className="text-red-900/60 block font-medium">Elevator Unit:</span>
                    <span className="font-bold text-red-950 font-mono">{viewingComplaint.liftNumber}</span>
                  </div>
                  <div>
                    <span className="text-red-900/60 block font-medium">Control Room Direct:</span>
                    <a href="tel:+918595940077" className="font-bold text-red-700 hover:underline">
                      +91 85959 40077
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 pt-4 text-xs">
              {/* COMPLAINT LIFECYCLE 10-STAGE PROGRESS TRACKER */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Complaint Lifecycle Progression (Permanent Record)
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#1976D2] uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Current: {viewingComplaint.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-thin">
                  {[
                    { key: 'new', label: '1. New' },
                    { key: 'pending', label: '2. Pending' },
                    { key: 'assigned', label: '3. Assigned' },
                    { key: 'accepted', label: '4. Accepted' },
                    { key: 'technician_on_way', label: '5. En Route' },
                    { key: 'arrived', label: '6. Arrived' },
                    { key: 'inspection_repair', label: '7. In Progress' },
                    { key: 'resolved', label: '8. Resolved' },
                    { key: 'closed', label: '9. Closed' },
                    { key: 'archived', label: '10. Archived' },
                  ].map((step) => {
                    const isCurrent =
                      (step.key === 'new' && (viewingComplaint.status === 'new' || viewingComplaint.status === 'pending')) ||
                      (step.key === 'pending' && viewingComplaint.status === 'pending') ||
                      (step.key === 'assigned' && viewingComplaint.status === 'assigned') ||
                      (step.key === 'accepted' && viewingComplaint.status === 'accepted') ||
                      (step.key === 'technician_on_way' && (viewingComplaint.status === 'technician_on_way' || viewingComplaint.status === 'en_route')) ||
                      (step.key === 'arrived' && viewingComplaint.status === 'arrived') ||
                      (step.key === 'inspection_repair' && (viewingComplaint.status === 'inspection_repair' || viewingComplaint.status === 'in_progress')) ||
                      (step.key === 'resolved' && viewingComplaint.status === 'resolved') ||
                      (step.key === 'closed' && viewingComplaint.status === 'closed') ||
                      (step.key === 'archived' && (viewingComplaint.status === 'archived' || viewingComplaint.isArchived));

                    return (
                      <span
                        key={step.key}
                        className={`px-2 py-1 rounded-lg whitespace-nowrap border shrink-0 ${
                          isCurrent
                            ? 'bg-[#1976D2] text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {step.label}
                      </span>
                    );
                  })}
                </div>
              </div>

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
                      <option value="technician_on_way">🚚 Technician En Route</option>
                      <option value="inspection_repair">🔧 In Progress / Inspection</option>
                      <option value="resolved">✅ Resolved</option>
                      <option value="closed">🔒 Closed</option>
                      <option value="archived">📦 Archived</option>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppUpdate(viewingComplaint)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Send WhatsApp Update</span>
                    </button>

                    {viewingComplaint.status === 'archived' || viewingComplaint.isArchived ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreComplaint(viewingComplaint.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1976D2] font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore from Archive</span>
                      </button>
                    ) : viewingComplaint.status === 'closed' ? (
                      <button
                        type="button"
                        onClick={() => handleArchiveComplaint(viewingComplaint.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive Closed Complaint</span>
                      </button>
                    ) : viewingComplaint.status === 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(viewingComplaint.id, 'closed')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Close Complaint</span>
                      </button>
                    ) : (viewingComplaint.status === 'assigned' || viewingComplaint.status === 'technician_on_way') ? (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(viewingComplaint.id, 'inspection_repair', 'Technician on-site inspection begun.')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Mark In Progress</span>
                      </button>
                    ) : null}
                  </div>

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
                  {technicians.map((tech) => {
                    const activeTechWorkload = complaints.filter(
                      (c) => c.assignedTechnicianId === tech.id && c.status !== 'resolved' && c.status !== 'closed'
                    ).length;

                    return (
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
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{tech.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">({tech.employeeCode})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 space-x-1">
                              <span>{tech.zone || 'Mumbai Hub'}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">{activeTechWorkload} active job(s)</span>
                              <span>•</span>
                              <span>⭐ {tech.customerRating || '4.9'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Skills: {tech.specialization || 'Traction, PMSM Gearless & ARD'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
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
                          <a
                            href={`tel:${tech.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <PhoneCall className="w-2.5 h-2.5" />
                            <span>Call</span>
                          </a>
                        </div>
                      </label>
                    );
                  })}
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
