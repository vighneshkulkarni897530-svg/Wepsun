import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  GitBranch,
  User,
} from 'lucide-react';

interface NavbarProps {
  onOpenRaiseComplaint?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRaiseComplaint }) => {
  const {
    currentUser,
    activeCompany,
    activeBranchId,
    branches,
    tenantComplaints,
    tenantLifts,
  } = useApp();



  const criticalCount = tenantComplaints.filter(
    (c) => (c.isEmergency || c.priority === 'critical') && c.status !== 'closed'
  ).length;

  const currentBranch = branches.find((b) => b.id === activeBranchId);

  return (
    <>
      <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Company Brand Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#123B5D] flex items-center justify-center text-white font-bold text-sm font-sans shadow-sm">
              {activeCompany.code || 'WEP'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">
                  {activeCompany.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-[#00A896]" />
                  {currentBranch ? currentBranch.name : 'All Branches'}
                </span>
                <span>•</span>
                <span>{tenantLifts.length} Elevators</span>
              </div>
            </div>
          </div>

          {/* Center Actions / QR & Emergency */}
          <div className="flex items-center gap-2 sm:gap-3">


            {onOpenRaiseComplaint && (
              <button
                onClick={onOpenRaiseComplaint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-500/20 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Breakdown</span>
              </button>
            )}
          </div>

          {/* Right User & Live Breakdown Alerts */}
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full text-red-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>{criticalCount} Critical Ticket{criticalCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              {(() => {
                const isProfileSaved = typeof window !== 'undefined' && currentUser?.id && localStorage.getItem('wepsun_profile_saved_' + currentUser.id) === 'true';
                const isDummyAvatar = (a?: string | null) => !a || a.includes('534528741775-53994a69daeb') || a.includes('541888946425') || a.includes('486406146926') || a.includes('519494026892') || a.includes('545324418');
                const hasValidAvatar = isProfileSaved && currentUser?.avatar && !isDummyAvatar(currentUser.avatar);

                return hasValidAvatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                );
              })()}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <span className="text-[11px] text-slate-500 capitalize block">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

    </>
  );
};
