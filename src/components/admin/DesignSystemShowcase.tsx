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
} from 'lucide-react';
import { WepsunLogo } from '../common/WepsunLogo';
import { WepsunSplashAnimation } from '../common/WepsunSplashAnimation';

export const DesignSystemShowcase: React.FC = () => {
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
    </div>
  );
};
