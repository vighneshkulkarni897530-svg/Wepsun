import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Lock,
  ShieldCheck,
  Smartphone,
  Bell,
  KeyRound,
  History,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Save,
  Camera,
  Briefcase,
  FileText,
  Copy,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditLogViewer } from './AuditLogViewer';
import { EditProfilePage } from '../common/EditProfilePage';
import { getEffectiveProfilePhoto, isValidCustomAvatar } from '../../utils/avatarUtils';
import { detectMasterAdminSlot, MASTER_ADMIN_PROFILES } from '../../utils/masterAdminProfiles';

export const AdminProfileSettingsView: React.FC = () => {
  const {
    currentUser,
    activeCompany,
    currentRole,
    updateUserProfile,
    showToast,
    showWarningModal,
    showSuccessModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'audit'>('profile');
  const [isEditingFull, setIsEditingFull] = useState(false);
  const [, setAvatarVersion] = useState(0);

  useEffect(() => {
    const handlePhotoUpdated = () => {
      setAvatarVersion((v) => v + 1);
    };
    window.addEventListener('wepsun_profile_photo_updated', handlePhotoUpdated);
    window.addEventListener('storage', handlePhotoUpdated);
    return () => {
      window.removeEventListener('wepsun_profile_photo_updated', handlePhotoUpdated);
      window.removeEventListener('storage', handlePhotoUpdated);
    };
  }, []);

  const masterSlot = detectMasterAdminSlot(currentUser);
  const masterDef = masterSlot ? MASTER_ADMIN_PROFILES[masterSlot] : null;

  // Stored profile cache per user ID
  const savedProfile = useMemo(() => {
    if (typeof window === 'undefined' || !currentUser.id) return null;
    try {
      const raw = localStorage.getItem('wepsun_master_profile_' + currentUser.id);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [currentUser.id]);

  const effectiveAdminAvatar = getEffectiveProfilePhoto(currentUser.avatar, null, currentUser.id) || masterDef?.defaultAvatar || '';

  // Profile Information Fields synced from currentUser & master metadata
  const [name, setName] = useState(() => savedProfile?.name || currentUser.name || masterDef?.name || 'WEPSUN Administrator');
  const [email, setEmail] = useState(() => savedProfile?.email || currentUser.email || masterDef?.email || 'admin@wepsun.com');
  const [phone, setPhone] = useState(() => savedProfile?.phone || currentUser.phone || masterDef?.phone || '+91 98201 55432');
  const [masterId] = useState(() => masterDef?.masterId || 'WEP-MASTER');
  const [designation, setDesignation] = useState(() => savedProfile?.designation || currentUser.designation || masterDef?.designation || 'Operations Head & Director');
  const [department, setDepartment] = useState(() => savedProfile?.department || masterDef?.department || 'Executive Administration');
  const [companyName, setCompanyName] = useState(() => savedProfile?.companyName || currentUser.companyName || activeCompany.name || 'WEPSUN Engineering Solution');
  const [address, setAddress] = useState(() => savedProfile?.address || currentUser.address || 'Plot No. 18, MIDC Industrial Estate, Thane West, Mumbai - 400604');
  const [bio, setBio] = useState(() => savedProfile?.bio || currentUser.bio || masterDef?.bio || 'Managing elevator service operations, preventive maintenance pipelines, and client SLA compliance.');
  const [avatar, setAvatar] = useState(() => isValidCustomAvatar(effectiveAdminAvatar) ? effectiveAdminAvatar : (masterDef?.defaultAvatar || ''));
  const [isCustomAvatarOpen, setIsCustomAvatarOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isCopiedId, setIsCopiedId] = useState(false);
  const [auditFilterMode, setAuditFilterMode] = useState<'all' | 'mine'>('mine');

  // Update local fields when currentUser changes (e.g. user switch)
  useEffect(() => {
    const raw = typeof window !== 'undefined' && currentUser.id ? localStorage.getItem('wepsun_master_profile_' + currentUser.id) : null;
    const sp = raw ? JSON.parse(raw) : null;
    setName(sp?.name || currentUser.name || masterDef?.name || '');
    setEmail(sp?.email || currentUser.email || masterDef?.email || '');
    setPhone(sp?.phone || currentUser.phone || masterDef?.phone || '');
    setDesignation(sp?.designation || currentUser.designation || masterDef?.designation || 'Operations Head & Director');
    setDepartment(sp?.department || masterDef?.department || 'Executive Administration');
    setCompanyName(sp?.companyName || currentUser.companyName || activeCompany.name);
    setAddress(sp?.address || currentUser.address || 'Plot No. 18, MIDC Industrial Estate, Thane West, Mumbai - 400604');
    setBio(sp?.bio || currentUser.bio || masterDef?.bio || 'Managing elevator service operations, preventive maintenance pipelines, and client SLA compliance.');
    const eff = getEffectiveProfilePhoto(currentUser.avatar, null, currentUser.id) || masterDef?.defaultAvatar || '';
    setAvatar(isValidCustomAvatar(eff) ? eff : (masterDef?.defaultAvatar || ''));
  }, [currentUser, activeCompany, masterDef]);
  
  // Notification Preferences (saved per admin)
  const notifPrefKey = `wepsun_admin_notifs_${currentUser.id || 'default'}`;
  const [emailAlerts, setEmailAlerts] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(notifPrefKey + '_email');
    return saved !== null ? saved === 'true' : true;
  });
  const [smsAlerts, setSmsAlerts] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(notifPrefKey + '_sms');
    return saved !== null ? saved === 'true' : true;
  });
  const [whatsappAlerts, setWhatsappAlerts] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(notifPrefKey + '_whatsapp');
    return saved !== null ? saved === 'true' : true;
  });
  const [criticalBreakdownAlerts, setCriticalBreakdownAlerts] = useState(true);

  // Security Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const handleCopyMasterId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(masterId);
      setIsCopiedId(true);
      setTimeout(() => setIsCopiedId(false), 2000);
      showToast('success', 'Master ID Copied', `${masterId} copied to clipboard.`);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      companyName: companyName.trim(),
      address: address.trim(),
      bio: bio.trim(),
      avatar: avatar.trim(),
    };

    if (typeof window !== 'undefined' && currentUser.id) {
      try {
        localStorage.setItem('wepsun_master_profile_' + currentUser.id, JSON.stringify({ ...updated, department }));
        localStorage.setItem(notifPrefKey + '_email', String(emailAlerts));
        localStorage.setItem(notifPrefKey + '_sms', String(smsAlerts));
        localStorage.setItem(notifPrefKey + '_whatsapp', String(whatsappAlerts));
      } catch {}
    }

    updateUserProfile(updated);
    showSuccessModal(
      'Profile Updated Successfully',
      `${name.trim()}'s profile and administrative preferences have been saved.`
    );
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Password Required', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Password Mismatch', 'New passwords do not match.');
      return;
    }
    showToast('success', 'Password Updated', 'Your security password has been changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (isEditingFull) {
    return <EditProfilePage onBack={() => setIsEditingFull(false)} onSaved={() => setIsEditingFull(false)} />;
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-[#1976D2]" />
            My Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Account settings, role permissions, multi-factor authentication, active sessions, and audit log trail.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditingFull(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px] touch-manipulation"
        >
          <Camera className="w-4 h-4" />
          <span>Edit Full Profile & Photo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto touch-pan-x scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap min-h-[44px] flex items-center cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#1976D2] text-[#1976D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          General Information
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap min-h-[44px] flex items-center cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#1976D2] text-[#1976D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Active Sessions
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap min-h-[44px] flex items-center cursor-pointer ${
            activeTab === 'audit'
              ? 'border-[#1976D2] text-[#1976D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Trail
        </button>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Executive Identity Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  {isValidCustomAvatar(effectiveAdminAvatar) ? (
                    <img
                      src={effectiveAdminAvatar}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-50 shadow-sm border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-[#1976D2] ring-4 ring-blue-50 shadow-sm border border-slate-200 font-bold text-xl">
                      {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20" title="Online & Active" />
                  <button
                    type="button"
                    onClick={() => setIsEditingFull(true)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#0066FF] hover:bg-[#0052cc] text-white flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                    title="Update Profile Photo"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{name}</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Root Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{designation}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={handleCopyMasterId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0066FF] font-mono text-[11px] font-bold border border-blue-200/80 transition-all cursor-pointer"
                      title="Click to copy Master ID"
                    >
                      <span>{masterId}</span>
                      {isCopiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                      CLEARANCE: LVL-5
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wide shadow-xs">
                  {masterSlot === 1 ? 'MASTER ADMIN 1' : masterSlot === 2 ? 'MASTER ADMIN 2' : 'MASTER ADMIN'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {department}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Master Administrator ID</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value={masterId}
                    className="w-full bg-slate-100/80 border border-slate-200 text-slate-600 rounded-xl pl-9 pr-16 py-2.5 font-mono font-bold cursor-not-allowed select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyMasterId}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0066FF] hover:text-[#0052cc] px-2 py-1 rounded cursor-pointer"
                  >
                    {isCopiedId ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Executive Designation</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department / Executive Portfolio</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address (Login Credential)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Hotline</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Company / Organization</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Head Office Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Executive Bio & Strategic Focus</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Enter your executive overview or department scope..."
                    className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1976D2]" />
              Notification Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F8FA] border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded text-[#1976D2] focus:ring-[#1976D2]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Email Notifications</span>
                  <span className="text-[11px] text-slate-500">Receive reports and AMC renewal notices via email</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F8FA] border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="rounded text-[#1976D2] focus:ring-[#1976D2]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">SMS Alerts</span>
                  <span className="text-[11px] text-slate-500">Receive OTP and technician arrival alerts</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F8FA] border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="rounded text-[#1976D2] focus:ring-[#1976D2]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">WhatsApp Updates</span>
                  <span className="text-[11px] text-slate-500">Receive instant ticket closures and PDF service reports</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F8FA] border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalBreakdownAlerts}
                  onChange={(e) => setCriticalBreakdownAlerts(e.target.checked)}
                  className="rounded text-[#1976D2] focus:ring-[#1976D2]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Emergency SOS Flashes</span>
                  <span className="text-[11px] text-red-600 font-semibold">Priority broadcast when passenger is trapped</span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 min-h-[44px] touch-manipulation cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Active Sessions */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Form */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#1976D2]" />
              Change Password
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs max-w-md">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* OTP Verification & 2FA */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#1976D2]" />
                  Two-Factor OTP Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Require 6-digit SMS / WhatsApp OTP on every new browser login
                </p>
              </div>

              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  twoFactorEnabled
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {twoFactorEnabled ? 'ENABLED 🟢' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1976D2]" />
              Active Logged-In Sessions
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F5F8FA] border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold">
                    PC
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Chrome on Windows 11 (Current Session)</span>
                    <span className="text-[11px] text-slate-500">IP: 49.37.142.88 • Mumbai, Maharashtra</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  ACTIVE NOW
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F8FA] border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                    📱
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">WEPSUN Mobile PWA on Android</span>
                    <span className="text-[11px] text-slate-500">IP: 103.22.14.90 • Pune, Maharashtra</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    showWarningModal(
                      'Revoke Mobile Session?',
                      'This will immediately log out the active Android PWA session on IP 103.22.14.90.',
                      () => {
                        showSuccessModal('Session Terminated', 'Remote Android session was successfully revoked.');
                      }
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-red-50 hover:text-red-600 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Audit Scope:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuditFilterMode('mine')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    auditFilterMode === 'mine'
                      ? 'bg-white text-[#0066FF] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Actions ({name.split(' ')[0]})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilterMode('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    auditFilterMode === 'all'
                      ? 'bg-white text-[#0066FF] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All System Logs
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {auditFilterMode === 'mine' ? `Filtered by ${name}` : 'Showing all tenant events across company'}
            </p>
          </div>
          <AuditLogViewer
            actorFilter={auditFilterMode === 'mine' ? name : undefined}
            onClearActorFilter={() => setAuditFilterMode('all')}
          />
        </div>
      )}
    </div>
  );
};
