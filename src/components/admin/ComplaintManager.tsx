import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  UserCheck,
  Wrench,
  Clock,
  PhoneCall,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Layers,
  Building,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types';
import { ServiceReportModal } from '../common/ServiceReportModal';
import { apiService } from '../../services/api';

export const ComplaintManager: React.FC = () => {
  const { complaints, technicians, assignTechnician, updateComplaintStatus, serviceReports } =
    useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [etaInput, setEtaInput] = useState('Within 30 mins');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.liftNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningTicketId && selectedTechId) {
      assignTechnician(assigningTicketId, selectedTechId, etaInput);
      setAssigningTicketId(null);
    }
  };

  const handleSendWhatsAppUpdate = (ticket: Complaint) => {
    const msg =
      `🚨 *WEPSUN LIFT SERVICES — BREAKDOWN UPDATE*\n\n` +
      `Dear *${ticket.clientName || 'Customer'}*,\n` +
      `Your complaint *#${ticket.ticketNumber}* for *Lift ${ticket.liftNumber}* (${ticket.buildingName}) is currently: *${ticket.status.toUpperCase().replace('_', ' ')}*.\n\n` +
      `👷 *Assigned Engineer:* ${ticket.assignedTechnicianName || 'WEPSUN Emergency Team'}\n` +
      `⏱️ *ETA:* ${ticket.technicianEta || 'Within 45 mins'}\n` +
      `⚠️ *Issue:* ${ticket.title}\n\n` +
      `📞 *24x7 Control Room:* +91 98201 55432\n` +
      `_Reliable Service. Safer Tomorrow._`;

    apiService.openWhatsAppDirect(ticket.clientPhone || '+919820155432', msg);
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket number, building, elevator..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] outline-none shadow-sm"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-medium shadow-sm"
          >
            <option value="All">All Priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="normal">🔵 Normal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-medium shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="inspection_repair">In Inspection</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FA] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Ticket & Lift</th>
              <th className="p-3.5">Site & Contact</th>
              <th className="p-3.5">Issue Description</th>
              <th className="p-3.5 text-center">Priority</th>
              <th className="p-3.5">Assigned Engineer</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Dispatch Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredComplaints.map((ticket) => {
              const isEmergency = ticket.isEmergency || ticket.priority === 'critical';
              const isClosed = ticket.status === 'closed';
              const linkedReport = serviceReports.find((r) => r.ticketId === ticket.id);

              return (
                <tr
                  key={ticket.id}
                  className={`hover:bg-blue-50/40 text-slate-700 transition-colors ${
                    isEmergency && !isClosed ? 'bg-red-50/60' : ''
                  }`}
                >
                  <td className="p-3.5 font-mono">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {isEmergency && <span className="text-red-500 animate-bounce">🚨</span>}
                      <span>{ticket.ticketNumber}</span>
                    </div>
                    <span className="text-[#1976D2] font-bold text-[11px]">{ticket.liftNumber}</span>
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{ticket.buildingName}</div>
                    <div className="text-[11px] text-slate-500">
                      {ticket.clientName} ({ticket.clientPhone})
                    </div>
                  </td>

                  <td className="p-3.5 max-w-xs">
                    <div className="font-semibold text-slate-800 truncate">{ticket.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{ticket.description}</div>
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                        ticket.priority === 'critical'
                          ? 'bg-red-100 text-[#D32F2F] border border-red-200 animate-pulse'
                          : ticket.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-[#1976D2]'
                      }`}
                    >
                      ● {ticket.priority}
                    </span>
                  </td>

                  <td className="p-3.5">
                    {ticket.assignedTechnicianName ? (
                      <div>
                        <div className="font-bold text-slate-900">{ticket.assignedTechnicianName}</div>
                        <div className="text-[11px] text-[#1976D2] font-mono">
                          {ticket.technicianEta || 'On-site'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-600 text-[11px] font-bold">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                        isClosed
                          ? 'bg-emerald-100 text-[#2E7D32]'
                          : ticket.status === 'inspection_repair'
                          ? 'bg-blue-100 text-[#1976D2]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSendWhatsAppUpdate(ticket)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-sm"
                        title="Send Instant WhatsApp Update to Client"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {!isClosed ? (
                        <button
                          onClick={() => {
                            setAssigningTicketId(ticket.id);
                            if (ticket.assignedTechnicianId) {
                              setSelectedTechId(ticket.assignedTechnicianId);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {ticket.assignedTechnicianName ? 'Reassign' : 'Assign Engineer'}
                        </button>
                      ) : (
                        linkedReport && (
                          <button
                            onClick={() => setSelectedReport(linkedReport)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-colors"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                            Report
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Technician Assignment Modal */}
      {assigningTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Dispatch Field Engineer
                </h3>
                <p className="text-xs text-slate-500">
                  Assign nearest available technician to ticket
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Select Technician</label>
                <div className="space-y-2">
                  {technicians.map((tech) => (
                    <label
                      key={tech.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedTechId === tech.id
                          ? 'bg-blue-50/70 border-[#1976D2] text-[#1976D2] shadow-sm ring-1 ring-[#1976D2]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="technician"
                          value={tech.id}
                          checked={selectedTechId === tech.id}
                          onChange={(e) => setSelectedTechId(e.target.value)}
                          className="accent-[#1976D2]"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{tech.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {tech.zone} • ⭐ {tech.customerRating}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          tech.currentStatus === 'available'
                            ? 'bg-emerald-100 text-[#2E7D32]'
                            : tech.currentStatus === 'on_job'
                            ? 'bg-amber-100 text-[#F9A825]'
                            : 'bg-blue-100 text-[#1976D2]'
                        }`}
                      >
                        {tech.currentStatus.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Estimated Arrival (ETA)</label>
                <input
                  type="text"
                  value={etaInput}
                  onChange={(e) => setEtaInput(e.target.value)}
                  placeholder="e.g. Within 30 mins (En Route)"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTicketId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Report Modal */}
      {selectedReport && (
        <ServiceReportModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};
