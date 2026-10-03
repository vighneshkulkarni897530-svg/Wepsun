import React, { useState, useMemo } from 'react';
import {
  History,
  FileText,
  Download,
  Calendar,
  Filter,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  Package,
  Layers,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { TechnicianJob, ServiceReport, PartReplaced } from '../../types';
import { downloadServiceReportPdf } from '../../services/pdfGenerator';

interface ServiceHistoryViewProps {
  job: TechnicianJob;
  historicalReports?: ServiceReport[];
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ServiceHistoryView: React.FC<ServiceHistoryViewProps> = ({
  job,
  historicalReports = [],
  showToast,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');

  // Hardcoded & passed historical records for this specific lift
  const liftHistoryRecords = useMemo(() => {
    // Standard mock historical entries for the active lift
    const baseRecords = [
      {
        id: 'rec-001',
        serviceId: 'SR-WEP-2026-0380',
        serviceDate: '2026-08-15',
        serviceType: 'Repair',
        complaint: 'Car top inspection light and auxiliary emergency socket not working.',
        faultFound: '230V car top maintenance luminaire ballast fused after monsoon voltage spike.',
        workPerformed: 'Replaced 28W tube with 18W IP65 LED maintenance flood fixture and reset safety breaker.',
        partsReplaced: [
          {
            partId: 'inv-lum-01',
            partName: 'Car Top IP65 LED Work Light Fixture 18W',
            partNumber: 'WEP-LGT-LED18',
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
          },
        ],
        technicianName: 'Rajesh Sharma',
        technicianRemarks: 'Tested all car top slow-speed travel switches. System operating in full specification.',
        liftOperatingStatus: 'Fully Operational & Safe',
      },
      {
        id: 'rec-002',
        serviceId: 'SR-WEP-2026-0294',
        serviceDate: '2026-07-12',
        serviceType: 'Preventive Maintenance (PM)',
        complaint: 'Routine Monthly PM Inspection (Visit 10 of 12).',
        faultFound: 'Guide shoe oilers empty; minor brake pad dust accumulation.',
        workPerformed: 'Topped up ISO VG 68 guide rail oilers; vacuumed brake plunger housing; checked safety gear trigger clearance.',
        partsReplaced: [
          {
            partId: 'inv-6',
            partName: 'ISO VG 68 Heavy Duty Guide Rail Lubricating Oil',
            partNumber: 'WEP-OIL-VG68',
            quantity: 1,
            unitPrice: 2200,
            totalPrice: 2200,
          },
        ],
        technicianName: 'Rajesh Sharma',
        technicianRemarks: 'All 24 safety checkpoints passed without critical defects.',
        liftOperatingStatus: 'Fully Operational & Safe',
      },
      {
        id: 'rec-003',
        serviceId: 'SR-WEP-2026-0182',
        serviceDate: '2026-05-20',
        serviceType: 'Breakdown',
        complaint: 'Lift stopped between 3rd and 4th floors with passengers inside during storm.',
        faultFound: 'Utility 3-phase grid phase reversal triggered electronic phase sequence protector relay.',
        workPerformed: 'Reset intelligent phase monitor, checked ARD auto-rescue battery health, conducted simulated power-failure rescue test.',
        partsReplaced: [],
        technicianName: 'Amit Verma',
        technicianRemarks: 'ARD battery bank at 100% capacity. Passengers safely evacuated within 8 minutes.',
        liftOperatingStatus: 'Fully Operational & Safe',
      },
      {
        id: 'rec-004',
        serviceId: 'SR-WEP-2026-0045',
        serviceDate: '2026-03-08',
        serviceType: 'Parts Replacement',
        complaint: 'Light curtain sensor channel 4 intermittent blind spot causing nuisance reversals.',
        faultFound: 'Optical sender phototransistor array degraded from ambient condensation.',
        workPerformed: 'Installed 32-Channel Smart Multi-Beam Infrared Light Curtain (WEP-SNS-LC32) and calibrated sync controller.',
        partsReplaced: [
          {
            partId: 'inv-2',
            partName: '32-Channel Smart Multi-Beam Infrared Light Curtain (940nm)',
            partNumber: 'WEP-SNS-LC32',
            quantity: 1,
            unitPrice: 6500,
            totalPrice: 6500,
          },
        ],
        technicianName: 'Rajesh Sharma',
        technicianRemarks: 'Full door safety curtain tested with 50mm obstacle test wand across full door height.',
        liftOperatingStatus: 'Fully Operational & Safe',
      },
    ];

    return baseRecords;
  }, []);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return liftHistoryRecords.filter((rec) => {
      if (selectedTypeFilter !== 'all' && rec.serviceType !== selectedTypeFilter) return false;
      return true;
    });
  }, [liftHistoryRecords, selectedTypeFilter]);

  const handleDownloadReport = (rec: (typeof liftHistoryRecords)[0]) => {
    const mockReport: ServiceReport = {
      id: rec.id,
      companyId: 'comp-1',
      branchId: 'br-thn-1',
      reportNumber: rec.serviceId,
      ticketId: job.id,
      ticketNumber: job.jobId,
      liftId: job.liftId,
      liftNumber: job.liftNumber,
      liftBrand: 'WEPSUN MRL Traction',
      liftModel: 'WEP-MAX 3000 Eco',
      buildingName: job.buildingName,
      buildingAddress: job.serviceAddress,
      clientName: job.clientName,
      clientContact: job.clientPhone,
      technicianId: job.technicianId,
      technicianName: rec.technicianName,
      technicianPhone: job.clientPhone,
      serviceDate: rec.serviceDate,
      serviceStartTime: '10:00 AM',
      serviceEndTime: '11:30 AM',
      serviceType: rec.serviceType as any,
      initialDiagnosis: rec.complaint,
      rootCause: rec.faultFound,
      workPerformed: rec.workPerformed,
      partsReplaced: rec.partsReplaced,
      technicianRecommendations: rec.technicianRemarks,
      liftOperatingStatusAfterWork: 'Fully Operational & Safe',
      beforePhotos: [],
      afterPhotos: [],
      technicianSignature: rec.technicianName,
      clientSignature: job.clientName,
      clientOtpVerified: true,
      createdAt: rec.serviceDate,
    };

    downloadServiceReportPdf(mockReport);
    showToast('success', 'Report Downloaded', `PDF Service Report ${rec.serviceId} saved to downloads.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Previous Service History</h2>
              <p className="text-xs text-slate-500">
                Audited maintenance records for <strong className="text-slate-800">{job.liftNumber}</strong> ({job.buildingName})
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start md:self-auto">
            {filteredRecords.length} Historical Records
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter by Type:
          </span>

          {['all', 'Breakdown', 'Preventive Maintenance (PM)', 'Repair', 'Parts Replacement'].map(
            (type) => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTypeFilter === type
                    ? 'bg-[#123B5D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All Records' : type}
              </button>
            )
          )}
        </div>
      </div>

      {/* History Records Timeline */}
      <div className="space-y-4">
        {filteredRecords.map((rec, idx) => (
          <div
            key={rec.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                  {rec.serviceId}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {rec.serviceType}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {rec.serviceDate}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadReport(rec)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#1976D2]" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Reported Complaint</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{rec.complaint}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Diagnosis / Fault Found</span>
                  <p className="text-slate-600 mt-0.5">{rec.faultFound}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Work Performed</span>
                  <p className="text-slate-600 mt-0.5">{rec.workPerformed}</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Parts Replaced ({rec.partsReplaced.length})
                  </span>
                  {rec.partsReplaced.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No parts replaced during this visit.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {rec.partsReplaced.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{p.partName}</span>
                            <span className="font-mono text-[10px] text-slate-400 block">{p.partNumber}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-700">
                            Qty: {p.quantity} • ₹{p.totalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[11px]">
                  <span>
                    Service Engineer: <strong className="text-slate-800">{rec.technicianName}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {rec.liftOperatingStatus}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Remarks</span>
                  <p className="text-[11px] text-slate-600 italic">"{rec.technicianRemarks}"</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
