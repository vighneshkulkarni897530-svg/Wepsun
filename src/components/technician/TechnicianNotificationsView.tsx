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
} from 'lucide-react';
import { TechNotificationItem } from '../../types';

interface TechnicianNotificationsViewProps {
  notifications: TechNotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectJobId?: (jobId: string) => void;
}

const NOTIF_ICONS: Record<TechNotificationItem['type'], React.ReactNode> = {
  emergency_call: <Zap className="w-4 h-4 text-rose-500 animate-pulse" />,
  job_assigned: <Calendar className="w-4 h-4 text-blue-500" />,
  job_rescheduled: <Clock className="w-4 h-4 text-amber-500" />,
  client_clarification: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  job_reminder: <Clock className="w-4 h-4 text-indigo-500" />,
  parts_issued: <Package className="w-4 h-4 text-teal-500" />,
  job_completion: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  otp_confirmation: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
  service_report_generated: <FileCheck2 className="w-4 h-4 text-purple-500" />,
};

export const TechnicianNotificationsView: React.FC<TechnicianNotificationsViewProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onSelectJobId,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'urgent') return n.priority === 'urgent' || n.type === 'emergency_call';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Technician Notifications</h2>
              <p className="text-xs text-slate-500">
                Live alerts for emergency calls, dispatched jobs, parts issuance and client sign-offs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#123B5D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-[#1976D2] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'urgent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Urgent / Emergency
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Notifications</h3>
          <p className="text-xs text-slate-500">You're all caught up with your field activity.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex items-start justify-between gap-4 ${
                !item.isRead
                  ? 'border-sky-300 bg-sky-50/20 ring-1 ring-sky-200/60'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {NOTIF_ICONS[item.type]}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    {item.priority === 'urgent' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                        URGENT
                      </span>
                    )}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#1976D2]" />
                    )}
                  </div>

                  <p className="text-slate-600 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.isRead && (
                  <button
                    onClick={() => onMarkAsRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {item.jobId && onSelectJobId && (
                  <button
                    onClick={() => onSelectJobId(item.jobId!)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <span>View Job</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
