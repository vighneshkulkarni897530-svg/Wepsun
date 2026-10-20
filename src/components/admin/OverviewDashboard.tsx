import React, { useState, useMemo } from 'react';
import {
  Building2,
  GitBranch,
  Building,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  Receipt,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardList,
  Layers,
  Bell,
  Package,
  Wrench,
  Sparkles,
  Users,
  HardHat,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Square,
  Trash2,
  ExternalLink,
  Award,
  Phone,
  Mail,
  Edit3,
  UserCheck,
  UserX,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTabId } from '../layout/Sidebar';
import elevatorLobbyImg from '../../assets/elevator-lobby.jpg';
import { RaiseComplaintModal } from '../client/RaiseComplaintModal';
import { detectMasterAdminSlot, getActiveMasterAdminProfile, MASTER_ADMIN_PROFILES } from '../../utils/masterAdminProfiles';
import { getEffectiveProfilePhoto, isValidCustomAvatar } from '../../utils/avatarUtils';
import { apiService } from '../../services/api';

interface OverviewDashboardProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
}) => {
  const {
    currentUser,
    tenantComplaints,
    tenantAmcContracts,
    tenantLifts,
    tenantWorkOrders,
    serviceReports,
    tenantInventory,
    tenantInvoices,
    tenantQuotations,
    tenantBuildings,
    users,
    showSuccessModal,
  } = useApp();

  // Pending Technician Onboarding Requests
  const [pendingTechnicians, setPendingTechnicians] = useState<any[]>([]);
  const [loadingPendingTechs, setLoadingPendingTechs] = useState<boolean>(false);
  const [techActionLoadingId, setTechActionLoadingId] = useState<string | null>(null);

  const fetchPendingTechnicians = React.useCallback(async () => {
    setLoadingPendingTechs(true);
    try {
      const res = await apiService.getPendingTechnicians();
      if (res && res.success && res.data) {
        setPendingTechnicians(res.data.pendingTechnicians || []);
      }
    } catch (err) {
      console.warn('[OverviewDashboard] Pending technicians fetch notice:', err);
    } finally {
      setLoadingPendingTechs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPendingTechnicians();
  }, [fetchPendingTechnicians]);

  const handleApproveTechnician = async (techId: string, name: string) => {
    setTechActionLoadingId(techId);
    try {
      const res = await apiService.approveTechnician(techId);
      if (res && res.success) {
        showSuccessModal(
          'Technician Approved',
          `Application for ${name} has been approved! Assigned Permanent ID: ${res.data?.permanentId || 'Generated'}. Branded approval email dispatched.`
        );
        fetchPendingTechnicians();
      }
    } catch (err: any) {
      console.error('Approve technician error:', err);
    } finally {
      setTechActionLoadingId(null);
    }
  };

  const handleRejectTechnician = async (techId: string, name: string) => {
    const reason = prompt(`Enter rejection reason for ${name} (will be emailed to applicant):`);
    if (reason === null) return;

    setTechActionLoadingId(techId);
    try {
      const res = await apiService.rejectTechnician(techId, reason.trim() || 'Application criteria not met');
      if (res && res.success) {
        showSuccessModal(
          'Application Rejected',
          `Application for ${name} has been rejected. Notification email sent.`
        );
        fetchPendingTechnicians();
      }
    } catch (err: any) {
      console.error('Reject technician error:', err);
    } finally {
      setTechActionLoadingId(null);
    }
  };

  const [activeRecentTab, setActiveRecentTab] = useState<'complaints' | 'amc' | 'quotations' | 'payments'>('complaints');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 Days');

  // Master Admin Personalized Profile Resolution
  const masterSlot = detectMasterAdminSlot(currentUser);
  const masterProfile = masterSlot ? MASTER_ADMIN_PROFILES[masterSlot] : null;

  // Stored Custom Profile overrides
  const customSavedProfile = useMemo(() => {
    if (typeof window === 'undefined' || !currentUser.id) return null;
    try {
      const raw = localStorage.getItem('wepsun_master_profile_' + currentUser.id);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [currentUser.id]);

  const adminDisplayName = customSavedProfile?.name || currentUser.name || masterProfile?.name || 'Executive Admin';
  const adminFirstName = adminDisplayName.split(' ')[0] || 'Admin';
  const adminEffectiveAvatar = getEffectiveProfilePhoto(currentUser.avatar, null, currentUser.id) || masterProfile?.defaultAvatar || '';

  // Executive Personal Workspace Notes State (Stored uniquely per Admin ID)
  const notesStorageKey = `wepsun_admin_notes_${currentUser.id || (masterSlot ? `master-${masterSlot}` : 'default')}`;
  const [adminNotes, setAdminNotes] = useState<{ id: string; text: string; completed: boolean }[]>(() => {
    if (typeof window === 'undefined') return masterProfile?.defaultNotes || [];
    try {
      const saved = localStorage.getItem(notesStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return masterProfile?.defaultNotes || [];
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleToggleNote = (noteId: string) => {
    setAdminNotes((prev) => {
      const updated = prev.map((n) => (n.id === noteId ? { ...n, completed: !n.completed } : n));
      try {
        localStorage.setItem(notesStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const item = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      completed: false,
    };
    setAdminNotes((prev) => {
      const updated = [item, ...prev];
      try {
        localStorage.setItem(notesStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setAdminNotes((prev) => {
      const updated = prev.filter((n) => n.id !== noteId);
      try {
        localStorage.setItem(notesStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Dynamic today date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  // Top 5 Stats
  const totalClients = useMemo(() => {
    const clientIds = new Set<string>();
    users.forEach((u) => {
      if (u.role === 'client') clientIds.add(u.id);
    });
    tenantBuildings.forEach((b) => {
      if (b.clientId) clientIds.add(b.clientId);
    });
    tenantLifts.forEach((l) => {
      if (l.clientId) clientIds.add(l.clientId);
    });
    return Math.max(1, clientIds.size);
  }, [users, tenantBuildings, tenantLifts]);

  const totalBuildings = tenantBuildings.length;
  const totalLifts = tenantLifts.length;
  const openComplaintsCount = tenantComplaints.filter(
    (c) => c.status === 'pending' || c.status === 'assigned' || c.status === 'technician_on_way' || c.status === 'inspection_repair'
  ).length;
  const amcExpiringCount = tenantAmcContracts.filter(
    (a) =>
      a.status === 'expiring_soon' ||
      (a.endDate &&
        new Date(a.endDate).getTime() - Date.now() < 30 * 86400000 &&
        new Date(a.endDate).getTime() > Date.now())
  ).length;

  // Complaints Overview Donut
  const totalComplaints = tenantComplaints.length;
  const openCount = tenantComplaints.filter((c) => c.status === 'pending' || c.status === 'assigned').length;
  const inProgressCount = tenantComplaints.filter(
    (c) => c.status === 'technician_on_way' || c.status === 'inspection_repair'
  ).length;
  const resolvedCount = tenantComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;

  const openPct = totalComplaints > 0 ? Math.round((openCount / totalComplaints) * 100) : 0;
  const inProgressPct = totalComplaints > 0 ? Math.round((inProgressCount / totalComplaints) * 100) : 0;
  const resolvedPct = totalComplaints > 0 ? Math.max(0, 100 - openPct - inProgressPct) : 0;

  // Service Requests Trend (Last 7 Days)
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      };
    });
  }, []);

  const trendData = useMemo(() => {
    const complaintsPoints = [65, 60, 70, 62, 50, 58, 48];
    const servicePoints = [45, 38, 48, 35, 25, 32, 22];
    const xCoords = [10, 60, 110, 160, 210, 260, 310];
    const cPolyline = xCoords.map((x, i) => `${x},${complaintsPoints[i]}`).join(' ');
    const sPolyline = xCoords.map((x, i) => `${x},${servicePoints[i]}`).join(' ');

    return {
      complaintsPoints: xCoords.map((x, i) => [x, complaintsPoints[i]]),
      servicePoints: xCoords.map((x, i) => [x, servicePoints[i]]),
      cPolyline,
      sPolyline,
    };
  }, []);

  // AMC Status Donut
  const totalAmc = tenantAmcContracts.length;
  const activeAmcCount = tenantAmcContracts.filter((a) => a.status === 'active').length;
  const expiringAmcCount = tenantAmcContracts.filter((a) => a.status === 'expiring_soon').length;
  const expiredAmcCount = tenantAmcContracts.filter((a) => a.status === 'expired').length;

  const activeAmcPct = totalAmc > 0 ? Math.round((activeAmcCount / totalAmc) * 100) : 0;
  const expiringAmcPct = totalAmc > 0 ? Math.round((expiringAmcCount / totalAmc) * 100) : 0;
  const expiredAmcPct = totalAmc > 0 ? Math.max(0, 100 - activeAmcPct - expiringAmcPct) : 0;

  // Inventory Low Stock
  const sortedInventory = useMemo(() => {
    return [...tenantInventory]
      .sort((a, b) => (a.currentStock - a.minStockThreshold) - (b.currentStock - b.minStockThreshold))
      .slice(0, 4);
  }, [tenantInventory]);

  // Payments Overview
  const totalInvoiced = useMemo(() => {
    return tenantInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.totalAmount || 0), 0);
  }, [tenantInvoices]);

  const paidTotal = useMemo(() => {
    return tenantInvoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, inv) => sum + (inv.grandTotal || inv.totalAmount || 0), 0);
  }, [tenantInvoices]);

  const pendingTotal = useMemo(() => {
    return tenantInvoices
      .filter((i) => i.status === 'pending' || (i as any).status === 'draft')
      .reduce((sum, inv) => sum + (inv.grandTotal || inv.totalAmount || 0), 0);
  }, [tenantInvoices]);

  const overdueTotal = useMemo(() => {
    return tenantInvoices
      .filter((i) => i.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.grandTotal || inv.totalAmount || 0), 0);
  }, [tenantInvoices]);

  const paidPct = totalInvoiced > 0 ? Math.round((paidTotal / totalInvoiced) * 100) : 0;
  const pendingPct = totalInvoiced > 0 ? Math.round((pendingTotal / totalInvoiced) * 100) : 0;
  const overduePct = totalInvoiced > 0 ? Math.max(0, 100 - paidPct - pendingPct) : 0;

  // Sidebar Recent Activity
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      icon: any;
      iconBg: string;
      iconColor: string;
      title: string;
      subtitle: string;
      time: string;
      timestamp: number;
    }> = [];

    tenantComplaints.forEach((c) => {
      const dt = new Date(c.createdAt || Date.now());
      list.push({
        id: `c-${c.id}`,
        icon: AlertTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        title: `Complaint #${c.ticketNumber || c.id}`,
        subtitle: `${c.issueType || 'Complaint raised'} - ${c.buildingName || c.clientName}`,
        time: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        timestamp: dt.getTime(),
      });
    });

    tenantInvoices.forEach((inv) => {
      const dt = new Date(inv.dueDate || Date.now());
      list.push({
        id: `inv-${inv.id}`,
        icon: Receipt,
        iconBg: inv.status === 'paid' ? 'bg-teal-100' : 'bg-amber-100',
        iconColor: inv.status === 'paid' ? 'text-teal-600' : 'text-amber-600',
        title: inv.status === 'paid' ? 'Payment Received' : `Invoice #${inv.invoiceNumber}`,
        subtitle: `₹ ${(inv.grandTotal || inv.totalAmount || 0).toLocaleString('en-IN')} for ${inv.clientName}`,
        time: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        timestamp: dt.getTime(),
      });
    });

    tenantAmcContracts.forEach((a) => {
      const dt = new Date(a.startDate || Date.now());
      list.push({
        id: `amc-${a.id}`,
        icon: ShieldCheck,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        title: 'AMC Contract Active',
        subtitle: `${a.contractNumber} (${a.amcType || 'Comprehensive'}) - ${a.buildingName || a.clientName}`,
        time: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        timestamp: dt.getTime(),
      });
    });

    serviceReports.forEach((sr) => {
      const dt = new Date(sr.serviceDate || Date.now());
      list.push({
        id: `sr-${sr.id}`,
        icon: Wrench,
        iconBg: 'bg-blue-100',
        iconColor: 'text-[#1976D2]',
        title: 'Service Completed',
        subtitle: `${sr.liftNumber || 'Elevator Service'} - ${sr.buildingName || 'Client Building'}`,
        time: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        timestamp: dt.getTime(),
      });
    });

    tenantQuotations.forEach((q) => {
      const dt = new Date(q.createdAt || Date.now());
      list.push({
        id: `q-${q.id}`,
        icon: FileSpreadsheet,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        title: `Quotation #${q.quotationNumber}`,
        subtitle: `₹ ${(q.grandTotal || q.totalAmount || 0).toLocaleString('en-IN')} - ${q.clientName || 'Client'}`,
        time: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        timestamp: dt.getTime(),
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [tenantComplaints, tenantInvoices, tenantAmcContracts, serviceReports, tenantQuotations]);

  return (
    <div className="w-full space-y-6 text-slate-800">
      {/* 2-COLUMN GRID (Left 8 Cols, Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT MAIN COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* PERSONALIZED EXECUTIVE HERO BANNER */}
          <div className="bg-gradient-to-r from-[#EBF5FB] via-[#F0F7FD] to-[#E3F2FD] border border-blue-200/80 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Ambient executive glow */}
            <div className={`absolute -right-12 -bottom-12 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none ${masterSlot === 2 ? 'bg-emerald-400' : 'bg-blue-400'}`} />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              {/* Left: Avatar + Identity + Personal Greeting */}
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md ring-4 ring-blue-100 flex items-center justify-center">
                    {adminEffectiveAvatar ? (
                      <img src={adminEffectiveAvatar} alt={adminDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  {/* Verified Shield Badge on Avatar */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white ${masterSlot === 2 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                    title="Verified Executive Master Admin"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase text-white shadow-xs bg-gradient-to-r ${masterProfile?.badgeGradient || 'from-blue-600 to-indigo-700'}`}>
                      <Award className="w-3 h-3" />
                      <span>{masterProfile?.masterId || 'WEP-MASTER'}</span>
                    </span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono tracking-wide">
                      MANAGING DIRECTOR & CEO
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 truncate">
                    Welcome back, {adminDisplayName}!
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                    <span className="font-bold text-slate-800">Managing Director & CEO</span> • {masterProfile?.executiveFocus || "Overview of WEPSUN's real-time elevator service operations."}
                  </p>
                </div>
              </div>

              {/* Right: Modern Elevator Graphic + Date & Profile Link */}
              <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end shrink-0">
                <div className="w-28 sm:w-36 h-18 sm:h-20 rounded-xl overflow-hidden border border-blue-200/80 shadow-md shrink-0 bg-slate-200 hidden lg:block">
                  <img
                    src={elevatorLobbyImg}
                    alt="Modern Elevator Lobby"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('settings')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50/80 border border-blue-200/80 text-[#1976D2] text-xs font-bold shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-95"
                    title="View your dedicated Executive Profile & Settings"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>

                  <div className="text-right flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
                    <Calendar className="w-4 h-4 text-[#1976D2]" />
                    <div className="text-left leading-tight">
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">Today</span>
                      <span className="text-xs font-bold text-slate-800 font-mono block">{todayFormatted}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized Executive Focus Bar */}
            {masterProfile && (
              <div className="mt-4 pt-3.5 border-t border-blue-100/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700 min-w-0">
                  <span className="font-bold text-[#1976D2] shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Executive Focus:
                  </span>
                  <span className="truncate text-slate-700 font-semibold">
                    {masterProfile.executiveFocus}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono shrink-0">
                  <span>Master ID: <strong className="text-slate-800">{masterProfile.masterId}</strong></span>
                  <span>•</span>
                  <span>Direct: <strong className="text-slate-800">{currentUser.phone || masterProfile.phone}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 5 TOP STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {/* 1. Total Clients */}
            <div
              onClick={() => onNavigateTab('clients')}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#1976D2] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">Total Clients</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">{totalClients}</div>
              <div className="text-[9.5px] sm:text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5 truncate">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>Active portfolio</span>
              </div>
            </div>

            {/* 2. Total Buildings */}
            <div
              onClick={() => onNavigateTab('buildings')}
              className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">Total Buildings</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">{totalBuildings}</div>
              <div className="text-[9.5px] sm:text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5 truncate">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>Registered sites</span>
              </div>
            </div>

            {/* 3. Total Lifts */}
            <div
              onClick={() => onNavigateTab('lifts')}
              className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">Total Lifts</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">{totalLifts}</div>
              <div className="text-[9.5px] sm:text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5 truncate">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>Under service</span>
              </div>
            </div>

            {/* 4. Open Complaints */}
            <div
              onClick={() => onNavigateTab('complaints')}
              className="bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">Open Complaints</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">{openComplaintsCount}</div>
              <div className="text-[9.5px] sm:text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-0.5 truncate">
                <span>Active tickets</span>
              </div>
            </div>

            {/* 5. AMC Expiring */}
            <div
              onClick={() => onNavigateTab('amc')}
              className="bg-white border border-slate-200/90 hover:border-teal-300 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between active:scale-[0.98] col-span-2 sm:col-span-1"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight truncate">AMC Expiring</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">{amcExpiringCount}</div>
              <div className="text-[9.5px] sm:text-[10px] font-semibold text-teal-600 mt-1 flex items-center gap-0.5 truncate">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>Next 30 Days</span>
              </div>
            </div>
          </div>

          {/* TECHNICIAN REQUESTS SECTION */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Technician Requests</h3>
                    {pendingTechnicians.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {pendingTechnicians.length} Pending Approval
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Review and verify incoming field engineer onboarding applications.
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('technician_records')}
                className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Technician Records</span>
                <span>→</span>
              </button>
            </div>

            {loadingPendingTechs ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Checking pending applications...</span>
              </div>
            ) : pendingTechnicians.length === 0 ? (
              <div className="py-6 px-4 rounded-xl bg-slate-50/70 border border-slate-200/70 text-center flex flex-col items-center justify-center space-y-1.5">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">All caught up! No pending technician requests.</p>
                <p className="text-[11px] text-slate-500">
                  New registrations submitted by field engineers will automatically appear here for one-click approval.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {pendingTechnicians.map((pt) => {
                  const isProcessing = techActionLoadingId === pt.id;
                  return (
                    <div
                      key={pt.id}
                      className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/90 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{pt.name}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{pt.email}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                            Awaiting Approval
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-amber-100">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Mobile:</span>
                            <span className="font-semibold text-slate-800">{pt.phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Registered:</span>
                            <span className="font-semibold">{pt.registeredAt ? new Date(pt.registeredAt).toLocaleDateString() : 'Recent'}</span>
                          </div>
                          {pt.qualifications && (
                            <div className="col-span-2">
                              <span className="text-slate-400 block text-[10px]">Qualifications:</span>
                              <span className="font-medium text-slate-800 truncate block">
                                {pt.qualifications} {pt.experienceYears ? `(${pt.experienceYears} yrs exp)` : ''}
                              </span>
                            </div>
                          )}
                          {pt.documents && (
                            <div className="col-span-2">
                              <span className="text-slate-400 block text-[10px]">Documents / License:</span>
                              <span className="font-mono text-slate-700 text-[10.5px] truncate block">{pt.documents}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-100">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRejectTechnician(pt.id, pt.name)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApproveTechnician(pt.id, pt.name)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Issue ID</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2 ANALYTICS CHARTS ROW (Complaints Overview Donut & Service Requests Trend) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Complaints Overview Donut Chart (5 Cols) */}
            <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Complaints Overview</span>
                </h3>
                <button
                  onClick={() => onNavigateTab('complaints')}
                  className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <span>→</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-5 pt-2">
                {/* SVG Donut Chart */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Segment 1: Open */}
                    {openPct > 0 && (
                      <path
                        className="text-red-500 transition-all duration-500"
                        strokeDasharray={`${openPct}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {/* Segment 2: In Progress */}
                    {inProgressPct > 0 && (
                      <path
                        className="text-amber-500 transition-all duration-500"
                        strokeDasharray={`${inProgressPct}, 100`}
                        strokeDashoffset={-(openPct)}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {/* Segment 3: Resolved */}
                    {resolvedPct > 0 && (
                      <path
                        className="text-emerald-500 transition-all duration-500"
                        strokeDasharray={`${resolvedPct}, 100`}
                        strokeDashoffset={-(openPct + inProgressPct)}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900 leading-none">{totalComplaints}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Total</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Open:</span>
                    <strong className="text-slate-900 font-mono">{openCount} ({openPct}%)</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-600 font-medium">In Progress:</span>
                    <strong className="text-slate-900 font-mono">{inProgressCount} ({inProgressPct}%)</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Resolved:</span>
                    <strong className="text-slate-900 font-mono">{resolvedCount} ({resolvedPct}%)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Requests Trend Multi-Line Chart (7 Cols) */}
            <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1976D2]" />
                  <span>Service Requests Trend</span>
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#1976D2]" />
                      Complaints
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Service Requests
                    </span>
                  </div>
                  <select
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(e.target.value)}
                    className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
                  >
                    <option>Last 7 Days</option>
                    <option>This Month</option>
                    <option>Last Quarter</option>
                  </select>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="h-32 w-full pt-2">
                <svg viewBox="0 0 320 90" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="320" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="320" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="320" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Line 1: Complaints (Blue) */}
                  <polyline
                    fill="none"
                    stroke="#1976D2"
                    strokeWidth="2"
                    points={trendData.cPolyline}
                  />
                  {trendData.complaintsPoints.map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill="#1976D2" />
                  ))}

                  {/* Line 2: Service Requests (Green) */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    points={trendData.sPolyline}
                  />
                  {trendData.servicePoints.map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill="#10b981" />
                  ))}
                </svg>

                {/* X Axis Date Labels */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1 px-1">
                  {last7Days.map((d, i) => (
                    <span key={i}>{d.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RECENT LISTS TABS & TABLE */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveRecentTab('complaints')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeRecentTab === 'complaints'
                      ? 'bg-[#1976D2] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Recent Complaints
                </button>
                <button
                  onClick={() => setActiveRecentTab('amc')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeRecentTab === 'amc'
                      ? 'bg-[#1976D2] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Upcoming AMC
                </button>
                <button
                  onClick={() => setActiveRecentTab('quotations')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeRecentTab === 'quotations'
                      ? 'bg-[#1976D2] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pending Quotations
                </button>
                <button
                  onClick={() => setActiveRecentTab('payments')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeRecentTab === 'payments'
                      ? 'bg-[#1976D2] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Recent Payments
                </button>
              </div>

              <button
                onClick={() => {
                  if (activeRecentTab === 'complaints') onNavigateTab('complaints');
                  else if (activeRecentTab === 'amc') onNavigateTab('amc');
                  else if (activeRecentTab === 'quotations') onNavigateTab('quotations');
                  else onNavigateTab('invoices');
                }}
                className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            <div className="table-scroll-container">
              {activeRecentTab === 'complaints' && (
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 pr-3">Ticket No.</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Building</th>
                      <th className="py-2.5 px-3">Lift No.</th>
                      <th className="py-2.5 px-3">Issue</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenantComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          No complaints recorded yet.
                        </td>
                      </tr>
                    ) : (
                      tenantComplaints.slice(0, 5).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pr-3 font-mono font-bold text-[#1976D2]">{c.ticketNumber || c.id}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{c.clientName || 'Client'}</td>
                          <td className="py-3 px-3 text-slate-600">{c.buildingName || 'Building'}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{c.liftNumber || 'Lift'}</td>
                          <td className="py-3 px-3 text-slate-600 max-w-[160px] truncate">{c.issueType || c.description}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'pending'
                                  ? 'bg-red-100 text-red-700'
                                  : c.status === 'assigned' || c.status === 'technician_on_way' || c.status === 'inspection_repair'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {c.status === 'technician_on_way' ? 'On The Way' : c.status === 'inspection_repair' ? 'In Progress' : c.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right font-mono text-slate-500">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeRecentTab === 'amc' && (
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 pr-3">Contract No.</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Building</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3">Annual Value</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenantAmcContracts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          No AMC contracts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      tenantAmcContracts.slice(0, 5).map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pr-3 font-mono font-bold text-[#1976D2]">{a.contractNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{a.clientName}</td>
                          <td className="py-3 px-3 text-slate-600">{a.buildingName}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{a.amcType}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">₹ {(a.totalAmount || a.contractValue || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                a.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : a.status === 'expiring_soon'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {a.status === 'expiring_soon' ? 'Expiring Soon' : a.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right font-mono text-slate-500">
                            {new Date(a.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeRecentTab === 'quotations' && (
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 pr-3">Quote No.</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Building</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenantQuotations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          No quotations recorded yet.
                        </td>
                      </tr>
                    ) : (
                      tenantQuotations.slice(0, 5).map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pr-3 font-mono font-bold text-[#1976D2]">{q.quotationNumber || q.quoteNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{q.clientName}</td>
                          <td className="py-3 px-3 text-slate-600">{q.buildingName || 'Building'}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{q.subject || 'Lift Service'}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {(q.grandTotal || q.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                q.status === 'approved' || q.status === 'converted_to_work_order'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {q.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right font-mono text-slate-500">
                            {new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeRecentTab === 'payments' && (
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 pr-3">Invoice No.</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Reference / Scope</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenantInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          No invoices or payments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      tenantInvoices.slice(0, 5).map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pr-3 font-mono font-bold text-[#1976D2]">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{inv.clientName}</td>
                          <td className="py-3 px-3 text-slate-600">{inv.type || 'Maintenance Service'}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {(inv.grandTotal || inv.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-right font-mono text-slate-500">
                            {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* BOTTOM 3 MINI CARDS ROW (AMC Status Donut, Inventory Low Stock Table, Payments Overview Donut) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. AMC Status */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1976D2]" />
                  AMC Status
                </span>
                <button
                  onClick={() => onNavigateTab('amc')}
                  className="text-[11px] font-bold text-[#1976D2] hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {activeAmcPct > 0 && (
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${activeAmcPct}, 100`}
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {expiringAmcPct > 0 && (
                      <path
                        className="text-amber-500"
                        strokeDasharray={`${expiringAmcPct}, 100`}
                        strokeDashoffset={-(activeAmcPct)}
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {expiredAmcPct > 0 && (
                      <path
                        className="text-red-500"
                        strokeDasharray={`${expiredAmcPct}, 100`}
                        strokeDashoffset={-(activeAmcPct + expiringAmcPct)}
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-slate-900 leading-none">{totalAmc}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Total</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate">Active</span>
                    <strong className="text-slate-900 font-mono ml-auto">{activeAmcCount} ({activeAmcPct}%)</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-600 truncate">Expiring</span>
                    <strong className="text-slate-900 font-mono ml-auto">{expiringAmcCount} ({expiringAmcPct}%)</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-slate-600 truncate">Expired</span>
                    <strong className="text-slate-900 font-mono ml-auto">{expiredAmcCount} ({expiredAmcPct}%)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Inventory Low Stock Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#1976D2]" />
                  Inventory Stock Level
                </span>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="text-[11px] font-bold text-[#1976D2] hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-50">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Current</th>
                      <th className="py-1 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedInventory.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-2 text-center text-slate-400">
                          No items in inventory.
                        </td>
                      </tr>
                    ) : (
                      sortedInventory.map((item) => {
                        const isLow = item.currentStock <= item.minStockThreshold;
                        const isOut = item.currentStock === 0;
                        return (
                          <tr key={item.id}>
                            <td className="py-1 font-medium text-slate-800 truncate max-w-[100px]">
                              {item.name || item.partNumber}
                            </td>
                            <td className="py-1 text-center font-mono font-bold">{item.currentStock}</td>
                            <td className="py-1 text-right">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isOut
                                    ? 'bg-rose-50 text-rose-600'
                                    : isLow
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Payments Overview */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#1976D2]" />
                  Payments Overview
                </span>
                <button
                  onClick={() => onNavigateTab('invoices')}
                  className="text-[11px] font-bold text-[#1976D2] hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {paidPct > 0 && (
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${paidPct}, 100`}
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {pendingPct > 0 && (
                      <path
                        className="text-amber-500"
                        strokeDasharray={`${pendingPct}, 100`}
                        strokeDashoffset={-(paidPct)}
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                    {overduePct > 0 && (
                      <path
                        className="text-red-500"
                        strokeDasharray={`${overduePct}, 100`}
                        strokeDashoffset={-(paidPct + pendingPct)}
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-900 leading-none">
                      {totalInvoiced >= 100000 ? `₹${(totalInvoiced / 100000).toFixed(1)}L` : `₹${(totalInvoiced / 1000).toFixed(0)}k`}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Total Billed</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate">Paid:</span>
                    <strong className="text-slate-900 font-mono ml-auto">₹{paidTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-600 truncate">Pending:</span>
                    <strong className="text-slate-900 font-mono ml-auto">₹{pendingTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-slate-600 truncate">Overdue:</span>
                    <strong className="text-slate-900 font-mono ml-auto">₹{overdueTotal.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* PERSONALIZED EXECUTIVE WORKSPACE & SCRATCHPAD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs ${masterSlot === 2 ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {adminFirstName}'s Executive Focus
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {masterProfile?.masterId || 'WEP-MASTER'} • Private Scratchpad
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1976D2] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            {/* Note input form */}
            {isAddingNote && (
              <form onSubmit={handleAddNote} className="space-y-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={`Add priority note for ${adminFirstName}...`}
                  autoFocus
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-blue-200 focus:border-[#1976D2] outline-none font-medium"
                />
                <div className="flex items-center justify-end gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-2.5 py-1 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-[#0066FF] hover:bg-blue-600 text-white font-bold cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            )}

            {/* Notes checklist */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {adminNotes.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-2 text-center">No notes currently added.</p>
              ) : (
                adminNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all text-xs ${
                      note.completed
                        ? 'bg-slate-50/70 border-slate-100 text-slate-400'
                        : 'bg-white hover:bg-blue-50/40 border-slate-100 hover:border-blue-100 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleNote(note.id)}
                      className="mt-0.5 text-slate-400 hover:text-[#1976D2] transition-colors shrink-0 cursor-pointer"
                    >
                      {note.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className={`flex-1 leading-snug break-words ${note.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                      {note.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 shrink-0 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer link to Profile & Settings */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono">
                Clearance: <strong className="text-slate-800">Level 5 Supreme Master (MD & CEO)</strong>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="text-[#1976D2] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Edit {adminFirstName}'s Profile</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS: 6 COLORED GRID TILES */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1976D2]" />
              <span>Quick Actions</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Add Client (Blue) */}
              <button
                onClick={() => onNavigateTab('clients')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 text-center transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Add Client</span>
              </button>

              {/* 2. Add Building (Green) */}
              <button
                onClick={() => onNavigateTab('buildings')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-100 text-center transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Building className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Add Building</span>
              </button>

              {/* 3. Add Lift (Purple) */}
              <button
                onClick={() => onNavigateTab('lifts')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100/80 border border-purple-100 text-center transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Add Lift</span>
              </button>

              {/* 4. Log Complaint (Red) */}
              <button
                onClick={() => setIsRaiseModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50/80 hover:bg-red-100/80 border border-red-100 text-center transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Log Complaint</span>
              </button>

              {/* 5. Assign Technician (Orange) */}
              <button
                onClick={() => onNavigateTab('technicians')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-50/80 hover:bg-orange-100/80 border border-orange-100 text-center transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Assign Technician</span>
              </button>

              {/* 6. Create Quotation (Teal) */}
              <button
                onClick={() => onNavigateTab('quotations')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-50/80 hover:bg-teal-100/80 border border-teal-100 text-center transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Create Quotation</span>
              </button>
            </div>
          </div>

          {/* RECENT ACTIVITY CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1976D2]" />
                <span>Recent Activity</span>
              </h3>
              <button
                onClick={() => onNavigateTab('complaints')}
                className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivities.length === 0 ? (
                <div className="py-4 text-center text-slate-400 italic">No recent activity</div>
              ) : (
                recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate pr-1">{act.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{act.time}</span>
                        </div>
                        <span className="text-slate-500 text-[11px] block truncate">
                          {act.subtitle}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency / Raise Modal */}
      <RaiseComplaintModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
      />
    </div>
  );
};
