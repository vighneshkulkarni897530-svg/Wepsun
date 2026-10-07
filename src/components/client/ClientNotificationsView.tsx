import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  FileSpreadsheet,
  CreditCard,
  Wrench,
  Clock,
  Trash2,
  Calendar,
  ExternalLink,
  CheckCheck,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Building,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playNotificationSound } from '../../utils/notificationSound';

interface ClientNotificationsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ClientNotificationsView: React.FC<ClientNotificationsViewProps> = ({ onNavigateTab }) => {
  const {
    roleNotifications,
    unreadNotificationsCount,
    criticalNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    isSoundEnabled,
    toggleSound,
    showDeleteModal,
  } = useApp();

  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredNotifications = useMemo(() => {
    return roleNotifications.filter((n) => {
      if (filterCategory === 'all') return true;
      if (filterCategory === 'unread') return !n.isRead;
      if (filterCategory === 'technician') return n.category === 'technician';
      if (filterCategory === 'complaint') return n.category === 'complaint' || n.category === 'emergency';
      if (filterCategory === 'pm') return n.category === 'pm';
      if (filterCategory === 'amc') return n.category === 'amc';
      if (filterCategory === 'finance') return n.category === 'quotation' || n.category === 'payment';
      return true;
    });
  }, [roleNotifications, filterCategory]);

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case 'emergency':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />,
          label: 'Emergency Alert',
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          borderLeft: 'border-l-rose-600',
        };
      case 'complaint':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          label: 'Breakdown Ticket',
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          borderLeft: 'border-l-amber-500',
        };
      case 'technician':
        return {
          icon: <Wrench className="w-5 h-5 text-blue-600" />,
          label: 'Technician Update',
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          borderLeft: 'border-l-blue-600',
        };
      case 'pm':
        return {
          icon: <Calendar className="w-5 h-5 text-indigo-600" />,
          label: 'Safety PM Audit',
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          borderLeft: 'border-l-indigo-600',
        };
      case 'amc':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
          label: 'AMC Protection',
          bg: 'bg-purple-50 border-purple-200 text-purple-700',
          borderLeft: 'border-l-purple-600',
        };
      case 'quotation':
        return {
          icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" />,
          label: 'Quotation Ready',
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          borderLeft: 'border-l-amber-500',
        };
      case 'payment':
        return {
          icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
          label: 'Payment & Receipt',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          borderLeft: 'border-l-emerald-600',
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-slate-600" />,
          label: 'Service Notice',
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          borderLeft: 'border-l-slate-400',
        };
    }
  };

  const handleNotificationClick = (notifId: string, actionTab?: string) => {
    markNotificationRead(notifId);
    if (actionTab && onNavigateTab) {
      onNavigateTab(actionTab);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0E2238] via-[#123B5D] to-[#0E2238] rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-0.5 rounded-full">
                Society & Building Hub
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadNotificationsCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Activity & Service Alerts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5 leading-relaxed">
              Stay informed with real-time engineer arrivals, scheduled monthly maintenance checks, contract renewals, and payment receipts.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              toggleSound();
              if (!isSoundEnabled) playNotificationSound('standard');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isSoundEnabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/10 border-white/15 text-slate-400 hover:bg-white/20'
            }`}
            title="Toggle notification chime"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSoundEnabled ? 'Chimes: ON' : 'MUTED'}</span>
          </button>

          {/* Mark All Read */}
          <button
            onClick={markAllNotificationsRead}
            disabled={unreadNotificationsCount === 0}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-blue-300" />
            <span>Mark All Read</span>
          </button>

          {/* Clear All */}
          {roleNotifications.length > 0 && (
            <button
              onClick={() => {
                showDeleteModal(
                  'Clear All Alerts?',
                  'This will remove all notification records for your account.',
                  () => {
                    clearAllNotifications();
                  }
                );
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs font-bold">
        {[
          { id: 'all', label: 'All Alerts', count: roleNotifications.length },
          { id: 'unread', label: 'Unread', count: unreadNotificationsCount },
          { id: 'technician', label: '👨‍🔧 Engineers', count: roleNotifications.filter((n) => n.category === 'technician').length },
          { id: 'complaint', label: '🚨 Breakdowns', count: roleNotifications.filter((n) => n.category === 'complaint' || n.category === 'emergency').length },
          { id: 'pm', label: '🗓️ Monthly PM', count: roleNotifications.filter((n) => n.category === 'pm').length },
          { id: 'amc', label: '🛡️ AMC Contract', count: roleNotifications.filter((n) => n.category === 'amc').length },
          { id: 'finance', label: '💰 Quotes & Payments', count: roleNotifications.filter((n) => n.category === 'quotation' || n.category === 'payment').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filterCategory === tab.id
                ? 'bg-[#1976D2] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterCategory === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-2.5 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900">All Caught Up!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no active alerts in this category. We will notify you when a technician is dispatched or an inspection is due.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const cat = getCategoryDetails(notif.category);
            const isUrgent = notif.priority === 'critical' || notif.priority === 'urgent';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id, notif.actionTab)}
                className={`p-4 sm:p-5 rounded-2xl border-l-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group relative ${
                  cat.borderLeft
                } ${
                  !notif.isRead
                    ? isUrgent
                      ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200/50'
                      : 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-200/50'
                    : 'bg-white border-slate-200/90 hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 ${cat.bg}`}
                  >
                    {cat.icon}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cat.bg}`}
                      >
                        {cat.label}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                          CRITICAL
                        </span>
                      )}
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#1976D2] shrink-0" title="Unread" />
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {notif.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {notif.message}
                    </p>

                    {/* Metadata tags */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                      {notif.buildingName && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{notif.buildingName}</span>
                        </span>
                      )}
                      {notif.liftNumber && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-mono">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{notif.liftNumber}</span>
                        </span>
                      )}
                      {notif.ticketNumber && (
                        <span className="inline-flex items-center gap-1 font-mono font-bold bg-blue-50 text-[#1976D2] px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                          <span>#{notif.ticketNumber}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-mono ml-auto sm:ml-0">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notif.timestamp).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                {notif.actionTab && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-2xs ${
                        isUrgent
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-[#1976D2] hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>{notif.actionLabel || 'View Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
