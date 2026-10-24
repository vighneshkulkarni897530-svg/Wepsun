import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Wrench,
  Camera,
  CheckCircle2,
  PhoneCall,
  MapPin,
  UploadCloud,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileText,
  Film,
  Plus,
  Eye,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IssueType, ComplaintPriority, Lift } from '../../types';

interface RaiseComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLift?: Lift | null;
  initialLiftId?: string;
  initialMode?: 'normal' | 'emergency';
}

export const FOUR_NAMED_LIFTS: Lift[] = [
  {
    id: 'lift-traction',
    companyId: 'comp-1',
    branchId: 'br-pune-1',
    liftNumber: 'Traction Lift',
    buildingId: 'bld-abc-1',
    buildingName: 'ABC Residency, Pune',
    clientId: 'client-1',
    clientName: 'ABC Residency Co-op Housing Society',
    clientPhone: '+91 98201 55432',
    brand: 'WEPSUN Traction',
    model: 'TR-5000 Eco',
    type: 'Passenger',
    capacityPersons: 8,
    capacityKg: 544,
    speedMps: 1.5,
    floors: 'G + 10 Floors',
    stops: 11,
    machineType: 'Geared Traction',
    motorKw: 7.5,
    controllerBrand: 'Integrated VVVF',
    doorOperator: 'Center Opening Auto Door',
    ardSystem: 'Automatic Rescue Device 415V',
    governorSpeed: 1.75,
    ropeDiaMm: 10,
    installationDate: '2023-01-01',
    warrantyExpiry: '2026-01-01',
    currentStatus: 'operational',
    amcStatus: 'active',
    lastPmDate: '2024-01-01',
    nextPmDate: '2024-04-01',
    safetyCertificateNumber: 'MH-PUN-SAFE-001',
    safetyCertificateExpiry: '2026-12-31',
    locationDetails: 'Traction Lift',
  },
  {
    id: 'lift-machine-room',
    companyId: 'comp-1',
    branchId: 'br-pune-1',
    liftNumber: 'Machine Room Lift',
    buildingId: 'bld-abc-1',
    buildingName: 'ABC Residency, Pune',
    clientId: 'client-1',
    clientName: 'ABC Residency Co-op Housing Society',
    clientPhone: '+91 98201 55432',
    brand: 'WEPSUN MR Series',
    model: 'MR-Classic 400',
    type: 'Passenger',
    capacityPersons: 10,
    capacityKg: 680,
    speedMps: 1.75,
    floors: 'G + 12 Floors',
    stops: 13,
    machineType: 'Geared Traction',
    motorKw: 9.0,
    controllerBrand: 'Microprocessor MR-300',
    doorOperator: 'Telescopic Auto Door',
    ardSystem: 'Automatic Rescue Device 415V',
    governorSpeed: 2.0,
    ropeDiaMm: 12,
    installationDate: '2022-06-15',
    warrantyExpiry: '2025-06-15',
    currentStatus: 'operational',
    amcStatus: 'active',
    lastPmDate: '2024-01-01',
    nextPmDate: '2024-04-01',
    safetyCertificateNumber: 'MH-PUN-SAFE-002',
    safetyCertificateExpiry: '2026-12-31',
    locationDetails: 'Machine Room Lift',
  },
  {
    id: 'lift-machine-roomless',
    companyId: 'comp-1',
    branchId: 'br-pune-1',
    liftNumber: 'Machine Roomless',
    buildingId: 'bld-abc-1',
    buildingName: 'ABC Residency, Pune',
    clientId: 'client-1',
    clientName: 'ABC Residency Co-op Housing Society',
    clientPhone: '+91 98201 55432',
    brand: 'WEPSUN MRL Eco',
    model: 'MRL-SpaceSaver',
    type: 'Passenger',
    capacityPersons: 8,
    capacityKg: 544,
    speedMps: 1.5,
    floors: 'G + 8 Floors',
    stops: 9,
    machineType: 'Gearless PMSM',
    motorKw: 5.5,
    controllerBrand: 'NICE 3000+ MRL',
    doorOperator: 'VVVF Center Opening',
    ardSystem: 'Automatic Rescue Device 415V',
    governorSpeed: 1.75,
    ropeDiaMm: 10,
    installationDate: '2023-03-10',
    warrantyExpiry: '2026-03-10',
    currentStatus: 'operational',
    amcStatus: 'active',
    lastPmDate: '2024-01-01',
    nextPmDate: '2024-04-01',
    safetyCertificateNumber: 'MH-PUN-SAFE-003',
    safetyCertificateExpiry: '2026-12-31',
    locationDetails: 'Machine Roomless',
  },
  {
    id: 'lift-goods',
    companyId: 'comp-1',
    branchId: 'br-pune-1',
    liftNumber: 'Goods Lift',
    buildingId: 'bld-abc-1',
    buildingName: 'ABC Residency, Pune',
    clientId: 'client-1',
    clientName: 'ABC Residency Co-op Housing Society',
    clientPhone: '+91 98201 55432',
    brand: 'WEPSUN HeavyDuty',
    model: 'GL-Freight 2000',
    type: 'Freight / Goods',
    capacityPersons: 15,
    capacityKg: 1500,
    speedMps: 1.0,
    floors: 'B + G + 6 Floors',
    stops: 8,
    machineType: 'Gearless PMSM',
    motorKw: 11.0,
    controllerBrand: 'Industrial Heavy Duty VFD',
    doorOperator: 'Collapsible Gate / 2-Speed Power Door',
    ardSystem: 'Automatic Rescue Device 415V Heavy',
    governorSpeed: 1.25,
    ropeDiaMm: 13,
    installationDate: '2021-11-20',
    warrantyExpiry: '2024-11-20',
    currentStatus: 'operational',
    amcStatus: 'active',
    lastPmDate: '2024-01-01',
    nextPmDate: '2024-04-01',
    safetyCertificateNumber: 'MH-PUN-SAFE-004',
    safetyCertificateExpiry: '2026-12-31',
    locationDetails: 'Goods Lift',
  },
];

export const RaiseComplaintModal: React.FC<RaiseComplaintModalProps> = ({
  isOpen,
  onClose,
  preselectedLift,
  initialLiftId,
  initialMode = 'normal',
}) => {
  const {
    lifts,
    createComplaint,
    clientScopedLifts,
    currentRole,
    showToast,
  } = useApp();

  const availableLifts = currentRole === 'client' ? clientScopedLifts : lifts;

  // Combine the 4 named lifts (Traction Lift, Machine Room Lift, Machine Roomless, Goods Lift) with any existing fleet lifts
  const liftOptions = useMemo(() => {
    const combined = [...FOUR_NAMED_LIFTS];
    if (availableLifts && availableLifts.length > 0) {
      availableLifts.forEach((l) => {
        if (!combined.some((c) => c.id === l.id || c.liftNumber.toLowerCase() === l.liftNumber.toLowerCase())) {
          combined.push(l);
        }
      });
    }
    return combined;
  }, [availableLifts]);

  const [modalMode, setModalMode] = useState<'normal' | 'emergency'>(initialMode);
  const [selectedLiftId, setSelectedLiftId] = useState<string>(
    initialLiftId || preselectedLift?.id || liftOptions[0]?.id || 'lift-traction'
  );

  // Normal mode fields (Page 5)
  const [complaintType, setComplaintType] = useState<
    'Lift Not Working' | 'Door Problem' | 'Noise / Vibration' | 'Electrical Problem' | 'Other'
  >('Lift Not Working');
  const [priority, setPriority] = useState<ComplaintPriority>('high');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Emergency mode fields (Page 6)
  const [emergencyBuilding, setEmergencyBuilding] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('+91 98201 55432');
  const [emergencyDesc, setEmergencyDesc] = useState('Lift stopped abruptly between floors. Passenger trapped inside.');
  const [emergencyPhotos, setEmergencyPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
  ]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    mode: 'normal' | 'emergency';
    title: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalMode(initialMode);
      setSubmittedTicket(null);
      if (initialLiftId) setSelectedLiftId(initialLiftId);
      else if (preselectedLift?.id) setSelectedLiftId(preselectedLift.id);
      else if (!selectedLiftId || !liftOptions.some((l) => l.id === selectedLiftId)) {
        setSelectedLiftId(liftOptions[0]?.id || 'lift-traction');
      }
    }
  }, [isOpen, initialMode, initialLiftId, preselectedLift, liftOptions, selectedLiftId]);

  if (!isOpen) return null;

  const currentLift = liftOptions.find((l) => l.id === selectedLiftId) || liftOptions[0];

  // Media upload & preview states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  const isVideoUrl = (url: string) => {
    return url.startsWith('data:video') || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploadingMedia(true);

    try {
      const readPromises = fileList.map((file) => {
        return new Promise<string>((resolve, reject) => {
          if (file.size > 50 * 1024 * 1024) {
            showToast('error', 'File Too Large', `${file.name} exceeds 50MB limit.`);
            reject(new Error('File too large'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.allSettled(readPromises);
      const newUrls: string[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          newUrls.push(r.value);
        }
      });

      if (newUrls.length > 0) {
        if (modalMode === 'emergency') {
          setEmergencyPhotos((prev) => [...prev, ...newUrls]);
        } else {
          setPhotos((prev) => [...prev, ...newUrls]);
        }
        showToast(
          'success',
          'Media Attached',
          `Successfully attached ${newUrls.length} file(s) (photo/video).`
        );
      }
    } catch (err) {
      console.error('Error uploading media', err);
      showToast('error', 'Upload Failed', 'Could not process one or more files.');
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    if (modalMode === 'emergency') {
      setEmergencyPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    }
    showToast('info', 'Item Removed', 'Media attachment removed.');
  };

  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLift) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created = createComplaint({
        liftId: currentLift.id,
        liftNumber: currentLift.liftNumber,
        buildingId: currentLift.buildingId,
        buildingName: currentLift.buildingName,
        clientId: currentLift.clientId,
        clientName: currentLift.clientName,
        clientPhone: currentLift.clientPhone || '+91 98201 55432',
        issueType:
          complaintType === 'Lift Not Working'
            ? 'lift_not_moving'
            : complaintType === 'Door Problem'
            ? 'door_jammed'
            : complaintType === 'Noise / Vibration'
            ? 'unusual_sound_vibration'
            : complaintType === 'Electrical Problem'
            ? 'lift_not_moving'
            : 'other',
        title: `${complaintType}: ${currentLift.liftNumber}`,
        description: description || `Complaint reported for ${currentLift.liftNumber}: ${complaintType}`,
        priority,
        isEmergency: priority === 'critical',
        beforePhotos: photos,
        afterPhotos: [],
      });

      const ticketNumber = created?.ticketNumber || '#CMP-' + Date.now().toString().slice(-5);
      setIsSubmitting(false);
      setSubmittedTicket({
        id: ticketNumber,
        mode: 'normal',
        title: `${complaintType} — ${currentLift.liftNumber}`,
      });
      showToast('success', 'Complaint Registered Successfully', `Ticket ID: ${ticketNumber}`);
    }, 400);
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLift) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created = createComplaint({
        liftId: currentLift.id,
        liftNumber: currentLift.liftNumber,
        buildingId: currentLift.buildingId,
        buildingName: emergencyBuilding || currentLift.buildingName,
        clientId: currentLift.clientId,
        clientName: currentLift.clientName,
        clientPhone: emergencyContact,
        issueType: 'stuck_passengers',
        title: `🚨 EMERGENCY BREAKDOWN: ${currentLift.liftNumber}`,
        description: emergencyDesc || 'Emergency breakdown reported. Lift stopped.',
        priority: 'critical',
        isEmergency: true,
        beforePhotos: emergencyPhotos,
        afterPhotos: [],
      });

      const ticketNumber = created?.ticketNumber || '#EMG-' + Date.now().toString().slice(-5);
      setIsSubmitting(false);
      setSubmittedTicket({
        id: ticketNumber,
        mode: 'emergency',
        title: `Emergency Breakdown — ${currentLift.liftNumber}`,
      });
      showToast('error', 'Emergency Request Created', `Ticket ID: ${ticketNumber} • Service team notified`);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92dvh] overflow-y-auto shadow-2xl relative text-slate-800 my-auto">
        {/* Accessible Close Button with min 40px tap target */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 z-20 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hidden Native File & Camera Inputs for Photos and Videos */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="complaint-file-upload-input"
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="complaint-camera-upload-input"
        />

        {/* Success Confirmation View */}
        {submittedTicket ? (
          <div className="p-5 sm:p-7 text-center space-y-5">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${
                submittedTicket.mode === 'emergency'
                  ? 'bg-red-100 text-[#D32F2F] ring-8 ring-red-50'
                  : 'bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
                  submittedTicket.mode === 'emergency'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                Ticket ID: {submittedTicket.id}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {submittedTicket.mode === 'emergency'
                  ? 'Emergency Request Created'
                  : 'Complaint Registered Successfully'}
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {submittedTicket.mode === 'emergency'
                  ? 'Service team has been notified. Nearest rapid-response engineer is being dispatched immediately.'
                  : 'Your service request has been logged. Our service coordinator will assign a certified technician shortly.'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket No:</span>
                <span className="font-mono font-bold text-slate-900">{submittedTicket.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-bold text-slate-800 truncate ml-2">{submittedTicket.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-700 font-bold">✓ Assigned to Control Desk</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
              >
                Done & View Ticket Tracker
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Mode Switcher Tab */}
            <div className="p-2.5 sm:p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 p-1 bg-white rounded-2xl w-full border border-slate-200/80 text-[11px] sm:text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setModalMode('normal')}
                  className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === 'normal'
                      ? 'bg-[#123B5D] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Service Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('emergency')}
                  className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalMode === 'emergency'
                      ? 'bg-[#D32F2F] text-white shadow-sm'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">🚨 Emergency</span>
                </button>
              </div>
            </div>

            {/* PAGE 5: RAISE A SERVICE REQUEST (NORMAL COMPLAINT) */}
            {modalMode === 'normal' && (
              <div>
                <div className="bg-[#123B5D] text-white p-4 sm:p-5 text-center">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Raise a Service Request</h2>
                  <p className="text-xs text-sky-200 mt-0.5 max-w-sm mx-auto">
                    Log routine elevator complaints, door sensor glitches, or electrical queries.
                  </p>
                </div>

                <form onSubmit={handleNormalSubmit} className="p-5 space-y-4 text-xs">
                  {/* Select Lift */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Select Lift <span className="text-slate-400 font-normal">(Select your lift)</span>
                    </label>
                    <select
                      value={selectedLiftId}
                      onChange={(e) => setSelectedLiftId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:bg-white focus:border-[#1976D2] outline-none"
                    >
                      {liftOptions.map((l) => {
                        const isNamedLift = FOUR_NAMED_LIFTS.some((f) => f.id === l.id);
                        return (
                          <option key={l.id} value={l.id}>
                            {isNamedLift
                              ? l.liftNumber
                              : `${l.liftNumber} — ${l.buildingName} (${l.capacityPersons ? `${l.capacityPersons} Persons / ` : ''}${l.locationDetails || `${l.capacityKg || 544} kg`})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Complaint Type (5 Options from PDF) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Complaint Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(
                        [
                          'Lift Not Working',
                          'Door Problem',
                          'Noise / Vibration',
                          'Electrical Problem',
                          'Other',
                        ] as const
                      ).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setComplaintType(type)}
                          className={`py-2 px-2.5 rounded-xl border text-center font-bold text-[11px] transition-all ${
                            complaintType === type
                              ? 'bg-[#1976D2] border-[#1976D2] text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority (Critical, High, Normal) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['critical', 'high', 'normal'] as ComplaintPriority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 px-3 rounded-xl border font-bold uppercase text-[11px] font-mono transition-all text-center ${
                            priority === p
                              ? p === 'critical'
                                ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                                : p === 'high'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                : 'bg-[#1976D2] border-[#1976D2] text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p === 'critical' ? '● Critical' : p === 'high' ? 'High' : 'Normal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Describe the Problem */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Describe the Problem
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:border-[#1976D2] outline-none"
                    />
                  </div>

                  {/* Upload Photos / Videos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        Upload Photos / Videos
                      </label>
                      <span className="text-[10px] text-slate-400">JPG, PNG, MP4, MOV (max 50MB)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <UploadCloud className="w-4 h-4 text-[#1976D2]" />
                        <span>{isUploadingMedia ? 'Uploading...' : 'Upload Photos / Videos'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1976D2] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Capture Photo with Device Camera"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </button>

                      {photos.length > 0 && (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{photos.length} file{photos.length > 1 ? 's' : ''} attached</span>
                        </span>
                      )}
                    </div>

                    {/* Preview Gallery */}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1.5">
                        {photos.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square shadow-2xs cursor-pointer"
                            onClick={() => setPreviewMediaUrl(url)}
                          >
                            {isVideoUrl(url) ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white relative">
                                <video src={url} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Film className="w-5 h-5 text-white/90" />
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-white">
                                  VIDEO
                                </span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt={`Evidence ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              title="Remove file"
                              aria-label="Remove file"
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-colors shadow-sm z-10 cursor-pointer active:scale-90"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Eye icon overlay on hover */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Eye className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1976D2] hover:bg-blue-50/50 flex flex-col items-center justify-center aspect-square text-slate-500 hover:text-[#1976D2] transition-all cursor-pointer text-[10px] font-bold gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add More</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Buttons: Submit Complaint & Cancel */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all"
                    >
                      {isSubmitting ? 'Registering...' : 'Submit Complaint'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PAGE 6: EMERGENCY BREAKDOWN (VISUALLY DIFFERENT / RED THEME) */}
            {modalMode === 'emergency' && (
              <div>
                <div className="bg-gradient-to-b from-[#B71C1C] via-[#D32F2F] to-[#E53935] text-white p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-2 text-white shadow-inner">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">Emergency Breakdown</h2>
                  <p className="text-xs text-red-100 mt-1 max-w-sm mx-auto leading-relaxed">
                    Is your lift currently stopped or experiencing an emergency? Please provide the
                    details below so our service team can respond quickly.
                  </p>

                  <div className="mt-3">
                    <a
                      href="tel:+919820155432"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-[#D32F2F] font-bold text-xs shadow-sm hover:bg-red-50 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>24x7 Control Room: +91 98201 55432</span>
                    </a>
                  </div>
                </div>

                <form onSubmit={handleEmergencySubmit} className="p-5 space-y-4 text-xs">
                  {/* Select Lift */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Lift</label>
                    <select
                      value={selectedLiftId}
                      onChange={(e) => setSelectedLiftId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50/40 text-slate-800 text-xs font-medium focus:bg-white focus:border-[#D32F2F] outline-none"
                    >
                      {liftOptions.map((l) => {
                        const isNamedLift = FOUR_NAMED_LIFTS.some((f) => f.id === l.id);
                        return (
                          <option key={l.id} value={l.id}>
                            {isNamedLift
                              ? l.liftNumber
                              : `${l.liftNumber} — ${l.buildingName} (${l.locationDetails || 'Passenger Lift'})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Building / Location */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Building / Location
                    </label>
                    <input
                      type="text"
                      value={emergencyBuilding || currentLift?.buildingName || 'ABC Residency, Pune'}
                      onChange={(e) => setEmergencyBuilding(e.target.value)}
                      placeholder="Enter Building & Location"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:border-[#D32F2F] outline-none"
                    />
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact Number</label>
                    <input
                      type="text"
                      required
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Enter caller contact phone"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-mono focus:bg-white focus:border-[#D32F2F] outline-none"
                    />
                  </div>

                  {/* Problem Description */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Problem Description
                    </label>
                    <textarea
                      rows={2}
                      value={emergencyDesc}
                      onChange={(e) => setEmergencyDesc(e.target.value)}
                      placeholder="Describe what happened (e.g. Lift halted between 3rd & 4th floor)..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:border-[#D32F2F] outline-none"
                    />
                  </div>

                  {/* Upload Photo / Video (Emergency) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold">
                        Upload Photo / Video
                      </label>
                      <span className="text-[10px] text-red-500 font-medium">Visual proof of breakdown</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#D32F2F] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{isUploadingMedia ? 'Uploading...' : 'Upload Photo / Video'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="px-3.5 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 border border-red-300 text-red-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Capture Photo with Device Camera"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Now</span>
                      </button>

                      {emergencyPhotos.length > 0 && (
                        <span className="text-xs text-red-700 font-semibold flex items-center gap-1 ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{emergencyPhotos.length} file{emergencyPhotos.length > 1 ? 's' : ''} attached</span>
                        </span>
                      )}
                    </div>

                    {/* Preview Gallery */}
                    {emergencyPhotos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1.5">
                        {emergencyPhotos.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-red-200 bg-slate-900 aspect-square shadow-2xs cursor-pointer"
                            onClick={() => setPreviewMediaUrl(url)}
                          >
                            {isVideoUrl(url) ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white relative">
                                <video src={url} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Film className="w-5 h-5 text-white/90" />
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-white">
                                  VIDEO
                                </span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt={`Emergency Evidence ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              title="Remove file"
                              aria-label="Remove file"
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-colors shadow-sm z-10 cursor-pointer active:scale-90"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Eye icon overlay on hover */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Eye className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border-2 border-dashed border-red-300 hover:border-red-500 hover:bg-red-50/50 flex flex-col items-center justify-center aspect-square text-red-500 hover:text-red-700 transition-all cursor-pointer text-[10px] font-bold gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add More</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Main Emergency Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      <span>
                        {isSubmitting ? 'Dispatching Fast Response...' : '🚨 REQUEST EMERGENCY SERVICE'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Media Lightbox Viewer Modal */}
        {previewMediaUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setPreviewMediaUrl(null)}
          >
            <div
              className="relative max-w-2xl max-h-[85vh] w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewMediaUrl(null)}
                aria-label="Close preview"
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-sm transition-all cursor-pointer shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
              {isVideoUrl(previewMediaUrl) ? (
                <video
                  src={previewMediaUrl}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl border border-white/20 bg-black"
                />
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Enlarged evidence"
                  className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
