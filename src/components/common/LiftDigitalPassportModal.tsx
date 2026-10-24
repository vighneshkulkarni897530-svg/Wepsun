import React, { useState } from 'react';
import {
  X,
  Layers,
  Building,
  ShieldCheck,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  QrCode,
  ExternalLink,
  Cpu,
  Zap,
  Gauge,
  PhoneCall,
  User,
  Clock,
  Sparkles,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Lift, UserRole, ServiceReport, Complaint } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadLiftSpecificationPdf } from '../../services/pdfGenerator';
import { WepsunLogo } from './WepsunLogo';

interface LiftDigitalPassportModalProps {
  lift: Lift | null;
  isOpen: boolean;
  onClose: () => void;
  onRaiseComplaint?: (liftId: string) => void;
  onStartService?: (liftId: string) => void;
  onEditSpecs?: (lift: Lift) => void;
}

export const LiftDigitalPassportModal: React.FC<LiftDigitalPassportModalProps> = ({
  lift,
  isOpen,
  onClose,
  onRaiseComplaint,
  onStartService,
  onEditSpecs,
}) => {
  const { currentRole, activeCompany, serviceReports, complaints, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'passport' | 'qrcode' | 'history'>('passport');

  if (!isOpen || !lift) return null;

  // Filter reports and complaints for this lift
  const liftReports = serviceReports.filter(
    (r) => r.liftId === lift.id || r.liftNumber === lift.liftNumber
  );
  const liftComplaints = complaints.filter(
    (c) => c.liftId === lift.id || c.liftNumber === lift.liftNumber
  );

  const passportDirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#lift-passport?id=${lift.id}&liftNumber=${encodeURIComponent(lift.liftNumber)}`
    : `WEPSUN:LIFT:${lift.id}:${lift.liftNumber}:${lift.buildingName}`;

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    passportDirectUrl
  )}&color=12-59-93&bgcolor=255-255-255`;

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WEPSUN Lift QR Code - ${lift.liftNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; margin: 0; }
            .container { max-width: 420px; margin: 0 auto; border: 3px solid #123B5D; border-radius: 24px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .brand { font-size: 24px; font-weight: 900; color: #123B5D; letter-spacing: 2px; }
            .tagline { font-size: 11px; text-transform: uppercase; color: #64748B; letter-spacing: 1.5px; margin-top: 4px; font-weight: 700; }
            .qr-wrapper { margin: 24px 0; display: inline-block; padding: 12px; border: 2px dashed #94A3B8; border-radius: 16px; }
            .lift-badge { background: #1976D2; color: white; display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 16px; margin-top: 8px; }
            .site-info { margin-top: 16px; font-size: 14px; font-weight: 700; color: #1E293B; }
            .address { font-size: 12px; color: #64748B; margin-top: 4px; }
            .instructions { font-size: 11px; color: #059669; font-weight: 700; margin-top: 20px; background: #ECFDF5; padding: 10px; border-radius: 10px; }
            .emergency { font-size: 12px; font-weight: 900; color: #DC2626; margin-top: 14px; }
            @media print { body { padding: 0; } .container { border: 2px solid black; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">WEPSUN</div>
            <div class="tagline">Engineering Solutions • Elevator Digital Passport</div>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" width="220" height="220" alt="QR Code" />
            </div>
            <div>
              <div class="lift-badge">${lift.liftNumber}</div>
              <div class="site-info">${lift.buildingName}</div>
              <div class="address">${lift.locationDetails || 'Main Elevator Shaft'}</div>
            </div>
            <div class="instructions">
              📱 Scan with Smartphone Camera or WEPSUN App to inspect lift passport or report breakdown
            </div>
            <div class="emergency">🚨 24x7 Control Room Emergency: +91 98201 55432</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92dvh] overflow-y-auto shadow-2xl relative text-slate-800 my-auto flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#123B5D] to-[#1976D2] p-5 sm:p-6 text-white rounded-t-3xl relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-white/20 text-white">
                  {lift.id}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    lift.currentStatus === 'operational'
                      ? 'bg-emerald-400 text-slate-900'
                      : lift.currentStatus === 'breakdown'
                      ? 'bg-red-400 text-slate-900 animate-pulse'
                      : 'bg-amber-400 text-slate-900'
                  }`}
                >
                  ● {lift.currentStatus.replace('_', ' ')}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/10 text-sky-100">
                  {lift.type}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{lift.liftNumber}</h2>
              <p className="text-xs text-sky-100 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{lift.buildingName}</span>
                <span>•</span>
                <span>{lift.locationDetails || 'Shaft 1'}</span>
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => downloadLiftSpecificationPdf(lift, activeCompany)}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Specs PDF</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/20">
            <button
              onClick={() => setActiveTab('passport')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'passport'
                  ? 'bg-white text-[#123B5D] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Technical Passport
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'qrcode'
                  ? 'bg-white text-[#123B5D] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code & Tag</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-[#123B5D] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Service History ({liftReports.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {activeTab === 'passport' && (
            <div className="space-y-6">
              {/* Summary Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Rated Capacity
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {lift.capacityPersons} Pers / {lift.capacityKg} kg
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Standard Rated Load</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Travel Speed
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-1">{lift.speedMps} m/s</div>
                  <span className="text-[10px] text-slate-500 font-medium">Rated Linear Speed</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Floors & Stops
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {lift.stops} Stops
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium truncate block">{lift.floors}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Machine Drive
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-1 truncate">
                    {lift.machineType}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{lift.motorKw || 7.5} kW Motor</span>
                </div>
              </div>

              {/* Comprehensive Technical Specifications Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
                  <span>Digital Passport Specifications & Hardware Registry</span>
                  <span className="text-[10px] font-mono text-[#1976D2]">WEPSUN OEM CERTIFIED</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
                  {/* Left Column */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Brand & Series:</span>
                      <span className="font-bold text-slate-900">{lift.brand}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Model Name:</span>
                      <span className="font-bold text-slate-900 font-mono">{lift.model}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Controller System:</span>
                      <span className="font-bold text-slate-900">{lift.controllerBrand || 'NICE 3000+ VVVF'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Door Operator:</span>
                      <span className="font-bold text-slate-900">{lift.doorOperator || 'Center Opening Auto Door'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Automatic Rescue Device:</span>
                      <span className="font-bold text-emerald-700">{lift.ardSystem || 'ARD 415V Included'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Governor Trip Speed:</span>
                      <span className="font-bold text-slate-900">{lift.governorSpeed || 1.75} m/s</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Traction Rope Dia:</span>
                      <span className="font-bold text-slate-900 font-mono">{lift.ropeDiaMm || 10} mm Steel</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Installation Date:</span>
                      <span className="font-bold text-slate-900 font-mono">{lift.installationDate || '2023-01-01'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Warranty Expiry:</span>
                      <span className="font-bold text-slate-900 font-mono">{lift.warrantyExpiry || '2026-01-01'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Safety Certificate No.:</span>
                      <span className="font-bold text-slate-900 font-mono">{lift.safetyCertificateNumber || 'MH-SAFE-2026'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Last PM Inspection:</span>
                      <span className="font-bold text-slate-900 font-mono">{lift.lastPmDate || '2024-01-01'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Next Scheduled PM:</span>
                      <span className="font-bold text-emerald-700 font-mono">{lift.nextPmDate || '2024-04-01'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-Specific Action Bar */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Authorized Quick Actions</span>
                  <span className="text-slate-500 text-[11px]">
                    Role: <strong className="text-[#1976D2] uppercase">{currentRole}</strong> • Actions are logged to audit trail
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  {currentRole === 'client' && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onRaiseComplaint) onRaiseComplaint(lift.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Breakdown</span>
                    </button>
                  )}

                  {currentRole === 'technician' && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onStartService) onStartService(lift.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Start Inspection / PM</span>
                    </button>
                  )}

                  {(currentRole === 'super_admin' ||
                    currentRole === 'company_admin' ||
                    currentRole === 'master_admin' ||
                    currentRole === 'service_manager') && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onEditSpecs) onEditSpecs(lift);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Edit Specifications</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qrcode' && (
            <div className="space-y-6 text-center">
              <div className="max-w-sm mx-auto p-6 rounded-3xl border-2 border-dashed border-[#123B5D]/40 bg-slate-50 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#123B5D] flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{lift.liftNumber}</h3>
                  <p className="text-xs text-slate-500">{lift.buildingName}</p>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-sm inline-block border border-slate-200">
                  <img
                    src={qrDataUrl}
                    alt="Lift QR Code"
                    width={220}
                    height={220}
                    className="rounded-lg mx-auto"
                  />
                </div>

                <div className="text-[11px] text-slate-600 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl font-semibold border border-emerald-200">
                  Scannable on elevator entrance or car operating panel for instant ticket dispatch and digital service history.
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handlePrintQr}
                    className="px-4 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print QR Placard</span>
                  </button>
                  <a
                    href={qrDataUrl}
                    download={`WEPSUN-QR-${lift.liftNumber}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Image</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Recent Service Reports & Maintenance Visits ({liftReports.length})
                </h3>
              </div>

              {liftReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No service reports recorded yet for this equipment unit.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {liftReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#1976D2]">{report.reportNumber}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {report.liftOperatingStatusAfterWork || 'Safe'}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">{report.serviceType}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{report.workPerformed}</p>
                      </div>

                      <div className="flex sm:flex-col items-start sm:items-end justify-between text-right text-[11px] text-slate-500">
                        <span className="font-mono font-semibold">{report.serviceDate}</span>
                        <span>Eng: {report.technicianName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Complaints History */}
              <div className="pt-2">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Breakdown Tickets for this Unit ({liftComplaints.length})
                </h3>
                {liftComplaints.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    Zero breakdown complaints logged. Equipment in prime running condition.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {liftComplaints.slice(0, 5).map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 mr-2">{comp.ticketNumber}</span>
                          <span className="text-slate-700 font-semibold">{comp.title}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({new Date(comp.reportedAt).toLocaleDateString()})</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            comp.status === 'closed' || comp.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
