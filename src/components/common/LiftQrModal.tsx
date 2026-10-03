import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  History,
  CheckCircle2,
} from 'lucide-react';
import { Lift } from '../../types';

interface LiftQrModalProps {
  lift: Lift | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPassport?: (lift: Lift) => void;
}

export const LiftQrModal: React.FC<LiftQrModalProps> = ({
  lift,
  isOpen,
  onClose,
  onOpenPassport,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'scanned_view'>('qr');

  if (!isOpen || !lift) return null;

  const qrUrl = `https://wepsun.com/passport/${lift.liftNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading & Intro matching Page 29 specification */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] mx-auto mb-2 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Lift QR Code</h2>
          <p className="text-xs text-slate-500 mt-1">
            Scan this QR code to access the digital profile of this lift.
          </p>
        </div>

        {/* Tab switch between QR code print view and After-Scanning Preview */}
        <div className="flex bg-[#F5F8FA] p-1 rounded-xl mb-4 text-xs font-bold border border-slate-200">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'qr' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            QR Plate
          </button>
          <button
            onClick={() => setActiveTab('scanned_view')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'scanned_view' ? 'bg-[#1976D2] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            After Scanning Profile
          </button>
        </div>

        {activeTab === 'qr' ? (
          <div className="space-y-4">
            {/* QR Plate Design */}
            <div className="bg-gradient-to-b from-[#123B5D] to-[#0A2540] p-5 rounded-2xl text-center text-white shadow-lg border border-sky-900/40">
              <div className="text-[10px] font-bold tracking-widest text-sky-300 uppercase mb-1">
                WEPSUN ENGINEERING SOLUTION
              </div>
              <div className="text-sm font-black text-white mb-3">
                LIFT DIGITAL PASSPORT
              </div>

              {/* QR Code graphic */}
              <div className="bg-white p-3.5 rounded-2xl inline-flex items-center justify-center shadow-inner">
                <QRCodeSVG
                  value={qrUrl}
                  size={150}
                  level="H"
                  includeMargin={false}
                  className="mx-auto"
                />
              </div>

              <div className="mt-3">
                <span className="font-mono text-sm font-black bg-white/10 px-3 py-1 rounded-lg tracking-wider border border-white/20 inline-block">
                  {lift.liftNumber}
                </span>
                <p className="text-[10px] text-sky-200 mt-1">{lift.buildingName}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-[#1976D2] hover:bg-blue-700 font-bold text-white flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Sticker</span>
              </button>
            </div>
          </div>
        ) : (
          /* After scanning info matching page 29:
             Lift Number, Capacity, Type, Installation Date, AMC Status, Service History
          */
          <div className="space-y-3 text-xs bg-[#F5F8FA] p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Lift Number:</span>
              <span className="font-mono font-bold text-[#1976D2]">{lift.liftNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Capacity:</span>
              <span className="font-bold text-slate-900">{lift.capacityPersons} Persons / {lift.capacityKg} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Type:</span>
              <span className="font-semibold text-slate-800">{lift.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Installation Date:</span>
              <span className="font-medium text-slate-800">12 Jan 2022</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">AMC Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active 🟢 ({lift.amcStatus.toUpperCase()})
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-semibold block mb-1">Service History:</span>
              <div className="space-y-1 text-[11px] text-slate-600">
                <p>• 10 Sep 2026 — PM Routine Checked & Passed (OK)</p>
                <p>• 15 Aug 2026 — Door Sensor Realigned & Lubricated</p>
              </div>
            </div>

            {onOpenPassport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPassport(lift);
                }}
                className="w-full mt-2 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>View Full Digital Passport</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
