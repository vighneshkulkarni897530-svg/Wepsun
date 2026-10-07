import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Award,
  Truck,
  Package,
  Wifi,
  WifiOff,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  Lock,
  Edit3,
  X,
  Camera,
  Car,
  FileBadge,
} from 'lucide-react';
import { Technician, TechnicianJob, InventoryItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { EditProfilePage } from '../common/EditProfilePage';

interface TechnicianProfileViewProps {
  technician: Technician;
  assignedJobs: TechnicianJob[];
  inventory: InventoryItem[];
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const TechnicianProfileView: React.FC<TechnicianProfileViewProps> = ({
  technician,
  assignedJobs,
  inventory,
  showToast,
}) => {
  const { currentUser, updateTechnicianProfile } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now (Online)');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    name: technician.name || '',
    phone: technician.phone || '',
    email: technician.email || '',
    branchName: technician.branchName || technician.baseHub || 'Pune Service Hub',
    vehicleNumber: technician.vehicleNumber || 'MH-12-WEP-8842',
    specialization: technician.specialization || 'High-Speed Gearless PMSM & MRL Elevators',
    bio: technician.bio || 'Senior Field Engineer with 8+ years experience in elevator maintenance and diagnostics.',
  });

  // Field Van Stock calculation
  const vanStockItems = [
    { id: 'vs-1', name: 'Landing Door Interlock Switch (WEP-SW-LCK102)', qty: 3, min: 2, status: 'In Stock' },
    { id: 'vs-2', name: 'COP Micro-Push Buttons (Blue Halo LED)', qty: 8, min: 5, status: 'In Stock' },
    { id: 'vs-3', name: '32-Channel Smart Light Curtain Sensors (940nm)', qty: 1, min: 1, status: 'Low Stock' },
    { id: 'vs-4', name: 'Guide Shoe Liner Set (16mm Blade)', qty: 2, min: 2, status: 'In Stock' },
    { id: 'vs-5', name: 'ISO VG 68 Heavy Duty Rail Lubricant (5L)', qty: 4, min: 2, status: 'In Stock' },
  ];

  const handleOpenEdit = () => {
    setEditForm({
      name: technician.name || '',
      phone: technician.phone || '',
      email: technician.email || '',
      branchName: technician.branchName || technician.baseHub || 'Pune Service Hub',
      vehicleNumber: technician.vehicleNumber || 'MH-12-WEP-8842',
      specialization: technician.specialization || 'High-Speed Gearless PMSM & MRL Elevators',
      bio: technician.bio || 'Senior Field Engineer with 8+ years experience in elevator maintenance and diagnostics.',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateTechnicianProfile(technician.id, editForm);
    setIsEditModalOpen(false);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    showToast('info', 'Synchronizing Field Data', 'Syncing offline cache with WEPSUN central cloud server...');
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('success', 'Cloud Synchronized', 'All offline job records, signatures, and evidence photos backed up.');
    }, 1200);
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
    if (!isOfflineMode) {
      showToast('warning', 'Offline Mode Activated', 'Field operations will cache locally and sync once network returns.');
    } else {
      showToast('success', 'Online Mode Restored', 'Connected to real-time central server dispatch.');
    }
  };

  if (isEditing) {
    return <EditProfilePage onBack={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#123B5D] to-[#1976D2] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={technician.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{technician.name.split(' ').map((n) => n[0]).join('')}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#0066FF] hover:bg-[#0052cc] text-white flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                title="Update Profile Photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{technician.name}</h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ID: {technician.id.toUpperCase()}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Field Lead
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {technician.specialization || 'Senior Elevator Systems Engineer • Specialization: High-Speed Gearless PMSM & MRL'}
              </p>
            </div>
          </div>

          {/* Sync & Actions Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#1976D2]" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={toggleOfflineMode}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isOfflineMode
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-4 h-4 text-amber-600" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
              <span>{isOfflineMode ? 'Offline Mode (Local Cache)' : 'Online Connected'}</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Data'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Profile & Emergency Credentials */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-[#1976D2]" />
              <span>Field Engineer Credentials</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Security Cleared</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Contact</span>
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {technician.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-700 truncate">{technician.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Base Station Hub</span>
                <span className="font-semibold text-slate-700">{technician.branchName || technician.baseHub || 'Pune Service Hub'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Field Service Vehicle</span>
                <span className="font-mono font-bold text-[#1976D2]">{technician.vehicleNumber || 'MH-12-WEP-8842 (Van 04)'}</span>
              </div>
              {technician.bio && (
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Engineer Bio</span>
                  <p className="text-slate-600 leading-relaxed text-[11px] italic">&quot;{technician.bio}&quot;</p>
                </div>
              )}
            </div>

            {/* Safety & Compliance Badges */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Safety & Technical Certifications
              </span>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Government Certified Wireman & Lift Inspector
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700">Valid: 2028</span>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#1976D2]" />
                    Monarch & Step OEM Drive Specialist
                  </span>
                  <span className="text-[10px] font-mono text-blue-700">Level 4 Master</span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-purple-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Passenger Entrapment Emergency Rescue
                  </span>
                  <span className="text-[10px] font-mono text-purple-700">Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Mobile Service Van Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Assigned Van Stock Inventory</span>
            </h3>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              5 SKUs
            </span>
          </div>

          <div className="space-y-2.5">
            {vanStockItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-all"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400">Min Buffer: {item.min} units</span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-slate-900 text-sm block">{item.qty} units</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-900">
            💡 Van stock items are replenished automatically every Monday from the central distribution hub.
          </div>
        </div>

        {/* 3. Privacy, Security & RBAC Scoping Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <span>Data Protection & Privacy Scope</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-600">Active Strict RBAC</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-800 block">Strict Data Isolation Policy:</strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Under WEPSUN ISO 27001 data protection protocols, technicians only have access to clients and elevators with an active dispatched job order assigned to their technician ID.
              </p>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Jobs Today</span>
                <span className="font-mono font-bold text-slate-900">{assignedJobs.length} Tickets</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Historical Records Access</span>
                <span className="font-bold text-slate-700">Read-Only Audited</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Offline Local Storage</span>
                <span className="font-mono font-bold text-emerald-700">IndexedDB Encrypted</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Last Successful Sync</span>
                <span className="font-mono text-slate-600">{lastSyncTime}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Field Support Emergency Control Room
                </span>
                <p className="font-mono font-black text-sm text-amber-400">+91 98201 55432</p>
                <span className="text-[10px] text-slate-400 block">24x7 Direct Dispatch Desk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Technician Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#1976D2]" />
              <span>Edit Field Engineer Profile</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Update your contact details, service van number, and technical specialization
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Station Hub</label>
                  <input
                    type="text"
                    required
                    value={editForm.branchName}
                    onChange={(e) => setEditForm({ ...editForm, branchName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Field Service Vehicle No.</label>
                  <input
                    type="text"
                    required
                    value={editForm.vehicleNumber}
                    onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Technical Specialization</label>
                <input
                  type="text"
                  required
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                  placeholder="e.g. High-Speed Gearless PMSM & MRL Elevators"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Engineer Bio / Summary</label>
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
