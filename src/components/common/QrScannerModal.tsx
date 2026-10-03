import React, { useState } from 'react';
import { QrCode, Camera, X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lift } from '../../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanLift: (lift: Lift) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScanLift }) => {
  const { lifts } = useApp();
  const [selectedLiftId, setSelectedLiftId] = useState<string>(lifts[0]?.id || '');

  if (!isOpen) return null;

  const handleSimulateScan = (liftId: string) => {
    const targetLift = lifts.find((l) => l.id === liftId);
    if (targetLift) {
      onScanLift(targetLift);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">Scan Lift QR Code</h3>
            <p className="text-xs text-slate-500">Instant access to Lift Digital Passport & Service Log</p>
          </div>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative bg-[#123B5D] rounded-2xl border border-[#0e2f4a] overflow-hidden h-56 flex flex-col items-center justify-center text-white">
          {/* Laser scanning line animation */}
          <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-bounce" />

          {/* Corner brackets */}
          <div className="w-44 h-44 border-2 border-sky-400/60 rounded-xl relative flex flex-col items-center justify-center p-4 bg-white/5">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-sky-400" />

            <Camera className="w-10 h-10 text-sky-300 animate-pulse" />
            <span className="text-[11px] text-sky-200 font-mono text-center mt-2 font-medium">
              Point camera at WEPSUN QR plate
            </span>
          </div>

          <div className="absolute bottom-2 text-[10px] text-sky-200/60 font-mono">
            WEPSUN Optical Lift Passport Engine
          </div>
        </div>

        {/* Quick Simulator Picker for demo testing */}
        <div className="bg-[#F5F8FA] border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              ⚡ Instant QR Code Simulator
            </span>
            <span className="text-[10px] text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
              Scanner Simulator
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Select an installed elevator to simulate scanning its on-lift QR plate:
          </p>

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {lifts.map((lift) => (
              <button
                key={lift.id}
                onClick={() => handleSimulateScan(lift.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all shadow-sm group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-[#1976D2]">
                      {lift.liftNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                      {lift.brand}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {lift.buildingName} • {lift.locationDetails}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#1976D2] font-bold pl-2 shrink-0 group-hover:translate-x-1 transition-transform">
                  <span>Scan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
