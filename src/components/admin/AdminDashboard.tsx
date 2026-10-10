import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Package,
  Users,
  Compass,
  FileText,
  History,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LiftDirectory } from './LiftDirectory';
import { ComplaintManager } from './ComplaintManager';
import { AmcManager } from './AmcManager';
import { QuotationManager } from './QuotationManager';
import { WorkOrderManager } from './WorkOrderManager';
import { InventoryManager } from './InventoryManager';
import { TechnicianPerformance } from './TechnicianPerformance';
import { LiveTechnicianRadar } from './LiveTechnicianRadar';
import { AuditLogViewer } from './AuditLogViewer';
import { RaiseComplaintModal } from '../client/RaiseComplaintModal';

export const AdminDashboard: React.FC = () => {
  const {
    tenantLifts,
    tenantComplaints,
    tenantAmcContracts,
    tenantQuotations,
    tenantWorkOrders,
    tenantInventory,
    activeCompany,
    activeBranchId,
    branches,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'complaints'
    | 'work_orders'
    | 'lifts'
    | 'amc'
    | 'quotations'
    | 'inventory'
    | 'technicians'
    | 'radar'
    | 'audit_logs'
  >('overview');

  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);

  // Key metrics
  const totalLifts = tenantLifts.length;
  const activeAmcs = tenantAmcContracts.filter(
    (a) => a.status === 'active' || a.status === 'expiring_soon'
  ).length;
  const openComplaints = tenantComplaints.filter((c) => c.status !== 'closed');
  const criticalComplaints = openComplaints.filter(
    (c) => c.isEmergency || c.priority === 'critical'
  );
  const activeWorkOrders = tenantWorkOrders.filter(
    (w) => w.status !== 'completed' && w.status !== 'cancelled'
  );
  const lowStockItems = tenantInventory.filter(
    (i) => i.currentStock <= i.minStockThreshold
  );

  const currentBranch = branches.find((b) => b.id === activeBranchId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {activeCompany.name}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentBranch ? currentBranch.name : 'All Service Branches'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Service & AMC Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of elevator fleet health, breakdown tickets, work orders, and field technicians
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Log Breakdown</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Lifts */}
        <div
          onClick={() => setActiveTab('lifts')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Lifts</span>
            <Layers className="w-4 h-4 text-[#1976D2]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalLifts}</div>
          <span className="text-[11px] text-slate-500">Registered elevators</span>
        </div>

        {/* Active AMCs */}
        <div
          onClick={() => setActiveTab('amc')}
          className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active AMC</span>
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div className="text-2xl font-bold text-[#2E7D32] mt-2">{activeAmcs}</div>
          <span className="text-[11px] text-slate-500">Under contract</span>
        </div>

        {/* Open Complaints */}
        <div
          onClick={() => setActiveTab('complaints')}
          className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all shadow-sm ${
            criticalComplaints.length > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Open Tickets</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{openComplaints.length}</div>
          <span className="text-[11px] text-red-600 font-bold">
            {criticalComplaints.length} urgent SOS
          </span>
        </div>

        {/* Work Orders */}
        <div
          onClick={() => setActiveTab('work_orders')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Work Orders</span>
            <ClipboardList className="w-4 h-4 text-[#1976D2]" />
          </div>
          <div className="text-2xl font-bold text-[#1976D2] mt-2">{activeWorkOrders.length}</div>
          <span className="text-[11px] text-slate-500">In progress / scheduled</span>
        </div>

        {/* Inventory Low Stock */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Spare Parts</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{tenantInventory.length}</div>
          <span className={`text-[11px] font-bold ${lowStockItems.length > 0 ? 'text-[#F9A825]' : 'text-slate-500'}`}>
            {lowStockItems.length > 0 ? `${lowStockItems.length} low stock alert` : 'Stock levels normal'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'complaints', label: 'Complaints', count: openComplaints.length, isAlert: criticalComplaints.length > 0 },
          { id: 'work_orders', label: 'Work Orders', count: activeWorkOrders.length },
          { id: 'lifts', label: 'Lifts Fleet', count: totalLifts },
          { id: 'amc', label: 'AMC Contracts', count: tenantAmcContracts.length },
          { id: 'quotations', label: 'Quotations', count: tenantQuotations.length },
          { id: 'inventory', label: 'Spare Parts & Stock' },
          { id: 'technicians', label: 'Technicians' },
          { id: 'radar', label: 'Live Map' },
          { id: 'audit_logs', label: 'Audit Trail' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                isActive
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    tab.isAlert
                      ? 'bg-red-500 text-white font-bold'
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview Summary */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Urgent Breakdown Tickets & Quick Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Active Tickets */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Breakdown Tickets</h2>
                  <p className="text-xs text-slate-500">Open tickets requiring technician action</p>
                </div>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className="text-xs text-[#1976D2] hover:text-blue-700 inline-flex items-center gap-1 font-bold"
                >
                  View All ({openComplaints.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {openComplaints.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#F5F8FA] rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  All elevators operational. Zero pending breakdown tickets.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {openComplaints.slice(0, 3).map((c) => (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#1976D2] font-bold">{c.ticketNumber}</span>
                          <span className="text-slate-500">• {c.buildingName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              c.priority === 'critical'
                                ? 'bg-red-100 text-[#D32F2F]'
                                : 'bg-amber-100 text-[#F9A825]'
                            }`}
                          >
                            {c.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-900 font-bold mt-1">{c.title}</p>
                        <p className="text-slate-500 text-[11px]">{c.description}</p>
                      </div>

                      <button
                        onClick={() => setActiveTab('complaints')}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#1976D2] text-xs font-bold border border-slate-200 hover:border-blue-300 shadow-sm shrink-0"
                      >
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick Action Shortcuts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
              <div className="space-y-2.5 text-xs">
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 text-left border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div>
                      <span className="font-bold text-slate-900 block">Log Breakdown Ticket</span>
                      <span className="text-[11px] text-slate-500">Dispatch nearest technician</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveTab('lifts')}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 text-left border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#1976D2]" />
                    <div>
                      <span className="font-bold text-slate-900 block">View Lifts Directory</span>
                      <span className="text-[11px] text-slate-500">Equipment specifications & directory</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveTab('quotations')}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 text-left border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#2E7D32]" />
                    <div>
                      <span className="font-bold text-slate-900 block">Quotations & AMC</span>
                      <span className="text-[11px] text-slate-500">Proposals and 1-click work orders</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveTab('inventory')}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 text-left border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Spare Parts Ledger</span>
                      <span className="text-[11px] text-slate-500">Stock movements & reorders</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Complaints */}
      {activeTab === 'complaints' && <ComplaintManager />}

      {/* Tab 3: Work Orders */}
      {activeTab === 'work_orders' && <WorkOrderManager />}

      {/* Tab 4: Lifts Fleet */}
      {activeTab === 'lifts' && <LiftDirectory />}

      {/* Tab 5: AMC Contracts */}
      {activeTab === 'amc' && <AmcManager />}

      {/* Tab 6: Quotations */}
      {activeTab === 'quotations' && <QuotationManager />}

      {/* Tab 7: Spare Parts & Inventory */}
      {activeTab === 'inventory' && <InventoryManager />}

      {/* Tab 8: Technicians */}
      {activeTab === 'technicians' && <TechnicianPerformance />}

      {/* Tab 9: Live Map Radar */}
      {activeTab === 'radar' && <LiveTechnicianRadar />}

      {/* Tab 10: Audit Logs */}
      {activeTab === 'audit_logs' && <AuditLogViewer />}

      {/* Log Breakdown Modal */}
      <RaiseComplaintModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
      />
    </div>
  );
};
