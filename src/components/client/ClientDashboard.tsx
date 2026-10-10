import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  AlertTriangle,
  History,
  ShieldCheck,
  Receipt,
  PhoneCall,
  CheckCircle2,
  Clock,
  ChevronRight,
  User,
  Bell,
  Building,
  QrCode,
  Calendar,
  FileCheck,
  Plus,
  Search,
  FileSpreadsheet,
  Star,
  CreditCard,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Wrench,
  ShieldAlert,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lift, Complaint, ServiceReport } from '../../types';
import { RaiseComplaintModal } from './RaiseComplaintModal';
import { ClientLiftsView } from './ClientLiftsView';
import { ClientComplaintsView } from './ClientComplaintsView';
import { ClientAmcView } from './ClientAmcView';
import { ClientAmcRenewalModal } from './ClientAmcRenewalModal';
import { ClientPaymentsView } from './ClientPaymentsView';
import { ClientPmView } from './ClientPmView';
import { ClientServiceHistoryView } from './ClientServiceHistoryView';
import { ClientPartsReplacementView } from './ClientPartsReplacementView';
import { ClientReportsView } from './ClientReportsView';
import { ClientNotificationsView } from './ClientNotificationsView';
import { ClientProfileView } from './ClientProfileView';
import elevatorLobbyImg from '../../assets/elevator-lobby.jpg';
import { ClientFeedbackModal } from './ClientFeedbackModal';
import { QuotationApprovalView } from './QuotationApprovalView';
import { BusinessEnquiryModal } from './BusinessEnquiryModal';
import { ServiceReportModal } from '../common/ServiceReportModal';

export type ClientDashboardTab =
  | 'home'
  | 'lifts'
  | 'complaints'
  | 'history'
  | 'parts'
  | 'amc'
  | 'quotations'
  | 'payments'
  | 'reports'
  | 'pm'
  | 'notifications'
  | 'profile';

export const normalizeClientTab = (tabStr?: string): ClientDashboardTab => {
  if (!tabStr) return 'home';
  const t = tabStr.toLowerCase().replace('#', '').split('?')[0];
  if (t === 'client-lifts' || t === 'my-lifts' || t === 'lifts' || t === 'fleet') return 'lifts';
  if (t === 'client-complaints' || t === 'complaints' || t === 'complaint-tracking' || t === 'complaint' || t === 'breakdowns') return 'complaints';
  if (t === 'client-history' || t === 'service-history' || t === 'history' || t === 'service_history') return 'history';
  if (t === 'client-parts' || t === 'parts' || t === 'parts-replacement' || t === 'parts-history') return 'parts';
  if (t === 'client-amc' || t === 'amc-management' || t === 'amc') return 'amc';
  if (t === 'client-quotations' || t === 'quotation-approval' || t === 'quotations' || t === 'quotes') return 'quotations';
  if (t === 'client-payments' || t === 'invoices' || t === 'payments' || t === 'pay' || t === 'billing') return 'payments';
  if (t === 'client-reports' || t === 'reports' || t === 'compliance' || t === 'analytics') return 'reports';
  if (t === 'client-pm' || t === 'preventive-maintenance' || t === 'pm') return 'pm';
  if (t === 'notifications' || t === 'client-notifications' || t === 'alerts') return 'notifications';
  if (t === 'profile' || t === 'my-profile' || t === 'client-profile' || t === 'settings' || t === 'edit-profile' || t === 'profile-edit' || t === 'edit_profile') return 'profile';
  if (t === 'home' || t === 'dashboard' || t === 'overview' || t === 'client') return 'home';
  return 'home';
};

export interface ClientDashboardProps {
  activeTab?: ClientDashboardTab | string;
  onNavigateTab?: (tab: ClientDashboardTab) => void;
  onOpenEmergencyModal?: () => void;
  onOpenRaiseModal?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  activeTab: propActiveTab,
  onNavigateTab,
  onOpenEmergencyModal: propOpenEmergencyModal,
  onOpenRaiseModal: propOpenRaiseModal,
}) => {
  const {
    clientScopedLifts,
    clientScopedComplaints,
    clientScopedAmcContracts,
    clientScopedInvoices,
    clientScopedQuotations,
    clientScopedReports,
    clientScopedBuildings,
    clientScopedNotifications,
    verifyClientAccess,
    currentUser,
    activeClientId,
    showToast,
  } = useApp();

  const [internalActiveTab, setInternalActiveTab] = useState<ClientDashboardTab>(() => {
    const rawHash = typeof window !== 'undefined' ? window.location.hash.toLowerCase().replace('#', '').split('?')[0] : '';
    if (rawHash) return normalizeClientTab(rawHash);
    if (propActiveTab) return normalizeClientTab(propActiveTab);
    return 'home';
  });

  const activeTab: ClientDashboardTab = propActiveTab ? normalizeClientTab(propActiveTab) : internalActiveTab;

  const setActiveTab = (tab: ClientDashboardTab) => {
    setInternalActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Sync tab with URL Hash
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.toLowerCase().replace('#', '');
      const hash = rawHash.split('?')[0];
      if (hash === 'feedback' || hash === 'rate-service') {
        setIsFeedbackModalOpen(true);
      } else if (hash === 'amc-renewal') {
        setIsRenewalModalOpen(true);
      } else if (hash === 'new-lift-quote' || hash === 'enquiry' || hash === 'new-quotation') {
        setIsEnquiryModalOpen(true);
      } else if (hash === 'raise-complaint') {
        if (propOpenRaiseModal) propOpenRaiseModal();
        else setIsRaiseModalOpen(true);
      } else if (hash === 'emergency' || hash === 'emergency-breakdown') {
        if (propOpenEmergencyModal) propOpenEmergencyModal();
        else setIsEmergencyModalOpen(true);
      } else if (hash) {
        setInternalActiveTab(normalizeClientTab(hash));
      }
    };

    // Check if user came from quote flow
    if (typeof window !== 'undefined') {
      const openQuote = sessionStorage.getItem('wepsun_open_quote_after_login');
      if (openQuote === 'true') {
        setIsEnquiryModalOpen(true);
      }
    }

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Strict Client-Scoped Datasets
  const clientLifts = clientScopedLifts;
  const clientComplaints = clientScopedComplaints;
  const clientAmcs = clientScopedAmcContracts;
  const clientInvoices = clientScopedInvoices;
  const clientQuotations = clientScopedQuotations;
  const clientReports = clientScopedReports;
  const clientNotifications = clientScopedNotifications;

  const handleOpenServiceReport = (report: any) => {
    if (!verifyClientAccess(report.clientId)) {
      showToast('error', 'Access Denied', 'You are not authorized to view this information.');
      setAccessDeniedMessage(`Access Denied – You are not authorized to view report ${report.reportNumber}.`);
      setTimeout(() => setAccessDeniedMessage(null), 4000);
      return;
    }
    setSelectedReport(report);
  };

  const switchTab = (tab: ClientDashboardTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Metrics Calculations
  const totalLifts = clientLifts.length;
  const operationalLifts = clientLifts.filter((l) => l.currentStatus === 'operational').length;
  const maintenanceLifts = clientLifts.filter((l) => l.currentStatus !== 'operational').length;

  const activeAmcs = clientAmcs.filter((a) => a.status === 'active' || a.status === 'expiring_soon');
  const openComplaints = clientComplaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed');
  const resolvedComplaintsCount = clientComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const pendingQuotations = clientQuotations.filter((q) => q.status === 'pending');
  const pendingQuotesTotal = pendingQuotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  const pendingInvoices = clientInvoices.filter((i) => i.status === 'unpaid' || i.status === 'partial');
  const pendingInvoicesTotal = pendingInvoices.reduce((sum, i) => sum + (i.balanceDue || i.totalAmount || 0), 0);

  const upcomingPmLift = clientLifts.find((l) => l.nextPmDate) || clientLifts[0];
  const nextUpcomingService = upcomingPmLift?.nextPmDate
    ? new Date(upcomingPmLift.nextPmDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (clientLifts.length > 0 ? 'Scheduled Soon' : 'No Scheduled Service');
  const nextUpcomingServiceLiftName = upcomingPmLift?.liftNumber || (clientLifts.length > 0 ? clientLifts[0].liftNumber : 'No Equipment');

  const activeAmc = clientAmcs.find((a) => a.status === 'active' || a.status === 'expiring_soon') || clientAmcs[0];
  const amcExpiryFormatted = activeAmc?.endDate
    ? new Date(activeAmc.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (activeAmcs.length > 0 ? 'Active' : 'No Active AMC');
  const amcsExpiringSoonCount = clientAmcs.filter(
    (a) => a.status === 'expiring_soon' || (a.endDate && new Date(a.endDate).getTime() - Date.now() < 60 * 86400000 && new Date(a.endDate).getTime() > Date.now())
  ).length;

  const unreadAlerts = clientNotifications.filter((n) => !n.isRead).length;

  // Real Dynamic Chronological Activity List
  const recentActivities = useMemo(() => {
    interface ActivityItem {
      id: string;
      dateTime: string;
      type: string;
      iconType: 'wrench' | 'complaint' | 'quotation' | 'payment' | 'amc';
      details: string;
      status: string;
      statusColor: string;
      rawDate: Date;
    }

    const items: ActivityItem[] = [];

    // 1. Complaints
    clientComplaints.forEach((c) => {
      const date = new Date(c.reportedAt || (c.timeline && c.timeline[0]?.timestamp) || Date.now());
      items.push({
        id: `act-cmp-${c.id}`,
        dateTime: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: c.status === 'resolved' || c.status === 'closed' ? 'Complaint Resolved' : 'Complaint Raised',
        iconType: 'complaint',
        details: `${c.liftNumber || 'Lift'} - ${c.title || c.issueType.replace('_', ' ')}`,
        status: c.status === 'resolved' || c.status === 'closed' ? 'Resolved' : c.status === 'pending' ? 'Open' : 'In Progress',
        statusColor: c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-100 text-emerald-800' : c.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800',
        rawDate: date,
      });
    });

    // 2. Service Reports
    clientReports.forEach((r) => {
      const date = new Date(r.serviceDate || r.createdAt || Date.now());
      items.push({
        id: `act-rep-${r.id}`,
        dateTime: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Service Completed',
        iconType: 'wrench',
        details: `${r.liftNumber || 'Lift'} - ${r.serviceType || 'Routine Maintenance'}`,
        status: 'Completed',
        statusColor: 'bg-emerald-100 text-emerald-800',
        rawDate: date,
      });
    });

    // 3. Quotations
    clientQuotations.forEach((q) => {
      const date = new Date(q.createdAt || q.validUntil || Date.now());
      items.push({
        id: `act-quote-${q.id}`,
        dateTime: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: q.status === 'approved' ? 'Quotation Approved' : 'Quotation Received',
        iconType: 'quotation',
        details: `${q.quotationNumber} - ₹ ${q.totalAmount.toLocaleString('en-IN')}`,
        status: q.status === 'approved' ? 'Approved' : q.status === 'rejected' ? 'Rejected' : 'Pending',
        statusColor: q.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : q.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800',
        rawDate: date,
      });
    });

    // 4. Invoices / Payments
    clientInvoices.forEach((inv) => {
      const date = new Date(inv.dueDate || inv.invoiceDate || Date.now());
      items.push({
        id: `act-inv-${inv.id}`,
        dateTime: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: inv.status === 'paid' ? 'Payment Completed' : 'Invoice Generated',
        iconType: 'payment',
        details: `${inv.invoiceNumber} - ₹ ${inv.totalAmount.toLocaleString('en-IN')}`,
        status: inv.status === 'paid' ? 'Paid' : inv.status === 'partial' ? 'Partial' : 'Due',
        statusColor: inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        rawDate: date,
      });
    });

    // 5. AMC Updates
    clientAmcs.forEach((amc) => {
      const date = new Date(amc.startDate || Date.now());
      items.push({
        id: `act-amc-${amc.id}`,
        dateTime: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: 'AMC Contract Active',
        iconType: 'amc',
        details: `${amc.contractNumber} (${(amc.amcType || (amc as any).contractType || 'AMC').toUpperCase()})`,
        status: amc.status === 'active' ? 'Active' : amc.status === 'expiring_soon' ? 'Expiring' : 'Expired',
        statusColor: amc.status === 'active' ? 'bg-blue-100 text-blue-800' : amc.status === 'expiring_soon' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700',
        rawDate: date,
      });
    });

    return items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 6);
  }, [clientComplaints, clientReports, clientQuotations, clientInvoices, clientAmcs]);

  return (
    <div className="w-full space-y-6">
      {/* Access Denied Warning Toast/Banner */}
      {accessDeniedMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{accessDeniedMessage}</span>
        </div>
      )}

      {/* SUB-VIEWS: RENDERED IF activeTab IS NOT 'home' */}
      {activeTab !== 'home' ? (
        <div className="space-y-6">
          {/* Sub-View Navigation Header */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => switchTab('home')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                ← Back to Overview
              </button>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                <span>
                  {activeTab === 'lifts'
                    ? 'My Lifts & Equipment Fleet'
                    : activeTab === 'complaints'
                    ? 'Service Complaints & Request Tracking'
                    : activeTab === 'history'
                    ? 'Service & Breakdown History'
                    : activeTab === 'parts'
                    ? 'Parts Replacement Ledger'
                    : activeTab === 'amc'
                    ? 'AMC Contracts & Annual Maintenance'
                    : activeTab === 'quotations'
                    ? 'Quotations & Proposals'
                    : activeTab === 'payments'
                    ? 'Invoices & Payments'
                    : activeTab === 'reports'
                    ? 'Compliance & Service Reports'
                    : activeTab === 'pm'
                    ? 'Preventive Maintenance & Inspection'
                    : activeTab === 'notifications'
                    ? 'Notification Center'
                    : 'Client Profile & Settings'}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency SOS</span>
              </button>
              <button
                onClick={() => setIsRaiseModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white text-xs font-bold shadow-sm hidden sm:flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Raise Ticket</span>
              </button>
            </div>
          </div>

          {/* 1. Lifts Fleet View */}
          {activeTab === 'lifts' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientLiftsView
                lifts={clientLifts}
                onRaiseComplaint={(liftId) => setIsRaiseModalOpen(true)}
              />
            </div>
          )}

          {/* 2. Complaints Tracking View */}
          {activeTab === 'complaints' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientComplaintsView
                complaints={clientComplaints}
                onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
                onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
              />
            </div>
          )}

          {/* 3. Service History View */}
          {activeTab === 'history' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientServiceHistoryView />
            </div>
          )}

          {/* 4. Parts Replacement History View */}
          {activeTab === 'parts' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientPartsReplacementView />
            </div>
          )}

          {/* 5. AMC Management View */}
          {activeTab === 'amc' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientAmcView
                contracts={clientAmcs}
                lifts={clientLifts}
                onOpenRenewalModal={() => setIsRenewalModalOpen(true)}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
              />
            </div>
          )}

          {/* 6. Quotation Approval View */}
          {activeTab === 'quotations' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <QuotationApprovalView quotations={clientQuotations} />
            </div>
          )}

          {/* 7. Payments & Invoices View */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <ClientPaymentsView invoices={clientInvoices} />
            </div>
          )}

          {/* 8. Reports & Safety Hub View */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientReportsView />
            </div>
          )}

          {/* 9. Preventive Maintenance View */}
          {activeTab === 'pm' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientPmView />
            </div>
          )}

          {/* 10. Notifications View */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientNotificationsView />
            </div>
          )}

          {/* 11. Profile View */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <ClientProfileView />
            </div>
          )}
        </div>
      ) : (
        /* HOME OVERVIEW VIEW WITH 6 SUMMARY CARDS (MATCHING REFERENCE DESIGN) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT MAIN CONTENT AREA (8 Columns on Large Screens) */}
          <div className="lg:col-span-8 space-y-5">
            {/* HERO WELCOME BANNER */}
            <div className="bg-gradient-to-r from-[#EBF5FB] via-[#E8F4F8] to-[#E3F2FD] border border-blue-100/90 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              <div className="space-y-1.5 max-w-md z-10">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {currentUser?.name || 'Priya Sharma'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Here&apos;s an overview of your lift services and activities.
                </p>
              </div>

              {/* Elevator Lobby Graphic Banner */}
              <div className="flex items-center gap-4 z-10 shrink-0">
                <div className="w-32 sm:w-44 h-20 sm:h-24 rounded-2xl overflow-hidden border border-blue-200/80 shadow-md shrink-0 bg-slate-200">
                  <img
                    src={elevatorLobbyImg}
                    alt="Modern Elevator Lobby"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-sm font-black italic tracking-wide text-slate-800">
                    Safe Lifts
                  </div>
                  <div className="text-sm font-black italic tracking-wide text-[#1976D2]">
                    Smooth
                  </div>
                  <div className="text-sm font-black italic tracking-wide text-slate-800">
                    Journeys
                  </div>
                  <div className="w-10 h-0.5 bg-[#1976D2] ml-auto mt-1 rounded-full" />
                </div>
              </div>
            </div>

            {/* TOP 4 PRIMARY METRIC STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. My Lifts Card */}
              <div
                onClick={() => switchTab('lifts')}
                className="bg-[#F0F7FF] border border-blue-100 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[#1976D2]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">My Lifts</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {totalLifts}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium">
                    <span className="font-bold text-slate-900">{operationalLifts}</span> Active
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    <span className="font-semibold text-slate-800">{maintenanceLifts}</span> Under Maintenance
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform text-sm">
                    →
                  </span>
                </div>
              </div>

              {/* 2. Open Complaints Card */}
              <div
                onClick={() => switchTab('complaints')}
                className="bg-[#FFF5F5] border border-red-100 hover:border-red-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Open Complaints</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {openComplaints.length}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium">
                    <span className="font-bold text-slate-900">
                      {openComplaints.filter((c) => c.status === 'pending' || c.status === 'assigned').length}
                    </span>{' '}
                    New
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    <span className="font-semibold text-slate-800">
                      {openComplaints.filter((c) => c.status === 'technician_on_way' || c.status === 'inspection_repair').length}
                    </span>{' '}
                    In Progress
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    <span className="font-semibold text-slate-600">{resolvedComplaintsCount}</span> Resolved
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-red-500 font-bold group-hover:translate-x-1 transition-transform text-sm">
                    →
                  </span>
                </div>
              </div>

              {/* 3. Upcoming Service Card */}
              <div
                onClick={() => switchTab('pm')}
                className="bg-[#F0FFF4] border border-emerald-100 hover:border-emerald-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Upcoming Service</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-2 font-mono">
                    {nextUpcomingService}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium leading-tight truncate" title={nextUpcomingServiceLiftName}>
                    {nextUpcomingServiceLiftName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {upcomingPmLift ? '(Preventive Maintenance)' : '(No Pending PM)'}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform text-sm">
                    →
                  </span>
                </div>
              </div>

              {/* 4. AMC Status Card */}
              <div
                onClick={() => switchTab('amc')}
                className="bg-[#FAF5FF] border border-purple-100 hover:border-purple-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">AMC Status</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-2 font-mono">
                    {activeAmcs.length} Active
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium">
                    Expires on
                  </div>
                  <div className="text-[11px] text-slate-800 font-semibold font-mono truncate" title={amcExpiryFormatted}>
                    {amcExpiryFormatted}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-purple-600 font-bold group-hover:translate-x-1 transition-transform text-sm">
                    →
                  </span>
                </div>
              </div>
            </div>

            {/* 2 SECONDARY SUMMARY CARDS: PENDING QUOTATIONS & PENDING PAYMENTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 5. Pending Quotations Card */}
              <div
                onClick={() => switchTab('quotations')}
                className="bg-[#FFFDF0] border border-amber-200/90 hover:border-amber-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Pending Quotations</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {pendingQuotations.length}
                      </span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        ₹ {pendingQuotesTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
                      {pendingQuotations.length > 0 ? 'Awaiting your approval' : 'All proposals reviewed'}
                    </span>
                  </div>
                </div>
                <span className="text-amber-600 font-bold group-hover:translate-x-1 transition-transform text-base mr-1">
                  →
                </span>
              </div>

              {/* 6. Pending Payments Card */}
              <div
                onClick={() => switchTab('payments')}
                className="bg-[#F0FDF4] border border-teal-200/90 hover:border-teal-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Pending Payments</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                      ₹ {pendingInvoicesTotal.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                      <span>{pendingInvoices.length} Invoices</span>
                      <span>•</span>
                      <span className={pendingInvoices.length > 0 ? 'text-teal-700 font-semibold' : 'text-slate-500'}>
                        {pendingInvoices.length > 0 ? 'Due soon' : 'All clear'}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-teal-600 font-bold group-hover:translate-x-1 transition-transform text-base mr-1">
                  →
                </span>
              </div>
            </div>

            {/* RECENT ACTIVITY TABLE */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#1976D2]" />
                  <span>Recent Activity</span>
                </h3>
                <button
                  onClick={() => switchTab('history')}
                  className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <span>→</span>
                </button>
              </div>

              {recentActivities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                        <th className="py-2.5 pr-4">Date & Time</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 pl-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                      {recentActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pr-4 font-mono text-slate-500 whitespace-nowrap">{act.dateTime}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                            {act.iconType === 'wrench' && <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            {act.iconType === 'complaint' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                            {act.iconType === 'quotation' && <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {act.iconType === 'payment' && <CreditCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                            {act.iconType === 'amc' && <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                            <span>{act.type}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[220px]" title={act.details}>{act.details}</td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${act.statusColor}`}>
                              {act.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No activity recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your service tickets, reports, and payments will appear here in real-time.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN (4 Columns on Large Screens) */}
          <div className="lg:col-span-4 space-y-5">
            {/* QUICK ACTIONS CARD */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>

              <div className="space-y-2.5">
                {/* 1. + Raise Complaint (Solid Blue) */}
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Raise Complaint</span>
                </button>

                {/* 2. Schedule/View Service (Solid Green) */}
                <button
                  onClick={() => switchTab('pm')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule/View Service</span>
                </button>

                {/* 3. View AMC (Solid Purple) */}
                <button
                  onClick={() => switchTab('amc')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#673AB7] hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View AMC</span>
                </button>

                {/* 4. View Quotations (Solid Orange) */}
                <button
                  onClick={() => switchTab('quotations')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F57C00] hover:bg-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>View Quotations</span>
                </button>

                {/* 5. Make Payment (Solid Teal) */}
                <button
                  onClick={() => switchTab('payments')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00838F] hover:bg-cyan-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Make Payment</span>
                </button>
              </div>
            </div>

            {/* UPCOMING SERVICE WIDGET */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Upcoming Service</h3>
                <button
                  onClick={() => switchTab('pm')}
                  className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <span>→</span>
                </button>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1574958269340-fa927304f208?w=200&auto=format&fit=crop&q=80"
                    alt="Lift Equipment"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-900 text-sm block truncate" title={nextUpcomingServiceLiftName}>
                    {nextUpcomingServiceLiftName}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {upcomingPmLift ? 'Routine PM Inspection' : 'No Active Equipment'}
                  </span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-mono font-semibold text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {nextUpcomingService}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${upcomingPmLift ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {upcomingPmLift ? 'Scheduled' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK SUMMARY CARD */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
              <h3 className="font-bold text-sm text-slate-900">Quick Summary</h3>

              <div className="space-y-2.5 text-xs">
                {/* Row 1: Total Quotations Pending */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Total Quotations Pending</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {pendingQuotations.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Total Amount Due */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Total Amount Due</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        ₹ {pendingInvoicesTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: AMC Expiring Soon */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">AMC Expiring Soon</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {amcsExpiringSoonCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <RaiseComplaintModal
        isOpen={isRaiseModalOpen || isEmergencyModalOpen}
        initialMode={isEmergencyModalOpen ? 'emergency' : 'normal'}
        onClose={() => {
          setIsRaiseModalOpen(false);
          setIsEmergencyModalOpen(false);
        }}
      />



      <ClientAmcRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
      />

      <ClientFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      <BusinessEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
      />

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
