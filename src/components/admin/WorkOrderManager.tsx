import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Plus,
  ArrowRight,
  FileText,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '../../types';

export const WorkOrderManager: React.FC = () => {
  const {
    tenantWorkOrders,
    tenantTechnicians,
    tenantLifts,
    updateWorkOrderStatus,
    createWorkOrder,
    activeCompany,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [selectedLiftId, setSelectedLiftId] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('medium');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState(3);
  const [amount, setAmount] = useState(5000);

  const filteredOrders = tenantWorkOrders.filter((wo) => {
    const matchesSearch =
      wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.liftNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lift = tenantLifts.find((l) => l.id === selectedLiftId);
    const tech = tenantTechnicians.find((t) => t.id === selectedTechId);

    createWorkOrder({
      liftId: lift?.id || '',
      liftNumber: lift?.liftNumber || '',
      buildingName: lift?.buildingName || '',
      clientId: lift?.clientId || '',
      clientName: lift?.clientName || '',
      technicianId: tech?.id,
      technicianName: tech?.name,
      title,
      description,
      priority,
      scheduledDate,
      estimatedHours: Number(estimatedHours),
      totalAmount: Number(amount),
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1 animate-pulse">
            <Wrench className="w-3 h-3" /> In Progress
          </span>
        );
      case 'assigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
            <User className="w-3 h-3" /> Assigned
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1976D2] font-mono text-xs font-bold uppercase tracking-wider">
              FIELD EXECUTION PIPELINE
            </span>
            <span className="text-xs text-slate-500 font-mono">• {activeCompany.name}</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 mt-1">Work Orders & Field Operations</h2>
          <p className="text-xs text-slate-500">
            Approved quotation conversions, major overhaul jobs, and technician assignment tracking
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search work order #, lift, society, technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1976D2] shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'scheduled', 'assigned', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm">
            <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No work orders match the current filter.</p>
            <p className="text-xs text-slate-400 mt-1">
              Create a new work order or approve a quotation to generate an execution order.
            </p>
          </div>
        ) : (
          filteredOrders.map((wo) => (
            <div
              key={wo.id}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-5 transition-all space-y-4 shadow-sm"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-[#1976D2] text-sm">{wo.workOrderNumber}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      {wo.liftNumber}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 font-medium">{wo.buildingName}</span>
                    {getStatusBadge(wo.status)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{wo.title}</h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 font-mono">Total Order Value</div>
                  <div className="text-lg font-black font-mono text-[#2E7D32]">
                    ₹{wo.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {wo.description}
              </p>

              {/* Bottom Metadata & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-4 text-slate-500 flex-wrap font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <User className="w-3.5 h-3.5 text-[#1976D2]" />
                    Technician: <span>{wo.technicianName || 'Unassigned'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#F9A825]" />
                    Scheduled: <strong>{wo.scheduledDate}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Est: <strong>{wo.estimatedHours} Hours</strong>
                  </span>
                  {wo.invoiceId && (
                    <span className="flex items-center gap-1 text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      <FileText className="w-3 h-3" /> Linked Invoice Active
                    </span>
                  )}
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-2">
                  {wo.status === 'scheduled' && (
                    <button
                      onClick={() => updateWorkOrderStatus(wo.id, 'assigned')}
                      className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm"
                    >
                      Assign Tech
                    </button>
                  )}
                  {wo.status === 'assigned' && (
                    <button
                      onClick={() => updateWorkOrderStatus(wo.id, 'in_progress')}
                      className="px-3 py-1 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                    >
                      Start Execution
                    </button>
                  )}
                  {wo.status === 'in_progress' && (
                    <button
                      onClick={() => updateWorkOrderStatus(wo.id, 'completed')}
                      className="px-3 py-1 rounded-xl bg-[#2E7D32] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Work Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#1976D2]" />
              Create Direct Work Order
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Lift *</label>
                <select
                  required
                  value={selectedLiftId}
                  onChange={(e) => setSelectedLiftId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2]"
                >
                  <option value="">Select Lift from Fleet...</option>
                  {tenantLifts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.liftNumber} — {l.buildingName} ({l.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Technician</label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2]"
                >
                  <option value="">Auto-Assign (Based on availability)</option>
                  {tenantTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.zone}) — ⭐ {t.customerRating}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Emergency)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Title / Job Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake Shoe Overhaul & Guide Shoe Liner Replacement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Details of the job, required parts, safety guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estimated Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#1976D2] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold shadow-md shadow-blue-900/20 transition-all"
                >
                  Issue Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
