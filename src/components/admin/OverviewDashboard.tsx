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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTabId } from '../layout/Sidebar';
import elevatorLobbyImg from '../../assets/elevator-lobby.jpg';
import { RaiseComplaintModal } from '../client/RaiseComplaintModal';

interface OverviewDashboardProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
}) => {
  const {
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
  } = useApp();

  const [activeRecentTab, setActiveRecentTab] = useState<'complaints' | 'amc' | 'quotations' | 'payments'>('complaints');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 Days');

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
          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-[#EBF5FB] via-[#E8F4F8] to-[#E3F2FD] border border-blue-100/90 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#1976D2] text-white flex items-center justify-center font-bold shadow-md shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome, Admin!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Here's an overview of your lift service operations.
                </p>
              </div>
            </div>

            {/* Middle/Right: Modern Elevator Lobby Graphic + Date */}
            <div className="flex items-center gap-4 z-10">
              <div className="w-32 sm:w-40 h-20 sm:h-24 rounded-xl overflow-hidden border border-blue-200/80 shadow-md shrink-0 bg-slate-200 hidden sm:block">
                <img
                  src={elevatorLobbyImg}
                  alt="Modern Elevator Lobby"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-right flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-blue-100 shadow-xs">
                <Calendar className="w-4 h-4 text-[#1976D2]" />
                <div className="text-left leading-tight">
                  <span className="text-[10px] text-slate-400 font-medium block">Today</span>
                  <span className="text-xs font-bold text-slate-800 font-mono block">{todayFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 TOP STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Total Clients */}
            <div
              onClick={() => onNavigateTab('clients')}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#1976D2]">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Clients</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalClients}</div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>Active portfolio</span>
              </div>
            </div>

            {/* 2. Total Buildings */}
            <div
              onClick={() => onNavigateTab('buildings')}
              className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Building className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Buildings</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalBuildings}</div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>Registered sites</span>
              </div>
            </div>

            {/* 3. Total Lifts */}
            <div
              onClick={() => onNavigateTab('lifts')}
              className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Lifts</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalLifts}</div>
              <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>Under service</span>
              </div>
            </div>

            {/* 4. Open Complaints */}
            <div
              onClick={() => onNavigateTab('complaints')}
              className="bg-white border border-slate-200/90 hover:border-red-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Open Complaints</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{openComplaintsCount}</div>
              <div className="text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-0.5">
                <span>Active tickets</span>
              </div>
            </div>

            {/* 5. AMC Expiring */}
            <div
              onClick={() => onNavigateTab('amc')}
              className="bg-white border border-slate-200/90 hover:border-teal-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">AMC Expiring</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{amcExpiringCount}</div>
              <div className="text-[10px] font-semibold text-teal-600 mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>Next 30 Days</span>
              </div>
            </div>
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

            <div className="overflow-x-auto">
              {activeRecentTab === 'complaints' && (
                <table className="w-full text-left text-xs">
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
                <table className="w-full text-left text-xs">
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
                <table className="w-full text-left text-xs">
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
                <table className="w-full text-left text-xs">
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
                                  ? 'bg-red-100 text-red-800'
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
