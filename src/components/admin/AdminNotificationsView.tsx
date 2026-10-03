import React, { useState } from 'react';
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
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type:
    | 'complaint_assigned'
    | 'tech_assigned'
    | 'amc_expiring'
    | 'pm_due'
    | 'quotation_received'
    | 'quotation_approved'
    | 'payment_received'
    | 'service_completed';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  ticketId?: string;
  priority?: 'critical' | 'high' | 'normal';
}

export const AdminNotificationsView: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'complaint_assigned',
      title: '🔔 New Complaint Assigned',
      message: 'Complaint #CMP-10245 (Door sensor alignment) assigned to Technician Raj Kumar at Skyline Towers.',
      time: '10 mins ago',
      isRead: false,
      ticketId: '#CMP-10245',
      priority: 'high',
    },
    {
      id: 'notif-2',
      type: 'tech_assigned',
      title: '🔔 Technician Assigned',
      message: 'Technician Ajay Singh assigned to Emergency Breakdown #EMG-10021 at Royal Residency.',
      time: '25 mins ago',
      isRead: false,
      ticketId: '#EMG-10021',
      priority: 'critical',
    },
    {
      id: 'notif-3',
      type: 'amc_expiring',
      title: '🔔 AMC Expiring Soon',
      message: 'Skyline Heights CHS Comprehensive AMC contract expires in 5 days (31 Dec 2026). Renewal proposal generated.',
      time: '2 hours ago',
      isRead: false,
      ticketId: '#AMC-2026',
      priority: 'high',
    },
    {
      id: 'notif-4',
      type: 'pm_due',
      title: '🔔 PM Due',
      message: 'Monthly 28-Point Preventive Maintenance visit scheduled for 15 October 2026 across 5 lifts at Sunrise Apartments.',
      time: '4 hours ago',
      isRead: true,
      ticketId: '#PM-102',
      priority: 'normal',
    },
    {
      id: 'notif-5',
      type: 'quotation_received',
      title: '🔔 Quotation Received',
      message: 'Quotation #QT-10025 for Door Sensor Replacement (₹2,950 incl. GST) submitted for client review.',
      time: '6 hours ago',
      isRead: true,
      ticketId: '#QT-10025',
      priority: 'normal',
    },
    {
      id: 'notif-6',
      type: 'quotation_approved',
      title: '🔔 Quotation Approved',
      message: 'Society Chairman Arvind Joshi approved Quotation #QT-10025. Work Order dispatched to technician inventory.',
      time: 'Yesterday',
      isRead: true,
      ticketId: '#QT-10025',
      priority: 'normal',
    },
    {
      id: 'notif-7',
      type: 'payment_received',
      title: '🔔 Payment Received',
      message: 'Online Payment of ₹2,950 received via UPI for Invoice #INV-10025. Receipt automatically mailed to customer.',
      time: 'Yesterday',
      isRead: true,
      ticketId: '#INV-10025',
      priority: 'normal',
    },
    {
      id: 'notif-8',
      type: 'service_completed',
      title: '🔔 Service Completed',
      message: 'Technician Raj Kumar closed Service Report #SR-10025 with verified client digital signature & 5-star rating.',
      time: '2 days ago',
      isRead: true,
      ticketId: '#SR-10025',
      priority: 'normal',
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'complaints') return n.type === 'complaint_assigned' || n.type === 'tech_assigned';
    if (filter === 'amc') return n.type === 'amc_expiring' || n.type === 'pm_due';
    if (filter === 'billing') return n.type === 'quotation_received' || n.type === 'quotation_approved' || n.type === 'payment_received';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'complaint_assigned':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'tech_assigned':
        return <HardHat className="w-5 h-5 text-blue-500" />;
      case 'amc_expiring':
        return <ShieldCheck className="w-5 h-5 text-red-500" />;
      case 'pm_due':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'quotation_received':
      case 'quotation_approved':
        return <FileSpreadsheet className="w-5 h-5 text-purple-500" />;
      case 'payment_received':
        return <Receipt className="w-5 h-5 text-emerald-500" />;
      case 'service_completed':
        return <CheckCircle2 className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#1976D2]" />
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time automated alerts across complaints, technicians, AMC renewals, quotations, and payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#1976D2]" />
            <span>Mark All as Read</span>
          </button>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-600 font-bold text-xs shadow-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-thin text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'all' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'unread' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
        <button
          onClick={() => setFilter('complaints')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'complaints' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Complaints & Dispatch
        </button>
        <button
          onClick={() => setFilter('amc')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'amc' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          AMC & PM Visits
        </button>
        <button
          onClick={() => setFilter('billing')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'billing' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Quotations & Invoices
        </button>
      </div>

      {/* Notification Stream matching the 8 exact examples */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-sm">No notifications in this view.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                notif.isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-blue-50/30 hover:bg-blue-50/50'
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                {getIcon(notif.type)}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {notif.time}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                {notif.ticketId && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {notif.ticketId}
                    </span>
                    {notif.priority && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          notif.priority === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : notif.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {notif.priority}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
