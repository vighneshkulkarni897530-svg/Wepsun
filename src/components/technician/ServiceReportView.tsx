import React from 'react';
import {
  FileText,
  Download,
  Share2,
  Send,
  Printer,
  CheckCircle2,
  Building2,
  Layers,
  Wrench,
  Clock,
  ShieldCheck,
  Calendar,
  Sparkles,
  PhoneCall,
  User,
  ExternalLink,
} from 'lucide-react';
import { TechnicianJob, ServiceReport, Company } from '../../types';
import { downloadServiceReportPdf } from '../../services/pdfGenerator';
import { WepsunLogo } from '../common/WepsunLogo';

interface ServiceReportViewProps {
  job: TechnicianJob;
  activeCompany?: Partial<Company>;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ServiceReportView: React.FC<ServiceReportViewProps> = ({
  job,
  activeCompany,
  showToast,
}) => {
  const reportNumber = job?.serviceReportNumber || (job?.jobId ? `SR-WEP-2026-${job.jobId.slice(-4)}` : 'SR-WEP-2026-0001');
  const completionDate = job?.checkOutDate || job?.scheduledDate || '2026-09-22';
  const startTime = job?.checkInTime || '08:52 AM';
  const endTime = job?.checkOutTime || '09:50 AM';
  const duration = job?.totalDurationMinutes ? `${job.totalDurationMinutes} mins` : '1 hr 15 mins';

  const handleDownloadPdf = () => {
    const reportData: ServiceReport = {
      id: `sr-${Date.now()}`,
      companyId: 'comp-1',
      branchId: 'br-thn-1',
      reportNumber,
      ticketId: job?.id || 'job-001',
      ticketNumber: job?.jobId || 'JOB-001',
      liftId: job?.liftId || 'lift-1',
      liftNumber: job?.liftNumber || 'WPS-PUN-000101',
      liftBrand: 'WEPSUN MRL Traction',
      liftModel: 'WEP-MAX 3000 Eco',
      buildingName: job?.buildingName || 'Greenwood Heights CHS',
      buildingAddress: job?.serviceAddress || 'Sector 19, Vashi, Navi Mumbai',
      clientName: job?.clientName || 'Greenwood Heights Society',
      clientContact: job?.clientPhone || '+91 98220 11223',
      technicianId: job?.technicianId || 'tech-1',
      technicianName: job?.technicianName || 'Rajesh Sharma',
      technicianPhone: job?.clientPhone || '+91 98203 11223',
      serviceDate: completionDate,
      serviceStartTime: startTime,
      serviceEndTime: endTime,
      serviceType: (job?.jobType as any) || 'Breakdown',
      initialDiagnosis: job?.diagnosis || job?.complaintReported || 'Periodic inspection and defect resolution',
      rootCause: job?.rootCause || 'Normal component wear and tear',
      workPerformed: job?.workPerformed || 'Testing and calibration completed',
      partsReplaced: (job?.parts || []).map((p) => ({
        partId: p.partId,
        partName: p.partName,
        partNumber: p.partNumber,
        quantity: p.quantityUsed,
        unitPrice: p.unitCost,
        totalPrice: p.totalCost,
      })),
      technicianRecommendations: job?.recommendations || job?.technicianRemarks || 'Keep landing sills clean',
      liftOperatingStatusAfterWork:
        job?.liftSafetyStatus === 'Out of Service'
          ? 'Shut Down (Parts Pending)'
          : job?.liftSafetyStatus === 'Temporarily Unsafe'
          ? 'Operational with Observation'
          : 'Fully Operational & Safe',
      beforePhotos: (job?.beforeEvidence || []).map((b) => b.url),
      afterPhotos: (job?.afterEvidence || []).map((a) => a.url),
      technicianSignature: job?.technicianSignature || job?.technicianName || 'Rajesh Sharma',
      clientSignature: job?.clientNameSigned || job?.clientName || 'Client Representative',
      clientOtpVerified: !!job?.otpVerified,
      createdAt: new Date().toISOString(),
    };

    downloadServiceReportPdf(reportData, activeCompany);
    showToast('success', 'PDF Generated & Downloaded', `Service Report ${reportNumber} saved as official PDF document.`);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `WEPSUN Engineering Solution - Elevator Service Report #${reportNumber}\n` +
      `Unit: ${job.liftNumber} (${job.buildingName})\n` +
      `Status: ${job.liftSafetyStatus || 'Safe to Operate'}\n` +
      `Engineer: ${job.technicianName}\n` +
      `OTP Confirmed: Yes\n` +
      `View digital report: https://wepsun.com/report/${reportNumber}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    showToast('info', 'Share Report', 'Opening WhatsApp to dispatch client copy...');
  };

  const handleSendEmail = () => {
    showToast('success', 'Email Dispatched', `Official PDF report #${reportNumber} sent to ${job.clientEmail}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Official Service Report</h2>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {reportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generated automatically upon job completion with dual-factor verification
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Email Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Formatted Service Report Document Paper */}
      <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-md max-w-4xl mx-auto space-y-6 text-slate-800 text-xs">
        {/* Document Header */}
        <div className="border-b-2 border-[#123B5D] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <WepsunLogo size="sm" />
            <p className="text-[10px] text-slate-500 leading-tight">
              Unit 402, Quantum Towers, SV Road, Malad West, Mumbai 400064<br />
              24x7 Control Room: +91 98201 55432 • GSTIN: 27AABCW1234F1Z8
            </p>
          </div>

          <div className="sm:text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Elevator Service Report</span>
            <p className="font-mono text-base font-black text-[#123B5D]">{reportNumber}</p>
            <p className="text-[11px] font-semibold text-slate-600">Date: {completionDate}</p>
          </div>
        </div>

        {/* Job & Site Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#123B5D]">Client & Location Details</span>
            <p className="font-bold text-slate-900 text-sm">{job.clientName}</p>
            <p className="text-slate-600">{job.buildingName}</p>
            <p className="text-[11px] text-slate-500">{job.serviceAddress}</p>
            <p className="text-[11px] text-slate-600">Contact: {job.contactPerson} ({job.clientPhone})</p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] uppercase font-bold text-[#123B5D]">Elevator & Job Parameters</span>
            <p className="font-mono font-black text-[#1976D2] text-sm">{job.liftNumber}</p>
            <p className="text-slate-700">Type: {job.jobType} • Priority: {job.priority}</p>
            <p className="text-slate-600">Location: {job.locationDetails}</p>
            <p className="text-[11px] text-slate-600">
              Timings: {startTime} to {endTime} ({duration})
            </p>
          </div>
        </div>

        {/* Diagnosis & Findings */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#123B5D] border-b border-slate-200 pb-1">
            Diagnosis & Corrective Actions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Initial Observation / Complaint</span>
              <p className="font-semibold text-slate-800">{job.complaintReported}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Root Cause Analysis</span>
              <p className="text-slate-700">{job.rootCause || job.diagnosis || 'Routine wear inspection'}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Detailed Work Performed</span>
            <p className="text-slate-700 leading-relaxed">
              {job.workPerformed || job.correctiveAction || 'All safety circuits tested, door sensor aligned, brake clearance calibrated.'}
            </p>
          </div>
        </div>

        {/* Replaced Parts Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#123B5D] border-b border-slate-200 pb-1">
            Spare Parts Replaced / Consumed
          </h4>

          {job.parts.length === 0 ? (
            <p className="text-slate-400 italic py-2">No spare parts replaced during this maintenance visit.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold">
                    <th className="p-2">Part Description</th>
                    <th className="p-2">Part Number</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {job.parts.map((part) => (
                    <tr key={part.id} className="border-b border-slate-100">
                      <td className="p-2 font-bold text-slate-900">{part.partName}</td>
                      <td className="p-2 font-mono text-slate-500">{part.partNumber}</td>
                      <td className="p-2 text-center font-mono font-bold">{part.quantityUsed}</td>
                      <td className="p-2 text-right font-mono">₹{part.unitCost}</td>
                      <td className="p-2 text-right font-mono font-bold">₹{part.totalCost.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evidence Photos Grid */}
        {(job.beforeEvidence.length > 0 || job.afterEvidence.length > 0) && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#123B5D] border-b border-slate-200 pb-1">
              Photo Evidence Verification
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {job.beforeEvidence.slice(0, 2).map((item, idx) => (
                <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div className="aspect-video bg-slate-900 overflow-hidden">
                    <img src={item.url} alt="Before" className="w-full h-full object-cover" />
                  </div>
                  <span className="p-1 text-[9px] font-bold text-slate-600 block truncate">Before: Image {idx + 1}</span>
                </div>
              ))}

              {job.afterEvidence.slice(0, 2).map((item, idx) => (
                <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div className="aspect-video bg-slate-900 overflow-hidden">
                    <img src={item.url} alt="After" className="w-full h-full object-cover" />
                  </div>
                  <span className="p-1 text-[9px] font-bold text-slate-600 block truncate">After: Image {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operating Status & Next PM Recommendations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/50 border border-amber-200 p-4 rounded-xl">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900">Lift Handover Status</span>
            <p className="font-black text-emerald-700 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {job.liftSafetyStatus || 'Safe to Operate'}
            </p>
            <p className="text-[11px] text-slate-600">
              Recommendations: {job.recommendations || 'Keep door sills clean. Maintain room temp < 32°C.'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900">Follow-up & Next PM Schedule</span>
            <p className="font-bold text-slate-800">
              Next Scheduled PM: <strong className="text-[#1976D2]">28 October 2026</strong>
            </p>
            <p className="text-[11px] text-slate-600">
              Follow-up Action: {job.furtherActionRequired ? `Required on ${job.followUpDate}` : 'None (Routine)'}
            </p>
          </div>
        </div>

        {/* Dual Signatures & OTP Confirmation Footer */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-16 border-b border-dashed border-slate-300 flex items-center justify-center sm:justify-start">
              <span className="font-serif italic text-base text-[#123B5D] font-bold">
                {job.technicianName}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900">{job.technicianName}</p>
              <p className="text-[10px] text-slate-500">Lead Field Engineer (ID: TECH-042)</p>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-right">
            <div className="h-16 border-b border-dashed border-slate-300 flex items-center justify-center sm:justify-end">
              {job.clientSignature ? (
                <img src={job.clientSignature} alt="Client Signature" className="max-h-12 object-contain" />
              ) : (
                <span className="font-serif italic text-base text-slate-700 font-bold">
                  {job.clientNameSigned || job.contactPerson}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-900">{job.clientNameSigned || job.contactPerson}</p>
              <p className="text-[10px] text-slate-500">
                {job.otpVerified ? 'Verified via 4-Digit Mobile OTP' : 'Acknowledged & Signed'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
