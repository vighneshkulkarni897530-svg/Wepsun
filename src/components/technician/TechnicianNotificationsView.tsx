import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Package,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TechNotificationItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { playNotificationSound } from '../../utils/notificationSound';

interface TechnicianNotificationsViewProps {
  notifications: TechNotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectJobId?: (jobId: string) => void;
}

const NOTIF_ICONS: Record<TechNotificationItem['type'], React.ReactNode> = {
  emergency_call: <Zap className="w-5 h-5 text-rose-600 animate-pulse" />,
  job_assigned: <Calendar className="w-5 h-5 text-blue-600" />,
  job_rescheduled: <Clock className="w-5 h-5 text-amber-600" />,
  client_clarification: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  job_reminder: <Clock className="w-5 h-5 text-indigo-600" />,
  parts_issued: <Package className="w-5 h-5 text-teal-600" />,
  job_completion: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  otp_confirmation: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
  service_report_generated: <FileCheck2 className="w-5 h-5 text-purple-600" />,
};

export const TechnicianNotificationsView: React.FC<TechnicianNotificationsViewProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onSelectJobId,
}) => {
  const { isSoundEnabled, toggleSound } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'urgent') return n.priority === 'urgent' || n.type === 'emergency_call';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const urgentCount = notifications.filter((n) => n.priority === 'urgent' || n.type === 'emergency_call').length;

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) onMarkAsRead(n.id);
    });
    playNotificationSound('markRead');
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
                Field Engineer Desk
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-mono font-bold bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Technician Notifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5 leading-relaxed">
              Instant field alerts for hospital emergencies, passenger entrapments, dispatched work orders, and warehouse parts issuance.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
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
            title="Toggle audio alerts"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSoundEnabled ? 'Audio: ON' : 'MUTED'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-4 h-4 text-blue-300" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={onClearAll}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#0E2238] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-[#1976D2] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        {urgentCount > 0 && (
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'urgent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>Urgent / SOS ({urgentCount})</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-2xs space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1976D2] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-xs text-slate-500">You have no pending alerts or emergency dispatches.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUrgent = item.priority === 'urgent' || item.type === 'emergency_call';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs relative ${
                  isUrgent
                    ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-200/80 border-l-4 border-l-rose-600'
                    : !item.isRead
                    ? 'border-blue-200 bg-blue-50/40 ring-1 ring-blue-200/60 border-l-4 border-l-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5 ${
                      isUrgent
                        ? 'bg-rose-100 border-rose-200'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {NOTIF_ICONS[item.type]}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUrgent && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                          EMERGENCY SOS
                        </span>
                      )}
                      {item.priority === 'high' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          HIGH
                        </span>
                      )}
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#1976D2] shrink-0" title="Unread" />
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {item.message}
                    </p>

                    <div className="pt-1 flex items-center gap-2 text-xs">
                      {item.jobId && (
                        <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                          #{item.jobId}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!item.isRead && (
                    <button
                      onClick={() => onMarkAsRead(item.id)}
                      title="Mark as read"
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-600 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {item.jobId && onSelectJobId && (
                    <button
                      onClick={() => onSelectJobId(item.jobId!)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        isUrgent
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-[#0E2238] hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{isUrgent ? 'Respond to Emergency' : 'View Job'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
