import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  FileCheck2,
  Search,
  Bell,
  Calendar,
  Home,
  User,
  Share2,
  Sparkles,
  Trash2,
  LockKeyhole,
  AlertOctagon,
  WifiOff,
  LogOut,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WepsunLogo } from '../common/WepsunLogo';
import { WepsunSplashAnimation } from '../common/WepsunSplashAnimation';

export const DesignSystemShowcase: React.FC = () => {
  const {
    showSuccessModal,
    showErrorModal,
    showWarningModal,
    showDeleteModal,
    showLoginErrorModal,
    showAccessDeniedModal,
    showNetworkModal,
    showLogoutModal,
    showLoadingModal,
    hideLoadingModal,
    showUpdateModal,
  } = useApp();

  const palette = [
    { name: 'Primary', label: 'Deep Navy Blue', hex: '#123B5D', textLight: true },
    { name: 'Secondary', label: 'Professional Blue', hex: '#1976D2', textLight: true },
    { name: 'Accent', label: 'Teal / Green', hex: '#00A896', textLight: true },
    { name: 'Background', label: 'Light Blue', hex: '#F5F8FA', textLight: false, border: true },
    { name: 'Cards', label: 'White', hex: '#FFFFFF', textLight: false, border: true },
    { name: 'Text', label: 'Charcoal', hex: '#263238', textLight: true },
    { name: 'Success', label: 'Green', hex: '#2E7D32', textLight: true },
    { name: 'Warning', label: 'Amber', hex: '#F9A825', textLight: false },
    { name: 'Error / Emergency', label: 'Red', hex: '#D32F2F', textLight: true },
  ];

  return (
    <div className="space-y-6">
      {/* Brand Header Banner */}
      <div className="bg-[#123B5D] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <WepsunLogo size="lg" theme="dark" />
            <p className="text-xs sm:text-sm text-sky-100 font-medium mt-3">
              Lift Service & AMC Management App • Reliable Lifts | Safer Tomorrow
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-sky-200">
            <span>✓ Professional</span>
            <span>•</span>
            <span>✓ Efficient Service Management</span>
            <span>•</span>
            <span>✓ Better Performance</span>
          </div>
        </div>
      </div>

      {/* Official Startup & Brand Animation Video (animation.mp4) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0b2545] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" /> WEPSUN Startup & Brand Animation (animation.mp4)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-definition startup animation playing on web and native app launch, featuring ambient lighting, audio toggles, responsive scaling, and progress tracking.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg border border-sky-100 self-start sm:self-center">
            Startup & Web Animation
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-black aspect-video relative">
          <WepsunSplashAnimation
            className="!relative !w-full !h-full !min-h-0 !z-0"
          />
        </div>
      </div>

      {/* Colour Palette Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#263238]">Colour Palette</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {palette.map((c) => (
            <div key={c.name} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-full h-16 rounded-2xl shadow-sm flex items-center justify-center font-mono text-[10px] font-bold ${
                  c.border ? 'border border-slate-200' : ''
                }`}
                style={{ backgroundColor: c.hex, color: c.textLight ? '#FFFFFF' : '#263238' }}
              >
                {c.hex}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#263238] block truncate">{c.name}</span>
                <span className="text-[10px] text-slate-500 block truncate">{c.label}</span>
                <span className="text-[9px] text-slate-400 font-mono block truncate">{c.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Foundation Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Block 1: Buttons & Elements */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
            Buttons & Elements
          </h3>

          <div className="space-y-2.5">
            <button className="w-full py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors">
              Primary Button
            </button>
            <button className="w-full py-2.5 rounded-xl bg-[#00A896] hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors">
              Secondary Button
            </button>
            <button className="w-full py-2.5 rounded-xl bg-white border border-[#1976D2] text-[#1976D2] hover:bg-blue-50 text-xs font-bold transition-colors">
              Outline Button
            </button>
            <button className="w-full py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Button</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-slate-500">
            <Search className="w-4 h-4 hover:text-[#1976D2] cursor-pointer" />
            <Bell className="w-4 h-4 hover:text-[#1976D2] cursor-pointer" />
            <Calendar className="w-4 h-4 hover:text-[#1976D2] cursor-pointer" />
            <Home className="w-4 h-4 hover:text-[#1976D2] cursor-pointer" />
            <Wrench className="w-4 h-4 hover:text-[#1976D2] cursor-pointer" />
            <User className="w-4 h-4 hover:text-[#1976D2] cursor-pointer" />
          </div>
        </div>

        {/* Block 2: Status Indicators */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
            Status Indicators
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#263238] block">OK / Resolved</span>
                <span className="text-[10px] font-mono text-slate-400">#2E7D32</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F9A825] text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#263238] block">Attention Required</span>
                <span className="text-[10px] font-mono text-slate-400">#F9A825</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D32F2F] text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#263238] block">Faulty / Emergency</span>
                <span className="text-[10px] font-mono text-slate-400">#D32F2F</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#607D8B] text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#263238] block">Pending</span>
                <span className="text-[10px] font-mono text-slate-400">#607D8B</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1976D2] text-white flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#263238] block">In Progress</span>
                <span className="text-[10px] font-mono text-slate-400">#1976D2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: Cards / Info Boxes */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
            Cards / Info Boxes
          </h3>

          {/* Lift Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#263238]">Lift #001</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#2E7D32] text-[10px] font-bold">
                Operational
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              <p>Capacity: 10 Persons</p>
              <p>Location: Main Building</p>
            </div>
          </div>

          {/* PM Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#263238]">Preventive Maintenance</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1976D2] text-[10px] font-bold">
                Scheduled
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              <p>Next PM: 15 Sep 2025</p>
            </div>
          </div>

          {/* AMC Plan Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#263238]">AMC Plan</span>
            </div>
            <div className="text-[11px] text-slate-500">
              <p>Type: Comprehensive</p>
              <p>Expiry: 12 Jan 2026</p>
            </div>
          </div>
        </div>

        {/* Block 4: Charts & Graphs (Dashboard) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
            Charts & Graphs (Dashboard)
          </h3>

          {/* Complaint Status Donut */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Complaint Status</span>
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#2E7D32"
                    strokeWidth="12"
                    strokeDasharray="139 238"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#1976D2"
                    strokeWidth="12"
                    strokeDasharray="60 238"
                    strokeDashoffset="-139"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F9A825"
                    strokeWidth="12"
                    strokeDasharray="39 238"
                    strokeDashoffset="-199"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-900 leading-none">12</span>
                  <span className="text-[8px] text-slate-400 leading-none">Total</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                  <span>Resolved: 7</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1976D2]" />
                  <span>In Progress: 3</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F9A825]" />
                  <span>Pending: 2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Service Visits Bar Graph */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Monthly Service Visits</span>
            <div className="flex items-end justify-between h-20 pt-2 px-1">
              {[
                { m: 'Jan', v: 7 },
                { m: 'Feb', v: 8 },
                { m: 'Mar', v: 11 },
                { m: 'Apr', v: 14 },
                { m: 'May', v: 16 },
                { m: 'Jun', v: 19 },
              ].map((item) => (
                <div key={item.m} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 rounded-t bg-[#1976D2]"
                    style={{ height: `${item.v * 3.5}px` }}
                  />
                  <span className="text-[9px] text-slate-400 font-mono">{item.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. WEPSUN POP-UP & MODAL SYSTEM SHOWCASE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#0b2545] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066FF]" /> WepSun Pop-Up & Modal System
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Consistent, modern, and responsive pop-up modal system designed for mobile & web with a clean engineering-tech aesthetic, smooth backdrop blur, spring entrance animations, and clear button hierarchy.
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#0066FF] text-xs font-bold rounded-xl border border-blue-100 self-start sm:self-center">
            10 Standardized Variants
          </span>
        </div>

        {/* 10 Live Modal Triggers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Success */}
          <button
            type="button"
            onClick={() => showSuccessModal('Successfully Saved!', 'Your changes have been saved successfully.')}
            className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                1. Success
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Successfully Saved!
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Confirmation message with single primary Continue action.
            </p>
          </button>

          {/* 2. Error */}
          <button
            type="button"
            onClick={() => showErrorModal('Something Went Wrong', "We couldn't complete your request. Please try again.")}
            className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center font-bold">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">
                2. Error
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
              Something Went Wrong
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Error prompt with Try Again and Cancel button actions.
            </p>
          </button>

          {/* 3. Warning */}
          <button
            type="button"
            onClick={() => showWarningModal('Are You Sure?', 'This action may affect your existing data.')}
            className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                3. Warning
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              Are You Sure?
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Caution dialogue with Continue and Cancel options.
            </p>
          </button>

          {/* 4. Delete Confirmation */}
          <button
            type="button"
            onClick={() => showDeleteModal('Delete This Item?', 'This action cannot be undone.')}
            className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">
                4. Delete
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
              Delete This Item?
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Destructive action with confirmation step and red button.
            </p>
          </button>

          {/* 5. Login Error */}
          <button
            type="button"
            onClick={() => showLoginErrorModal('Please check your ID and password and try again.')}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold">
                <LockKeyhole className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-md">
                5. Auth Error
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors">
              Invalid Credentials
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Authentication failure prompt with Try Again action.
            </p>
          </button>

          {/* 6. Access Denied */}
          <button
            type="button"
            onClick={() => showAccessDeniedModal("You don't have permission to access this section.")}
            className="p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                6. RBAC Denied
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
              Access Denied
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Permission barrier prompt with single OK dismissal.
            </p>
          </button>

          {/* 7. Internet Connection */}
          <button
            type="button"
            onClick={() => showNetworkModal()}
            className="p-4 rounded-2xl border border-sky-200/80 bg-sky-50/50 hover:bg-sky-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100/80 text-sky-600 flex items-center justify-center font-bold">
                <WifiOff className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-md">
                7. Network
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
              No Connection
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Offline state detection dialog with Retry button.
            </p>
          </button>

          {/* 8. Logout Confirmation */}
          <button
            type="button"
            onClick={() => showLogoutModal()}
            className="p-4 rounded-2xl border border-orange-200/80 bg-orange-50/50 hover:bg-orange-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center font-bold">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100/60 px-2 py-0.5 rounded-md">
                8. Logout
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
              Logout?
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Session termination prompt with Logout & Cancel buttons.
            </p>
          </button>

          {/* 9. Loading */}
          <button
            type="button"
            onClick={() => {
              showLoadingModal('Please wait…', 'Processing your request securely with WepSun Cloud Services.');
              setTimeout(() => {
                hideLoadingModal();
                showSuccessModal('Operation Complete', 'Your request was processed successfully.');
              }, 2200);
            }}
            className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 hover:bg-blue-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[#0066FF] flex items-center justify-center font-bold">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] bg-blue-100/60 px-2 py-0.5 rounded-md">
                9. Loading
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors">
              Please wait…
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Minimal animated logo spinner with auto-completion demo.
            </p>
          </button>

          {/* 10. Information / Update */}
          <button
            type="button"
            onClick={() => showUpdateModal('New Update Available', 'A new feature or service update is available for WepSun Engineering Solution.')}
            className="p-4 rounded-2xl border border-sky-200/80 bg-sky-50/50 hover:bg-sky-50 text-left transition-all duration-200 hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100/80 text-[#0066FF] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] bg-sky-100/60 px-2 py-0.5 rounded-md">
                10. Release
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors">
              New Update
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Feature announcement with View Details & Later options.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

