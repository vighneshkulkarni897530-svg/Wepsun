import React from 'react';
import {
  LayoutDashboard,
  Bell,
  Building2,
  GitBranch,
  Building,
  Users,
  Layers,
  AlertCircle,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  FileCheck2,
  FileSpreadsheet,
  ClipboardList,
  Receipt,
  Package,
  HardHat,
  BarChart3,
  TrendingUp,
  Settings,
  Palette,
  Workflow,
  Star,
  X,
  Zap,
  History,
  CreditCard,
  FileCheck,
  QrCode,
  CheckCircle2,
  Camera,
  FileText,
  LogOut,
  User,
} from 'lucide-react';
import { WepsunLogo } from '../common/WepsunLogo';
import { useApp } from '../../context/AppContext';

export type NavTabId =
  // Admin Tabs
  | 'dashboard'
  | 'clients'
  | 'buildings'
  | 'lifts'
  | 'complaints'
  | 'technicians'
  | 'amc'
  | 'quotations'
  | 'inventory'
  | 'invoices'
  | 'reports'
  | 'analytics'
  | 'service_jobs'
  | 'pm'
  | 'work_orders'
  | 'feedback'
  | 'companies'
  | 'branches'
  | 'notifications'
  | 'flowchart'
  | 'design_system'
  | 'settings'
  | 'edit_profile'
  // Client Tabs
  | 'home'
  | 'history'
  | 'payments'
  | 'profile'
  | 'parts'
  // Technician Tabs
  | 'jobs'
  | 'client_lift'
  | 'service_history'
  | 'checkin_checkout'
  | 'diagnosis'
  | 'photos'
  | 'signature_otp'
  | 'service_report'
  | 'pm_checklist'
  | 'breakdown'
  | 'signature'
  | 'report';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenLoginModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  onOpenLoginModal,
}) => {
  const {
    currentUser,
    currentRole,
    logout,
    showLogoutModal,
    clientScopedNotifications,
    clientScopedComplaints,
    clientScopedQuotations,
    clientScopedInvoices,
    unreadNotificationsCount: globalUnreadCount,
  } = useApp();

  const unreadNotificationsCount = globalUnreadCount !== undefined
    ? globalUnreadCount
    : (clientScopedNotifications ? clientScopedNotifications.filter(n => !n.isRead).length : 0);
  const openComplaintsCount = clientScopedComplaints ? clientScopedComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length : 0;
  const pendingQuotesCount = clientScopedQuotations ? clientScopedQuotations.filter(q => q.status === 'pending').length : 0;
  const pendingInvoicesCount = clientScopedInvoices ? clientScopedInvoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length : 0;

  // Role-specific menu configurations strictly matching recommended structure
  const adminMenuItems: { id: NavTabId; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-[18px] h-[18px]" />, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined },
    { id: 'clients', label: 'Clients', icon: <Users className="w-[18px] h-[18px]" /> },
    { id: 'buildings', label: 'Buildings', icon: <Building className="w-[18px] h-[18px]" /> },
    { id: 'lifts', label: 'Lifts', icon: <Layers className="w-[18px] h-[18px]" /> },
    { id: 'complaints', label: 'Complaints', icon: <AlertCircle className="w-[18px] h-[18px]" /> },
    { id: 'technicians', label: 'Technicians', icon: <Wrench className="w-[18px] h-[18px]" /> },
    { id: 'amc', label: 'AMC', icon: <FileCheck2 className="w-[18px] h-[18px]" /> },
    { id: 'quotations', label: 'Quotations', icon: <FileSpreadsheet className="w-[18px] h-[18px]" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-[18px] h-[18px]" /> },
    { id: 'invoices', label: 'Payments', icon: <CreditCard className="w-[18px] h-[18px]" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-[18px] h-[18px]" /> },
  ];

  const technicianMenuItems: { id: NavTabId; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'jobs', label: 'Jobs', icon: <ClipboardList className="w-[18px] h-[18px]" /> },
    { id: 'client_lift', label: 'Lift Profile', icon: <Layers className="w-[18px] h-[18px]" /> },
    { id: 'pm_checklist', label: 'PM Checklist', icon: <CheckCircle2 className="w-[18px] h-[18px]" /> },
    { id: 'breakdown', label: 'Breakdown', icon: <AlertTriangle className="w-[18px] h-[18px]" /> },
    { id: 'parts', label: 'Parts', icon: <Wrench className="w-[18px] h-[18px]" /> },
    { id: 'photos', label: 'Photos', icon: <Camera className="w-[18px] h-[18px]" /> },
    { id: 'report', label: 'Report', icon: <FileText className="w-[18px] h-[18px]" /> },
    { id: 'signature', label: 'Client Signature', icon: <FileCheck className="w-[18px] h-[18px]" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-[18px] h-[18px]" />, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined },
    { id: 'profile', label: 'Profile & Sync', icon: <User className="w-[18px] h-[18px]" /> },
  ];

  const clientMenuItems: { id: NavTabId; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'home', label: 'Home', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'lifts', label: 'My Lifts', icon: <Layers className="w-[18px] h-[18px]" /> },
    { id: 'complaints', label: 'Complaints', icon: <AlertTriangle className="w-[18px] h-[18px]" />, badge: openComplaintsCount > 0 ? openComplaintsCount : undefined },
    { id: 'history', label: 'Service History', icon: <Wrench className="w-[18px] h-[18px]" /> },
    { id: 'amc', label: 'AMC', icon: <FileCheck2 className="w-[18px] h-[18px]" /> },
    { id: 'quotations', label: 'Quotations', icon: <FileSpreadsheet className="w-[18px] h-[18px]" />, badge: pendingQuotesCount > 0 ? pendingQuotesCount : undefined },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-[18px] h-[18px]" />, badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-[18px] h-[18px]" /> },
  ];

  const isClient = currentRole === 'client';
  const isTechnician = currentRole === 'technician';
  const isAdmin = !isClient && !isTechnician;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 lg:z-30 w-[240px] bg-[#0E2238] border-r border-[#0A1828] flex flex-col transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {/* CLIENT MENU (Image 1: Home, My Lifts, Complaints, Service History, AMC, Quotations, Payments, Reports) */}
          {isClient && (
            <div className="space-y-1">
              {clientMenuItems.map((item) => {
                const isActive = activeTab === item.id || (item.id === 'home' && (!activeTab || activeTab === 'dashboard'));
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      window.location.hash = item.id;
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1976D2] text-white font-bold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-300'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TECHNICIAN MENU (Image 2: Dashboard, Jobs, Lift Profile, PM Checklist, Breakdown, Parts, Photos, Report, Client Signature) */}
          {isTechnician && (
            <div className="space-y-1">
              {technicianMenuItems.map((item) => {
                const isActive = activeTab === item.id || (item.id === 'dashboard' && !activeTab);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      window.location.hash = item.id;
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1976D2] text-white font-bold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-300'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ADMIN MENU (Image 3: Dashboard, Clients, Buildings, Lifts, Complaints, Technicians, AMC, Quotations, Inventory, Payments, Reports, Analytics) */}
          {isAdmin && (
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      window.location.hash = item.id;
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1976D2] text-white font-bold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-300'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#D32F2F] text-white text-[10px] font-bold shadow-sm shadow-red-500/40">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Settings & Logout Actions (matching Image 2 & 3) */}
        <div className="p-3 border-t border-[#0A1828] bg-[#0A192A] shrink-0 space-y-1">
          <button
            onClick={() => {
              const targetTab: NavTabId = isClient ? 'profile' : isTechnician ? 'profile' : 'settings';
              onSelectTab(targetTab);
              window.location.hash = targetTab;
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>{isClient ? 'My Profile' : isTechnician ? 'My Profile' : 'Settings & Profile'}</span>
          </button>
          <button
            onClick={() => {
              showLogoutModal(() => {
                logout();
                onCloseMobile();
              });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

