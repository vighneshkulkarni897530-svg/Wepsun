import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditLogViewer } from './AuditLogViewer';
import { EditProfilePage } from '../common/EditProfilePage';

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

  // Profile Information Fields synced from currentUser
  const [name, setName] = useState(currentUser.name || 'WEPSUN Administrator');
  const [email, setEmail] = useState(currentUser.email || 'admin@wepsun.com');
  const [phone, setPhone] = useState(currentUser.phone || '+91 98201 55432');
  const [designation, setDesignation] = useState(currentUser.designation || 'Operations Head & Director');
  const [companyName, setCompanyName] = useState(currentUser.companyName || activeCompany.name || 'WEPSUN Engineering Solution');
  const [address, setAddress] = useState(currentUser.address || 'Plot No. 18, MIDC Industrial Estate, Thane West, Mumbai - 400604');
  const [bio, setBio] = useState(currentUser.bio || 'Managing elevator service operations, preventive maintenance pipelines, and client SLA compliance.');
  const [avatar, setAvatar] = useState(currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80');
  const [isCustomAvatarOpen, setIsCustomAvatarOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Update local fields when currentUser changes (e.g. user switch)
  useEffect(() => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setDesignation(currentUser.designation || (currentUser.role === 'super_admin' ? 'Global Platform Super Admin' : 'Operations Head & Director'));
    setCompanyName(currentUser.companyName || activeCompany.name);
    setAddress(currentUser.address || 'Plot No. 18, MIDC Industrial Estate, Thane West, Mumbai - 400604');
    setBio(currentUser.bio || 'Managing elevator service operations, preventive maintenance pipelines, and client SLA compliance.');
    setAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80');
  }, [currentUser, activeCompany]);
  
  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [criticalBreakdownAlerts, setCriticalBreakdownAlerts] = useState(true);

  // Security Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      companyName: companyName.trim(),
      address: address.trim(),
      bio: bio.trim(),
      avatar: avatar.trim(),
    });
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
          className="px-4 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <Camera className="w-4 h-4" />
          <span>Edit Full Profile & Photo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'profile'
              ? 'border-[#1976D2] text-[#1976D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          General Information
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'security'
              ? 'border-[#1976D2] text-[#1976D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Active Sessions
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
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
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <div className="relative group shrink-0">
                <img
                  src={currentUser.avatar || avatar}
                  alt={name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-50 shadow-sm border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingFull(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#0066FF] hover:bg-[#0052cc] text-white flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                  title="Update Photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{name}</h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1976D2] font-bold text-[11px] uppercase">
                  {currentRole.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Society Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Official Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F5F8FA] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:border-[#1976D2] outline-none font-medium"
                />
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
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
          <AuditLogViewer />
        </div>
      )}
    </div>
  );
};
