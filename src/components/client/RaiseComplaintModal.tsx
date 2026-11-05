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
  Loader2,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IssueType, ComplaintPriority, Lift } from '../../types';

export const EMERGENCY_CATEGORIES = [
  'Passenger Trapped Inside Lift',
  'Lift Stuck Between Floors',
  'Lift Not Operating',
  'Door Not Opening',
  'Electrical Failure',
  'Sudden Lift Shutdown',
  'Other Emergency',
] as const;

export interface RaiseComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLift?: Lift | null;
  initialLiftId?: string;
  initialMode?: 'normal' | 'emergency';
  onNavigateTab?: (tab: 'home' | 'complaints', ticketNumber?: string) => void;
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
    clientPhone: '+91 85959 40077',
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
    clientPhone: '+91 85959 40077',
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
    clientPhone: '+91 85959 40077',
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
    clientPhone: '+91 85959 40077',
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

export interface SubmittedTicketDetails {
  id: string;
  rawId?: string;
  mode: 'normal' | 'emergency';
  title: string;
  liftName: string;
  buildingName: string;
  complaintType: string;
  priority: ComplaintPriority;
  status: string;
  reportedAt: string;
}

export const RaiseComplaintModal: React.FC<RaiseComplaintModalProps> = ({
  isOpen,
  onClose,
  preselectedLift,
  initialLiftId,
  initialMode = 'normal',
  onNavigateTab,
}) => {
  const {
    lifts,
    createComplaint,
    createComplaintAsync,
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
  const [emergencyType, setEmergencyType] = useState<string>('Passenger Trapped Inside Lift');
  const [trappedPassengers, setTrappedPassengers] = useState<number>(1);
  const [emergencyFloorLocation, setEmergencyFloorLocation] = useState<string>('Between 3rd & 4th Floor');
  const [emergencyBuilding, setEmergencyBuilding] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('+91 85959 40077');
  const [emergencyDesc, setEmergencyDesc] = useState('Lift stopped abruptly between floors. Passenger trapped inside.');
  const [emergencyPhotos, setEmergencyPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
  ]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<SubmittedTicketDetails | null>(null);
  const [isCopiedId, setIsCopiedId] = useState(false);

  const formattedSubmittedAt = useMemo(() => {
    if (!submittedTicket?.reportedAt) return '';
    try {
      const d = new Date(submittedTicket.reportedAt);
      return `${d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}, ${d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return new Date().toLocaleString();
    }
  }, [submittedTicket?.reportedAt]);

  // Scroll Container Ref for mobile adjustment & virtual keyboard support
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalMode(initialMode);
      setSubmittedTicket(null);
      setSubmitError(null);
      setIsSubmitting(false);
      setIsCopiedId(false);
      if (initialLiftId) setSelectedLiftId(initialLiftId);
      else if (preselectedLift?.id) setSelectedLiftId(preselectedLift.id);
      else if (!selectedLiftId || !liftOptions.some((l) => l.id === selectedLiftId)) {
        setSelectedLiftId(liftOptions[0]?.id || 'lift-traction');
      }
    }
  }, [isOpen, initialMode, initialLiftId, preselectedLift, liftOptions, selectedLiftId]);

  // Support mobile virtual keyboard opening & smooth scroll adjustments
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportResize = () => {
      if (document.activeElement && scrollContainerRef.current) {
        const active = document.activeElement as HTMLElement;
        if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT') {
          setTimeout(() => {
            active.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    };

    const vv = window.visualViewport;
    vv.addEventListener('resize', handleViewportResize);
    return () => vv.removeEventListener('resize', handleViewportResize);
  }, []);

  const currentLift = liftOptions.find((l) => l.id === selectedLiftId) || liftOptions[0];

  if (!isOpen) return null;

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

  const handleRemovePhoto = (index: number) => {
    if (modalMode === 'emergency') {
      setEmergencyPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    }
    showToast('info', 'Item Removed', 'Media attachment removed.');
  };

  // Section 3: Robust Backend Submission and Field Validation
  const handleNormalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Validate Lift selection
    if (!currentLift || !currentLift.id) {
      const msg = 'Please select a valid elevator / lift unit.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    // 2. Validate Complaint Type
    if (!complaintType) {
      const msg = 'Please select a complaint type.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    // 3. Validate Priority
    if (!priority) {
      const msg = 'Please select a priority level.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    // 4. Validate Problem Description
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      const msg = 'Please enter a description of the problem.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }
    if (trimmedDesc.length < 5) {
      const msg = 'Please provide a more detailed description (at least 5 characters).';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const mappedIssueType: IssueType =
      complaintType === 'Lift Not Working'
        ? 'lift_not_moving'
        : complaintType === 'Door Problem'
        ? 'door_jammed'
        : complaintType === 'Noise / Vibration'
        ? 'unusual_sound_vibration'
        : complaintType === 'Electrical Problem'
        ? 'lift_not_moving'
        : 'other';

    try {
      let createdResult;
      if (createComplaintAsync) {
        createdResult = await createComplaintAsync({
          liftId: currentLift.id,
          liftNumber: currentLift.liftNumber,
          buildingId: currentLift.buildingId,
          buildingName: currentLift.buildingName,
          clientId: currentLift.clientId,
          clientName: currentLift.clientName,
          clientPhone: currentLift.clientPhone || '+91 85959 40077',
          issueType: mappedIssueType,
          title: `${complaintType}: ${currentLift.liftNumber}`,
          description: trimmedDesc,
          priority,
          isEmergency: priority === 'critical',
          beforePhotos: photos,
          afterPhotos: [],
        });
      } else {
        createdResult = createComplaint({
          liftId: currentLift.id,
          liftNumber: currentLift.liftNumber,
          buildingId: currentLift.buildingId,
          buildingName: currentLift.buildingName,
          clientId: currentLift.clientId,
          clientName: currentLift.clientName,
          clientPhone: currentLift.clientPhone || '+91 85959 40077',
          issueType: mappedIssueType,
          title: `${complaintType}: ${currentLift.liftNumber}`,
          description: trimmedDesc,
          priority,
          isEmergency: priority === 'critical',
          beforePhotos: photos,
          afterPhotos: [],
        });
      }

      const ticketNumber = createdResult?.ticketNumber || '#CMP-' + Date.now().toString().slice(-5);

      // Section 2: Display attractive success popup ONLY after backend storage confirmed
      setSubmittedTicket({
        id: ticketNumber,
        rawId: createdResult?.id,
        mode: 'normal',
        title: `${complaintType} — ${currentLift.liftNumber}`,
        liftName: currentLift.liftNumber,
        buildingName: currentLift.buildingName,
        complaintType: complaintType,
        priority: priority,
        status: createdResult?.status || 'pending',
        reportedAt: createdResult?.reportedAt || new Date().toISOString(),
      });
      showToast('success', 'Complaint Registered Successfully', `Ticket ID: ${ticketNumber}`);
    } catch (err: any) {
      console.error('[RaiseComplaintModal] Failed to submit complaint:', err);
      const friendlyMsg = err?.message || 'Could not connect to the service backend. Please try again.';
      setSubmitError(friendlyMsg);
      showToast('error', 'Submission Failed', friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentLift || !currentLift.id) {
      const msg = 'Please select a valid elevator / lift unit.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    const trimmedContact = emergencyContact.trim();
    if (!trimmedContact) {
      const msg = 'Please enter a caller contact phone number.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    const trimmedDesc = emergencyDesc.trim();
    if (!trimmedDesc) {
      const msg = 'Please enter emergency details.';
      setSubmitError(msg);
      showToast('error', 'Validation Error', msg);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let createdResult;
      if (createComplaintAsync) {
        createdResult = await createComplaintAsync({
          liftId: currentLift.id,
          liftNumber: currentLift.liftNumber,
          buildingId: currentLift.buildingId,
          buildingName: emergencyBuilding || currentLift.buildingName,
          clientId: currentLift.clientId,
          clientName: currentLift.clientName,
          clientPhone: trimmedContact,
          issueType: 'stuck_passengers',
          title: `🚨 EMERGENCY BREAKDOWN: ${currentLift.liftNumber}`,
          description: trimmedDesc,
          priority: 'critical',
          isEmergency: true,
          beforePhotos: emergencyPhotos,
          afterPhotos: [],
        });
      } else {
        createdResult = createComplaint({
          liftId: currentLift.id,
          liftNumber: currentLift.liftNumber,
          buildingId: currentLift.buildingId,
          buildingName: emergencyBuilding || currentLift.buildingName,
          clientId: currentLift.clientId,
          clientName: currentLift.clientName,
          clientPhone: trimmedContact,
          issueType: 'stuck_passengers',
          title: `🚨 EMERGENCY BREAKDOWN: ${currentLift.liftNumber}`,
          description: trimmedDesc,
          priority: 'critical',
          isEmergency: true,
          beforePhotos: emergencyPhotos,
          afterPhotos: [],
        });
      }

      const ticketNumber = createdResult?.ticketNumber || '#EMG-' + Date.now().toString().slice(-5);

      setSubmittedTicket({
        id: ticketNumber,
        rawId: createdResult?.id,
        mode: 'emergency',
        title: `Emergency Breakdown — ${currentLift.liftNumber}`,
        liftName: currentLift.liftNumber,
        buildingName: emergencyBuilding || currentLift.buildingName,
        complaintType: 'Emergency Breakdown',
        priority: 'critical',
        status: createdResult?.status || 'pending',
        reportedAt: createdResult?.reportedAt || new Date().toISOString(),
      });
      showToast('emergency', '🚨 Emergency Request Registered', `Ticket ID: ${ticketNumber} • Response team notified`);
    } catch (err: any) {
      console.error('[RaiseComplaintModal] Failed to submit emergency request:', err);
      const friendlyMsg = err?.message || 'Emergency dispatch request could not reach backend. Please call control room directly.';
      setSubmitError(friendlyMsg);
      showToast('error', 'Dispatch Request Failed', friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Popup Navigation Handlers (Section 2)
  const handleViewComplaint = () => {
    if (!submittedTicket) return;
    const ticketId = submittedTicket.id;
    // Store in sessionStorage so ClientComplaintsView can auto-expand and scroll
    try {
      sessionStorage.setItem('wepsun_highlight_ticket', ticketId);
    } catch {}

    if (onNavigateTab) {
      onNavigateTab('complaints', ticketId);
    } else {
      window.location.hash = 'complaints';
      onClose();
    }
  };

  const handleBackToHome = () => {
    if (onNavigateTab) {
      onNavigateTab('home');
    } else {
      window.location.hash = 'home';
      onClose();
    }
  };

  const handleCopyTicketId = () => {
    if (!submittedTicket) return;
    try {
      navigator.clipboard.writeText(submittedTicket.id);
      setIsCopiedId(true);
      showToast('success', 'Ticket ID Copied', `${submittedTicket.id} copied to clipboard.`);
      setTimeout(() => setIsCopiedId(false), 2000);
    } catch {
      showToast('info', 'Ticket ID', submittedTicket.id);
    }
  };

  return (
    <>
      {/* 
        Section 1: Mobile Layout Fix 
        Outer wrapper: z-40 so MobileBottomNav (z-50) stays fixed at bottom on mobile
        Full height flex container on mobile, centered modal dialog on desktop
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-service-request-title"
        className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-4 select-none animate-in fade-in duration-200"
      >
        {/* 
          Inner modal container:
          h-full on mobile, rounded card on desktop.
          flex flex-col and overflow-hidden ensures fixed header on top, single smooth scrollable form in the middle!
        */}
        <div className="bg-[#FFFFFF] w-full h-full md:h-auto md:max-w-lg md:max-h-[92dvh] md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl flex flex-col relative text-slate-800 overflow-hidden">
          
          {/* Accessible Close Button (Top-Right, 44px tap area) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md touch-manipulation"
          >
            <X className="w-5 h-5" />
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

          {/* 
            FIXED APPLICATION / MODAL HEADER 
            Header Mode Switcher & Title Banner stays fixed at top of dialog
          */}
          <header className="shrink-0 bg-white border-b border-slate-200 z-20">
            {/* Header Mode Switcher Tab */}
            <div className="p-2 sm:p-2.5 bg-slate-100/90 border-b border-slate-200/80">
              <div className="grid grid-cols-2 p-1 bg-white rounded-2xl w-full max-w-xs sm:max-w-none border border-slate-200/90 text-xs font-bold gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('normal');
                    setSubmitError(null);
                  }}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                    modalMode === 'normal'
                      ? 'bg-[#123B5D] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">Service Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('emergency');
                    setSubmitError(null);
                  }}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                    modalMode === 'emergency'
                      ? 'bg-[#D32F2F] text-white shadow-sm'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="truncate">🚨 Emergency</span>
                </button>
              </div>
            </div>

            {/* Mode Banner Title */}
            {modalMode === 'normal' ? (
              <div className="bg-[#123B5D] text-white px-4 py-3.5 sm:px-6 sm:py-4 text-center">
                <h2 id="raise-service-request-title" className="text-base sm:text-lg font-black tracking-tight flex items-center justify-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-300" />
                  <span>Raise a Service Request</span>
                </h2>
                <p className="text-xs text-sky-200 mt-0.5 max-w-sm mx-auto">
                  Log routine elevator complaints, door sensor glitches, or electrical queries.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#B71C1C] via-[#D32F2F] to-[#E53935] text-white px-4 py-3.5 sm:px-6 sm:py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Emergency Breakdown</h2>
                </div>
                <p className="text-xs text-red-100 max-w-sm mx-auto">
                  Is your lift currently stopped with trapped passengers? Rapid response dispatch team is on standby.
                </p>
                <div className="mt-2">
                  <a
                    href="tel:+918595940077"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-white/95 text-[#D32F2F] font-bold text-[11px] shadow-sm hover:bg-white transition-all"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>24x7 Control Room: +91 85959 40077</span>
                  </a>
                </div>
              </div>
            )}
          </header>

          {/* 
            VERTICALLY SCROLLABLE COMPLAINT FORM 
            Single scroll container on mobile.
            Key mobile fix: pb-[calc(104px+env(safe-area-inset-bottom,20px))] ensures the final 2 buttons 
            scroll COMPLETELY above the fixed MobileBottomNav!
          */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 sm:px-6 pt-4 pb-[calc(104px+env(safe-area-inset-bottom,20px))] md:pb-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Inline Error Notification Banner */}
            {submitError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold block">Submission Error</span>
                  <span className="text-slate-600 leading-relaxed">{submitError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* PAGE 5: RAISE A SERVICE REQUEST (NORMAL COMPLAINT) */}
            {modalMode === 'normal' && (
              <form onSubmit={handleNormalSubmit} className="space-y-4 text-xs">
                {/* 1. Select Lift */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Select Lift <span className="text-slate-400 font-normal">(Select your lift)</span>
                  </label>
                  <select
                    value={selectedLiftId}
                    onChange={(e) => setSelectedLiftId(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-base sm:text-xs font-medium focus:bg-white focus:border-[#1976D2] outline-none transition-colors"
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

                {/* 2. Complaint Type (5 Options from PDF) */}
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
                        className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs sm:text-[11px] transition-all cursor-pointer touch-manipulation active:scale-95 ${
                          complaintType === type
                            ? 'bg-[#1976D2] border-[#1976D2] text-white shadow-sm ring-2 ring-blue-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Priority (Critical, High, Normal) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['critical', 'high', 'normal'] as ComplaintPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2.5 px-3 rounded-xl border font-bold uppercase text-xs sm:text-[11px] font-mono transition-all text-center cursor-pointer touch-manipulation active:scale-95 ${
                          priority === p
                            ? p === 'critical'
                              ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm ring-2 ring-red-200'
                              : p === 'high'
                              ? 'bg-amber-500 border-amber-500 text-white shadow-sm ring-2 ring-amber-200'
                              : 'bg-[#1976D2] border-[#1976D2] text-white shadow-sm ring-2 ring-blue-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p === 'critical' ? '● Critical' : p === 'high' ? 'High' : 'Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Describe the Problem */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Describe the Problem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 150);
                    }}
                    placeholder="Please describe the issue in detail (e.g., Door stuck on 4th floor, strange scraping sound)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-base sm:text-xs focus:bg-white focus:border-[#1976D2] outline-none transition-colors"
                  />
                </div>

                {/* 5. Upload Photos / Videos */}
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
                      disabled={isUploadingMedia || isSubmitting}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs touch-manipulation disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4 text-[#1976D2]" />
                      <span>{isUploadingMedia ? 'Attaching...' : 'Upload Photos / Videos'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploadingMedia || isSubmitting}
                      className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1976D2] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation disabled:opacity-50"
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

                {/* Immediate Inline Status / Error Message */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 
                  FINAL ACTION BUTTONS: Cancel and Submit Complaint
                  Thanks to the bottom padding on the scrollable container,
                  these buttons scroll cleanly above the bottom navigation bar on all mobile screens!
                */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 min-h-[46px] py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 min-h-[46px] py-3 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Registering Complaint...</span>
                      </>
                    ) : (
                      <span>Submit Complaint</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* PAGE 6: EMERGENCY BREAKDOWN (VISUALLY DIFFERENT / RED THEME) */}
            {modalMode === 'emergency' && (
              <form onSubmit={handleEmergencySubmit} className="space-y-4 text-xs">
                {/* 1. Emergency Category Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-red-950 font-bold">
                      Emergency Category <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wide bg-red-100 px-2 py-0.5 rounded-full">
                      ● HIGHEST PRIORITY
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EMERGENCY_CATEGORIES.map((cat) => {
                      const isSelected = emergencyType === cat;
                      const isTrapped = cat === 'Passenger Trapped Inside Lift';
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setEmergencyType(cat);
                            if (isTrapped) {
                              setEmergencyDesc('Lift stopped abruptly between floors. Passenger trapped inside cabin.');
                            } else if (cat === 'Door Not Opening') {
                              setEmergencyDesc('Lift arrived at floor but landing and car doors are jammed shut.');
                            } else if (cat === 'Electrical Failure') {
                              setEmergencyDesc('Complete power outage / blackout inside lift shaft and car.');
                            } else {
                              setEmergencyDesc(`Emergency Breakdown: ${cat}`);
                            }
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-600/25 ring-2 ring-red-400 font-bold'
                              : 'bg-red-50/70 hover:bg-red-100/80 border-red-200 text-red-950 font-medium'
                          }`}
                        >
                          <span className="truncate pr-1">{cat}</span>
                          {isTrapped && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black shrink-0 ${
                              isSelected ? 'bg-white text-red-700' : 'bg-red-200 text-red-800'
                            }`}>
                              SOS
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Trapped Passengers Count & Safety Instruction Banner */}
                {emergencyType === 'Passenger Trapped Inside Lift' && (
                  <div className="space-y-3 p-3.5 bg-red-50 border-2 border-red-300 rounded-2xl animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-red-950 font-bold text-xs">
                          Number of Trapped Passengers
                        </label>
                        <span className="text-[11px] text-red-700">Select estimated headcount in cabin</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-red-300 rounded-xl p-1 shadow-2xs">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isSelected = trappedPassengers === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setTrappedPassengers(num)}
                              className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#D32F2F] text-white shadow-xs'
                                  : 'hover:bg-red-100 text-red-950'
                              }`}
                            >
                              {num === 5 ? '5+' : num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Prominent Entrapment Safety Instruction */}
                    <div className="p-3 bg-white/90 border border-red-200 rounded-xl text-[11px] text-red-900 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>⚠️ CRITICAL ENTRAPMENT SAFETY NOTICE</span>
                      </div>
                      <p>
                        Remain calm. Modern WEPSUN lift cabins are <strong>fully ventilated</strong> and cannot freefall due to fail-safe governor safety brakes.
                        Use the cabin intercom or speaker to comfort trapped occupants. If anyone requires urgent medical assistance, please dial <strong>112 / 101</strong> immediately alongside this emergency dispatch.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Select Lift Unit */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Select Lift Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLiftId}
                    onChange={(e) => setSelectedLiftId(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-red-200 bg-red-50/40 text-slate-800 text-base sm:text-xs font-bold focus:bg-white focus:border-[#D32F2F] outline-none transition-colors"
                  >
                    {liftOptions.map((l) => {
                      const isNamedLift = FOUR_NAMED_LIFTS.some((f) => f.id === l.id);
                      return (
                        <option key={l.id} value={l.id}>
                          {isNamedLift
                            ? `${l.liftNumber} — ${l.buildingName}`
                            : `${l.liftNumber} — ${l.buildingName} (${l.locationDetails || 'Passenger Lift'})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 4. Building & Specific Floor / Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Building Name & Site</label>
                    <input
                      type="text"
                      value={emergencyBuilding || currentLift?.buildingName || 'ABC Residency, Pune'}
                      onChange={(e) => setEmergencyBuilding(e.target.value)}
                      placeholder="Building name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:border-[#D32F2F] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Current Floor / Location in Shaft</label>
                    <input
                      type="text"
                      value={emergencyFloorLocation}
                      onChange={(e) => setEmergencyFloorLocation(e.target.value)}
                      placeholder="e.g. Between 3rd & 4th floor, Pit, Floor 7"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:border-[#D32F2F] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 5. Contact Caller Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">
                      Caller Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">For technician call back</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Enter caller contact phone"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-mono font-bold focus:bg-white focus:border-[#D32F2F] outline-none transition-colors"
                  />
                </div>

                {/* 6. Problem Description */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Emergency Details / Problem Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={emergencyDesc}
                    onChange={(e) => setEmergencyDesc(e.target.value)}
                    placeholder="Describe what happened..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:border-[#D32F2F] outline-none transition-colors"
                  />
                </div>

                {/* 7. Upload Photo / Video (Emergency) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">Upload Photos / Videos (Optional)</label>
                    <span className="text-[10px] text-red-500 font-medium">Visual proof of breakdown</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingMedia || isSubmitting}
                      className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#D32F2F] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs touch-manipulation disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingMedia ? 'Uploading...' : 'Upload Photo / Video'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploadingMedia || isSubmitting}
                      className="px-3.5 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 border border-red-300 text-red-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation disabled:opacity-50"
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Emergency Call Strip */}
                <div className="p-3 bg-red-100/80 border border-red-300 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D32F2F] text-white flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-red-950 block">24x7 Control Room Direct Line</span>
                      <span className="text-xs font-mono font-bold text-red-700">+91 85959 40077</span>
                    </div>
                  </div>
                  <a
                    href="tel:+918595940077"
                    className="px-3 py-1.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 shrink-0"
                  >
                    <span>Call Now</span>
                  </a>
                </div>
                {/* Immediate Inline Status / Error Message */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Emergency Action Button */}
                <div className="pt-3 border-t border-red-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 min-h-[48px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 min-h-[48px] py-3.5 rounded-2xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Dispatching Fast Response...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>🚨 REQUEST EMERGENCY SERVICE</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 
        Section 2: ATTRACTIVE COMPLAINT SUBMISSION SUCCESS POPUP 
        Centered modal with clean white background, premium rounded corners, soft shadow and subtle blue glow,
        animated green success checkmark inside circular icon, dynamic Complaint ID, selected lift,
        complaint type, priority badge, submitted date & time, and two dedicated navigation buttons!
      */}
      {submittedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-heading"
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
        >
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md max-h-[92dvh] overflow-y-auto p-6 sm:p-8 text-center shadow-2xl shadow-blue-950/20 ring-1 ring-blue-500/15 relative animate-in zoom-in-95 duration-300">
            {/* Top decorative corporate gradient line with subtle blue glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#123B5D] via-[#1976D2] to-emerald-500" />

            {/* Close X at top-right of popup */}
            <button
              type="button"
              onClick={handleBackToHome}
              aria-label="Close popup"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated Green Circular Success Icon with Checkmark */}
            <div className="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-35" />
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm relative z-10">
                <CheckCircle2 className="w-11 h-11 text-emerald-600 stroke-[2.5]" />
              </div>
            </div>

            {/* Main Heading */}
            <h2 id="success-modal-heading" className="text-xl sm:text-2xl font-black text-[#123B5D] tracking-tight">
              Complaint Submitted Successfully!
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-sm mx-auto">
              Your complaint has been successfully submitted. Our service team has been notified and will review your request shortly.
            </p>

            {/* Dynamic Details Card */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 mt-5 text-left text-xs space-y-2.5">
              {/* Complaint ID */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Complaint ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs sm:text-sm text-[#1976D2] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {submittedTicket.id}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketId}
                    title="Copy Complaint ID"
                    aria-label="Copy Complaint ID"
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    {isCopiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Lift Name */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Lift Name:</span>
                <span className="font-bold text-slate-800 text-right truncate ml-2 max-w-[210px]">
                  {submittedTicket.liftName}
                </span>
              </div>

              {/* Complaint Type */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Complaint Type:</span>
                <span className="font-bold text-slate-800 text-right">
                  {submittedTicket.complaintType}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Priority:</span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    submittedTicket.priority === 'critical'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : submittedTicket.priority === 'high'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-blue-100 text-[#1976D2] border border-blue-200'
                  }`}
                >
                  ● {submittedTicket.priority}
                </span>
              </div>

              {/* Submitted Date & Time */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Submitted Date & Time:</span>
                <span className="font-mono font-medium text-slate-700 text-right text-[11px]">
                  {formattedSubmittedAt}
                </span>
              </div>

              {/* Current Status */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Registered & Under Review
                </span>
              </div>
            </div>

            {/* Popup Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {/* Button 1: Track Complaint */}
              <button
                type="button"
                onClick={handleViewComplaint}
                className="min-h-[46px] py-3 px-3.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md shadow-blue-900/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate">Track Complaint</span>
              </button>

              {/* Button 2: Back to Home */}
              <button
                type="button"
                onClick={handleBackToHome}
                className="min-h-[46px] py-3 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation"
              >
                <span className="truncate">Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Viewer Modal */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
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
    </>
  );
};
