import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  ShieldCheck,
  Zap,
  Gauge,
  Cpu,
  Layers,
  Calendar,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Printer,
  Download,
  History,
  PhoneCall,
  Wrench,
  Sparkles,
  Activity,
} from 'lucide-react';
import { Lift } from '../../types';
import { WepsunLogo } from './WepsunLogo';
import { useApp } from '../../context/AppContext';
import { downloadLiftPassportPdf } from '../../services/pdfGenerator';
import { IoTLiftSimulationModal } from './IoTLiftSimulationModal';

interface LiftPassportModalProps {
  lift: Lift | null;
  isOpen: boolean;
  onClose: () => void;
  onRaiseTicket?: (lift: Lift) => void;
}

export const LiftPassportModal: React.FC<LiftPassportModalProps> = ({
  lift,
  isOpen,
  onClose,
  onRaiseTicket,
}) => {
  const { complaints, serviceReports, pmRecords, amcContracts, currentRole, verifyClientAccess, activeCompany } = useApp();
  const [isIoTModalOpen, setIsIoTModalOpen] = useState(false);

  if (!isOpen || !lift) return null;

  if (currentRole === 'client' && !verifyClientAccess(lift.clientId)) {
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

  // Filter history for this lift (client-isolated)
  const liftComplaints = complaints.filter(
    (c) => c.liftId === lift.id && (currentRole !== 'client' || verifyClientAccess(c.clientId))
  );
  const liftReports = serviceReports.filter(
    (r) => r.liftId === lift.id && (currentRole !== 'client' || verifyClientAccess(r.clientId))
  );
  const liftPms = pmRecords.filter((p) => p.liftId === lift.id);
  const liftAmc = amcContracts.find((a) => a.id === lift.activeAmcId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-800 my-auto flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Passport Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <WepsunLogo size="md" theme="light" />
            <div className="border-l border-slate-200 pl-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#1976D2] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  LIFT DIGITAL PASSPORT
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    lift.currentStatus === 'operational'
                      ? 'bg-emerald-100 text-[#2E7D32]'
                      : lift.currentStatus === 'breakdown'
                      ? 'bg-red-100 text-[#D32F2F] animate-pulse'
                      : 'bg-amber-100 text-[#F9A825]'
                  }`}
                >
                  ● {lift.currentStatus.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-1">
                {lift.liftNumber}
              </h2>
              <p className="text-xs text-slate-500">
                {lift.buildingName} • {lift.locationDetails}
              </p>
            </div>
          </div>

          <div className="no-print flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsIoTModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold border border-cyan-500/40 shadow-sm transition-all"
              title="Launch Real-Time IoT Telemetry Stream & 3D Simulation"
            >
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>IoT Telemetry</span>
            </button>

            <button
              onClick={() => downloadLiftPassportPdf(lift, activeCompany)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1976D2] text-xs font-bold border border-blue-200 transition-colors"
              title="Download PDF Digital Passport"
            >
              <Download className="w-4 h-4 text-[#1976D2]" />
              Download PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
              title="Print QR Plate Sticker"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              Print QR Plate
            </button>

            {onRaiseTicket && (
              <button
                onClick={() => {
                  onRaiseTicket(lift);
                  onClose();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Issue
              </button>
            )}
          </div>
        </div>

        {/* QR Code Plate & Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* QR Plate Card */}
          <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200">
              <QRCodeSVG
                value={`https://wepsun.com/passport/${lift.liftNumber}?id=${lift.id}`}
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>
            <span className="font-mono text-xs font-bold text-slate-900 mt-2.5">
              {lift.liftNumber}
            </span>
            <span className="text-[10px] text-[#1976D2] font-mono font-bold">
              Scan for On-Site Digital Passport
            </span>
          </div>

          {/* AMC & Safety Badge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AMC Contract Status</span>
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">
                {liftAmc ? liftAmc.amcType : 'Comprehensive AMC'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Valid until: <strong className="text-emerald-700">{liftAmc?.endDate || '2027-03-31'}</strong>
              </div>
            </div>
            <div className="bg-[#F5F8FA] rounded-xl p-2.5 text-[11px] flex items-center justify-between border border-slate-200">
              <span className="text-slate-500">Next Scheduled PM:</span>
              <span className="text-[#1976D2] font-bold">{lift.nextPmDate}</span>
            </div>
          </div>

          {/* Safety Certificate Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <FileCheck className="w-4 h-4 text-[#1976D2]" />
              <span>Govt. Safety Certificate</span>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-900 font-bold">
                {lift.safetyCertificateNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Expiry: <strong className="text-slate-900">{lift.safetyCertificateExpiry}</strong>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inspected & Certified Safe</span>
            </div>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1976D2]" />
            Technical Equipment Specifications
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Make & Model</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{lift.brand}</p>
              <p className="text-[11px] text-slate-500">{lift.model}</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Machine Type</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{lift.machineType}</p>
              <p className="text-[11px] text-slate-500">{lift.motorKw} kW Motor</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Controller Brand</span>
              <p className="text-xs font-bold text-[#1976D2] mt-0.5">{lift.controllerBrand}</p>
              <p className="text-[11px] text-slate-500">VVVF Microprocessor</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Door Operator</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{lift.doorOperator}</p>
              <p className="text-[11px] text-slate-500">Automatic Center/Side</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Capacity & Speed</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {lift.capacityPersons} Persons ({lift.capacityKg} kg)
              </p>
              <p className="text-[11px] text-slate-500">{lift.speedMps} m/s Speed</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Floors & Stops</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{lift.floors}</p>
              <p className="text-[11px] text-slate-500">{lift.stops} Landing Stops</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Auto Rescue (ARD)</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{lift.ardSystem}</p>
              <p className="text-[11px] text-slate-500">Battery Backed 415V</p>
            </div>

            <div className="bg-[#F5F8FA] border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Ropes & Governor</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{lift.ropeDiaMm} mm Hoisting Ropes</p>
              <p className="text-[11px] text-slate-500">Gov. {lift.governorSpeed} m/s</p>
            </div>
          </div>
        </div>

        {/* Maintenance & Breakdown Lifecycle History */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#1976D2]" />
            Service & Maintenance History Log
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {liftComplaints.length === 0 && liftReports.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F5F8FA] border border-slate-200 text-center text-xs text-slate-500">
                Zero breakdown complaints logged. Equipment running smoothly with regular PM visits.
              </div>
            ) : (
              liftComplaints.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1976D2]">{c.ticketNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          c.status === 'closed'
                            ? 'bg-emerald-100 text-[#2E7D32]'
                            : 'bg-amber-100 text-[#F9A825]'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-slate-900 font-semibold">{c.title}</p>
                    <p className="text-[11px] text-slate-500">
                      Reported: {new Date(c.reportedAt).toLocaleDateString()} • Tech: {c.assignedTechnicianName || 'Pending'}
                    </p>
                  </div>
                  {c.partsReplaced.length > 0 && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#1976D2] font-bold">Parts Replaced</span>
                      <p className="text-[11px] text-slate-600">{c.partsReplaced.map((p) => p.partName).join(', ')}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Emergency Call Bar */}
        <div className="bg-[#F5F8FA] p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">WEPSUN 24x7 Emergency Helpdesk:</span>
              <span className="font-mono text-[#1976D2] font-bold text-sm">+91 98201 55432 / +91 98202 88765</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            WEPSUN ENGINEERING SOLUTION ISO 9001:2015 Certified
          </span>
        </div>

        {/* Real-time IoT 3D Simulation & Telemetry Modal */}
        <IoTLiftSimulationModal
          lift={lift}
          isOpen={isIoTModalOpen}
          onClose={() => setIsIoTModalOpen(false)}
        />
      </div>
    </div>
  );
};
