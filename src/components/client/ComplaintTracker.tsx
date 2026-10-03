import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  Truck,
  Wrench,
  CheckCircle2,
  FileCheck,
  PhoneCall,
  Star,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { Complaint, ComplaintStatus, ServiceReport } from '../../types';
import { useApp } from '../../context/AppContext';
import { ServiceReportModal } from '../common/ServiceReportModal';

interface ComplaintTrackerProps {
  complaint: Complaint;
}

export const ComplaintTracker: React.FC<ComplaintTrackerProps> = ({ complaint }) => {
  const { serviceReports, rateService } = useApp();
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null);
  const [userRating, setUserRating] = useState<number>(complaint.clientRating || 5);
  const [userFeedback, setUserFeedback] = useState<string>(complaint.clientFeedback || '');
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(!!complaint.clientRating);

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

  const currentStageIdx = getStageIndex(complaint.status);
  const linkedReport = serviceReports.find((r) => r.ticketId === complaint.id || r.id === complaint.serviceReportId);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rateService(complaint.id, userRating, userFeedback);
    setIsRatingSubmitted(true);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col gap-6 text-slate-800">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {complaint.ticketNumber}
            </span>
            <span className="font-bold text-slate-900 text-base">{complaint.liftNumber}</span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                complaint.priority === 'critical'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : complaint.priority === 'high'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-blue-100 text-[#1976D2] border border-blue-200'
              }`}
            >
              ● {complaint.priority} priority
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5">
            {complaint.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {complaint.buildingName} • Reported at {new Date(complaint.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(complaint.reportedAt).toLocaleDateString()})
          </p>
        </div>

        {/* Client OTP Card if Job in Progress */}
        {complaint.clientOtp && complaint.status !== 'closed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#1976D2] flex items-center justify-center text-white">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block font-bold">
                Your Job Closure OTP
              </span>
              <span className="font-mono text-lg font-black text-[#1976D2] tracking-wider">
                {complaint.clientOtp}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6-Stage Timeline Stepper */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
          Live Service Progress Timeline
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {stages.map((stg, idx) => {
            const isCompleted = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;

            return (
              <div
                key={stg.key}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-[#1976D2] text-[#1976D2] shadow-sm ring-2 ring-[#1976D2]/20'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-[#F5F8FA] border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      isCurrent
                        ? 'bg-[#1976D2] text-white font-bold shadow-sm'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {stg.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold">
                    {idx + 1}/{stages.length}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-bold truncate text-slate-900">{stg.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{stg.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned Technician Card */}
      {complaint.assignedTechnicianName && (
        <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={
                complaint.technicianPhoto ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
              }
              alt={complaint.assignedTechnicianName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{complaint.assignedTechnicianName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#1976D2] font-mono font-bold">
                  Assigned Engineer
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Status: <strong className="text-slate-900">{complaint.technicianEta || 'On-site'}</strong>
              </p>
              {complaint.checkInTime && (
                <p className="text-[11px] text-slate-500">
                  Checked in at: {new Date(complaint.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <a
            href={`tel:${complaint.technicianPhone || '+919820155432'}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-sky-300" />
            <span>Call Engineer ({complaint.technicianPhone})</span>
          </a>
        </div>
      )}

      {/* Completed Service Report & Feedback Form */}
      {complaint.status === 'closed' && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Service Completed & Verified
                </span>
                <span className="text-[11px] text-slate-500">
                  Ticket finalized on {complaint.closedAt ? new Date(complaint.closedAt).toLocaleString() : 'Today'}
                </span>
              </div>
            </div>

            {linkedReport && (
              <button
                onClick={() => setSelectedReport(linkedReport)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-sm transition-all"
              >
                <FileCheck className="w-4 h-4 text-sky-300" />
                View & Download Service Report
              </button>
            )}
          </div>

          {/* 5-Star Rating Form */}
          <form onSubmit={handleRatingSubmit} className="pt-3 border-t border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Rate Service Quality & Technician
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    disabled={isRatingSubmitted}
                    onClick={() => setUserRating(star)}
                    className="p-1 hover:scale-110 transition-transform disabled:opacity-80"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= userRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {!isRatingSubmitted ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="Share feedback on resolution speed or technician conduct..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1976D2] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-800 font-medium italic">
                ✓ Review recorded: &ldquo;{userFeedback || '5-Star service excellence'}&rdquo; — Thank you!
              </p>
            )}
          </form>
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
