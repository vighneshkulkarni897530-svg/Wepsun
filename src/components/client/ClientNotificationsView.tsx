import React, { useState } from 'react';
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
} from 'lucide-react';
import { ClientNotification } from '../../types';
import { useApp } from '../../context/AppContext';

interface ClientNotificationsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ClientNotificationsView: React.FC<ClientNotificationsViewProps> = ({ onNavigateTab }) => {
  const { clientScopedNotifications, markNotificationRead, clearAllNotifications } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredNotifications = clientScopedNotifications.filter((n) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'unread') return !n.isRead;
    return n.category === filterCategory;
  });

  const unreadCount = clientScopedNotifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (category: ClientNotification['category']) => {
    switch (category) {
      case 'complaint':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'technician':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'pm':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'amc':
        return <FileCheck2 className="w-4 h-4 text-purple-600" />;
      case 'quotation':
        return <FileSpreadsheet className="w-4 h-4 text-amber-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleNotificationClick = (n: ClientNotification) => {
    markNotificationRead(n.id);
    if (n.actionTab && onNavigateTab) {
      onNavigateTab(n.actionTab);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] shadow-sm shrink-0">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase bg-blue-100 text-[#1976D2] px-2.5 py-0.5 rounded-full">
                Notification Center
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold font-mono bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Activity & Service Alerts</h1>
            <p className="text-xs text-slate-500">
              Live automated alerts for technician dispatch, PM schedules, AMC renewals, and financial milestones
            </p>
          </div>
        </div>

        {clientScopedNotifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'technician', label: 'Technicians' },
          { id: 'complaint', label: 'Complaints' },
          { id: 'pm', label: 'Maintenance (PM)' },
          { id: 'amc', label: 'AMC Contracts' },
          { id: 'quotation', label: 'Quotations' },
          { id: 'payment', label: 'Payments' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
              filterCategory === tab.id
                ? 'bg-[#1976D2] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="font-bold text-sm text-slate-700">All Caught Up!</p>
          <p className="text-xs text-slate-400">You have no unread alerts in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-4 shadow-xs ${
                !notif.isRead
                  ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-300/50'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#1976D2]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>
                  <span className="text-[11px] font-mono text-slate-400 block pt-1">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {notif.actionTab && (
                <button
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-[#1976D2] text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
