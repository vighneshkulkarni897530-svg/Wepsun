import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  UserCheck,
  Truck,
  Wrench,
  CheckCircle2,
  FileCheck,
  PhoneCall,
  Star,
  KeyRound,
  Search,
  Plus,
  Filter,
  Layers,
  Building,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Complaint, ComplaintStatus, ServiceReport } from '../../types';
import { useApp } from '../../context/AppContext';
import { ServiceReportModal } from '../common/ServiceReportModal';

interface ClientComplaintsViewProps {
  complaints: Complaint[];
  onOpenRaiseModal: () => void;
  onOpenEmergencyModal: () => void;
  onOpenPassportModal?: (liftId: string) => void;
}

export const ClientComplaintsView: React.FC<ClientComplaintsViewProps> = ({
  complaints,
  onOpenRaiseModal,
  onOpenEmergencyModal,
  onOpenPassportModal,
}) => {
  const { serviceReports, rateService, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null);
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(
    complaints[0]?.id || null
  );

  // Ratings state by complaint ID
  const [ratings, setRatings] = useState<Record<string, { rating: number; feedback: string; submitted: boolean }>>({});

  const stages: { key: ComplaintStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'pending', label: 'Ticket Logged', icon: <Clock className="w-4 h-4" />, desc: 'Service dispatch reviewing' },
    { key: 'assigned', label: 'Technician Assigned', icon: <UserCheck className="w-4 h-4" />, desc: 'Engineer assigned' },
    { key: 'technician_on_way', label: 'On The Way', icon: <Truck className="w-4 h-4" />, desc: 'En route to site' },
    { key: 'inspection_repair', label: 'Inspection & Repair', icon: <Wrench className="w-4 h-4" />, desc: 'Active on equipment' },
    { key: 'resolved', label: 'Work Completed', icon: <CheckCircle2 className="w-4 h-4" />, desc: 'Tested & operational' },
    { key: 'closed', label: 'Ticket Closed', icon: <FileCheck className="w-4 h-4" />, desc: 'Report signed & finalized' },
  ];

  const getStageIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'assigned': return 1;
      case 'technician_on_way': return 2;
      case 'inspection_repair': return 3;
      case 'resolved': return 4;
      case 'closed': return 5;
      default: return 0;
    }
  };

  const handleRatingSubmit = (complaintId: string, e: React.FormEvent) => {
    e.preventDefault();
    const cur = ratings[complaintId] || { rating: 5, feedback: '', submitted: false };
    rateService(complaintId, cur.rating || 5, cur.feedback || 'Excellent service resolution');
    setRatings(prev => ({
      ...prev,
      [complaintId]: { ...cur, submitted: true }
    }));
    showToast('success', 'Feedback Submitted', 'Thank you for rating our service!');
  };

  const filteredComplaints = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.ticketNumber.toLowerCase().includes(q) ||
      c.liftNumber.toLowerCase().includes(q) ||
      c.buildingName.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'open') return c.status === 'pending' || c.status === 'assigned';
    if (statusFilter === 'in_progress') return c.status === 'technician_on_way' || c.status === 'inspection_repair';
    if (statusFilter === 'closed') return c.status === 'resolved' || c.status === 'closed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Complaint & Service Request Tracking</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-stage tracking for breakdown tickets, routine service requests, and engineer dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEmergencyModal}
            className="px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🚨 Emergency SOS</span>
          </button>
          <button
            onClick={onOpenRaiseModal}
            className="px-4 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Complaint</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Tickets', count: complaints.length },
              { id: 'open', label: 'New / Assigned', count: complaints.filter(c => c.status === 'pending' || c.status === 'assigned').length },
              { id: 'in_progress', label: 'In Progress', count: complaints.filter(c => c.status === 'technician_on_way' || c.status === 'inspection_repair').length },
              { id: 'closed', label: 'Resolved / Closed', count: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets, lifts, buildings..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none"
          />
        </div>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No complaints matching your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All your elevator units are operating smoothly. If you experience an issue, click "Raise Complaint" or use 24x7 Emergency SOS.
          </p>
          <button
            onClick={onOpenRaiseModal}
            className="px-4 py-2 bg-[#123B5D] text-white font-bold text-xs rounded-xl hover:bg-[#0e2f4a] transition-all"
          >
            Raise Service Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map(complaint => {
            const isExpanded = expandedComplaintId === complaint.id;
            const currentStageIdx = getStageIndex(complaint.status);
            const linkedReport = serviceReports.find(
              r => r.ticketId === complaint.id || r.id === complaint.serviceReportId
            );
            const ratingState = ratings[complaint.id] || {
              rating: complaint.clientRating || 5,
              feedback: complaint.clientFeedback || '',
              submitted: !!complaint.clientRating,
            };

            return (
              <div
                key={complaint.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => setExpandedComplaintId(isExpanded ? null : complaint.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-white to-slate-50/50"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        complaint.priority === 'critical' || complaint.isEmergency
                          ? 'bg-red-100 text-red-600'
                          : complaint.priority === 'high'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-[#1976D2]'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {complaint.ticketNumber}
                        </span>
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {complaint.liftNumber}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600 truncate">
                          {complaint.buildingName}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            complaint.priority === 'critical' || complaint.isEmergency
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : complaint.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-[#1976D2] border border-blue-200'
                          }`}
                        >
                          ● {complaint.priority}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                        {complaint.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize block ${
                          complaint.status === 'closed' || complaint.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : complaint.status === 'inspection_repair'
                            ? 'bg-blue-100 text-blue-800'
                            : complaint.status === 'technician_on_way'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {complaint.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {new Date(complaint.reportedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 space-y-6 bg-slate-50/40">
                    {/* Problem Description & Details */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Reported Issue Details:</span>
                        <span className="font-mono text-[11px]">
                          {new Date(complaint.reportedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {complaint.description || 'No additional issue description provided.'}
                      </p>

                      {complaint.beforePhotos && complaint.beforePhotos.length > 0 && (
                        <div className="pt-2 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Attached Photos:</span>
                          <div className="flex items-center gap-2">
                            {complaint.beforePhotos.map((photo, idx) => (
                              <a
                                key={idx}
                                href={photo}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                              >
                                <img src={photo} alt="Issue" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 6-Stage Timeline Stepper */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                          Live 6-Stage Resolution Timeline
                        </span>
                        {complaint.clientOtp && complaint.status !== 'closed' && (
                          <div className="flex items-center gap-1.5 bg-blue-50 text-[#1976D2] px-2.5 py-1 rounded-full border border-blue-200 text-xs font-bold font-mono">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Job Closure OTP: {complaint.clientOtp}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {stages.map((stg, idx) => {
                          const isCompleted = currentStageIdx >= idx;
                          const isCurrent = currentStageIdx === idx;

                          return (
                            <div
                              key={stg.key}
                              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                                isCurrent
                                  ? 'bg-blue-50 border-[#1976D2] text-[#1976D2] shadow-sm ring-2 ring-[#1976D2]/20'
                                  : isCompleted
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                                    isCurrent
                                      ? 'bg-[#1976D2] text-white font-bold'
                                      : isCompleted
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {stg.icon}
                                </div>
                                <span className="text-[10px] font-mono font-bold">
                                  {idx + 1}/6
                                </span>
                              </div>
                              <div className="mt-2.5">
                                <div className="text-[11px] font-bold text-slate-900 truncate">{stg.label}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5 truncate">{stg.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assigned Technician Card */}
                    {complaint.assignedTechnicianName && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              complaint.technicianPhoto ||
                              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
                            }
                            alt={complaint.assignedTechnicianName}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {complaint.assignedTechnicianName}
                              </span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-[#1976D2] font-mono font-bold">
                                Lead Field Engineer
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Estimated Arrival / Status: <strong className="text-slate-900">{complaint.technicianEta || 'On-site'}</strong>
                            </p>
                          </div>
                        </div>

                        <a
                          href={`tel:${complaint.technicianPhone || '+919820155432'}`}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-sky-300" />
                          <span>Call Technician ({complaint.technicianPhone || '+91 98201 55432'})</span>
                        </a>
                      </div>
                    )}

                    {/* Service Report & 5-Star Feedback Form */}
                    {(complaint.status === 'closed' || complaint.status === 'resolved') && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                Service Work Completed & Certified
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Resolved on {complaint.closedAt ? new Date(complaint.closedAt).toLocaleString() : 'Recent'}
                              </span>
                            </div>
                          </div>

                          {linkedReport && (
                            <button
                              onClick={() => setSelectedReport(linkedReport)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-xs transition-all"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-sky-300" />
                              View Digital Service Report
                            </button>
                          )}
                        </div>

                        {/* 5-Star Feedback Rating */}
                        <form
                          onSubmit={(e) => handleRatingSubmit(complaint.id, e)}
                          className="pt-3 border-t border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">Your Rating:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  disabled={ratingState.submitted}
                                  onClick={() =>
                                    setRatings(prev => ({
                                      ...prev,
                                      [complaint.id]: {
                                        ...ratingState,
                                        rating: star,
                                      },
                                    }))
                                  }
                                  className="p-0.5 hover:scale-110 transition-transform disabled:opacity-80"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= ratingState.rating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {!ratingState.submitted ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="text"
                                value={ratingState.feedback}
                                onChange={(e) =>
                                  setRatings(prev => ({
                                    ...prev,
                                    [complaint.id]: {
                                      ...ratingState,
                                      feedback: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Feedback comments..."
                                className="flex-1 sm:w-64 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-[#1976D2] outline-none"
                              />
                              <button
                                type="submit"
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
                              >
                                Submit Rating
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-800 font-bold italic">
                              ✓ {ratingState.rating} Stars submitted: &ldquo;{ratingState.feedback || 'Service completed satisfactorily'}&rdquo;
                            </span>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
