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
  Type,
  Hash,
  Binary,
  Cpu,
  Info,
  Check,
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

      {/* ========================================================================= */}
      {/* 3. WEPSUN CORPORATE TYPOGRAPHY SYSTEM */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1976D2] flex items-center justify-center font-bold">
                <Type className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Corporate Typography System
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-normal leading-relaxed">
              Clean, high-precision corporate sans-serif typography built for engineering, elevator IoT telemetry, field service management, and client dashboards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-900 text-white text-[11px] font-mono font-semibold rounded-xl">
              Inter Primary
            </span>
            <span className="px-3 py-1 bg-blue-50 text-[#1976D2] text-[11px] font-semibold rounded-xl border border-blue-100">
              ISO 9001 Identity
            </span>
          </div>
        </div>

        {/* Brand Typography Identity Banner */}
        <div className="bg-gradient-to-r from-[#0E2238] via-[#123B5D] to-[#0A1828] text-white rounded-2xl p-5 sm:p-6 shadow-inner relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-sky-300 font-semibold">
              Corporate Identity Principle
            </span>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
              WEPSUN = Professional • Engineering • Technology • Reliability • Precision
            </h3>
            <p className="text-xs text-slate-300 font-normal">
              Consistent letterforms, tabular technical metrics, disciplined optical spacing, and clean sentence case structure across every screen.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 shrink-0">
            <span className="text-emerald-400">●</span>
            <span className="text-slate-200">OpenType: tnum, cv02, cv03, cv11</span>
          </div>
        </div>

        {/* 3 Font Family Cards (Primary, Corporate Fallback, Technical Monospace) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Primary Font - Inter */}
          <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Primary Brand Font
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">Weights: 300–900</span>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 font-sans tracking-tight">Inter</h4>
              <p className="text-xs text-slate-600 mt-0.5">High-legibility geometric sans-serif engineered for digital interfaces and enterprise software.</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100 font-sans text-xs space-y-1 text-slate-800">
              <div className="font-bold text-sm tracking-tight">Aa Bb Cc Dd Ee Ff Gg 1234567890</div>
              <div className="text-[11px] text-slate-500 font-normal">Regular 400 • Medium 500 • Semi-Bold 600 • Bold 700</div>
            </div>
          </div>

          {/* Card 2: Corporate Fallback - Manrope / Plus Jakarta Sans */}
          <div className="border border-slate-200 bg-slate-50/60 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                Corporate Fallbacks
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">Weights: 400–800</span>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Manrope / Plus Jakarta</h4>
              <p className="text-xs text-slate-600 mt-0.5">Modern, clean industrial neo-grotesque fallbacks maintaining exact proportion balance.</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 text-slate-800">
              <div className="font-bold text-sm tracking-tight">Aa Bb Cc Dd Ee Ff Gg 1234567890</div>
              <div className="text-[11px] text-slate-500 font-normal">Modern corporate aesthetics with open apertures</div>
            </div>
          </div>

          {/* Card 3: Technical Monospace - JetBrains Mono */}
          <div className="border border-teal-200 bg-teal-50/30 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Equipment & Telemetry
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">Weights: 400–700</span>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 font-mono tracking-tight">JetBrains Mono</h4>
              <p className="text-xs text-slate-600 mt-0.5">Monospaced font designed for elevator serial numbers, IoT sensor metrics, and currency.</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-teal-100 font-mono text-xs space-y-1 text-slate-800">
              <div className="font-bold text-sm">SN-9820-ELEV ₹ 1,45,000 1.75m/s</div>
              <div className="text-[11px] text-slate-500 font-medium">Tabular alignment • Zero slash disambiguation</div>
            </div>
          </div>
        </div>

        {/* Typographic Hierarchy Scale & Usage Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Standardized Typographic Hierarchy & Specifications
            </span>
            <span className="text-[11px] text-slate-500 font-mono">6 Scale Levels</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Level 1: App Major Headings */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="md:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold font-mono">H1 / Hero</span>
                  <span className="font-bold text-slate-900 text-sm">Major Headings & Titles</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Font: Inter • Bold 700 • tracking-tight (-0.028em) • leading-tight (1.15)
                </div>
              </div>
              <div className="md:w-2/3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Smart Lift Service Operations Portal
                </h1>
              </div>
            </div>

            {/* Level 2: Section Headings */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="md:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold font-mono">H2 / Section</span>
                  <span className="font-bold text-slate-900 text-sm">Section Headings</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Font: Inter • Semi-Bold 600 • tracking-tight (-0.016em) • leading-snug (1.32)
                </div>
              </div>
              <div className="md:w-2/3">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
                  Registered Elevator Fleet & Preventive Maintenance
                </h2>
              </div>
            </div>

            {/* Level 3: Card / Sub-section Titles */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="md:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-[10px] font-bold font-mono">H3 / Card</span>
                  <span className="font-bold text-slate-900 text-sm">Card & Component Titles</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Font: Inter • Semi-Bold 600 • text-sm/base • leading-snug
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                  Elevator Spec Sheet #ELEV-001 — Passenger Unit A
                </h3>
              </div>
            </div>

            {/* Level 4: Body Text */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="md:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-bold font-mono">Body / Text</span>
                  <span className="font-bold text-slate-900 text-sm">Body & Explanatory Text</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Font: Inter • Regular 400 • leading-relaxed (1.6) • Avoid thin text
                </div>
              </div>
              <div className="md:w-2/3">
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Regular routine maintenance ensures consistent passenger safety and reduces long-term machine wear. Field service reports are signed digitally upon completion of each inspection.
                </p>
              </div>
            </div>

            {/* Level 5: Labels & Badges */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="md:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold font-mono">Labels / Tags</span>
                  <span className="font-bold text-slate-900 text-sm">Labels, Meta & Status Tags</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Font: Inter • Medium 500 • Compact, clean & crisp
                </div>
              </div>
              <div className="md:w-2/3 flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-medium text-slate-600">Equipment Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                  Fully Operational
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-medium">
                  Comprehensive AMC
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium">
                  Inspection Due Soon
                </span>
              </div>
            </div>

            {/* Level 6: Buttons & Action Items */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="md:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold font-mono">Buttons</span>
                  <span className="font-bold text-slate-900 text-sm">Interactive Buttons</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Font: Inter • Semi-Bold 600 • Sentence Case (Not ALL CAPS)
                </div>
              </div>
              <div className="md:w-2/3 flex items-center gap-3 flex-wrap">
                <button className="px-4 py-2 rounded-xl bg-[#1976D2] text-white text-xs font-semibold shadow-xs">
                  Request Service Visit
                </button>
                <button className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
                  Download Job Card
                </button>
                <button className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white text-xs font-semibold shadow-xs">
                  Emergency Breakdown SOS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Data & Elevator Telemetry Showcase */}
        <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Technical Data & Tabular Numerics Demonstration
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              font-variant-numeric: tabular-nums
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block">Rated Capacity</span>
              <span className="font-mono text-sm font-bold text-slate-900 block tabular-nums">1000 kg</span>
              <span className="text-[10px] text-slate-400 font-medium">13 Passengers</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block">Operating Speed</span>
              <span className="font-mono text-sm font-bold text-slate-900 block tabular-nums">1.75 m/s</span>
              <span className="text-[10px] text-slate-400 font-medium">Gearless VVVF</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block">Travel Height</span>
              <span className="font-mono text-sm font-bold text-slate-900 block tabular-nums">48.50 m</span>
              <span className="text-[10px] text-slate-400 font-medium">G + 14 Floors</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block">Motor Output</span>
              <span className="font-mono text-sm font-bold text-slate-900 block tabular-nums">11.50 kW</span>
              <span className="text-[10px] text-slate-400 font-medium">415V 3-Phase</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block">Trips Completed</span>
              <span className="font-mono text-sm font-bold text-emerald-700 block tabular-nums">1,284,930</span>
              <span className="text-[10px] text-slate-400 font-medium">99.98% Uptime</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-medium block">Serial Number</span>
              <span className="font-mono text-xs font-bold text-blue-700 block truncate">SN-2026-IND-049</span>
              <span className="text-[10px] text-slate-400 font-medium">Cortex-M7 IoT</span>
            </div>
          </div>
        </div>

        {/* Engineering Guidelines Checklist (Dos & Don'ts) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Typography Rules</span>
            </h4>
            <ul className="space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Use <strong>Inter</strong> as primary font with Manrope / Plus Jakarta Sans fallbacks.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Use <strong>Sentence case</strong> for buttons and content (e.g. &quot;Submit Service Report&quot;).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Tighter letter spacing for headings (<code>tracking-tight</code>) and relaxed line height for body (<code>leading-relaxed</code>).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Use tabular monospaced numbers (<code>font-mono tabular-nums</code>) for measurements, currencies, and serial numbers.</span>
              </li>
            </ul>
          </div>

          <div className="border border-rose-200 bg-rose-50/40 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Typography Prohibitions & Anti-Patterns</span>
            </h4>
            <ul className="space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">✗</span>
                <span><strong>No decorative, cartoon, gaming, or handwritten fonts</strong>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">✗</span>
                <span><strong>Avoid excessively thin text</strong> (e.g. font-thin / font-extralight) to preserve readability.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">✗</span>
                <span><strong>Avoid excessive ALL CAPS</strong>; reserve uppercase only for micro badges/tags.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">✗</span>
                <span><strong>Avoid excessive italic text</strong>; preserve clean vertical letterforms for technical credibility.</span>
              </li>
            </ul>
          </div>
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

