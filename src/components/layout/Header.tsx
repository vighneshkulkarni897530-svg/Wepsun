import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Building2,
  ChevronDown,
  User,
  ShieldCheck,
  Wrench,
  UserCheck,
  CreditCard,
  Globe2,
  AlertTriangle,
  RotateCcw,
  Palette,
  Lock,
  X,
  Package,
  Star,
  Layers,
  FileCheck2,
  FileSpreadsheet,
  ArrowRight,
  Zap,
  Check,
  KeyRound,
  LogOut,
  Sparkles,
  Wifi,
  Volume2,
  VolumeX,
  CheckCheck,
  Clock,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getEffectiveProfilePhoto, isValidCustomAvatar } from '../../utils/avatarUtils';
import { UserRole } from '../../types';
import { NavTabId } from './Sidebar';
import { WepsunLiftServicesLogo } from '../common/WepsunLogo';
import { GoogleAuthModal } from '../common/GoogleAuthModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenRaiseComplaint?: () => void;
  onOpenLoginModal?: () => void;
  onNavigateTab?: (tab: NavTabId) => void;
  currentTab?: NavTabId | string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenRaiseComplaint,
  onOpenLoginModal,
  onNavigateTab,
  currentTab,
}) => {
  const {
    currentUser,
    clientProfile,
    activeCompany,
    companies,
    setActiveCompanyId,
    currentRole,
    setCurrentRole,
    logout,
    resetDemoData,
    tenantLifts,
    tenantComplaints,
    tenantInventory,
    tenantFeedbacks,
    tenantBuildings,
    clientScopedLifts,
    clientScopedComplaints,
    clientScopedFeedbacks,
    roleNotifications,
    unreadNotificationsCount,
    criticalNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    isSoundEnabled,
    toggleSound,
    showLogoutModal,
    showWarningModal,
  } = useApp();

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [, setAvatarVersion] = useState(0);

  const companyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for instant profile photo sync across windows and components
  useEffect(() => {
    const handlePhotoUpdated = () => {
      setAvatarVersion((v) => v + 1);
    };
    window.addEventListener('wepsun_profile_photo_updated', handlePhotoUpdated);
    window.addEventListener('storage', handlePhotoUpdated);
    return () => {
      window.removeEventListener('wepsun_profile_photo_updated', handlePhotoUpdated);
      window.removeEventListener('storage', handlePhotoUpdated);
    };
  }, []);

  // Strict RBAC Live Search Filtering (Zero cross-client data leakage)
  const isClient = currentRole === 'client';
  const effectiveSearchLifts = isClient ? clientScopedLifts : tenantLifts;
  const effectiveSearchComplaints = isClient ? clientScopedComplaints : tenantComplaints;
  const effectiveSearchFeedbacks = isClient ? clientScopedFeedbacks : tenantFeedbacks;
  const effectiveSearchParts = isClient ? [] : tenantInventory;

  const trimmedSearch = searchQuery.trim().toLowerCase();

  const effectiveHeaderAvatar = getEffectiveProfilePhoto(
    currentUser?.avatar,
    clientProfile?.logo,
    currentUser?.id
  );
  const hasUserCustomAvatar = isValidCustomAvatar(effectiveHeaderAvatar);

  const matchingLifts = trimmedSearch
    ? effectiveSearchLifts.filter(
        (l) =>
          l.liftNumber.toLowerCase().includes(trimmedSearch) ||
          l.buildingName.toLowerCase().includes(trimmedSearch) ||
          l.model?.toLowerCase().includes(trimmedSearch)
      ).slice(0, 3)
    : [];

  const matchingComplaints = trimmedSearch
    ? effectiveSearchComplaints.filter(
        (c) =>
          c.ticketNumber.toLowerCase().includes(trimmedSearch) ||
          c.title.toLowerCase().includes(trimmedSearch) ||
          c.buildingName.toLowerCase().includes(trimmedSearch) ||
          c.clientName.toLowerCase().includes(trimmedSearch)
      ).slice(0, 3)
    : [];

  const matchingParts = trimmedSearch
    ? effectiveSearchParts.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedSearch) ||
          p.partNumber.toLowerCase().includes(trimmedSearch) ||
          p.category.toLowerCase().includes(trimmedSearch)
      ).slice(0, 3)
    : [];

  const matchingFeedbacks = trimmedSearch
    ? effectiveSearchFeedbacks.filter(
        (f) =>
          f.clientName.toLowerCase().includes(trimmedSearch) ||
          f.buildingName.toLowerCase().includes(trimmedSearch) ||
          f.comments.toLowerCase().includes(trimmedSearch)
      ).slice(0, 3)
    : [];

  const hasSearchResults =
    matchingLifts.length > 0 ||
    matchingComplaints.length > 0 ||
    matchingParts.length > 0 ||
    matchingFeedbacks.length > 0;

  const handleSelectSearchResult = (tab: NavTabId) => {
    if (onNavigateTab) onNavigateTab(tab);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'company_admin', label: 'Admin (Web Portal)', icon: <ShieldCheck className="w-4 h-4 text-[#1976D2]" /> },
    { role: 'client', label: 'Client App (Mobile View)', icon: <UserCheck className="w-4 h-4 text-[#00A896]" /> },
    { role: 'technician', label: 'Technician App (Jobs View)', icon: <Wrench className="w-4 h-4 text-[#2E7D32]" /> },
    { role: 'super_admin', label: 'Super Admin', icon: <Globe2 className="w-4 h-4 text-purple-600" /> },
    { role: 'accounts', label: 'Accounts & Billing', icon: <CreditCard className="w-4 h-4 text-rose-600" /> },
  ];

  const displayRoleLabel =
    currentRole === 'client'
      ? 'Client'
      : currentRole === 'technician'
      ? 'Technician'
      : currentRole === 'company_admin' || currentRole === 'super_admin' || (currentRole as string) === 'master_admin'
      ? 'Administrator'
      : currentRole.replace('_', ' ');

  const displayName =
    currentUser.name ||
    (currentRole === 'client'
      ? 'Priya Sharma'
      : currentRole === 'technician'
      ? 'Rohan Patil'
      : 'Admin');

  return (
    <header className="min-h-16 h-auto bg-[#0E2238] border-b border-[#0A1828] sticky top-0 z-50 px-2.5 sm:px-6 py-2 sm:py-0 flex items-center justify-between gap-2 sm:gap-4 select-none safe-top">
      {/* Left: Hamburger & WEPSUN Lift Services Logo */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 sm:p-2.5 min-w-[42px] min-h-[42px] rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer active:scale-95"
          title="Toggle Sidebar"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* WEPSUN Lift Services Brand Logo */}
        <div
          onClick={() => {
            if (onNavigateTab) onNavigateTab(currentRole === 'client' ? 'home' : currentRole === 'technician' ? 'jobs' : 'dashboard');
          }}
          className="cursor-pointer max-w-[170px] xs:max-w-none truncate"
        >
          <WepsunLiftServicesLogo />
        </div>
      </div>

      {/* Center: Long, Rounded-Pill Search Bar (matching Image 3) */}
      <div className="flex-1 max-w-2xl px-2 hidden md:block" ref={searchRef}>
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, building, lift, or ticket number..."
            className="w-full pl-11 pr-10 py-2 bg-white text-slate-800 text-xs sm:text-sm font-medium placeholder-slate-400 rounded-full border border-slate-200 focus:border-[#1976D2] focus:ring-2 focus:ring-blue-400/40 focus:outline-none shadow-sm transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Interactive Live Search Results Dropdown */}
          {isSearchFocused && trimmedSearch.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 max-h-[75vh] overflow-y-auto space-y-3 text-slate-800">
              {hasSearchResults ? (
                <>
                  {/* Lifts */}
                  {matchingLifts.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-blue-600" />
                        <span>Lifts ({matchingLifts.length})</span>
                      </div>
                      {matchingLifts.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => handleSelectSearchResult('lifts')}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/70 transition-colors cursor-pointer text-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#1976D2]">{l.liftNumber}</span>
                            <span className="text-slate-600">• {l.buildingName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 group-hover:text-blue-600 flex items-center gap-1">
                            <span>{l.currentStatus}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Complaints */}
                  {matchingComplaints.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span>Breakdown Tickets ({matchingComplaints.length})</span>
                      </div>
                      {matchingComplaints.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectSearchResult('complaints')}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-red-50/70 transition-colors cursor-pointer text-xs group"
                        >
                          <div>
                            <span className="font-mono font-bold text-red-600 mr-2">#{c.ticketNumber}</span>
                            <span className="font-medium text-slate-800">{c.title}</span>
                            <span className="text-slate-400 block text-[11px]">{c.buildingName} • {c.clientName}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 group-hover:text-red-600 flex items-center gap-1 shrink-0 ml-2">
                            <span>{c.status}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Spare Parts */}
                  {matchingParts.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 flex items-center gap-1.5">
                        <Package className="w-3 h-3 text-indigo-600" />
                        <span>Spare Parts Inventory ({matchingParts.length})</span>
                      </div>
                      {matchingParts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectSearchResult('inventory')}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/70 transition-colors cursor-pointer text-xs group"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-slate-400 block text-[11px]">SKU: {p.partNumber} • Stock: {p.currentStock} {p.unit}</span>
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1">
                            <span>₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Feedback */}
                  {matchingFeedbacks.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Customer Feedback & Ratings ({matchingFeedbacks.length})</span>
                      </div>
                      {matchingFeedbacks.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => handleSelectSearchResult('feedback')}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/70 transition-colors cursor-pointer text-xs group"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{f.clientName}</span>
                              <span className="text-amber-500 font-bold">{f.overallRating}★</span>
                            </div>
                            <span className="text-slate-500 block text-[11px] truncate max-w-sm">&quot;{f.comments}&quot;</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching lifts, complaints, parts, or feedback found for &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* Dynamic Notification Bell with Badge & Sound - Opens Notification Hub Directly in Full-Screen Mode */}
        <div className="relative">
          <button
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('notifications');
              }
              window.location.hash = 'notifications';
            }}
            className={`relative p-2 sm:p-2.5 min-w-[42px] min-h-[42px] rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
              currentTab === 'notifications'
                ? 'bg-blue-600/35 text-white ring-1 ring-blue-400/50 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Notifications & Field Alerts - Open Notification Hub"
            aria-label="View Notification Hub"
          >
            <Bell className="w-5 h-5 shrink-0" />
            {unreadNotificationsCount > 0 && (
              <>
                {criticalNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 animate-ping opacity-75" />
                )}
                <span
                  className={`absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-white text-[9px] font-black ring-2 ring-[#0E2238] ${
                    criticalNotificationsCount > 0 ? 'bg-red-600' : 'bg-[#1976D2]'
                  }`}
                >
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              </>
            )}
          </button>
        </div>

        {/* User Profile matching exact style from screenshots */}
        <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors min-h-[42px] cursor-pointer active:scale-95"
                aria-label="User Account Menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-white/20 shadow-sm shrink-0 flex items-center justify-center text-slate-700">
                  {hasUserCustomAvatar ? (
                    <img
                      src={effectiveHeaderAvatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="block text-[11px] text-slate-300 font-normal leading-tight">
                    {displayRoleLabel}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-20px)] sm:w-80 max-w-[320px] bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in text-slate-800">
                  <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                      {hasUserCustomAvatar ? (
                        <img
                          src={effectiveHeaderAvatar}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#263238] truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email || 'admin@wepsun.com'}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-[#1976D2] text-[10px] font-bold">
                        {displayRoleLabel}
                      </span>
                    </div>
                  </div>

              {/* Profile Actions */}
              <div className="p-2 space-y-2">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    const targetTab = currentRole === 'client' ? 'profile' : currentRole === 'technician' ? 'profile' : 'settings';
                    if (onNavigateTab) onNavigateTab(targetTab as NavTabId);
                    window.location.hash = targetTab;
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1976D2] hover:text-blue-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <User className="w-4 h-4 shrink-0 text-[#1976D2]" />
                  <span>View & Edit My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsGoogleAuthModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google Account / Switch</span>
                </button>


                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      showLogoutModal(() => {
                        logout();
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                    title="Log out and return to Home Page"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      showWarningModal(
                        'Reset Application Cache?',
                        'This will clear local cache and reload latest data.',
                        () => {
                          resetDemoData();
                        }
                      );
                    }}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors"
                    title="Reset cached data"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthModalOpen}
        onClose={() => setIsGoogleAuthModalOpen(false)}
      />

    </header>
  );
};


