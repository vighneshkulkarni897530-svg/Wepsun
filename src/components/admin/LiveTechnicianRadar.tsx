import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  PhoneCall,
  UserCheck,
  Zap,
  Activity,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LiveTechnicianRadar: React.FC = () => {
  const { technicians, complaints } = useApp();
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');

  const selectedTech = technicians.find((t) => t.id === selectedTechId) || technicians[0];
  const techJob = complaints.find((c) => c.id === selectedTech?.activeJobId);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1976D2] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              GPS FIELD TELEMETRY
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
            Live Field Technician Radar & Fleet Status
          </h2>
          <p className="text-xs text-slate-500">
            Real-time coordinates, job dispatch routing, and field engineer availability
          </p>
        </div>
      </div>

      {/* 2-Column Radar Map + Technician Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Map Simulation */}
        <div className="lg:col-span-2 bg-[#123B5D] border border-blue-900 rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[420px] flex flex-col justify-between text-white">
          {/* Animated Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[300px] h-[300px] rounded-full border border-sky-300" />
            <div className="w-[500px] h-[500px] rounded-full border border-sky-300" />
            <div className="w-[700px] h-[700px] rounded-full border border-sky-300" />
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-sky-300/40" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-sky-300/40" />
          </div>

          {/* Map Region Header */}
          <div className="relative z-10 flex items-center justify-between bg-black/25 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Compass className="w-4 h-4 text-sky-300 animate-spin" />
              <span className="text-white font-bold">Mumbai & Navi Mumbai Elevator Grid</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 font-semibold">
              ● 4 Units Online
            </span>
          </div>

          {/* Interactive Simulated Markers */}
          <div className="relative z-10 my-auto grid grid-cols-2 gap-4 py-8">
            {technicians.map((tech) => {
              const isSelected = tech.id === selectedTech?.id;
              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`p-3.5 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white/20 border-white shadow-lg scale-105'
                      : 'bg-black/20 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={tech.avatar}
                        alt={tech.name}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/50"
                      />
                      <span
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#123B5D] ${
                          tech.currentStatus === 'available'
                            ? 'bg-emerald-400'
                            : tech.currentStatus === 'on_job'
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-bold text-white truncate">{tech.name}</div>
                      <div className="text-[10px] text-sky-200 font-mono truncate">
                        {tech.currentLocationName}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-sky-200/70">
            <span>Lat: 19.0760° N, Lng: 72.9980° E</span>
            <span>WEPSUN Telematics v2.4</span>
          </div>
        </div>

        {/* Selected Engineer Telemetry Panel */}
        {selectedTech && (
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <img
                  src={selectedTech.avatar}
                  alt={selectedTech.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedTech.name}</h3>
                  <span className="text-xs text-[#1976D2] font-mono font-bold">
                    {selectedTech.employeeCode}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono block mt-1 border border-slate-200">
                    {selectedTech.zone}
                  </span>
                </div>
              </div>

              {/* Current Job Assignment */}
              <div className="space-y-1.5 text-xs">
                <span className="font-mono text-slate-500 uppercase font-bold text-[10px]">
                  Current Field Assignment
                </span>
                {techJob ? (
                  <div className="bg-[#F5F8FA] p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-mono font-bold text-[#1976D2]">{techJob.ticketNumber}</span>
                    <p className="font-bold text-slate-900">{techJob.buildingName}</p>
                    <p className="text-[11px] text-slate-600">{techJob.title}</p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 font-mono text-xs">
                    Available for nearest emergency breakdown dispatch
                  </div>
                )}
              </div>

              {/* Telemetry Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-sans block font-semibold">Avg Response</span>
                  <span className="text-[#1976D2] font-bold text-sm">
                    {selectedTech.avgResolutionMinutes} mins
                  </span>
                </div>

                <div className="bg-[#F5F8FA] p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-sans block font-semibold">Customer Rating</span>
                  <span className="text-amber-600 font-bold text-sm">
                    ⭐ {selectedTech.customerRating} / 5
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${selectedTech.phone}`}
              className="w-full py-3 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              Direct Call ({selectedTech.phone})
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
