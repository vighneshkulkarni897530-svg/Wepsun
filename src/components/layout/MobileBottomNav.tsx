import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  AlertTriangle,
  QrCode,
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
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  onOpenQrScanner: () => void;
  onOpenEmergencyModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQrScanner,
  onOpenEmergencyModal,
}) => {
  const { currentRole, complaints } = useApp();

  const handleTabClick = (tab: NavTabId) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  const handleCenterAction = () => {
    triggerHaptic('heavy');
    if (currentRole === 'client') {
      onOpenEmergencyModal();
    } else {
      onOpenQrScanner();
    }
  };

  // Active complaints count for badge
  const activeComplaintsCount = complaints.filter(
    (c) => String(c.status).toLowerCase() !== 'resolved' &&
           String(c.status).toLowerCase() !== 'closed' &&
           String(c.status).toLowerCase() !== 'cancelled'
  ).length;

  const isClient = currentRole === 'client';
  const isTechnician = currentRole === 'technician';
  const isAdmin = !isClient && !isTechnician;

  return (
    <nav aria-label="Mobile Navigation Bar" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 text-slate-400 px-2 py-1.5 shadow-2xl safe-bottom">
      <div className="flex items-center justify-around relative max-w-lg mx-auto">
        {/* Role-Specific Left Tab 1 */}
        {isAdmin && (
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'dashboard' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Overview</span>
          </button>
        )}

        {isTechnician && (
          <button
            onClick={() => handleTabClick('jobs')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
              activeTab === 'jobs' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
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
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'home' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">My Lifts</span>
          </button>
        )}

        {/* Role-Specific Left Tab 2 */}
        {isAdmin && (
          <button
            onClick={() => handleTabClick('complaints')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
              activeTab === 'complaints' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
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
            onClick={() => handleTabClick('checkin_checkout')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'checkin_checkout' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Attendance</span>
          </button>
        )}

        {isClient && (
          <button
            onClick={() => handleTabClick('history')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'history' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Reports</span>
          </button>
        )}

        {/* Prominent Center Action Button (QR Scan for Tech/Admin, SOS Breakdown for Client) */}
        <div className="flex-1 flex justify-center -mt-5">
          {isClient ? (
            <button
              onClick={handleCenterAction}
              aria-label="Report emergency breakdown"
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white p-3 shadow-lg shadow-red-500/40 border-2 border-slate-900 flex items-center justify-center active:scale-90 transition-transform animate-pulse"
            >
              <PhoneCall className="w-6 h-6 animate-bounce" />
            </button>
          ) : (
            <button
              onClick={handleCenterAction}
              aria-label="Scan Lift QR Passport"
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white p-3 shadow-lg shadow-blue-500/40 border-2 border-slate-900 flex items-center justify-center active:scale-90 transition-transform"
            >
              <QrCode className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Role-Specific Right Tab 1 */}
        {isAdmin && (
          <button
            onClick={() => handleTabClick('amc')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'amc' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">AMC</span>
          </button>
        )}

        {isTechnician && (
          <button
            onClick={() => handleTabClick('service_history')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'service_history' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Job Card</span>
          </button>
        )}

        {isClient && (
          <button
            onClick={() => handleTabClick('payments')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'payments' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">AMC & Pay</span>
          </button>
        )}

        {/* Role-Specific Right Tab 2 (More / Settings) */}
        {isAdmin && (
          <button
            onClick={() => handleTabClick('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'settings' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Settings</span>
          </button>
        )}

        {isTechnician && (
          <button
            onClick={() => handleTabClick('service_report')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'service_report' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Report</span>
          </button>
        )}

        {isClient && (
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'profile' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
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
