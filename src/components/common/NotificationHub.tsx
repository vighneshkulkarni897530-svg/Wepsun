import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Calendar,
  FileSpreadsheet,
  Receipt,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Filter,
  Search,
  Zap,
  Volume2,
  VolumeX,
  Building,
  Layers,
  Check,
  ExternalLink,
  X,
  CreditCard,
  Package,
  Sparkles,
  Inbox,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationPriority, NotificationCategory } from '../../types';
import { playNotificationSound } from '../../utils/notificationSound';
import { NavTabId } from '../layout/Sidebar';
import { GeometricBlueWLogo } from './WepsunLogo';

export type NotificationStatusFilter = 'all' | 'unread' | 'urgent' | 'read';

interface NotificationHubProps {
  onBack?: () => void;
  onNavigateTab?: (tab: NavTabId | string) => void;
}

export const NotificationHub: React.FC<NotificationHubProps> = ({
  onBack,
  onNavigateTab,
}) => {
  const {
    currentRole,
    roleNotifications,
    unreadNotificationsCount,
    criticalNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    isSoundEnabled,
    toggleSound,
    showDeleteModal,
  } = useApp();

  // Primary status filter: 'all' | 'unread' | 'urgent' | 'read'
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time dynamic counts across all 4 mandatory filter dimensions
  const dynamicCounts = useMemo(() => {
    const all = roleNotifications.length;
    const unread = roleNotifications.filter((n) => !n.isRead).length;
    const urgent = roleNotifications.filter(
      (n) => n.priority === 'critical' || n.priority === 'urgent' || n.category === 'emergency'
    ).length;
    const read = roleNotifications.filter((n) => n.isRead).length;

    return { all, unread, urgent, read };
  }, [roleNotifications]);

  // Comprehensive multi-dimensional filtering
  const filteredNotifications = useMemo(() => {
    return roleNotifications.filter((n) => {
      // 1. Primary Status Filter: All / Unread / Urgent / Read
      if (statusFilter === 'unread' && n.isRead) return false;
      if (statusFilter === 'read' && !n.isRead) return false;
      if (statusFilter === 'urgent') {
        const isUrgent =
          n.priority === 'critical' || n.priority === 'urgent' || n.category === 'emergency';
        if (!isUrgent) return false;
      }

      // 2. Secondary Category Filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'emergency' && n.category !== 'emergency') return false;
        if (categoryFilter === 'complaints' && n.category !== 'complaint' && n.category !== 'emergency') return false;
        if (categoryFilter === 'technicians' && n.category !== 'technician') return false;
        if (categoryFilter === 'pm' && n.category !== 'pm') return false;
        if (categoryFilter === 'amc' && n.category !== 'amc') return false;
        if (categoryFilter === 'finance' && n.category !== 'quotation' && n.category !== 'payment') return false;
        if (categoryFilter === 'inventory' && n.category !== 'inventory') return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches =
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          (n.buildingName && n.buildingName.toLowerCase().includes(query)) ||
          (n.ticketNumber && n.ticketNumber.toLowerCase().includes(query)) ||
          (n.liftNumber && n.liftNumber.toLowerCase().includes(query)) ||
          (n.actionLabel && n.actionLabel.toLowerCase().includes(query));
        if (!matches) return false;
      }

      return true;
    });
  }, [roleNotifications, statusFilter, categoryFilter, searchQuery]);

  // Group notifications chronologically (Today, Yesterday, Earlier)
  const groupedNotifications = useMemo(() => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    filteredNotifications.forEach((notif) => {
      const time = new Date(notif.timestamp).getTime();
      if (time >= startOfToday) {
        today.push(notif);
      } else if (time >= startOfYesterday) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, earlier };
  }, [filteredNotifications]);

  // Category presentation styling
  const getCategoryMeta = (category: NotificationCategory, priority: NotificationPriority) => {
    const isUrgent = priority === 'critical' || priority === 'urgent' || category === 'emergency';

    switch (category) {
      case 'emergency':
        return {
          icon: <Zap className="w-4 h-4 text-rose-600 animate-pulse" />,
          label: 'Emergency SOS',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
          borderColor: 'border-l-rose-600',
        };
      case 'complaint':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          label: 'Breakdown Ticket',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
          borderColor: 'border-l-amber-500',
        };
      case 'technician':
        return {
          icon: <HardHat className="w-4 h-4 text-blue-600" />,
          label: 'Engineer Dispatch',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
          borderColor: 'border-l-blue-600',
        };
      case 'pm':
        return {
          icon: <Calendar className="w-4 h-4 text-indigo-600" />,
          label: 'PM Inspection',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-600 border-indigo-200',
          borderColor: 'border-l-indigo-600',
        };
      case 'amc':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
          label: 'AMC Protection',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-600 border-purple-200',
          borderColor: 'border-l-purple-600',
        };
      case 'quotation':
        return {
          icon: <FileSpreadsheet className="w-4 h-4 text-amber-600" />,
          label: 'Quotation Ready',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
          borderColor: 'border-l-amber-500',
        };
      case 'payment':
        return {
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
          label: 'Payment & Invoice',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
          borderColor: 'border-l-emerald-600',
        };
      case 'inventory':
        return {
          icon: <Package className="w-4 h-4 text-teal-600" />,
          label: 'Spare Parts Stock',
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
          iconBg: 'bg-teal-100 text-teal-600 border-teal-200',
          borderColor: 'border-l-teal-600',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          label: 'System Notification',
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
          borderColor: 'border-l-slate-400',
        };
    }
  };

  const formatTimeAgo = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markNotificationRead(notif.id);
    }
    if (notif.actionTab && onNavigateTab) {
      onNavigateTab(notif.actionTab as NavTabId);
      window.location.hash = notif.actionTab;
    }
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Default fallback based on role
    const fallbackTab = currentRole === 'client' ? 'home' : currentRole === 'technician' ? 'jobs' : 'dashboard';
    if (onNavigateTab) {
      onNavigateTab(fallbackTab as NavTabId);
    }
    window.location.hash = fallbackTab;
  };

  const renderNotificationCard = (notif: AppNotification) => {
    const isUrgent =
      notif.priority === 'critical' || notif.priority === 'urgent' || notif.category === 'emergency';
    const meta = getCategoryMeta(notif.category, notif.priority);

    return (
      <div
        key={notif.id}
        className={`rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
          !notif.isRead
            ? isUrgent
              ? 'bg-rose-50/50 hover:bg-rose-50/80 border-rose-200 border-l-4 border-l-rose-600 shadow-sm'
              : 'bg-blue-50/40 hover:bg-blue-50/70 border-blue-200/80 border-l-4 border-l-[#1976D2] shadow-sm'
            : 'bg-white hover:bg-slate-50/80 border-slate-200/80 border-l-4 border-l-slate-300'
        }`}
      >
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
          {/* Category Icon Badge */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${meta.iconBg}`}
          >
            {meta.icon}
          </div>

          {/* Main Content Body */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Tag */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${meta.badgeBg}`}
                >
                  {meta.label}
                </span>

                {/* Urgent Pill */}
                {isUrgent && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Urgent</span>
                  </span>
                )}

                {/* Priority Tag (High/Normal) */}
                {!isUrgent && notif.priority === 'high' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    High Priority
                  </span>
                )}

                {/* Unread indicator */}
                {!notif.isRead ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Unread</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-slate-400" />
                    <span>Read</span>
                  </span>
                )}
              </div>

              {/* Time Ago */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatTimeAgo(notif.timestamp)}</span>
              </div>
            </div>

            {/* Title */}
            <h3
              onClick={() => handleActionClick(notif)}
              className={`text-sm sm:text-base font-bold mt-2 leading-snug cursor-pointer transition-colors ${
                !notif.isRead
                  ? 'text-slate-900 group-hover:text-[#1976D2]'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {notif.title}
            </h3>

            {/* Message Body */}
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {notif.message}
            </p>

            {/* Metadata Tags: Ticket #, Lift #, Building Name */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {notif.ticketNumber && (
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                  <span>Ticket:</span>
                  <span className="text-blue-700">#{notif.ticketNumber}</span>
                </span>
              )}

              {notif.liftNumber && (
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>{notif.liftNumber}</span>
                </span>
              )}

              {notif.buildingName && (
                <span className="text-[11px] text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{notif.buildingName}</span>
                </span>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              {/* Primary Action Button (if configured) */}
              {notif.actionTab ? (
                <button
                  type="button"
                  onClick={() => handleActionClick(notif)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                    isUrgent
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                      : 'bg-[#1976D2] hover:bg-blue-700 text-white shadow-blue-200'
                  }`}
                >
                  <span>{notif.actionLabel || 'View Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div />
              )}

              {/* Secondary Controls: Mark Read/Unread & Delete */}
              <div className="flex items-center gap-2 ml-auto">
                {!notif.isRead ? (
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(notif.id);
                      if (isSoundEnabled) playNotificationSound('markRead');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-bold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mark as Read</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium italic px-2 py-1 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Read</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => deleteNotification(notif.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Remove notification"
                  aria-label="Remove alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in pb-16 max-w-7xl mx-auto w-full">
      {/* 1. Top Navigation Bar with Back Button & Brand Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>Back</span>
          </button>

          {/* WEPSUN Original Shield Logo & Title */}
          <div className="flex items-center gap-3 pl-1 border-l border-slate-200">
            <GeometricBlueWLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-[#0b2545] tracking-tight leading-none">
                  WEPSUN Notification Hub
                </h1>
                {unreadNotificationsCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    <span>{unreadNotificationsCount} Active</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Elevator Dispatch, Maintenance & Operational Alert Feed
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Sound Chime, Mark All Read, Clear */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap ml-auto">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleSound();
              if (!isSoundEnabled) playNotificationSound('standard');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              isSoundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
            title={isSoundEnabled ? 'Audio Alerts: ON (click to mute)' : 'Audio Alerts: MUTED (click to enable)'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isSoundEnabled ? 'Audio: ON' : 'Audio: MUTED'}</span>
          </button>

          {/* Mark All as Read Button */}
          <button
            type="button"
            onClick={markAllNotificationsRead}
            disabled={dynamicCounts.unread === 0}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-[#1976D2] text-white font-bold text-xs sm:text-sm border border-blue-600 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-4 h-4 text-white" />
            <span>Mark All as Read</span>
          </button>

          {/* Clear All Button */}
          <button
            type="button"
            onClick={() => {
              showDeleteModal(
                'Clear All Visible Notifications?',
                'This will clear all notifications currently stored in your notification center.',
                () => {
                  clearAllNotifications();
                }
              );
            }}
            disabled={dynamicCounts.all === 0}
            className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 font-bold text-xs border border-slate-200 hover:border-rose-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title="Clear all notifications"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Royal Corporate Light Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Alerts Card */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs select-none active:scale-[0.99] ${
            statusFilter === 'all'
              ? 'bg-white border-[#1976D2] ring-2 ring-blue-100 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{dynamicCounts.all}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">Total Notifications Feed</div>
        </div>

        {/* Unread Alerts Card */}
        <div
          onClick={() => setStatusFilter('unread')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs select-none active:scale-[0.99] ${
            statusFilter === 'unread'
              ? 'bg-blue-50/50 border-[#1976D2] ring-2 ring-blue-200 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Unread</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1976D2] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#1976D2]">{dynamicCounts.unread}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">Requires Your Attention</div>
        </div>

        {/* Urgent / Critical Card */}
        <div
          onClick={() => setStatusFilter('urgent')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs select-none active:scale-[0.99] ${
            statusFilter === 'urgent'
              ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-200 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Urgent</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{dynamicCounts.urgent}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">Breakdown SOS & Critical</div>
        </div>

        {/* Read Card */}
        <div
          onClick={() => setStatusFilter('read')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs select-none active:scale-[0.99] ${
            statusFilter === 'read'
              ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-200 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Read</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{dynamicCounts.read}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">Acknowledged Alerts</div>
        </div>
      </div>

      {/* 3. Primary Filter Tabs (All, Unread, Urgent, Read) & Search Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top: 4 Primary Status Filters (All, Unread, Urgent, Read) */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            {/* 1. All */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                statusFilter === 'all'
                  ? 'bg-[#1976D2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/90'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>All</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {dynamicCounts.all}
              </span>
            </button>

            {/* 2. Unread */}
            <button
              type="button"
              onClick={() => setStatusFilter('unread')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                statusFilter === 'unread'
                  ? 'bg-[#1976D2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/90'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Unread</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  statusFilter === 'unread' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {dynamicCounts.unread}
              </span>
            </button>

            {/* 3. Urgent */}
            <button
              type="button"
              onClick={() => setStatusFilter('urgent')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                statusFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Urgent</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  statusFilter === 'urgent' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
                }`}
              >
                {dynamicCounts.urgent}
              </span>
            </button>

            {/* 4. Read */}
            <button
              type="button"
              onClick={() => setStatusFilter('read')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                statusFilter === 'read'
                  ? 'bg-[#1976D2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/90'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Read</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  statusFilter === 'read' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {dynamicCounts.read}
              </span>
            </button>
          </div>

          {/* Reset Filters Shortcut (if non-default) */}
          {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#1976D2] hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Live Search and Category Pills Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Live Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket, lift #, building name, or issue description..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#1976D2] focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 text-xs font-bold">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'emergency', label: '🚨 SOS' },
              { id: 'complaints', label: '⚠️ Breakdowns' },
              { id: 'technicians', label: '👨‍🔧 Engineers' },
              { id: 'pm', label: '🗓️ PM' },
              { id: 'amc', label: '🛡️ AMC' },
              { id: 'finance', label: '💰 Billing' },
              { id: 'inventory', label: '📦 Parts' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Filtered Notification Items Feed */}
      <div className="space-y-6">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1976D2] flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-[#1976D2]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">All Caught Up!</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {statusFilter === 'unread'
                ? 'You have zero unread notifications. All field alerts have been reviewed.'
                : statusFilter === 'urgent'
                ? 'No urgent or critical breakdown alerts require immediate dispatch.'
                : statusFilter === 'read'
                ? 'No acknowledged notifications found in this view.'
                : 'No notifications match your current filter or search criteria.'}
            </p>
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="mt-5 px-4 py-2 rounded-xl bg-[#1976D2] text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                View All Notifications
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Today Section */}
            {groupedNotifications.today.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Today ({groupedNotifications.today.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {groupedNotifications.today.map(renderNotificationCard)}
                </div>
              </div>
            )}

            {/* Yesterday Section */}
            {groupedNotifications.yesterday.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Yesterday ({groupedNotifications.yesterday.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {groupedNotifications.yesterday.map(renderNotificationCard)}
                </div>
              </div>
            )}

            {/* Earlier Section */}
            {groupedNotifications.earlier.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Earlier ({groupedNotifications.earlier.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {groupedNotifications.earlier.map(renderNotificationCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
