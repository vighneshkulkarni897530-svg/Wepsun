import React, { useState } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { ServiceReport } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadServiceReportPdf } from '../../services/pdfGenerator';
import { ServiceReportModal } from '../common/ServiceReportModal';

interface ClientReportsViewProps {
  reports?: ServiceReport[];
}

export const ClientReportsView: React.FC<ClientReportsViewProps> = ({ reports }) => {
  const { clientScopedReports, clientScopedLifts, activeCompany } = useApp();
  const allReports = reports || clientScopedReports;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLiftFilter, setSelectedLiftFilter] = useState('all');
  const [selectedReportForModal, setSelectedReportForModal] = useState<ServiceReport | null>(null);

  const filteredReports = allReports.filter((rep) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      rep.reportNumber.toLowerCase().includes(q) ||
      rep.liftNumber.toLowerCase().includes(q) ||
      rep.buildingName.toLowerCase().includes(q) ||
      rep.technicianName.toLowerCase().includes(q) ||
      (rep.initialDiagnosis && rep.initialDiagnosis.toLowerCase().includes(q));

    const matchType = typeFilter === 'all' || rep.serviceType === typeFilter;
    const matchLift = selectedLiftFilter === 'all' || rep.liftNumber === selectedLiftFilter;

    return matchQuery && matchType && matchLift;
  });

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] shadow-sm shrink-0">
            <FileCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                ISO 9001:2015 Verified Archive
              </span>
              <span className="text-xs text-slate-500 font-mono">Digital Passports & Certificates</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Service Reports & Compliance Hub</h1>
            <p className="text-xs text-slate-500">
              Official digitized field service reports, preventive maintenance certificates, and breakdown closures
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold bg-blue-50 text-[#1976D2] px-3.5 py-2 rounded-xl border border-blue-200">
          {allReports.length} Total Reports Available
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report ID, Lift Number, Diagnosis..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#1976D2] outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedLiftFilter}
            onChange={(e) => setSelectedLiftFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
          >
            <option value="all">All Lifts</option>
            {clientScopedLifts.map((l) => (
              <option key={l.id} value={l.liftNumber}>
                {l.liftNumber}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
          >
            <option value="all">All Service Types</option>
            <option value="Preventive Maintenance">Preventive Maintenance</option>
            <option value="Breakdown Repair">Breakdown Repair</option>
            <option value="Emergency Call">Emergency Call</option>
            <option value="Modernization Inspection">Modernization Inspection</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-2">
          <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-sm text-slate-700">No Service Reports Found</p>
          <p className="text-xs text-slate-400">Reports will be generated automatically following maintenance visits.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FA] text-slate-700 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">Report ID</th>
                  <th className="p-4 font-bold">Lift / Site</th>
                  <th className="p-4 font-bold">Service Type</th>
                  <th className="p-4 font-bold">Service Date</th>
                  <th className="p-4 font-bold">Technician</th>
                  <th className="p-4 font-bold">Operating Status</th>
                  <th className="p-4 font-bold">Verification</th>
                  <th className="p-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#1976D2]">
                      <span className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {report.reportNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{report.liftNumber}</span>
                      <span className="text-[11px] text-slate-500">{report.buildingName}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{report.serviceType}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                        {report.initialDiagnosis || 'Routine Checkup'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-700">{report.serviceDate}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{report.technicianName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{report.technicianPhone}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                        {report.liftOperatingStatusAfterWork || 'Fully Operational'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {report.clientOtpVerified ? 'OTP Verified' : 'Signed'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReportForModal(report)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                          title="View Online"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadServiceReportPdf(report, activeCompany)}
                          className="px-3 py-1.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-sm flex items-center gap-1"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-300" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Report View Modal */}
      {selectedReportForModal && (
        <ServiceReportModal
          report={selectedReportForModal}
          isOpen={!!selectedReportForModal}
          onClose={() => setSelectedReportForModal(null)}
        />
      )}
    </div>
  );
};
