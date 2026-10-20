import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  UserCheck,
  UserX,
  History,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';

export interface TechnicianRecordItem {
  id: string;
  permanentId?: string | null;
  employeeCode?: string | null;
  name: string;
  email: string;
  phone: string;
  accountStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'SUSPENDED';
  address?: string | null;
  qualifications?: string | null;
  experienceYears?: number | null;
  documents?: string | null;
  registeredAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  blockedAt?: string | null;
  blockedBy?: string | null;
  blockReason?: string | null;
  unblockedAt?: string | null;
  unblockedBy?: string | null;
  unblockReason?: string | null;
  lastLoginAt?: string | null;
  user?: {
    id: string;
    isActive: boolean;
    lastLoginAt?: string | null;
  } | null;
  workOrders?: Array<{
    id: string;
    title: string;
    status: string;
    scheduledDate?: string;
    lift?: {
      unitNumber: string;
      building?: { name: string };
    };
  }>;
  serviceReports?: Array<{
    id: string;
    workOrderId: string;
    completedAt?: string;
    liftCondition?: string;
  }>;
}

export const TechnicianRecordsView: React.FC = () => {
  const { showSuccessModal, currentUser } = useApp();

  // State for server-side query
  const [records, setRecords] = useState<TechnicianRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'registeredAt' | 'approvedAt' | 'name'>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Summary counts
  const [statusCounts, setStatusCounts] = useState({
    ALL: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
    BLOCKED: 0,
    SUSPENDED: 0,
  });

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<TechnicianRecordItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form reasons
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch technician records from server with pagination & filters
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getTechnicianRecords({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sortBy,
        sortOrder,
      });

      if (res && res.success && res.data) {
        setRecords(res.data.technicians || []);
        if (res.data.pagination) {
          setTotalCount(res.data.pagination.total);
          setTotalPages(res.data.pagination.totalPages || 1);
        }
        if (res.data.counts) {
          setStatusCounts(res.data.counts);
        }
      } else {
        setError(res?.message || 'Failed to load technician records from server.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with technician records service.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await apiService.approveTechnician(selectedRecord.id);
      if (res && res.success) {
        setIsApproveModalOpen(false);
        showSuccessModal(
          'Technician Approved',
          `Technician ${selectedRecord.name} was approved! Permanent ID: ${res.data?.permanentId || 'Generated'}. Approval email dispatched.`
        );
        fetchRecords();
      } else {
        setActionFeedback({
          type: 'error',
          message: res?.message || 'Failed to approve technician.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Approval error.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await apiService.rejectTechnician(selectedRecord.id, actionReason.trim());
      if (res && res.success) {
        setIsRejectModalOpen(false);
        setActionReason('');
        showSuccessModal(
          'Application Rejected',
          `Application for ${selectedRecord.name} has been rejected. Notification email sent.`
        );
        fetchRecords();
      } else {
        setActionFeedback({
          type: 'error',
          message: res?.message || 'Failed to reject technician application.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Rejection error.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Block
  const handleBlock = async () => {
    if (!selectedRecord) return;
    if (!actionReason.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'Please provide a clear reason for blocking this account.',
      });
      return;
    }

    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await apiService.blockTechnician(selectedRecord.id, actionReason.trim());
      if (res && res.success) {
        setIsBlockModalOpen(false);
        setActionReason('');
        showSuccessModal(
          'Account Blocked',
          `Technician account for ${selectedRecord.name} has been blocked. All active sessions have been revoked.`
        );
        fetchRecords();
      } else {
        setActionFeedback({
          type: 'error',
          message: res?.message || 'Failed to block technician account.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Block error.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unblock
  const handleUnblock = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await apiService.unblockTechnician(selectedRecord.id, actionReason.trim());
      if (res && res.success) {
        setIsUnblockModalOpen(false);
        setActionReason('');
        showSuccessModal(
          'Account Restored',
          `Technician account for ${selectedRecord.name} has been unblocked and restored to Approved status.`
        );
        fetchRecords();
      } else {
        setActionFeedback({
          type: 'error',
          message: res?.message || 'Failed to unblock technician account.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Unblock error.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Export records to CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'Permanent ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Registered At',
      'Approved At',
      'Approved By',
      'Qualifications',
      'Experience Years',
      'Blocked At',
      'Block Reason',
      'Last Login',
    ];

    const rows = records.map((t) => [
      `"${t.permanentId || t.employeeCode || 'PENDING'}"`,
      `"${t.name || ''}"`,
      `"${t.email || ''}"`,
      `"${t.phone || ''}"`,
      `"${t.accountStatus}"`,
      `"${t.registeredAt ? new Date(t.registeredAt).toLocaleDateString() : ''}"`,
      `"${t.approvedAt ? new Date(t.approvedAt).toLocaleDateString() : ''}"`,
      `"${t.approvedBy || ''}"`,
      `"${(t.qualifications || '').replace(/"/g, '""')}"`,
      `"${t.experienceYears || ''}"`,
      `"${t.blockedAt ? new Date(t.blockedAt).toLocaleDateString() : ''}"`,
      `"${(t.blockReason || '').replace(/"/g, '""')}"`,
      `"${t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wepsun_technician_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Approval
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <Lock className="w-3 h-3 text-red-600" />
            Blocked
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertTriangle className="w-3 h-3 text-purple-600" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Technician Records
                </h1>
                {statusCounts.PENDING_APPROVAL > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {statusCounts.PENDING_APPROVAL} Pending
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Onboarding approvals, permanent technician IDs, credential validation & account status controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => fetchRecords()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div
            onClick={() => { setStatusFilter('ALL'); setPage(1); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Fleet</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 block">
              {statusCounts.ALL || 0}
            </span>
          </div>

          <div
            onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-emerald-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Approved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
              {statusCounts.APPROVED || 0}
            </span>
          </div>

          <div
            onClick={() => { setStatusFilter('PENDING_APPROVAL'); setPage(1); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-amber-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1 block">
              {statusCounts.PENDING_APPROVAL || 0}
            </span>
          </div>

          <div
            onClick={() => { setStatusFilter('BLOCKED'); setPage(1); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'BLOCKED'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/10'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-red-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Blocked</span>
              <Lock className="w-3.5 h-3.5 text-red-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-red-700 font-mono mt-1 block">
              {statusCounts.BLOCKED || 0}
            </span>
          </div>

          <div
            onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              statusFilter === 'REJECTED'
                ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Rejected</span>
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-700 font-mono mt-1 block">
              {statusCounts.REJECTED || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter & Sort Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Permanent ID (Wepsun0001...), Name, Email, or Mobile..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:border-[#0066FF] outline-none"
            >
              <option value="registeredAt">Registration Date</option>
              <option value="approvedAt">Approval Date</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              title={`Sorting ${sortOrder.toUpperCase()}`}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'BLOCKED', 'REJECTED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Records' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Table of Technician Records */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading technician records from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-red-600">{error}</p>
            <button
              onClick={() => fetchRecords()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No Technician Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter criteria.'
                : 'Technician registrations submitted via the app will automatically appear here for approval.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Technician</th>
                  <th className="py-3.5 px-4">Permanent ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Qualifications & Exp.</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((tech) => {
                  const isPending = tech.accountStatus === 'PENDING_APPROVAL';
                  const isApproved = tech.accountStatus === 'APPROVED';
                  const isBlocked = tech.accountStatus === 'BLOCKED';

                  return (
                    <tr
                      key={tech.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-default"
                    >
                      {/* Technician Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {tech.name ? tech.name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                              {tech.name}
                            </span>
                            <span className="text-[10.5px] text-slate-400 font-mono">
                              Code: {tech.employeeCode || tech.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Permanent ID */}
                      <td className="py-3.5 px-4">
                        {tech.permanentId ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0066FF] font-mono font-bold text-xs border border-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                            {tech.permanentId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned (Pending)</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{tech.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{tech.phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(tech.accountStatus)}
                        {tech.blockReason && isBlocked && (
                          <span className="block text-[10px] text-red-600 truncate max-w-[140px] mt-0.5" title={tech.blockReason}>
                            Reason: {tech.blockReason}
                          </span>
                        )}
                      </td>

                      {/* Qualifications & Exp */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <span className="font-semibold text-slate-800 block truncate" title={tech.qualifications || ''}>
                          {tech.qualifications || 'Standard Certification'}
                        </span>
                        <span className="text-[10.5px] text-slate-500">
                          {tech.experienceYears ? `${tech.experienceYears} Years Exp.` : 'Entry Level'}
                        </span>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 space-y-0.5">
                        <div>
                          <span className="text-slate-400">Reg: </span>
                          <span>{tech.registeredAt ? new Date(tech.registeredAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {tech.approvedAt && (
                          <div className="text-emerald-700">
                            <span className="text-emerald-500">Apprv: </span>
                            <span>{new Date(tech.approvedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => {
                              setSelectedRecord(tech);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Technician Profile & Jobs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Pending Approval Actions */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRecord(tech);
                                  setIsApproveModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs cursor-pointer"
                                title="Approve Registration"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRecord(tech);
                                  setActionReason('');
                                  setIsRejectModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] border border-red-200 transition-colors cursor-pointer"
                                title="Reject Registration"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Approved: Option to Block */}
                          {isApproved && (
                            <button
                              onClick={() => {
                                setSelectedRecord(tech);
                                setActionReason('');
                                setIsBlockModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Block Account"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Block</span>
                            </button>
                          )}

                          {/* Blocked: Option to Unblock */}
                          {isBlocked && (
                            <button
                              onClick={() => {
                                setSelectedRecord(tech);
                                setActionReason('');
                                setIsUnblockModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                              title="Unblock Account"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </button>
                          )}

                          {/* History / Audit Log */}
                          <button
                            onClick={() => {
                              setSelectedRecord(tech);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Audit & Security History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        <div className="py-3.5 px-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <strong className="text-slate-800">{records.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800">{Math.min(page * limit, totalCount)}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="py-1 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-slate-700 text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: Full Technician Profile, Jobs & Service History */}
      {/* ===================================================================== */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {selectedRecord.name ? selectedRecord.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedRecord.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {renderStatusBadge(selectedRecord.accountStatus)}
                    {selectedRecord.permanentId && (
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {selectedRecord.permanentId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Information</span>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedRecord.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedRecord.phone}</span>
                </div>
                {selectedRecord.address && (
                  <div className="flex items-start gap-2 text-slate-800 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedRecord.address}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualifications & Certification</span>
                <div className="flex items-start gap-2 text-slate-800 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedRecord.qualifications || 'Standard Technical Training'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedRecord.experienceYears ? `${selectedRecord.experienceYears} Years Verified Experience` : 'Entry Level'}</span>
                </div>
                {selectedRecord.documents && (
                  <div className="flex items-start gap-2 text-slate-800 font-medium">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>License / Doc: {selectedRecord.documents}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audit & Lifecycle Information */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 text-xs space-y-2">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Account Lifecycle Log</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Registered:</span>
                  <span className="font-semibold">{selectedRecord.registeredAt ? new Date(selectedRecord.registeredAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Approved At:</span>
                  <span className="font-semibold text-emerald-700">{selectedRecord.approvedAt ? new Date(selectedRecord.approvedAt).toLocaleString() : 'Pending'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Approved By:</span>
                  <span className="font-semibold">{selectedRecord.approvedBy || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Last Login:</span>
                  <span className="font-semibold font-mono">{selectedRecord.lastLoginAt ? new Date(selectedRecord.lastLoginAt).toLocaleString() : 'Never logged in'}</span>
                </div>
                {selectedRecord.blockedAt && (
                  <div>
                    <span className="text-red-500 block text-[10px]">Blocked At:</span>
                    <span className="font-semibold text-red-700">{new Date(selectedRecord.blockedAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedRecord.blockReason && (
                  <div className="col-span-2">
                    <span className="text-red-500 block text-[10px]">Block Reason:</span>
                    <span className="font-semibold text-red-700">{selectedRecord.blockReason}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Service & Jobs History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Assigned Work Orders & Service Jobs ({selectedRecord.workOrders?.length || 0})
              </h4>
              {(!selectedRecord.workOrders || selectedRecord.workOrders.length === 0) ? (
                <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-slate-100">
                  No service tickets assigned to this technician yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedRecord.workOrders.map((wo) => (
                    <div key={wo.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{wo.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Lift: {wo.lift?.unitNumber || 'N/A'} ({wo.lift?.building?.name || 'Building'})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                        {wo.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Approve Technician Confirmation */}
      {/* ===================================================================== */}
      {isApproveModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Approve Technician Application</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are approving <strong>{selectedRecord.name}</strong> as an authorized WEPSUN field engineer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>A permanent unique Technician ID will be generated</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>An approval email with permanent ID and login instructions will be sent</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <Wrench className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Technician portal access and job assignments will activate</span>
              </div>
            </div>

            {actionFeedback && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                {actionFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Confirm & Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: Reject Application */}
      {/* ===================================================================== */}
      {isRejectModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-xs">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Reject Technician Application</h3>
              <p className="text-xs text-slate-500 mt-1">
                Rejecting application for <strong>{selectedRecord.name}</strong> ({selectedRecord.email}).
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Rejection Reason (will be emailed to the applicant):
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Incomplete certification documents or verification could not be completed."
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 outline-none transition-all"
              />
            </div>

            {actionFeedback && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                {actionFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Reject Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: Block Technician Account */}
      {/* ===================================================================== */}
      {isBlockModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Block Technician Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are about to block <strong>{selectedRecord.name}</strong> ({selectedRecord.permanentId || selectedRecord.email}).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Immediate Security Enforcement:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800">
                <li>All active tokens and sessions will be immediately revoked.</li>
                <li>API requests from all authenticated devices will be blocked.</li>
                <li>Access to work orders, service reports and tools will be denied.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Block Reason (Required for Audit Compliance): *
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Disciplinary suspension, policy violation, or contract termination."
                required
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 outline-none transition-all"
              />
            </div>

            {actionFeedback && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                {actionFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={actionLoading || !actionReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Block Account Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: Unblock Technician Account */}
      {/* ===================================================================== */}
      {isUnblockModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Unlock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Unblock Technician Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Restoring access for <strong>{selectedRecord.name}</strong> ({selectedRecord.permanentId || selectedRecord.email}).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">Access Restoration Policy:</span>
              <p className="text-[11px] leading-relaxed">
                Account will be restored to <strong>APPROVED</strong> status with its existing permanent ID preserved. The technician can sign in again immediately.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Unblock Reason / Authorization Note:
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Investigation completed and clearance granted."
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {actionFeedback && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                {actionFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsUnblockModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnblock}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Unblock Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: Block & Security Audit History */}
      {/* ===================================================================== */}
      {isHistoryModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Security & Audit History</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedRecord.permanentId || selectedRecord.id} — {selectedRecord.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
              {/* Event 1: Registration */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-slate-500 text-[10.5px]">
                  <span className="font-bold text-slate-700 uppercase">Registration Submitted</span>
                  <span className="font-mono">{selectedRecord.registeredAt ? new Date(selectedRecord.registeredAt).toLocaleString() : 'N/A'}</span>
                </div>
                <p className="text-slate-600 mt-1">Initial application recorded with status PENDING_APPROVAL.</p>
              </div>

              {/* Event 2: Approval if present */}
              {selectedRecord.approvedAt && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-bold uppercase text-emerald-700">Account Approved</span>
                    <span className="font-mono">{new Date(selectedRecord.approvedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-emerald-800 mt-1">
                    Permanent ID assigned: <strong className="font-mono">{selectedRecord.permanentId}</strong>. Approved by: {selectedRecord.approvedBy || 'Admin'}.
                  </p>
                </div>
              )}

              {/* Event 3: Block if present */}
              {selectedRecord.blockedAt && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-bold uppercase text-red-700">Account Blocked</span>
                    <span className="font-mono">{new Date(selectedRecord.blockedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-red-800 mt-1">
                    Blocked by: {selectedRecord.blockedBy || 'Admin'}. Reason: <em>"{selectedRecord.blockReason || 'Unspecified'}"</em>
                  </p>
                </div>
              )}

              {/* Event 4: Unblock if present */}
              {selectedRecord.unblockedAt && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-bold uppercase text-blue-700">Account Unblocked</span>
                    <span className="font-mono">{new Date(selectedRecord.unblockedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-blue-800 mt-1">
                    Unblocked by: {selectedRecord.unblockedBy || 'Admin'}. Note: <em>"{selectedRecord.unblockReason || 'Clearance granted'}"</em>
                  </p>
                </div>
              )}

              {/* Event 5: Rejection if present */}
              {selectedRecord.rejectedAt && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-bold uppercase text-slate-700">Application Rejected</span>
                    <span className="font-mono">{new Date(selectedRecord.rejectedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 mt-1">
                    Rejected by: {selectedRecord.rejectedBy || 'Admin'}. Reason: <em>"{selectedRecord.rejectionReason || 'Documents insufficient'}"</em>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
