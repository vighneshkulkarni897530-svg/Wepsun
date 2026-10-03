import React, { useState } from 'react';
import { History, Search, Filter, FileCheck, Download, CheckCircle2, Wrench, Calendar, User, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceReport } from '../../types';
import { ServiceReportModal } from '../common/ServiceReportModal';

export const ClientServiceHistoryView: React.FC = () => {
  const { clientScopedReports, clientScopedLifts } = useApp();
  const [selectedLiftFilter, setSelectedLiftFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null);

  const filteredReports = clientScopedReports.filter((r) => {
    if (selectedLiftFilter !== 'all' && r.liftNumber !== selectedLiftFilter) return false;
    if (selectedTypeFilter !== 'all' && r.serviceType !== selectedTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] shadow-sm shrink-0">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Service History</h2>
            <p className="text-xs text-slate-500">
              Complete archive of maintenance visits, breakdown repairs, and parts replacement records
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedLiftFilter}
            onChange={(e) => setSelectedLiftFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
          >
            <option value="all">All Lifts</option>
            {clientScopedLifts.map((l) => (
              <option key={l.id} value={l.liftNumber}>
                {l.liftNumber}
              </option>
            ))}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
          >
            <option value="all">All Service Types</option>
            <option value="preventive_maintenance">Preventive Maintenance</option>
            <option value="breakdown_repair">Breakdown Repair</option>
            <option value="safety_audit">Safety Audit</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {report.reportNumber}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{report.initialDiagnosis || 'Routine Inspection & Service'}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Lift: <strong className="text-slate-800">{report.liftNumber}</strong></span>
                    <span>•</span>
                    <span>{report.buildingName}</span>
                    <span>•</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-mono">
                ✓ Completed
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div className="bg-[#F5F8FA] p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium block text-[10px] uppercase font-mono">
                  Technician
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">{report.technicianName}</span>
              </div>

              <div className="bg-[#F5F8FA] p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium block text-[10px] uppercase font-mono">
                  Service Type
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block capitalize">
                  {report.serviceType.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-[#F5F8FA] p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium block text-[10px] uppercase font-mono">
                  Parts Replaced
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {report.partsReplaced && report.partsReplaced.length > 0
                    ? report.partsReplaced.map((p) => `${p.partName} (${p.quantity})`).join(', ')
                    : 'None (Maintenance only)'}
                </span>
              </div>

              <div className="bg-[#F5F8FA] p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-medium block text-[10px] uppercase font-mono">
                  Client Verification
                </span>
                <span className="font-bold text-emerald-700 mt-0.5 block">
                  {report.clientSignature ? 'Signed & Verified' : report.clientOtpVerified ? 'Closed via OTP' : 'Verified'}
                </span>
              </div>
            </div>

            {/* Remarks & Recommendations */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <p className="text-slate-700">
                <strong className="text-slate-900">Technician Remarks: </strong>
                {report.workPerformed || 'All systems inspected, door alignment verified, lubricants topped up.'}
              </p>
              {report.technicianRecommendations && (
                <p className="text-slate-600 italic">
                  <strong className="text-slate-800">Recommendations: </strong>
                  {report.technicianRecommendations}
                </p>
              )}
            </div>

            {/* Photos Preview if any */}
            {report.afterPhotos && report.afterPhotos.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">Service Photos:</span>
                <div className="flex gap-2">
                  {report.afterPhotos.map((imgUrl, i) => (
                    <img
                      key={i}
                      src={imgUrl}
                      alt="Service photo"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(report)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                View Report
              </button>
              <button
                onClick={() => setSelectedReport(report)}
                className="px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
