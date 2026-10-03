import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Building2,
  Layers,
  Calendar,
  Zap,
  Gauge,
  Sparkles,
  ArrowLeft,
  AlertOctagon,
} from 'lucide-react';
import { Lift, Company } from '../../types';
import { RaiseComplaintModal } from '../client/RaiseComplaintModal';
import { WepsunLogo } from './WepsunLogo';

interface PublicQrLiftPassportProps {
  lift: Lift;
  company: Company;
  onBackToApp?: () => void;
}

export const PublicQrLiftPassport: React.FC<PublicQrLiftPassportProps> = ({
  lift,
  company,
  onBackToApp,
}) => {
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F8FA] text-slate-800 flex flex-col justify-between">
      {/* Public Verified Banner Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <WepsunLogo size="sm" theme="light" />
            <div className="border-l border-slate-200 pl-3">
              <div className="text-[10px] text-[#2E7D32] font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Official Verified Lift Passport
              </div>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to App
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-5 my-auto">
        {/* Lift ID Badge Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1976D2] font-mono text-xs font-bold tracking-wider uppercase">
              PERMANENT LIFT ID
            </span>
          </div>

          <h1 className="text-3xl font-black font-mono text-[#1976D2] tracking-tight">
            {lift.liftNumber}
          </h1>

          <div className="text-xs text-slate-600 space-y-0.5">
            <div className="font-bold text-slate-900 text-base">{lift.buildingName}</div>
            <div className="text-slate-500">{lift.locationDetails}</div>
          </div>

          {/* Operational Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider">
            {lift.currentStatus === 'operational' ? (
              <span className="bg-emerald-100 text-[#2E7D32] border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> FULLY OPERATIONAL & CERTIFIED
              </span>
            ) : lift.currentStatus === 'breakdown' ? (
              <span className="bg-red-100 text-[#D32F2F] border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold animate-pulse">
                <AlertOctagon className="w-4 h-4 text-red-600" /> BREAKDOWN ATTENDANCE IN PROGRESS
              </span>
            ) : (
              <span className="bg-amber-100 text-[#F9A825] border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> ROUTINE INSPECTION SCHEDULED
              </span>
            )}
          </div>
        </div>

        {/* Public-Safe Technical Specs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#1976D2]" /> Verified Elevator Specifications
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Manufacturer</span>
              <strong className="text-slate-900 text-sm font-sans">{lift.brand}</strong>
            </div>

            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Rated Capacity</span>
              <strong className="text-slate-900 text-sm">
                {lift.capacityPersons} Persons ({lift.capacityKg} kg)
              </strong>
            </div>

            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Rated Speed</span>
              <strong className="text-slate-900 text-sm">{lift.speedMps} m/s</strong>
            </div>

            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Travel / Floors</span>
              <strong className="text-slate-900 text-sm">{lift.floors}</strong>
            </div>

            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Next Preventive PM</span>
              <strong className="text-emerald-700 text-sm">{lift.nextPmDate}</strong>
            </div>

            <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Safety Certificate</span>
              <strong className="text-[#1976D2] text-xs truncate block font-bold">
                {lift.safetyCertificateNumber}
              </strong>
            </div>
          </div>
        </div>

        {/* Emergency Breakdown Trigger & 24x7 Control Room Hotlines */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-red-100 text-red-600">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-red-900">Experiencing an Issue or Passenger Stoppage?</h3>
              <p className="text-[11px] text-red-700">
                Immediately raise an emergency alert to dispatch the on-duty engineer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Breakdown / SOS
            </button>

            <a
              href={`tel:${company.contactPhone}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 transition-colors shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-[#1976D2]" />
              Call Control Room ({company.contactPhone})
            </a>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-mono">
        <div>
          {company.name} • Certified Lift Maintenance & Modernization Platform
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          Secure Public Verification Token: {lift.qrToken || 'wep-token-verified'}
        </div>
      </footer>

      {/* Emergency Breakdown Modal */}
      <RaiseComplaintModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        initialLiftId={lift.id}
      />
    </div>
  );
};
