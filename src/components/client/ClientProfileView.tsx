import React, { useState } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  KeyRound,
  LogOut,
  Edit3,
  CheckCircle2,
  Camera,
  FileSpreadsheet,
  AlertCircle,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ClientProfileViewProps {
  onLogout?: () => void;
}

export const ClientProfileView: React.FC<ClientProfileViewProps> = ({ onLogout }) => {
  const { clientProfile, updateClientProfile, changeClientPassword, clientScopedLifts, showToast, setCurrentRole } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    companyName: clientProfile.companyName,
    contactPerson: clientProfile.contactPerson,
    phone: clientProfile.phone,
    email: clientProfile.email,
    address: clientProfile.address,
    city: clientProfile.city,
    pincode: clientProfile.pincode,
    gstin: clientProfile.gstin || '',
    logo: clientProfile.logo || '',
  });

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleOpenEdit = () => {
    setEditForm({
      companyName: clientProfile.companyName,
      contactPerson: clientProfile.contactPerson,
      phone: clientProfile.phone,
      email: clientProfile.email,
      address: clientProfile.address,
      city: clientProfile.city,
      pincode: clientProfile.pincode,
      gstin: clientProfile.gstin || '',
      logo: clientProfile.logo || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientProfile(editForm);
    setIsEditModalOpen(false);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    const success = changeClientPassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (success) {
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      window.location.hash = 'login';
      showToast('info', 'Logged Out', 'You have been logged out of the Client Portal.');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-slate-100 border-2 border-blue-200 shadow-md shrink-0 flex items-center justify-center">
              {clientProfile.logo ? (
                <img
                  src={clientProfile.logo}
                  alt={clientProfile.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#123B5D] text-white flex items-center justify-center font-bold text-2xl">
                  {clientProfile.companyName.charAt(0)}
                </div>
              )}
            </div>
            <button
              onClick={handleOpenEdit}
              className="absolute -bottom-1 -right-1 p-1.5 bg-[#1976D2] hover:bg-blue-700 text-white rounded-xl shadow-md border-2 border-white transition-transform hover:scale-110"
              title="Change Logo / Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1976D2] font-mono text-xs font-bold border border-blue-200">
                Client ID: {clientProfile.clientId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                Verified Account
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {clientProfile.companyName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Primary Representative: <strong className="text-slate-900">{clientProfile.contactPerson}</strong>
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <button
            onClick={handleOpenEdit}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-[#1976D2]" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-slate-600" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Grid: Company Details & Registered Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-[#1976D2]" />
              <span>Company & Contact Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">Client / Society Name</span>
                <span className="font-bold text-slate-900 text-sm block">{clientProfile.companyName}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">Client Identification Number</span>
                <span className="font-bold text-[#1976D2] font-mono text-sm block">{clientProfile.clientId}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">Contact Person Name</span>
                <span className="font-bold text-slate-900 text-sm block">{clientProfile.contactPerson}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">Mobile Number</span>
                <span className="font-bold text-slate-900 text-sm font-mono block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {clientProfile.phone}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">Email Address</span>
                <span className="font-bold text-slate-900 text-sm block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  {clientProfile.email}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">GSTIN / Tax ID</span>
                <span className="font-bold text-slate-800 font-mono text-sm block">
                  {clientProfile.gstin || '27AABCW1234F1Z8'}
                </span>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium block text-[11px]">Registered Billing Address</span>
                <span className="font-bold text-slate-900 text-sm block flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  {clientProfile.address}, {clientProfile.city} - {clientProfile.pincode}
                </span>
              </div>
            </div>
          </div>

          {/* Registered Buildings Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-[#1976D2]" />
              <span>Registered Buildings & Site Locations</span>
            </h2>

            <div className="space-y-3">
              {clientProfile.registeredBuildings.map((bld, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-[#F5F8FA] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{bld}</span>
                      <span className="text-xs text-slate-500">{clientProfile.address}, {clientProfile.city}</span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono shrink-0">
                    {clientScopedLifts.length} Lifts Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Security & Service Summary */}
        <div className="space-y-6">
          {/* Security & Access Box */}
          <div className="bg-gradient-to-br from-[#123B5D] to-[#0A2540] text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Client Security Vault</h3>
                <p className="text-[11px] text-blue-200">Strict RBAC Zero Data Leakage</p>
              </div>
            </div>

            <p className="text-xs text-blue-100 leading-relaxed">
              Your account operates in an isolated tenant container. All maintenance records, AMC agreements, invoices, and diagnostic data belong strictly to your society.
            </p>

            <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-200">
                <span>Account Tier:</span>
                <strong className="text-white">Premium Society AMC</strong>
              </div>
              <div className="flex items-center justify-between text-blue-200">
                <span>2FA / OTP Verification:</span>
                <strong className="text-emerald-400">Active (4-Digit)</strong>
              </div>
              <div className="flex items-center justify-between text-blue-200">
                <span>Last Login:</span>
                <strong className="text-white">Today, 10:15 AM</strong>
              </div>
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900">Dedicated Service Desk</h3>
            <p className="text-xs text-slate-600">
              Need to update society committee members, billing entities, or registered elevator units?
            </p>
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs space-y-1 font-mono">
              <span className="text-slate-600 block text-[11px]">24x7 Control Room:</span>
              <strong className="text-[#1976D2] text-sm block">+91 98201 55432</strong>
              <span className="text-slate-500 block text-[10px] mt-1">support@wepsun.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
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
              <span>Edit Client Profile</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Update society contact person, address, phone number, or company logo
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Society Name</label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.contactPerson}
                    onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={editForm.gstin}
                    onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:border-[#1976D2] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#1976D2]" />
              <span>Change Account Password</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter your current password and choose a strong new password
            </p>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#1976D2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-bold shadow-md shadow-slate-900/10"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Confirm Logout</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to end your current session from {clientProfile.companyName}?
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
