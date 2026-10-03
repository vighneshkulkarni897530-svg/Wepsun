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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationPriority, NotificationCategory } from '../../types';
import { playNotificationSound } from '../../utils/notificationSound';
import { NavTabId } from '../layout/Sidebar';

interface AdminNotificationsViewProps {
  onNavigateTab?: (tab: NavTabId | string) => void;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({ onNavigateTab }) => {
  const {
    roleNotifications,
    unreadNotificationsCount,
    criticalNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    isSoundEnabled,
    toggleSound,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Filter logic
  const filteredNotifications = useMemo(() => {
    return roleNotifications.filter((n) => {
      // Category filter
      if (selectedCategory === 'unread' && n.isRead) return false;
      if (selectedCategory === 'emergency' && n.category !== 'emergency') return false;
      if (selectedCategory === 'complaints' && n.category !== 'complaint' && n.category !== 'emergency') return false;
      if (selectedCategory === 'technicians' && n.category !== 'technician') return false;
      if (selectedCategory === 'amc_pm' && n.category !== 'amc' && n.category !== 'pm') return false;
      if (selectedCategory === 'billing' && n.category !== 'quotation' && n.category !== 'payment') return false;
      if (selectedCategory === 'inventory' && n.category !== 'inventory') return false;

      // Priority filter
      if (selectedPriority !== 'all' && n.priority !== selectedPriority) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches =
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          (n.buildingName && n.buildingName.toLowerCase().includes(query)) ||
          (n.ticketNumber && n.ticketNumber.toLowerCase().includes(query)) ||
          (n.liftNumber && n.liftNumber.toLowerCase().includes(query));
        if (!matches) return false;
      }

      return true;
    });
  }, [roleNotifications, selectedCategory, selectedPriority, searchQuery]);

  // Group notifications by time window (Today, Yesterday, Older)
  const groupedNotifications = useMemo(() => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const older: AppNotification[] = [];

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
        older.push(notif);
      }
    });

    return { today, yesterday, older };
  }, [filteredNotifications]);

  const getCategoryBadge = (category: NotificationCategory, priority: NotificationPriority) => {
    const isUrgent = priority === 'critical' || priority === 'urgent';

    switch (category) {
      case 'emergency':
        return {
          icon: <Zap className="w-4 h-4 text-rose-600 animate-pulse" />,
          label: 'Emergency SOS',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
        };
      case 'complaint':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          label: 'Breakdown Ticket',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
        };
      case 'technician':
        return {
          icon: <HardHat className="w-4 h-4 text-blue-600" />,
          label: 'Tech Dispatch',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
        };
      case 'pm':
        return {
          icon: <Calendar className="w-4 h-4 text-indigo-600" />,
          label: 'PM Inspection',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-600 border-indigo-200',
        };
      case 'amc':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
          label: 'AMC Contract',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-600 border-purple-200',
        };
      case 'quotation':
        return {
          icon: <FileSpreadsheet className="w-4 h-4 text-amber-600" />,
          label: 'Quotation',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
        };
      case 'payment':
        return {
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
          label: 'Payment Verified',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        };
      case 'inventory':
        return {
          icon: <Package className="w-4 h-4 text-teal-600" />,
          label: 'Inventory Stock',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
          iconBg: 'bg-teal-100 text-teal-600 border-teal-200',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          label: 'System Alert',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
  };

  const formatTimeAgo = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.actionTab && onNavigateTab) {
      onNavigateTab(notif.actionTab);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0E2238] via-[#123B5D] to-[#0E2238] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-blue-300 shadow-inner shrink-0 mt-1">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-0.5 rounded-full">
                Operations & Dispatch Alerts
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-rose-500/90 text-white px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{unreadNotificationsCount} Unread</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              Notification Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Real-time automated alerts for passenger emergency entrapments, technician GPS dispatch, AMC contract renewals, and payment milestones.
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              toggleSound();
              if (!isSoundEnabled) playNotificationSound('standard');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              isSoundEnabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/10 border-white/15 text-slate-400 hover:bg-white/20'
            }`}
            title="Toggle audio chimes for incoming alerts"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSoundEnabled ? 'Audio: ON' : 'Audio: MUTED'}</span>
          </button>

          {/* Mark All Read */}
          <button
            onClick={markAllNotificationsRead}
            disabled={unreadNotificationsCount === 0}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-blue-300" />
            <span>Mark All Read</span>
          </button>

          {/* Clear All */}
          <button
            onClick={() => {
              if (window.confirm('Clear all visible notifications?')) {
                clearAllNotifications();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 font-bold text-xs border border-white/10 hover:border-rose-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Alerts */}
        <div
          onClick={() => {
            setSelectedCategory('all');
            setSelectedPriority('all');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedCategory === 'all' && selectedPriority === 'all'
              ? 'bg-white border-[#1976D2] ring-2 ring-blue-100 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{roleNotifications.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all tenants & departments</p>
        </div>

        {/* Unread Alerts */}
        <div
          onClick={() => setSelectedCategory('unread')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedCategory === 'unread'
              ? 'bg-blue-50/50 border-[#1976D2] ring-2 ring-blue-200 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Unread Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{unreadNotificationsCount}</div>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Pending admin review or action</p>
        </div>

        {/* Critical & Emergency */}
        <div
          onClick={() => {
            setSelectedCategory('all');
            setSelectedPriority('critical');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedPriority === 'critical'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Emergency SOS</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 flex items-center gap-2">
            <span>{criticalNotificationsCount}</span>
            {criticalNotificationsCount > 0 && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-bounce">
                Action Req.
              </span>
            )}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Urgent elevator breakdowns</p>
        </div>

        {/* AMC Expiring & Billing */}
        <div
          onClick={() => setSelectedCategory('amc_pm')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedCategory === 'amc_pm'
              ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">AMC & Contracts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700">
            {roleNotifications.filter((n) => n.category === 'amc' || n.category === 'pm').length}
          </div>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Renewals & PM safety audits</p>
        </div>
      </div>

      {/* Filter Toolbar: Search + Category Pills + Priority Filter */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket (#CMP), building, lift, technician..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Priority:</span>
            </span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-2 px-3 rounded-xl focus:border-[#1976D2] focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">🚨 Critical / Emergency</option>
              <option value="high">⚠️ High Priority</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pt-1 pb-0.5 text-xs font-bold">
          {[
            { id: 'all', label: 'All Alerts', count: roleNotifications.length },
            { id: 'unread', label: 'Unread', count: unreadNotificationsCount },
            { id: 'emergency', label: '🚨 Emergency SOS', count: roleNotifications.filter((n) => n.category === 'emergency').length },
            { id: 'complaints', label: 'Breakdowns', count: roleNotifications.filter((n) => n.category === 'complaint').length },
            { id: 'technicians', label: '👨‍🔧 Technicians', count: roleNotifications.filter((n) => n.category === 'technician').length },
            { id: 'amc_pm', label: '🛡️ AMC & PM Visits', count: roleNotifications.filter((n) => n.category === 'amc' || n.category === 'pm').length },
            { id: 'billing', label: '💰 Quotes & Payments', count: roleNotifications.filter((n) => n.category === 'quotation' || n.category === 'payment').length },
            { id: 'inventory', label: '📦 Inventory', count: roleNotifications.filter((n) => n.category === 'inventory').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-[#1976D2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Notifications Match Filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, priority filter, or category tabs to see other field alerts.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedPriority('all');
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section: Today */}
          {groupedNotifications.today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Today
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {groupedNotifications.today.length}
                </span>
                <div className="flex-1 h-px bg-slate-200/80" />
              </div>

              <div className="space-y-2.5">
                {groupedNotifications.today.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    getCategoryBadge={getCategoryBadge}
                    formatTimeAgo={formatTimeAgo}
                    onActionClick={handleActionClick}
                    onMarkRead={markNotificationRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Yesterday */}
          {groupedNotifications.yesterday.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Yesterday
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {groupedNotifications.yesterday.length}
                </span>
                <div className="flex-1 h-px bg-slate-200/80" />
              </div>

              <div className="space-y-2.5">
                {groupedNotifications.yesterday.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    getCategoryBadge={getCategoryBadge}
                    formatTimeAgo={formatTimeAgo}
                    onActionClick={handleActionClick}
                    onMarkRead={markNotificationRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Older */}
          {groupedNotifications.older.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Earlier This Month
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {groupedNotifications.older.length}
                </span>
                <div className="flex-1 h-px bg-slate-200/80" />
              </div>

              <div className="space-y-2.5">
                {groupedNotifications.older.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    getCategoryBadge={getCategoryBadge}
                    formatTimeAgo={formatTimeAgo}
                    onActionClick={handleActionClick}
                    onMarkRead={markNotificationRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Reusable Rich Notification Card
interface NotificationCardProps {
  notif: AppNotification;
  getCategoryBadge: (cat: NotificationCategory, prio: NotificationPriority) => any;
  formatTimeAgo: (t: string) => string;
  onActionClick: (n: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notif,
  getCategoryBadge,
  formatTimeAgo,
  onActionClick,
  onMarkRead,
  onDelete,
}) => {
  const badgeInfo = getCategoryBadge(notif.category, notif.priority);
  const isUrgent = notif.priority === 'critical' || notif.priority === 'urgent';
  const isHigh = notif.priority === 'high';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs group relative overflow-hidden ${
        !notif.isRead
          ? isUrgent
            ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200/80'
            : isHigh
            ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-100'
            : 'bg-blue-50/30 border-blue-200 ring-1 ring-blue-100/60'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Accent left line indicating priority */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isUrgent
            ? 'bg-rose-600'
            : isHigh
            ? 'bg-amber-500'
            : notif.category === 'technician'
            ? 'bg-blue-500'
            : notif.category === 'amc'
            ? 'bg-purple-500'
            : notif.category === 'payment'
            ? 'bg-emerald-500'
            : 'bg-slate-300'
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Icon + Body Content */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 ${badgeInfo.iconBg}`}
          >
            {badgeInfo.icon}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Header badges & title */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeInfo.badgeClass}`}
              >
                {badgeInfo.label}
              </span>

              {isUrgent && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                  CRITICAL
                </span>
              )}

              {isHigh && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  HIGH
                </span>
              )}

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
              )}
            </div>

            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
              {notif.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {notif.message}
            </p>

            {/* Context chips */}
            <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
              {notif.ticketNumber && (
                <span className="inline-flex items-center gap-1 font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <span>#{notif.ticketNumber}</span>
                </span>
              )}

              {notif.buildingName && (
                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/80 text-[11px] font-medium">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{notif.buildingName}</span>
                </span>
              )}

              {notif.liftNumber && (
                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/80 text-[11px] font-mono">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>{notif.liftNumber}</span>
                </span>
              )}

              {notif.amount && (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px] font-bold font-mono">
                  <span>₹{notif.amount.toLocaleString('en-IN')}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-mono ml-auto sm:ml-0">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(notif.timestamp)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
          {notif.actionTab && (
            <button
              onClick={() => onActionClick(notif)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isUrgent
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#1976D2] hover:bg-blue-700 text-white'
              }`}
            >
              <span>{notif.actionLabel || 'View Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {!notif.isRead ? (
            <button
              onClick={() => onMarkRead(notif.id)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Mark as read"
            >
              <Check className="w-4 h-4 text-emerald-600" />
            </button>
          ) : (
            <button
              onClick={() => onMarkRead(notif.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Mark as read"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
            </button>
          )}

          <button
            onClick={() => onDelete(notif.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
