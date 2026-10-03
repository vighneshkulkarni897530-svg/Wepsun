import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Wrench,
  UserCheck,
  Briefcase,
  Building2,
  GitBranch,
  CreditCard,
  Globe2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';

export const RoleSwitcher: React.FC = () => {
  const {
    companies,
    activeCompanyId,
    setActiveCompanyId,
    branches,
    activeBranchId,
    setActiveBranchId,
    currentRole,
    setCurrentRole,
    currentUser,
    resetDemoData,
  } = useApp();

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'company_admin', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { role: 'service_manager', label: 'Service Manager', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { role: 'technician', label: 'Technician App', icon: <Wrench className="w-3.5 h-3.5" /> },
    { role: 'client', label: 'Client Portal', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { role: 'accounts', label: 'Accounts', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { role: 'sales', label: 'Sales / CRM', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
    { role: 'super_admin', label: 'Super Admin', icon: <Globe2 className="w-3.5 h-3.5" /> },
  ];

  const currentBranches = branches.filter(
    (b) => activeCompanyId === 'all' || b.companyId === activeCompanyId
  );

  return (
    <div className="bg-white border-b border-slate-200 text-xs text-slate-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Organization & Branch Selection */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Company */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#1976D2] shrink-0" />
            <span className="text-slate-500 text-xs">Company:</span>
            <select
              value={activeCompanyId}
              onChange={(e) => {
                setActiveCompanyId(e.target.value);
                setActiveBranchId('all');
              }}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 font-semibold focus:border-[#1976D2] focus:outline-none cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {currentRole === 'super_admin' && (
                <option value="all">★ All Companies (Super Admin)</option>
              )}
            </select>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#00A896] shrink-0" />
            <span className="text-slate-500 text-xs">Branch:</span>
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 font-semibold focus:border-[#1976D2] focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches</option>
              {currentBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View as Role Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-500 text-xs mr-1 font-semibold">
            <span>User:</span>
            <span className="text-slate-900 font-bold max-w-[120px] truncate">{currentUser.name}</span>
            <span>•</span>
            <span>Role:</span>
          </div>
          {roles.map((item) => {
            const isActive = currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => setCurrentRole(item.role)}
                title={`Switch active role to ${item.label}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 ${
                  isActive
                    ? 'bg-[#1976D2] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              if (window.confirm('Reset local application cache and state?')) {
                resetDemoData();
              }
            }}
            className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold"
            title="Reset cached state"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
