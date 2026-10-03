import React, { useState } from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Plus,
  Trash2,
  KeyRound,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Complaint, PartReplaced, InventoryItem, ServiceReport } from '../../types';
import { useApp } from '../../context/AppContext';
import { DigitalSignaturePad } from '../common/DigitalSignaturePad';
import { OtpVerificationModal } from '../common/OtpVerificationModal';
import { ServiceReportModal } from '../common/ServiceReportModal';

interface JobClosureModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
}

export const JobClosureModal: React.FC<JobClosureModalProps> = ({
  complaint,
  isOpen,
  onClose,
}) => {
  const { inventory, completeJobAndGenerateReport, currentUser } = useApp();

  const [diagnosis, setDiagnosis] = useState(
    complaint.diagnosisRemarks || '7th floor landing door lock interlock contact switch worn out; light curtain infrared diode channel 12 misaligned.'
  );
  const [rootCause, setRootCause] = useState(
    'Mechanical contact spring fatigue caused intermittent microswitch opening under cabin draft vibrations.'
  );
  const [actionTaken, setActionTaken] = useState(
    complaint.actionTaken || 'Replaced door lock interlock assembly, re-aligned light curtain channels, completed 15 full test cycles without faults.'
  );
  const [recommendations, setRecommendations] = useState(
    'Advised building security to prevent trolley door wedging during morning delivery hours.'
  );
  const [liftOperatingStatus, setLiftOperatingStatus] = useState<
    'Fully Operational & Safe' | 'Operational with Observation' | 'Shut Down (Parts Pending)'
  >('Fully Operational & Safe');

  // Parts list
  const [parts, setParts] = useState<PartReplaced[]>(
    complaint.partsReplaced.length > 0
      ? complaint.partsReplaced
      : [
          {
            partId: 'inv-3',
            partName: 'Landing Door Lock Interlock Switch Beak',
            partNumber: 'WEP-SW-LCK102',
            quantity: 1,
            unitPrice: 1850,
            totalPrice: 1850,
          },
        ]
  );
  const [selectedPartId, setSelectedPartId] = useState<string>(inventory[0]?.id || '');
  const [partQty, setPartQty] = useState<number>(1);

  // Photos
  const [beforePhotos, setBeforePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
  ]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
  ]);

  // Signatures
  const [techSign, setTechSign] = useState('');
  const [clientSign, setClientSign] = useState('');

  // OTP Verification Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Completed report state for auto-open
  const [generatedReport, setGeneratedReport] = useState<ServiceReport | null>(null);

  if (!isOpen) return null;

  const handleAddPart = () => {
    const invItem = inventory.find((i) => i.id === selectedPartId);
    if (!invItem) return;

    const existingIdx = parts.findIndex((p) => p.partId === invItem.id);
    if (existingIdx >= 0) {
      const updated = [...parts];
      updated[existingIdx].quantity += partQty;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * invItem.sellingPrice;
      setParts(updated);
    } else {
      setParts([
        ...parts,
        {
          partId: invItem.id,
          partName: invItem.name,
          partNumber: invItem.partNumber,
          quantity: partQty,
          unitPrice: invItem.sellingPrice,
          totalPrice: partQty * invItem.sellingPrice,
        },
      ]);
    }
  };

  const handleRemovePart = (idx: number) => {
    setParts(parts.filter((_, i) => i !== idx));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtpVerified) {
      setIsOtpModalOpen(true);
      return;
    }

    const report = completeJobAndGenerateReport(complaint.id, {
      diagnosis,
      rootCause,
      actionTaken,
      partsReplaced: parts,
      recommendations,
      liftOperatingStatus,
      beforePhotos,
      afterPhotos,
      technicianSignature: techSign || 'Rajesh Sharma [Digital Sign]',
      clientSignature: clientSign || 'Arvind Mehta [Client e-Sign]',
      clientOtpVerified: isOtpVerified,
    });

    setGeneratedReport(report);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-800 my-auto flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2E7D32] shadow-sm shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#1976D2] uppercase tracking-wider">
                  JOB COMPLETION & SERVICE REPORT GENERATOR
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900">
                Close Ticket: {complaint.ticketNumber} ({complaint.liftNumber})
              </h2>
            </div>
          </div>

          <form onSubmit={handleFinalSubmit} className="space-y-5 text-xs">
            {/* Technical Diagnosis & Root Cause */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  Technician Diagnosis Findings
                </label>
                <textarea
                  rows={2}
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:border-[#1976D2] outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Root Cause of Failure</label>
                <textarea
                  rows={2}
                  required
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:border-[#1976D2] outline-none resize-none"
                />
              </div>
            </div>

            {/* Action Taken */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Action Taken & Work Performed</label>
              <textarea
                rows={2}
                required
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:border-[#1976D2] outline-none resize-none"
              />
            </div>

            {/* Parts Consumed Logger */}
            <div className="space-y-3 bg-[#F5F8FA] p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Parts Replaced & Issued (Auto-Deducted from Inventory)
                </span>
                <span className="text-[11px] text-[#1976D2] font-mono font-bold">
                  Total: ₹{parts.reduce((acc, p) => acc + p.totalPrice, 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Add Part Form */}
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:border-[#1976D2]"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.currentStock}) — ₹{item.sellingPrice.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partQty}
                  onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                  className="w-20 bg-white border border-slate-200 rounded-xl p-2.5 text-center text-slate-900 font-mono focus:border-[#1976D2] outline-none"
                />

                <button
                  type="button"
                  onClick={handleAddPart}
                  className="px-3.5 py-2.5 bg-[#1976D2] hover:bg-blue-700 text-white font-bold rounded-xl border border-blue-600 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Part
                </button>
              </div>

              {/* Parts Table */}
              {parts.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {parts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold">{p.partName}</span>
                        <span className="text-slate-500">× {p.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#1976D2] font-bold">₹{p.totalPrice.toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Before & After Photo Proof */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" /> Before Service Photo
                </span>
                <img
                  src={beforePhotos[0]}
                  alt="Before"
                  className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" /> After Rectification Photo
                </span>
                <img
                  src={afterPhotos[0]}
                  alt="After"
                  className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                />
              </div>
            </div>

            {/* Final Operating Status */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Final Equipment Operating Status</label>
              <select
                value={liftOperatingStatus}
                onChange={(e) => setLiftOperatingStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none focus:border-[#1976D2]"
              >
                <option value="Fully Operational & Safe">🟢 Fully Operational & Safe for Passengers</option>
                <option value="Operational with Observation">🟡 Operational with Observation (Monitor next 24h)</option>
                <option value="Shut Down (Parts Pending)">🔴 Shut Down (Awaiting Major Assembly Replacement)</option>
              </select>
            </div>

            {/* Dual Digital Signature Pads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DigitalSignaturePad
                title="Technician Signature"
                signerName={currentUser.name}
                signerRole="Elevator Service Engineer"
                onSave={(sig) => setTechSign(sig)}
              />

              <DigitalSignaturePad
                title="Client / Society Signature"
                signerName={complaint.clientName}
                signerRole="Authorized Customer"
                onSave={(sig) => setClientSign(sig)}
              />
            </div>

            {/* OTP Status & Verification Button */}
            <div className="p-3.5 bg-[#F5F8FA] rounded-xl border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#1976D2]" />
                <div>
                  <span className="font-bold text-slate-900 block">Client OTP Verification</span>
                  <span className="text-[11px] text-slate-500">
                    {isOtpVerified ? '✓ OTP Confirmed by Client' : 'Client must provide 4-digit code to finalize'}
                  </span>
                </div>
              </div>

              {isOtpVerified ? (
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-[#2E7D32] border border-emerald-200 font-mono font-bold">
                  VERIFIED
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(true)}
                  className="px-4 py-2 bg-[#1976D2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Verify Client OTP
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
              Finalize Job & Generate Official WEPSUN Service Report
            </button>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={() => {
          setIsOtpVerified(true);
          setIsOtpModalOpen(false);
        }}
        clientName={complaint.clientName}
        clientPhone={complaint.clientPhone}
        expectedOtp={complaint.clientOtp || '7419'}
      />

      {/* Auto-Open Generated Service Report */}
      {generatedReport && (
        <ServiceReportModal
          report={generatedReport}
          isOpen={!!generatedReport}
          onClose={() => {
            setGeneratedReport(null);
            onClose();
          }}
        />
      )}
    </>
  );
};
