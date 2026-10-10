import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavTabId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { OverviewDashboard } from './components/admin/OverviewDashboard';
import { ComplaintManager } from './components/admin/ComplaintManager';
import { AmcManager } from './components/admin/AmcManager';
import { LiftDirectory } from './components/admin/LiftDirectory';
import { QuotationManager } from './components/admin/QuotationManager';
import { WorkOrderManager } from './components/admin/WorkOrderManager';
import { InventoryManager } from './components/admin/InventoryManager';
import { TechnicianPerformance } from './components/admin/TechnicianPerformance';
import { LiveTechnicianRadar } from './components/admin/LiveTechnicianRadar';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { DesignSystemShowcase } from './components/admin/DesignSystemShowcase';
import { SystemFlowchartViewer } from './components/admin/SystemFlowchartViewer';
import { AdminClientsView } from './components/admin/AdminClientsView';
import { AdminBuildingsView } from './components/admin/AdminBuildingsView';
import { AdminReportsView } from './components/admin/AdminReportsView';
import { AdminNotificationsView } from './components/admin/AdminNotificationsView';
import { AdminProfileSettingsView } from './components/admin/AdminProfileSettingsView';
import { CustomerFeedbackManager } from './components/admin/CustomerFeedbackManager';
import { ClientDashboard } from './components/client/ClientDashboard';
import { TechnicianDashboard } from './components/technician/TechnicianDashboard';
import { RaiseComplaintModal } from './components/client/RaiseComplaintModal';
import { LoginModal } from './components/common/LoginModal';
import { LoginPage } from './components/common/LoginPage';
import { LandingPage } from './components/common/LandingPage';
import { PublicFeedbackPage } from './components/common/PublicFeedbackPage';
import { WepsunSplashAnimation } from './components/common/WepsunSplashAnimation';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { WepsunLogo, WepsunLogoIcon, GeometricBlueWLogo } from './components/common/WepsunLogo';
import { Lift } from './types';
import { PhoneCall } from 'lucide-react';
import { AppInstallBanner } from './components/common/AppInstallBanner';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { isMasterAdminAuthenticated } from './lib/masterAuthClient';
import { WepsunModalContainer } from './components/common/WepsunModalContainer';
import { EditProfilePage } from './components/common/EditProfilePage';
import { AuthGuard } from './components/common/AuthGuard';

const PUBLIC_HASHES = [
  'login',
  'signin',
  'signup',
  'register',
  'login-technician',
  'login-client',
  'login-admin',
  'forgot-password',
  'reset-password',
  'landing',
  'splash',
  'animation',
  'logo-reveal',
  'feedback-form',
  'rate-service',
  'customer-review',
  'public-feedback',
  'rate',
];

const CLIENT_ALLOWED_TABS = [
  'home',
  'lifts',
  'client-lifts',
  'my-lifts',
  'complaints',
  'client-complaints',
  'complaint-tracking',
  'complaint',
  'history',
  'client-history',
  'service-history',
  'amc',
  'client-amc',
  'amc-management',
  'quotations',
  'client-quotations',
  'quotation-approval',
  'payments',
  'invoices',
  'client-payments',
  'reports',
  'client-reports',
  'profile',
  'my-profile',
  'client-profile',
  'parts',
  'client-parts',
  'parts-replacement',
  'pm',
  'preventive-maintenance',
  'client-pm',
  'notifications',
  'client-notifications',
  'alerts',
  'settings',
  'edit-profile',
  'profile-edit',
  'emergency',
  'raise-complaint',
  'feedback',
];

const TECH_ALLOWED_TABS = [
  'dashboard',
  'jobs',
  'client_lift',
  'service_history',
  'checkin_checkout',
  'diagnosis',
  'parts',
  'photos',
  'signature_otp',
  'service_report',
  'report',
  'signature',
  'breakdown',
  'notifications',
  'profile',
  'pm_checklist',
  'settings',
  'edit-profile',
  'profile-edit',
];

const ADMIN_EXCLUSIVE_TABS = [
  'flowchart',
  'companies',
  'branches',
  'buildings',
  'clients',
  'technicians',
  'inventory',
  'analytics',
  'service_jobs',
  'work_orders',
  'design_system',
  'admin',
  'admin-dashboard',
];

const ADMIN_PROTECTED_TABS = [
  'dashboard',
  'flowchart',
  'complaints',
  'service_jobs',
  'work_orders',
  'pm',
  'amc',
  'lifts',
  'quotations',
  'inventory',
  'technicians',
  'feedback',
  'companies',
  'branches',
  'buildings',
  'clients',
  'invoices',
  'reports',
  'analytics',
  'notifications',
  'settings',
  'design_system',
];

export const AppContent: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    activeCompany,
    branches,
    buildings,
    users,
    tenantInvoices,
    lifts,
    showToast,
    isAuthenticated,
    isAuthLoading,
  } = useApp();

  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => {
    if (typeof window !== 'undefined') {
      const rawHash = window.location.hash.toLowerCase().replace('#', '');
      return rawHash.split('?')[0];
    }
    return '';
  });

  const [isFullLoginPage, setIsFullLoginPage] = useState(() => {
    if (typeof window === 'undefined') return true;
    const rawHash = window.location.hash.toLowerCase().replace('#', '');
    const hash = rawHash.split('?')[0];

    const isExplicitLogout = localStorage.getItem('wepsun_explicit_logout') === 'true';
    if (isExplicitLogout) return true;

    const token = localStorage.getItem('wepsun_access_token') || sessionStorage.getItem('wepsun_access_token');
    const refresh = localStorage.getItem('wepsun_refresh_token') || sessionStorage.getItem('wepsun_refresh_token');
    const cachedSession = localStorage.getItem('wepsun_user_session');

    // If no tokens or session exist at all, unauthenticated -> show login
    if (!token && !refresh && !cachedSession) {
      if (PUBLIC_HASHES.includes(hash)) return false;
      return true;
    }

    if (hash === 'feedback-form' || hash === 'rate-service' || hash === 'customer-review' || hash === 'public-feedback' || hash === 'rate') {
      return false;
    }

    // Default to false while session restoration completes to prevent login screen flashing
    return false;
  });
  const [isPublicFeedbackPage, setIsPublicFeedbackPage] = useState(false);
  const [isStartupSplashActive, setIsStartupSplashActive] = useState(true);
  const [isSplashPage, setIsSplashPage] = useState(() => {
    const rawHash = typeof window !== 'undefined' ? window.location.hash.toLowerCase().replace('#', '').split('?')[0] : '';
    return rawHash === 'splash' || rawHash === 'animation' || rawHash === 'logo-reveal';
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.toLowerCase().replace('#', '');
      const hash = rawHash.split('?')[0];
      setCurrentHash(hash);
      
      // 1. Splash animation hash
      if (hash === 'splash' || hash === 'animation' || hash === 'logo-reveal') {
        setIsSplashPage(true);
        setIsFullLoginPage(false);
        setIsPublicFeedbackPage(false);
        return;
      }
      setIsSplashPage(false);

      // 2. Public Feedback forms are always accessible
      if (hash === 'feedback-form' || hash === 'rate-service' || hash === 'customer-review' || hash === 'public-feedback' || hash === 'rate') {
        setIsFullLoginPage(false);
        setIsPublicFeedbackPage(true);
        return;
      }
      setIsPublicFeedbackPage(false);

      // 3. Authenticated Automatic Session Navigation
      if (isAuthenticated) {
        // If accessing root or public auth routes while authenticated: navigate directly to authorized dashboard
        if (!hash || PUBLIC_HASHES.includes(hash)) {
          const defaultTab: NavTabId =
            currentRole === 'client'
              ? 'home'
              : currentRole === 'technician'
              ? 'jobs'
              : isMasterAdminAuthenticated()
              ? 'dashboard'
              : 'home';

          window.history.replaceState(null, '', `#${defaultTab}`);
          setCurrentHash(defaultTab);
          setActiveTab(defaultTab);
          setIsFullLoginPage(false);
          return;
        }

        const isClientRole = currentRole === 'client';
        const isTechRole = currentRole === 'technician';
        const isClientTab = CLIENT_ALLOWED_TABS.includes(hash);
        const isTechTab = TECH_ALLOWED_TABS.includes(hash);

        // Route Protection: Prevent unauthorized access to Admin-exclusive views
        const isForbiddenAdminRoute =
          !isMasterAdminAuthenticated() &&
          (ADMIN_EXCLUSIVE_TABS.includes(hash) ||
           hash === 'admin' ||
           hash === 'admin-dashboard' ||
           hash.startsWith('dashboard/') ||
           hash.startsWith('admin/') ||
           (!isClientRole && !isTechRole && !isClientTab && !isTechTab && ADMIN_PROTECTED_TABS.includes(hash)));

        if (isForbiddenAdminRoute) {
          const fallback = currentRole === 'client' ? 'home' : 'jobs';
          window.history.replaceState(null, '', `#${fallback}`);
          setCurrentHash(fallback);
          setActiveTab(fallback as NavTabId);
          setIsFullLoginPage(false);
          showToast('warning', 'Master Authentication Required', 'Please enter your authorized Master ID to access the Admin Dashboard.');
          return;
        }

        if (hash === 'emergency' || hash === 'emergency-breakdown' || hash === 'raise-complaint') {
          setIsFullLoginPage(false);
          setIsEmergencyModalOpen(true);
        } else {
          setIsFullLoginPage(false);
          // Sync activeTab
          if (
            [
              'dashboard',
              'home',
              'jobs',
              'flowchart',
              'complaints',
              'service_jobs',
              'work_orders',
              'pm',
              'amc',
              'lifts',
              'quotations',
              'inventory',
              'technicians',
              'feedback',
              'companies',
              'branches',
              'buildings',
              'clients',
              'invoices',
              'reports',
              'analytics',
              'notifications',
              'settings',
              'edit_profile',
              'design_system',
              'history',
              'payments',
              'profile',
              'parts',
              'client_lift',
              'service_history',
              'checkin_checkout',
              'diagnosis',
              'photos',
              'signature_otp',
              'service_report',
            ].includes(hash)
          ) {
            setActiveTab(hash as NavTabId);
          } else if (hash === 'edit-profile' || hash === 'profile-edit') {
            setActiveTab('edit_profile');
          }
        }
        return;
      }

      // 4. Unauthenticated Navigation: strictly display Sign In only if no valid session exists
      if (!isAuthenticated && !isAuthLoading) {
        const hasStoredTokens = !!(
          localStorage.getItem('wepsun_access_token') ||
          localStorage.getItem('wepsun_refresh_token') ||
          localStorage.getItem('wepsun_user_session')
        );
        const isExplicit = localStorage.getItem('wepsun_explicit_logout') === 'true';

        // If tokens exist and not explicitly logged out, retain view while session restores/reconnects
        if (hasStoredTokens && !isExplicit) {
          setIsFullLoginPage(false);
          return;
        }

        if (!hash || !PUBLIC_HASHES.includes(hash)) {
          window.history.replaceState(null, '', '#login');
          setCurrentHash('login');
        }
        setIsFullLoginPage(true);
        return;
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [lifts, currentRole, isAuthenticated, isAuthLoading]);

  const clientUsers = users.filter((u) => u.role === 'client');

  // Render view based on role and active tab
  const renderMainContent = () => {
    // If technician or client view was switched in header
    if (currentRole === 'technician') {
      return (
        <div className="max-w-7xl mx-auto">
          <TechnicianDashboard
            activeTab={activeTab as any}
            onNavigateTab={(tab) => {
              setActiveTab(tab as NavTabId);
              window.location.hash = tab;
            }}
          />
        </div>
      );
    }

    if (currentRole === 'client') {
      return (
        <div className="max-w-7xl mx-auto">
          <ClientDashboard
            activeTab={activeTab as any}
            onNavigateTab={(tab) => {
              setActiveTab(tab as NavTabId);
              window.location.hash = tab;
            }}
            onOpenEmergencyModal={() => {
              setIsEmergencyModalOpen(true);
              window.location.hash = 'emergency';
            }}
            onOpenRaiseModal={() => {
              setIsEmergencyModalOpen(true);
              window.location.hash = 'raise-complaint';
            }}
          />
        </div>
      );
    }

    // Admin / Operations / Management Portal (Protected: Requires Verified Master Admin Session)
    if (!isMasterAdminAuthenticated()) {
      window.location.hash = 'login-technician';
      return null;
    }

    switch (activeTab) {
      case 'dashboard':
        return <OverviewDashboard onNavigateTab={setActiveTab} />;

      case 'flowchart':
        return <SystemFlowchartViewer />;

      case 'design_system':
        return <DesignSystemShowcase />;

      case 'complaints':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Service Complaints & Breakdown Tickets</span>
            </h2>
            <ComplaintManager />
          </div>
        );

      case 'service_jobs':
      case 'work_orders':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Work Orders & Field Service Dispatch</span>
            </h2>
            <WorkOrderManager />
          </div>
        );

      case 'pm':
      case 'amc':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Annual Maintenance Contracts (AMC) & Preventive Maintenance</span>
            </h2>
            <AmcManager />
          </div>
        );

      case 'lifts':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Registered Lifts Fleet & Digital Passports</span>
            </h2>
            <LiftDirectory />
          </div>
        );

      case 'quotations':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Quotations, AMC Proposals & Estimates</span>
            </h2>
            <QuotationManager />
          </div>
        );

      case 'inventory':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Elevator Spare Parts & Inventory Ledger</span>
            </h2>
            <InventoryManager />
          </div>
        );

      case 'technicians':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Technician Performance & Workload
              </h2>
              <TechnicianPerformance />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Live Field Engineer Radar Map
              </h2>
              <LiveTechnicianRadar />
            </div>
          </div>
        );

      case 'feedback':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            <CustomerFeedbackManager />
          </div>
        );

      case 'companies':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Operating Companies</h2>
                <p className="text-xs text-slate-500">Multi-tenant elevator OEM and maintenance entities</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  {activeCompany.code || 'WEP'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeCompany.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeCompany.address}</p>
                  <div className="mt-2 text-[11px] text-blue-600 font-semibold">Active Tenant</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'branches':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Service Branches & Hubs</h2>
                <p className="text-xs text-slate-500">Geographical regional control centers</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {branches.map((b) => (
                <div key={b.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      {b.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{b.city}, {b.state}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'buildings':
        return <AdminBuildingsView onNavigateToLifts={() => setActiveTab('lifts')} />;

      case 'clients':
        return <AdminClientsView />;

      case 'invoices':
        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invoices & Financial Ledger</h2>
                <p className="text-xs text-slate-500">AMC billing, spare parts invoices, and payment tracking</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2.5 pr-3">Invoice No</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 pl-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenantInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-700">{inv.clientName}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹ {inv.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 pl-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'reports':
      case 'analytics':
        return <AdminReportsView />;

      case 'notifications':
        return <AdminNotificationsView onNavigateTab={(tab) => setActiveTab(tab as NavTabId)} />;

      case 'settings':
        return <AdminProfileSettingsView />;

      case 'edit_profile':
        return <EditProfilePage onBack={() => setActiveTab('settings')} onSaved={() => setActiveTab('settings')} />;

      default:
        return <OverviewDashboard onNavigateTab={setActiveTab} />;
    }
  };

  // 1. Fullscreen Native Startup Animation Overlay (animation.mp4)
  const renderSplashOverlay = () => {
    if (!isStartupSplashActive && !isSplashPage) return null;
    return (
      <WepsunSplashAnimation
        onComplete={() => {
          setIsStartupSplashActive(false);
          if (isSplashPage) {
            setIsSplashPage(false);
          }
          const rawH = window.location.hash.toLowerCase().replace('#', '').split('?')[0];
          if (!rawH || rawH === 'splash' || rawH === 'animation' || rawH === 'logo-reveal' || rawH === 'landing' || rawH === 'login') {
            if (isAuthenticated) {
              const target =
                currentRole === 'client'
                  ? 'home'
                  : currentRole === 'technician'
                  ? 'jobs'
                  : isMasterAdminAuthenticated()
                  ? 'dashboard'
                  : 'home';
              window.history.replaceState(null, '', `#${target}`);
              setCurrentHash(target);
              setActiveTab(target as NavTabId);
              setIsFullLoginPage(false);
            }
          }
        }}
      />
    );
  };

  // Dedicated Branded Loading Overlay while checking session validity
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#071325] flex flex-col items-center justify-center p-4">
        {renderSplashOverlay()}
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <GeometricBlueWLogo className="w-16 h-13 animate-pulse" />
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-300 tracking-wide">
              Restoring your session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isFullLoginPage) {
    const hash = currentHash;

    const defaultRole: 'technician' | 'client' = hash.includes('technician')
      ? 'technician'
      : 'client';

    // If explicit login or signup hash, show dedicated full screen
    if (
      hash === 'login' ||
      hash === 'signin' ||
      hash === 'signup' ||
      hash === 'register' ||
      hash.includes('login-')
    ) {
      return (
        <div className="min-h-screen">
          {renderSplashOverlay()}
          <LoginPage
            isOpen={true}
            initialView={hash.includes('signup') || hash.includes('register') ? 'signup' : 'signin'}
            defaultRole={defaultRole}
            onClose={() => {
              setIsFullLoginPage(false);
              const rawH = window.location.hash.toLowerCase().replace('#', '').split('?')[0];
              const savedRole =
                localStorage.getItem('wepsun_lift_saas_v2_role') ||
                localStorage.getItem('wepsun_role') ||
                currentRole ||
                'client';
              if (!rawH || rawH === 'login' || rawH === 'signin' || rawH === 'signup' || rawH === 'landing' || rawH.startsWith('login-')) {
                const target = savedRole === 'client' ? 'home' : savedRole === 'technician' ? 'jobs' : (isMasterAdminAuthenticated() ? 'dashboard' : 'home');
                window.location.hash = target;
                setActiveTab(target as NavTabId);
              } else {
                setActiveTab(rawH as NavTabId);
              }
            }}
            isModal={false}
          />
          <ToastContainer />
          <WepsunModalContainer />
        </div>
      );
    }

    // Default is the complete Modern Landing Page
    return (
      <div className="min-h-screen">
        {renderSplashOverlay()}
        <LandingPage
          defaultRole={defaultRole}
          onClose={() => {
            setIsFullLoginPage(false);
            const rawH = window.location.hash.toLowerCase().replace('#', '').split('?')[0];
            const savedRole =
              localStorage.getItem('wepsun_lift_saas_v2_role') ||
              localStorage.getItem('wepsun_role') ||
              currentRole ||
              'client';
            if (!rawH || rawH === 'login' || rawH === 'signin' || rawH === 'signup' || rawH === 'landing' || rawH.startsWith('login-')) {
              const target = savedRole === 'client' ? 'home' : savedRole === 'technician' ? 'jobs' : (isMasterAdminAuthenticated() ? 'dashboard' : 'home');
              window.location.hash = target;
              setActiveTab(target as NavTabId);
            } else {
              setActiveTab(rawH as NavTabId);
            }
          }}
        />
        <ToastContainer />
        <WepsunModalContainer />
      </div>
    );
  }

  if (isPublicFeedbackPage) {
    return (
      <div className="min-h-screen bg-slate-950">
        {renderSplashOverlay()}
        <PublicFeedbackPage
          onClose={() => {
            setIsPublicFeedbackPage(false);
            window.location.hash = 'feedback';
          }}
        />
        <ToastContainer />
        <WepsunModalContainer />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F4F7FB] text-[#263238] flex flex-col">
        {renderSplashOverlay()}
        {/* Top Full-Width Dark Navy Header Bar */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenRaiseComplaint={() => setIsEmergencyModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onNavigateTab={setActiveTab}
        />

        {/* Main Body with Left Sidebar and Page Canvas */}
        <div className="flex-1 flex">
          {/* Left Dark Navy Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />

          {/* Main Content Canvas */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:pl-[240px]' : 'lg:pl-0'}`}>
            <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto pb-20 md:pb-7">
              <ErrorBoundary key={`${currentRole}-${activeTab}`} fallbackTitle="View Failed to Render">
                {renderMainContent()}
              </ErrorBoundary>
            </main>

            {/* Clean Corporate Footer */}
            <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 no-print flex flex-col sm:flex-row items-center justify-between gap-3 mb-16 md:mb-0">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 font-medium">
                  <span className="font-bold text-[#0E2238] text-xs">WEPSUN Lift Services</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">Reliable Service. Safer Tomorrow.</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <PhoneCall className="w-3.5 h-3.5 text-[#1976D2]" />
                  24x7 Control Room: +91 98201 55432
                </span>
                <span className="text-slate-300">•</span>
                <span className="capitalize">{currentRole.replace('_', ' ')} Dashboard</span>
              </div>
            </footer>
          </div>
        </div>

        {/* Global Notifications Container */}
        <ToastContainer />
        {/* Modern WepSun Modal & Pop-up System */}
        <WepsunModalContainer />



        {/* Emergency Breakdown Modal */}
        <RaiseComplaintModal
          isOpen={isEmergencyModalOpen}
          initialMode="emergency"
          onClose={() => {
            setIsEmergencyModalOpen(false);
            if (window.location.hash.includes('emergency') || window.location.hash.includes('raise-complaint')) {
              window.location.hash = activeTab || 'home';
            }
          }}
        />

        {/* Login & Sign Up Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />

        {/* Native Mobile App Bottom Navigation Bar (Android & iOS) */}
        {!isFullLoginPage && !isPublicFeedbackPage && (
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              window.location.hash = tab;
            }}
            onOpenEmergencyModal={() => {
              setIsEmergencyModalOpen(true);
              window.location.hash = 'emergency';
            }}
          />
        )}

        {/* Cross-Platform App Installation Prompt (Mobile & Desktop) */}
        <AppInstallBanner />
      </div>
    </AuthGuard>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
