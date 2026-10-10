import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Building2,
  Wrench,
  PhoneCall,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTabId } from './Sidebar';
import { triggerHaptic } from '../../services/nativeApp';

interface MobileBottomNavProps {
  activeTab: NavTabId | string;
  setActiveTab: (tab: NavTabId) => void;
  onOpenEmergencyModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenEmergencyModal,
}) => {
  const { currentRole, complaints } = useApp();

  const handleTabClick = (tab: NavTabId) => {
    triggerHaptic('light');
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleCenterAction = () => {
    triggerHaptic('heavy');
    window.location.hash = 'emergency';
    onOpenEmergencyModal();
  };

  // Active complaints count for badge
  const activeComplaintsCount = complaints.filter(
    (c) =>
      String(c.status).toLowerCase() !== 'resolved' &&
      String(c.status).toLowerCase() !== 'closed' &&
      String(c.status).toLowerCase() !== 'cancelled'
  ).length;

  const isClient = currentRole === 'client';
  const isTechnician = currentRole === 'technician';
  const isAdmin = !isClient && !isTechnician;

  // Active state matching
  const isClientHomeActive = activeTab === 'home' || activeTab === 'lifts' || activeTab === 'dashboard' || !activeTab;
  const isClientReportsActive = activeTab === 'history' || activeTab === 'reports';
  const isClientPayActive = activeTab === 'payments' || activeTab === 'amc' || activeTab === 'invoices';
  const isClientProfileActive = activeTab === 'profile' || activeTab === 'settings' || activeTab === 'edit_profile';

  const isTechJobsActive = activeTab === 'jobs' || activeTab === 'dashboard' || !activeTab;
  const isTechAttendanceActive = activeTab === 'checkin_checkout';
  const isTechJobCardActive = activeTab === 'service_history' || activeTab === 'diagnosis' || activeTab === 'pm_checklist' || activeTab === 'parts';
  const isTechReportActive = activeTab === 'service_report' || activeTab === 'report' || activeTab === 'photos' || activeTab === 'signature_otp' || activeTab === 'profile';

  const isAdminDashboardActive = activeTab === 'dashboard' || activeTab === 'home' || !activeTab;
  const isAdminComplaintsActive = activeTab === 'complaints' || activeTab === 'service_jobs' || activeTab === 'work_orders';
  const isAdminAmcActive = activeTab === 'amc' || activeTab === 'pm' || activeTab === 'invoices' || activeTab === 'quotations';
  const isAdminSettingsActive = activeTab === 'settings' || activeTab === 'edit_profile' || activeTab === 'notifications';

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 text-slate-400 px-2 py-1.5 shadow-2xl safe-bottom select-none touch-manipulation"
    >
      <div className="flex items-center justify-around relative max-w-lg mx-auto">
        {/* Role-Specific Left Tab 1 */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isAdminDashboardActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Overview</span>
          </button>
        )}

        {isTechnician && (
          <button
            type="button"
            onClick={() => handleTabClick('jobs')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
              isTechJobsActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardHat className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">My Jobs</span>
            {activeComplaintsCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {activeComplaintsCount}
              </span>
            )}
          </button>
        )}

        {isClient && (
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isClientHomeActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">My Lifts</span>
          </button>
        )}

        {/* Role-Specific Left Tab 2 */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleTabClick('complaints')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
              isAdminComplaintsActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Breakdowns</span>
            {activeComplaintsCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {activeComplaintsCount}
              </span>
            )}
          </button>
        )}

        {isTechnician && (
          <button
            type="button"
            onClick={() => handleTabClick('checkin_checkout')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isTechAttendanceActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Attendance</span>
          </button>
        )}

        {isClient && (
          <button
            type="button"
            onClick={() => handleTabClick('reports')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isClientReportsActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Reports</span>
          </button>
        )}

        {/* Prominent Center Action Button (Emergency Breakdown SOS) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={handleCenterAction}
            aria-label="Report emergency breakdown"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white p-3 shadow-lg shadow-red-500/40 border-2 border-slate-900 flex items-center justify-center active:scale-90 transition-transform animate-pulse cursor-pointer"
          >
            <PhoneCall className="w-6 h-6 animate-bounce" />
          </button>
        </div>

        {/* Role-Specific Right Tab 1 */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleTabClick('amc')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isAdminAmcActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">AMC</span>
          </button>
        )}

        {isTechnician && (
          <button
            type="button"
            onClick={() => handleTabClick('service_history')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isTechJobCardActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Job Card</span>
          </button>
        )}

        {isClient && (
          <button
            type="button"
            onClick={() => handleTabClick('payments')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isClientPayActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">AMC & Pay</span>
          </button>
        )}

        {/* Role-Specific Right Tab 2 (More / Settings) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleTabClick('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isAdminSettingsActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Settings</span>
          </button>
        )}

        {isTechnician && (
          <button
            type="button"
            onClick={() => handleTabClick('service_report')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isTechReportActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Report</span>
          </button>
        )}

        {isClient && (
          <button
            type="button"
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              isClientProfileActive ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Profile</span>
          </button>
        )}
      </div>
    </nav>
  );
};

