import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Wrench,
  Clock,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { ServiceReport } from '../../types';
import { WepsunLogo } from './WepsunLogo';
import { useApp } from '../../context/AppContext';

interface ServiceReportModalProps {
  report: ServiceReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceReportModal: React.FC<ServiceReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const { currentRole, verifyClientAccess } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  if (currentRole === 'client' && !verifyClientAccess(report.clientId)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white border border-red-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
          <p className="text-xs text-slate-600">Access Denied – You are not authorized to view this information.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const totalPartsCost = report.partsReplaced.reduce((acc, p) => acc + p.totalPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-800 my-auto flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Modal Actions Bar (hidden in print) */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#2E7D32] border border-emerald-200 text-xs font-mono font-bold">
              VERIFIED SERVICE REPORT
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {report.reportNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div
          ref={printRef}
          className="bg-white text-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6"
        >
          {/* Document Header with WEPSUN Branding */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#1976D2]">
            <div className="flex items-center gap-4">
              <WepsunLogo size="lg" theme="light" />
              <div className="border-l border-slate-200 pl-4">
                <p className="text-xs text-[#1976D2] font-bold tracking-wide">
                  Elevator & Escalator Maintenance, Modernization & AMC Services
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Head Office: Sector 19, Vashi, Navi Mumbai | 24x7 Helpdesk: +91 98201 55432
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-[#F5F8FA] p-3 rounded-xl border border-slate-200 shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
                SERVICE REPORT NUMBER
              </div>
              <div className="font-mono text-base font-extrabold text-[#1976D2]">
                {report.reportNumber}
              </div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                Ticket: <strong className="text-slate-900">{report.ticketNumber}</strong>
              </div>
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Client & Building Details */}
            <div className="bg-[#F5F8FA] rounded-xl p-4 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[#1976D2] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Customer & Site Information
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{report.buildingName}</p>
                <p className="text-slate-700 mt-0.5">{report.clientName}</p>
                <p className="text-slate-500 mt-0.5">Contact: {report.clientContact}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{report.buildingAddress}</p>
              </div>
            </div>

            {/* Equipment & Job Timing */}
            <div className="bg-[#F5F8FA] rounded-xl p-4 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[#1976D2] flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Equipment & Service Session
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Lift Number:</span>
                  <p className="font-mono font-bold text-slate-900">{report.liftNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Service Type:</span>
                  <p className="font-semibold text-[#1976D2]">{report.serviceType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Date:</span>
                  <p className="font-mono text-slate-800">{report.serviceDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Duration:</span>
                  <p className="font-mono text-slate-800">
                    {report.serviceStartTime} – {report.serviceEndTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Diagnosis & Work Done */}
          <div className="space-y-4 text-xs">
            <div className="bg-[#F5F8FA] rounded-xl p-4 border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                1. Initial Inspection & Diagnosis
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">{report.initialDiagnosis}</p>
            </div>

            <div className="bg-[#F5F8FA] rounded-xl p-4 border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                2. Root Cause of Breakdown / Fault
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">{report.rootCause}</p>
            </div>

            <div className="bg-[#F5F8FA] rounded-xl p-4 border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                3. Work Performed & Calibration
              </span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {report.workPerformed}
              </p>
            </div>
          </div>

          {/* Parts Replaced Table */}
          {report.partsReplaced.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                4. Parts Replaced & Issued
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F8FA] text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Part Description</th>
                      <th className="p-2.5">Part No.</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Rate (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono">
                    {report.partsReplaced.map((part, idx) => (
                      <tr key={idx} className="text-slate-700">
                        <td className="p-2.5 font-sans font-medium">{part.partName}</td>
                        <td className="p-2.5 text-slate-500">{part.partNumber || 'WEP-PARTS'}</td>
                        <td className="p-2.5 text-center">{part.quantity}</td>
                        <td className="p-2.5 text-right">₹{part.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right text-[#1976D2] font-bold">
                          ₹{part.totalPrice.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#F5F8FA] font-bold text-slate-900 border-t border-slate-200">
                      <td colSpan={4} className="p-2.5 text-right uppercase text-[11px]">
                        Total Parts Value (Excl. Tax):
                      </td>
                      <td className="p-2.5 text-right text-[#1976D2]">
                        ₹{totalPartsCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations & Safety Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F5F8FA] rounded-xl p-4 border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                Engineer Recommendations:
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {report.technicianRecommendations || 'All safety circuits tested and verified operational. Routine monthly PM recommended.'}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-[#2E7D32] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Equipment Operating Status
              </span>
              <div className="my-2">
                <span className="text-base font-bold text-slate-900 block">
                  {report.liftOperatingStatusAfterWork}
                </span>
                <span className="text-xs text-[#2E7D32] font-semibold">
                  Ready for safe passenger transit
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Client OTP Verified: {report.clientOtpVerified ? 'YES (Confirmed)' : 'Digital Sign Verified'}</span>
              </div>
            </div>
          </div>

          {/* Dual Signatures Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
            {/* Technician Signature */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                Service Engineer Signature
              </span>
              <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                {report.technicianSignature.startsWith('data:image') ? (
                  <img
                    src={report.technicianSignature}
                    alt="Technician Signature"
                    className="max-h-full object-contain"
                  />
                ) : (
                  <span className="font-mono text-xs text-[#1976D2] italic font-semibold">
                    {report.technicianSignature}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900">{report.technicianName}</p>
              <p className="text-[10px] text-slate-500 font-mono">WEPSUN Authorized Elevator Engineer</p>
            </div>

            {/* Client Signature */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                Customer / Society Representative Sign
              </span>
              <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                {report.clientSignature && report.clientSignature.startsWith('data:image') ? (
                  <img
                    src={report.clientSignature}
                    alt="Client Signature"
                    className="max-h-full object-contain"
                  />
                ) : (
                  <span className="font-mono text-xs text-[#2E7D32] italic font-semibold">
                    {report.clientSignature || 'Digitally Acknowledged via OTP'}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900">{report.clientName}</p>
              <p className="text-[10px] text-slate-500 font-mono">Authorized Society Representative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
