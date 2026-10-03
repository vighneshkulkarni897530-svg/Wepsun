import React, { useState, useEffect } from 'react';
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
  const [modalMode, setModalMode] = useState<'normal' | 'emergency'>(initialMode);
  const [selectedLiftId, setSelectedLiftId] = useState<string>(
    initialLiftId || preselectedLift?.id || availableLifts[0]?.id || ''
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
      else if (availableLifts[0]?.id) setSelectedLiftId(availableLifts[0].id);
    }
  }, [isOpen, initialMode, initialLiftId, preselectedLift, availableLifts]);

  if (!isOpen) return null;

  const currentLift = availableLifts.find((l) => l.id === selectedLiftId) || availableLifts[0];

  const handleFileUpload = () => {
    const samplePhoto = 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80';
    if (modalMode === 'emergency') {
      setEmergencyPhotos((prev) => [...prev, samplePhoto]);
    } else {
      setPhotos((prev) => [...prev, samplePhoto]);
    }
    showToast('info', 'Photo Attached', 'File uploaded successfully.');
  };

  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLift) return;

    setIsSubmitting(true);
    const ticketId = '#CMP-10245';

    setTimeout(() => {
      createComplaint({
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

      setIsSubmitting(false);
      setSubmittedTicket({
        id: ticketId,
        mode: 'normal',
        title: `${complaintType} — ${currentLift.liftNumber}`,
      });
      showToast('success', 'Complaint Registered Successfully', `Ticket ID: ${ticketId}`);
    }, 400);
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLift) return;

    setIsSubmitting(true);
    const ticketId = '#EMG-10021';

    setTimeout(() => {
      createComplaint({
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

      setIsSubmitting(false);
      setSubmittedTicket({
        id: ticketId,
        mode: 'emergency',
        title: `Emergency Breakdown — ${currentLift.liftNumber}`,
      });
      showToast('error', 'Emergency Request Created', `Ticket ID: ${ticketId} • Service team notified`);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-lg max-h-[94vh] overflow-y-auto shadow-2xl relative text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Confirmation View */}
        {submittedTicket ? (
          <div className="p-7 text-center space-y-5">
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
                <span className="font-bold text-slate-800">{submittedTicket.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-700 font-bold">✓ Assigned to Control Desk</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold text-xs shadow-md transition-all"
              >
                Done & View Ticket Tracker
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Mode Switcher Tab */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 p-1 bg-white rounded-2xl w-full border border-slate-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalMode('normal')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    modalMode === 'normal'
                      ? 'bg-[#123B5D] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Raise Service Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('emergency')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    modalMode === 'emergency'
                      ? 'bg-[#D32F2F] text-white shadow-sm'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>🚨 Emergency Breakdown</span>
                </button>
              </div>
            </div>

            {/* PAGE 5: RAISE A SERVICE REQUEST (NORMAL COMPLAINT) */}
            {modalMode === 'normal' && (
              <div>
                <div className="bg-[#123B5D] text-white p-5 text-center">
                  <h2 className="text-lg font-black tracking-tight">Raise a Service Request</h2>
                  <p className="text-xs text-sky-200 mt-0.5">
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
                      {availableLifts.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.liftNumber} — {l.buildingName} ({l.capacityPersons ? `${l.capacityPersons} Persons / ` : ''}{l.locationDetails || `${l.capacityKg || 544} kg`})
                        </option>
                      ))}
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
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Upload Photos / Videos
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <UploadCloud className="w-4 h-4 text-[#1976D2]" />
                        <span>Upload Photos / Videos</span>
                      </button>
                      {photos.length > 0 && (
                        <span className="text-xs text-emerald-700 font-semibold">
                          ✓ {photos.length} photo attached
                        </span>
                      )}
                    </div>
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
                      {availableLifts.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.liftNumber} — {l.buildingName} ({l.locationDetails || 'Passenger Lift'})
                        </option>
                      ))}
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

                  {/* Upload Photo / Video */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Upload Photo / Video
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#D32F2F] font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Upload Photo / Video</span>
                      </button>
                      {emergencyPhotos.length > 0 && (
                        <span className="text-xs text-red-700 font-semibold">
                          ✓ {emergencyPhotos.length} file attached
                        </span>
                      )}
                    </div>
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
      </div>
    </div>
  );
};
