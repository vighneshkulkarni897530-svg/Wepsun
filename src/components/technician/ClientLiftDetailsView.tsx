import React, { useState } from 'react';
import {
  Building2,
  PhoneCall,
  Navigation,
  MapPin,
  Mail,
  User,
  ShieldCheck,
  Layers,
  Calendar,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  Compass,
  Cpu,
  Gauge,
  Weight,
  Maximize2,
  CheckCircle2,
  Phone,
  Clock,
  ArrowRight,
  Hash,
  Award,
} from 'lucide-react';
import { TechnicianJob, Lift } from '../../types';

interface ClientLiftDetailsViewProps {
  job: TechnicianJob;
  lift?: Lift;
  onNavigateToTab: (tab: string) => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ClientLiftDetailsView: React.FC<ClientLiftDetailsViewProps> = ({
  job,
  lift,
  onNavigateToTab,
  showToast,
}) => {
  const [isCalling, setIsCalling] = useState<string | null>(null);

  const handleCall = (name: string, phone: string) => {
    setIsCalling(name);
    showToast('info', `Connecting Call`, `Dialing ${name} (${phone})...`);
    setTimeout(() => {
      setIsCalling(null);
      window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
    }, 800);
  };

  const handleOpenMaps = () => {
    const encodedAddress = encodeURIComponent(`${job.buildingName}, ${job.serviceAddress}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    showToast('info', 'Opening Navigation', `Routing to ${job.buildingName} via Google Maps...`);
    window.open(mapsUrl, '_blank');
  };

  // Field Geolocation Distance & Travel calculations
  const distanceKm = 4.2;
  const etaMinutes = 14;

  const serialNo = (lift as any)?.serialNumber || (job?.liftNumber ? `SN-LFT-${job.liftNumber.slice(-4)}-2024` : 'SN-LFT-1001-2024');
  const installDate = lift?.installationDate || '15 Jan 2024';
  const warrantyStatus = lift?.warrantyExpiry ? `Valid until ${lift.warrantyExpiry}` : 'Active OEM 5-Yr Warranty';
  const amcExpiryDate = '30 Sep 2026';

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation & Quick Actions */}
      <div className="bg-gradient-to-r from-[#123B5D] to-[#1976D2] rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/20">
                {job.jobId}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                {job.jobType}
              </span>
            </div>
            <h2 className="text-xl font-black">{job.buildingName}</h2>
            <p className="text-xs text-sky-100 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              {job.serviceAddress}
            </p>
          </div>

          {/* Quick Route & Dial Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenMaps}
              className="px-4 py-2.5 rounded-xl bg-white text-[#123B5D] hover:bg-sky-50 text-xs font-black shadow-sm transition-all flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 text-[#1976D2]" />
              <span>Start GPS Route ({distanceKm} km • {etaMinutes} min)</span>
            </button>

            <button
              onClick={() => handleCall(job.contactPerson, job.clientPhone)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-sm transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isCalling ? 'Dialing...' : 'Call Client'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Client Details Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#1976D2] flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Client & Site Contact Details</h3>
                <p className="text-[11px] text-slate-500">Authorized jurisdiction for this service job</p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified Client
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Client / Company Name</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{job.clientName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Person</span>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {job.contactPerson}
                </p>
                <p className="text-[11px] text-slate-500">Authorized Society Signatory</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone & Email</span>
                <p className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {job.clientPhone}
                </p>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {job.clientEmail}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Service Address</span>
              <p className="font-medium text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {job.serviceAddress}
              </p>
            </div>

            {/* Travel & Distance Stats */}
            <div className="grid grid-cols-3 gap-2 bg-sky-50/60 border border-sky-100 p-3 rounded-xl text-center">
              <div>
                <span className="text-[10px] font-bold text-sky-800 block">Distance to Client</span>
                <span className="font-black text-sky-900 text-sm">{distanceKm} km</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-800 block">Est. Travel Time</span>
                <span className="font-black text-sky-900 text-sm">{etaMinutes} mins</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-800 block">Traffic Status</span>
                <span className="font-bold text-emerald-600 text-xs">Normal Traffic</span>
              </div>
            </div>

            {/* Calling Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleCall(job.contactPerson, job.clientPhone)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#1976D2]" />
                <span>Call Client</span>
              </button>

              <button
                onClick={() => handleCall('Site Security / Supervisor', job.clientPhone)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Site Desk</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Lift Technical Details Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Lift Technical Profile</h3>
                <p className="text-[11px] text-slate-500">Unit ID: {job.liftNumber}</p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                lift?.currentStatus === 'breakdown'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              Current Status: {lift?.currentStatus ? lift.currentStatus.toUpperCase() : 'OPERATIONAL'}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Main Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Lift Number / ID</span>
                <span className="font-mono font-bold text-[#1976D2]">{job.liftNumber}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Lift Type</span>
                <span className="font-bold text-slate-800">{lift?.type || 'Passenger'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Brand / Manufacturer</span>
                <span className="font-bold text-slate-800">{lift?.brand || 'WEPSUN MRL Traction'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Model</span>
                <span className="font-bold text-slate-800">{lift?.model || 'WEP-MAX 3000 Eco'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Serial Number</span>
                <span className="font-mono font-bold text-slate-800">{serialNo}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Capacity</span>
                <span className="font-bold text-slate-800">
                  {lift?.capacityPersons || 8} Pers. ({lift?.capacityKg || 544} kg)
                </span>
              </div>
            </div>

            {/* Installation, Warranty & AMC */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Installation Date</span>
                <span className="font-semibold text-slate-700">{installDate}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Warranty Status</span>
                <span className="font-semibold text-emerald-700">{warrantyStatus}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">AMC Expiry Date</span>
                <span className="font-mono font-bold text-amber-800">{amcExpiryDate}</span>
              </div>
            </div>

            {/* Controller & Systems */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" /> Controller System
                </span>
                <span className="font-bold text-slate-800">{lift?.controllerBrand || 'Monarch NICE 3000+'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Door Operator</span>
                <span className="font-bold text-slate-800">{lift?.doorOperator || 'Fermator VVVF 4+'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Auto Rescue Device</span>
                <span className="font-bold text-slate-800">{lift?.ardSystem || 'WEPSUN Smart ARD 15kVA'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Machine & Motor</span>
                <span className="font-bold text-slate-800">
                  {lift?.machineType || 'Gearless PMSM'} ({lift?.motorKw || 5.5} kW)
                </span>
              </div>
            </div>

            {/* Contract & AMC Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">AMC Status</span>
                <span className="text-xs font-black text-amber-900 mt-0.5 block">
                  {lift?.amcStatus === 'active' ? 'Active Comprehensive AMC' : 'Active Standard AMC'}
                </span>
                <span className="text-[10px] text-amber-700">Valid till {amcExpiryDate}</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Safety Certificate</span>
                <span className="text-xs font-black text-emerald-900 mt-0.5 block">
                  {lift?.safetyCertificateNumber || 'MH-EI-LIFT-2025'}
                </span>
                <span className="text-[10px] text-emerald-700">Valid till Mar 2027</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => onNavigateToTab('service_history')}
                className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1"
              >
                <span>View Lift Service History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigateToTab('diagnosis')}
                className="px-3.5 py-2 rounded-xl bg-[#123B5D] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <span>Proceed to Diagnosis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
