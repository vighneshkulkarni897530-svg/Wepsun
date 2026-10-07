import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Building2,
  KeyRound,
  Lock,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Save,
  X,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
  Bell,
  Smartphone,
  MessageSquare,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Upload,
  Sliders,
  Shield,
  RefreshCw,
  BadgeCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GeometricBlueWLogo } from './WepsunLogo';
import { ProfilePhotoEditorModal } from './ProfilePhotoEditorModal';
import { UserRole } from '../../types';

interface EditProfilePageProps {
  onBack?: () => void;
  onSaved?: () => void;
}

// Preset Engineering & Corporate Avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
];

const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Delhi NCR',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Madhya Pradesh',
  'Kerala',
  'Punjab',
  'Haryana',
  'Goa',
  'Andhra Pradesh',
  'Bihar',
  'Odisha',
];

const LANGUAGES = [
  { code: 'en', label: 'English (India)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onBack, onSaved }) => {
  const {
    currentUser,
    clientProfile,
    currentRole,
    activeCompany,
    updateUserProfile,
    updateClientProfile,
    updateTechnicianProfile,
    showSuccessModal,
    showWarningModal,
    showDeleteModal,
    showToast,
  } = useApp();

  // Primary Editable Profile Form State
  const [formData, setFormData] = useState({
    name: currentUser.name || clientProfile?.contactPerson || '',
    username: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : 'user_' + currentUser.id.slice(-4)),
    email: currentUser.email || clientProfile?.email || '',
    phone: currentUser.phone || clientProfile?.phone || '',
    address: currentUser.address || clientProfile?.address || '',
    city: currentUser.city || clientProfile?.city || 'Pune',
    state: currentUser.state || 'Maharashtra',
    pincode: currentUser.pincode || clientProfile?.pincode || '411045',
    companyName: currentUser.companyName || clientProfile?.companyName || activeCompany?.name || 'WepSun Engineering Solution',
    designation: currentUser.designation || (currentRole === 'client' ? 'Society Chairman / Administrator' : currentRole === 'technician' ? 'Senior Elevator Maintenance Engineer' : 'Operations Head'),
    bio: currentUser.bio || 'Managing vertical transportation safety and AMC service compliance with WepSun Engineering Solution.',
    language: currentUser.language || 'en',
    avatar: currentUser.avatar || clientProfile?.logo || PRESET_AVATARS[0],
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    email: currentUser.notificationPreferences?.email ?? true,
    sms: currentUser.notificationPreferences?.sms ?? true,
    whatsapp: currentUser.notificationPreferences?.whatsapp ?? true,
    push: currentUser.notificationPreferences?.push ?? true,
    pmReminders: currentUser.notificationPreferences?.pmReminders ?? true,
  });

  // Photo Selector / Camera & Cropper Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<'options' | 'camera' | 'crop' | 'presets'>('options');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Security Modals State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email Update Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'input' | 'otp'>('input');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailTimer, setEmailTimer] = useState(60);

  // Phone Update Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'input' | 'otp'>('input');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneTimer, setPhoneTimer] = useState(60);

  // Saving / Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Timer countdowns for OTPs
  useEffect(() => {
    let timer: any;
    if (emailOtpStep === 'otp' && emailTimer > 0) {
      timer = setInterval(() => setEmailTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailOtpStep, emailTimer]);

  useEffect(() => {
    let timer: any;
    if (phoneOtpStep === 'otp' && phoneTimer > 0) {
      timer = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phoneOtpStep, phoneTimer]);

  // Start live webcam capture
  const handleStartCamera = async () => {
    setPhotoTab('camera');
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        showToast('warning', 'Camera Not Supported', 'Please use file upload from gallery.');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      showToast('error', 'Camera Access Denied', 'Please grant camera permissions or choose a photo from gallery.');
      setPhotoTab('options');
      setIsCameraActive(false);
    }
  };

  // Capture snapshot from webcam
  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame to square canvas
        const minDim = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
        const startX = (videoRef.current.videoWidth - minDim) / 2;
        const startY = (videoRef.current.videoHeight - minDim) / 2;
        ctx.drawImage(videoRef.current, startX, startY, minDim, minDim, 0, 0, 400, 400);
        const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setTempImage(capturedDataUrl);
        stopCameraStream();
        setPhotoTab('crop');
      }
    }
  };

  // Handle image file selection from gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('warning', 'File Too Large', 'Please select an image smaller than 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempImage(event.target.result as string);
          setPhotoTab('crop');
          setZoomLevel(1);
          setRotation(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Cropped / Selected Photo
  const handleApplyPhoto = (imageToApply?: string) => {
    const finalImg = imageToApply || tempImage;
    if (finalImg) {
      setFormData((prev) => ({ ...prev, avatar: finalImg }));
      setHasChanges(true);
      setIsPhotoModalOpen(false);
      setPhotoTab('options');
      setTempImage(null);
      stopCameraStream();
      showToast('success', 'Profile Photo Updated', 'Your new avatar is ready to be saved.');
    }
  };

  // Remove Photo with Confirmation
  const handleRemovePhoto = () => {
    showDeleteModal(
      'Remove Profile Picture?',
      'Your avatar will be removed and reset to your default initials.',
      () => {
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'WepSun User')}&background=0b2545&color=ffffff&bold=true&size=256`;
        setFormData((prev) => ({ ...prev, avatar: defaultAvatar }));
        setHasChanges(true);
        setIsPhotoModalOpen(false);
        setPhotoTab('options');
        showToast('info', 'Photo Removed', 'Avatar cleared.');
      }
    );
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim().replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'PIN Code must be a 6-digit number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Main Form Submission
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      showToast('warning', 'Check Form Fields', 'Please correct the highlighted errors before saving.');
      return;
    }

    setIsSaving(true);

    try {
      // Simulate network save latency
      await new Promise((resolve) => setTimeout(resolve, 600));

      const updatedUserProfile = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
        pincode: formData.pincode.trim(),
        companyName: formData.companyName.trim(),
        designation: formData.designation.trim(),
        bio: formData.bio.trim(),
        language: formData.language,
        avatar: formData.avatar,
        notificationPreferences: notifications,
      };

      // 1. Update Core User Profile
      updateUserProfile(updatedUserProfile);

      // 2. If client role, sync client profile
      if (currentRole === 'client') {
        updateClientProfile({
          contactPerson: formData.name.trim(),
          companyName: formData.companyName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          logo: formData.avatar,
        });
      }

      // 3. If technician role, sync technician profile
      if (currentRole === 'technician' && currentUser.technicianId) {
        updateTechnicianProfile(currentUser.technicianId, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          avatar: formData.avatar,
        });
      }

      setHasChanges(false);

      // 4. Trigger WepSun Success Pop-up Modal
      showSuccessModal(
        'Profile Updated Successfully!',
        'Your profile information, contact credentials, and preferences have been updated across WepSun Cloud ERP.',
        () => {
          if (onSaved) {
            onSaved();
          } else if (onBack) {
            onBack();
          } else {
            // Navigate back to profile tab
            window.location.hash = currentRole === 'client' ? 'profile' : currentRole === 'technician' ? 'profile' : 'settings';
          }
        }
      );
    } catch (err: any) {
      showToast('error', 'Failed to Save Profile', err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password Submission
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showSuccessModal(
      'Password Changed Successfully!',
      'Your account security credentials have been updated. You can now use your new password for future logins.'
    );
  };

  // Handle Cancel / Discard
  const handleCancel = () => {
    if (hasChanges) {
      showWarningModal(
        'Discard Unsaved Changes?',
        'You have unsaved modifications in your profile. Are you sure you want to discard them and return?',
        () => {
          if (onBack) {
            onBack();
          } else {
            window.location.hash = currentRole === 'client' ? 'profile' : currentRole === 'technician' ? 'profile' : 'settings';
          }
        }
      );
    } else {
      if (onBack) {
        onBack();
      } else {
        window.location.hash = currentRole === 'client' ? 'profile' : currentRole === 'technician' ? 'profile' : 'settings';
      }
    }
  };

  // Password Strength Score Helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passScore = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* Top Header & Breadcrumb Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleCancel}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Return to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200/60 text-[10px] font-bold uppercase tracking-wider">
                Account Settings
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {currentRole.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b2545] tracking-tight mt-0.5">
              Edit Profile & Credentials
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveProfile()}
            className="px-5 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] disabled:opacity-60 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Profile Editor Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. PROFILE PICTURE SECTION */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Circular Frame with Ring Glow */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-blue-500/20 border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
                {/* Overlay on hover */}
                <div
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Update</span>
                </div>
              </div>

              {/* Floating Camera Button Badge */}
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white flex items-center justify-center shadow-lg border-2 border-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Change Photo"
                aria-label="Change Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info & Change Actions */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-[#0b2545]">
                    {formData.name || 'WepSun User'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                    <BadgeCheck className="w-3 h-3 text-emerald-600" />
                    Verified User
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {formData.designation} • {formData.companyName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {currentUser.id} • Username: @{formData.username}
                </p>
              </div>

              {/* Photo Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] font-bold text-xs border border-blue-200/60 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Recommended: Square JPG or PNG, minimum 400x400 pixels. Maximum file size 8MB.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. EDITABLE PROFILE INFORMATION (CARDS GRID) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Personal & Account Identity */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0b2545]">Personal Information</h3>
                <p className="text-[11px] text-slate-400">Name and system account username</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border text-xs text-slate-900 font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.name ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-[#0066FF]'
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Username / User ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username / User Handle
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-mono text-xs absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="username"
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Designation / Role Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Role Title
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="e.g. Society Secretary / Operations Manager"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Bio / Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Profile Bio
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Brief description of your role and responsibilities..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card B: Contact Details & Quick Verifications */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0b2545]">Contact Information</h3>
                <p className="text-[11px] text-slate-400">Email, mobile, and verification credentials</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmailInput(formData.email);
                      setEmailOtpStep('input');
                      setIsEmailModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="name@company.com"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border text-xs text-slate-900 font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.email ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-[#0066FF]'
                    }`}
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {formErrors.email && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhoneInput(formData.phone);
                      setPhoneOtpStep('input');
                      setIsPhoneModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Verify via OTP
                  </button>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98200 00000"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border text-xs text-slate-900 font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.phone ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-[#0066FF]'
                    }`}
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Company / Society Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company / Organization / Society Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter society or company name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Security & Password Quick Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0b2545] text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#0066FF]" />
                    <span>Change Account Password</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Update ➔</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card C: Address & Geographical Location */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0b2545]">Location & Address</h3>
                <p className="text-[11px] text-slate-400">Registered premises and postal PIN code</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Street Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street / Building / Society Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Plot No., Street name, Landmark..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* City, State & PIN Code in responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="411045"
                    className={`w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border text-xs text-slate-900 font-mono focus:bg-white focus:outline-none transition-all ${
                      formErrors.pincode ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200 focus:border-[#0066FF]'
                    }`}
                  />
                </div>
              </div>
              {formErrors.pincode && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {formErrors.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Card D: Preferences & Notifications */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0b2545]">App & Notification Preferences</h3>
                <p className="text-[11px] text-slate-400">Language and real-time alert channels</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Language Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred App Language
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:bg-white focus:border-[#0066FF] focus:outline-none transition-all cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Toggles List */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Communication Channels
                </span>

                {/* Email Alerts */}
                <label className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Email Notifications</span>
                      <span className="text-[10px] text-slate-500">Service reports, quotes & AMC invoices</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => {
                      setNotifications((prev) => ({ ...prev, email: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-[#0066FF] rounded accent-[#0066FF] cursor-pointer"
                  />
                </label>

                {/* SMS & Critical Alerts */}
                <label className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">SMS & Breakdown Alerts</span>
                      <span className="text-[10px] text-slate-500">Emergency dispatch, ticket OTPs & alarms</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => {
                      setNotifications((prev) => ({ ...prev, sms: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-[#0066FF] rounded accent-[#0066FF] cursor-pointer"
                  />
                </label>

                {/* WhatsApp Updates */}
                <label className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">WhatsApp Dispatch Updates</span>
                      <span className="text-[10px] text-slate-500">Technician live ETA & instant service card</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.whatsapp}
                    onChange={(e) => {
                      setNotifications((prev) => ({ ...prev, whatsapp: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-[#0066FF] rounded accent-[#0066FF] cursor-pointer"
                  />
                </label>

                {/* Monthly PM Reminders */}
                <label className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">PM Maintenance Reminders</span>
                      <span className="text-[10px] text-slate-500">Scheduled 48-hour prior visit notifications</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pmReminders}
                    onChange={(e) => {
                      setNotifications((prev) => ({ ...prev, pmReminders: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-[#0066FF] rounded accent-[#0066FF] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM STICKY ACTION BUTTONS */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-[#0b2545] block">
              {hasChanges ? 'You have unsaved changes' : 'Profile up to date'}
            </span>
            <p className="text-[11px] text-slate-400">
              {hasChanges ? 'Save your changes to sync across all WepSun applications.' : 'All information is synchronized with WepSun Cloud.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] disabled:opacity-60 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* 4. PROFESSIONAL INTERACTIVE PROFILE PHOTO EDITOR MODAL */}
      {/* ========================================================================= */}
      <ProfilePhotoEditorModal
        isOpen={isPhotoModalOpen}
        initialImage={formData.avatar}
        onClose={() => setIsPhotoModalOpen(false)}
        onApply={(croppedDataUrl) => {
          setFormData((prev) => ({ ...prev, avatar: croppedDataUrl }));
          setHasChanges(true);
          setIsPhotoModalOpen(false);
          showToast('success', 'Profile Photo Updated', 'Your profile picture has been updated and positioned.');
        }}
        onRemovePhoto={handleRemovePhoto}
      />

      {/* ========================================================================= */}
      {/* 5. CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsPasswordModalOpen(false)} className="fixed inset-0 bg-slate-950/65 backdrop-blur-md" />

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 overflow-hidden space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-black text-[#0b2545]">Change Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min 8 characters) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter strong new password"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {passwordForm.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      <div className={`flex-1 rounded-full ${passScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                      <div className={`flex-1 rounded-full ${passScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                      <div className={`flex-1 rounded-full ${passScore >= 3 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      <div className={`flex-1 rounded-full ${passScore >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Strength: {passScore <= 1 ? 'Weak' : passScore <= 2 ? 'Fair' : passScore === 3 ? 'Good' : 'Strong & Secure'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CHANGE EMAIL MODAL WITH VERIFICATION */}
      {/* ========================================================================= */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsEmailModalOpen(false)} className="fixed inset-0 bg-slate-950/65 backdrop-blur-md" />

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 overflow-hidden space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-black text-[#0b2545]">Update Email Address</h3>
              </div>
              <button type="button" onClick={() => setIsEmailModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {emailOtpStep === 'input' ? (
              <div className="space-y-3.5">
                <p className="text-xs text-slate-500">
                  Enter your new email address. We will send a 6-digit confirmation code to verify ownership.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Email Address</label>
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="new.email@society.in"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newEmailInput || !newEmailInput.includes('@')) {
                        showToast('warning', 'Invalid Email', 'Please enter a valid email.');
                        return;
                      }
                      setEmailOtpStep('otp');
                      setEmailTimer(60);
                      showToast('info', 'Verification Code Dispatched', `Code sent to ${newEmailInput}. Use dev code 928205 if needed.`);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Send Verification Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-center">
                <p className="text-xs text-slate-600">
                  Enter the 6-digit code sent to <span className="font-bold text-slate-900">{newEmailInput}</span>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  className="w-48 mx-auto text-center py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-mono font-bold tracking-widest text-[#0066FF] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Resend code in {emailTimer}s
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('email', newEmailInput);
                      setIsEmailModalOpen(false);
                      showSuccessModal('Email Verified & Updated', `Your account email has been updated to ${newEmailInput}.`);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Verify & Update Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CHANGE PHONE NUMBER MODAL WITH OTP */}
      {/* ========================================================================= */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsPhoneModalOpen(false)} className="fixed inset-0 bg-slate-950/65 backdrop-blur-md" />

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 overflow-hidden space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-black text-[#0b2545]">Update Mobile Number with OTP</h3>
              </div>
              <button type="button" onClick={() => setIsPhoneModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {phoneOtpStep === 'input' ? (
              <div className="space-y-3.5">
                <p className="text-xs text-slate-500">
                  Enter your updated 10-digit mobile number to receive a one-time password (OTP).
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Mobile Number</label>
                  <input
                    type="tel"
                    value={newPhoneInput}
                    onChange={(e) => setNewPhoneInput(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPhoneInput || newPhoneInput.length < 10) {
                        showToast('warning', 'Invalid Phone Number', 'Please enter a valid 10-digit mobile number.');
                        return;
                      }
                      setPhoneOtpStep('otp');
                      setPhoneTimer(60);
                      showToast('info', 'OTP Sent', `OTP code sent to ${newPhoneInput}. (Dev OTP: 123456)`);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Send OTP
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-center">
                <p className="text-xs text-slate-600">
                  Enter the 6-digit SMS OTP sent to <span className="font-bold text-slate-900">{newPhoneInput}</span>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1 2 3 4 5 6"
                  className="w-48 mx-auto text-center py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-mono font-bold tracking-widest text-[#0066FF] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Resend OTP in {phoneTimer}s
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('phone', newPhoneInput);
                      setIsPhoneModalOpen(false);
                      showSuccessModal('Mobile Number Verified!', `Your registered phone number has been updated to ${newPhoneInput}.`);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Verify & Update Phone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;
