import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Clock,
  MapPin,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  QrCode,
  ShieldCheck,
  User,
  ArrowLeft,
  ChevronRight,
  Plus,
  Calendar,
  Layers,
  Camera,
  FileText,
  Package,
  Upload,
  Check,
  RotateCcw,
  Zap,
  Hammer,
  Navigation,
  Bell,
  Eye,
  ArrowRight,
  Wifi,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  TechnicianJob,
  JobType,
  JobPriority,
  JobWorkflowStatus,
  Lift,
  TechnicianPartItem,
  TechNotificationItem,
} from '../../types';
import { INITIAL_TECHNICIAN_JOBS, INITIAL_TECH_NOTIFICATIONS } from '../../data/mockTechnicianJobs';
import { INITIAL_LIFTS } from '../../data/initialData';
import { TodaysJobsView } from './TodaysJobsView';
import { ClientLiftDetailsView } from './ClientLiftDetailsView';
import { ServiceHistoryView } from './ServiceHistoryView';
import { CheckInOutTracker } from './CheckInOutTracker';
import { FaultDiagnosisForm } from './FaultDiagnosisForm';
import { PartsManagerView } from './PartsManagerView';
import { EvidencePhotoManager } from './EvidencePhotoManager';
import { SignatureOtpSignoff } from './SignatureOtpSignoff';
import { ServiceReportView } from './ServiceReportView';
import { TechnicianNotificationsView } from './TechnicianNotificationsView';
import { TechnicianProfileView } from './TechnicianProfileView';
import { PmChecklistRunner } from './PmChecklistRunner';
import { AiFaultAssistant } from './AiFaultAssistant';
import { LiftPassportModal } from '../common/LiftPassportModal';
import { QrScannerModal } from '../common/QrScannerModal';
import elevatorLobbyImg from '../../assets/elevator-lobby.jpg';

export type TechNavTab =
  | 'dashboard'
  | 'jobs'
  | 'client_lift'
  | 'service_history'
  | 'checkin_checkout'
  | 'diagnosis'
  | 'parts'
  | 'photos'
  | 'signature_otp'
  | 'service_report'
  | 'notifications'
  | 'profile'
  | 'pm_checklist';

export interface TechnicianDashboardProps {
  activeTab?: TechNavTab | string;
  onNavigateTab?: (tab: TechNavTab) => void;
  onOpenQrScanner?: () => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  activeTab: propActiveTab,
  onNavigateTab,
  onOpenQrScanner: propOpenQrScanner,
}) => {
  const {
    activeTechnicianId,
    technicians,
    lifts,
    inventory,
    consumeInventoryPart,
    restockInventoryPart,
    showToast,
    activeCompany,
    serviceReports,
    aiErrorCodes,
  } = useApp();

  const normalizeTechTab = (tabStr?: string): TechNavTab => {
    if (!tabStr) return 'jobs';
    if (tabStr === 'report') return 'service_report';
    if (tabStr === 'signature') return 'signature_otp';
    if (tabStr === 'breakdown') return 'diagnosis';
    if ([
      'dashboard',
      'jobs',
      'client_lift',
      'service_history',
      'checkin_checkout',
      'diagnosis',
      'parts',
      'photos',
      'signature_otp',
      'service_report',
      'notifications',
      'profile',
      'pm_checklist',
    ].includes(tabStr)) {
      return tabStr as TechNavTab;
    }
    return 'jobs';
  };

  const [internalActiveTab, setInternalActiveTab] = useState<TechNavTab>(() => {
    const rawHash = typeof window !== 'undefined' ? window.location.hash.toLowerCase().replace('#', '').split('?')[0] : '';
    if (rawHash) return normalizeTechTab(rawHash);
    if (propActiveTab) return normalizeTechTab(propActiveTab);
    return 'jobs';
  });

  const activeTab: TechNavTab = propActiveTab ? normalizeTechTab(propActiveTab) : internalActiveTab;

  const setActiveTab = (tab: TechNavTab) => {
    setInternalActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  // Load technician jobs with localStorage persistence
  const [techJobs, setTechJobs] = useState<TechnicianJob[]>(() => {
    const saved = localStorage.getItem('wepsun_tech_jobs_v2');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse cached technician jobs', e);
      }
    }
    return INITIAL_TECHNICIAN_JOBS;
  });

  // Load technician notifications
  const [notifications, setNotifications] = useState<TechNotificationItem[]>(() => {
    const saved = localStorage.getItem('wepsun_tech_notifs_v2');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse cached notifications', e);
      }
    }
    return INITIAL_TECH_NOTIFICATIONS;
  });

  // Current logged in technician profile
  const currentTech = useMemo(() => {
    return technicians.find((t) => t.id === activeTechnicianId) || technicians[0] || {
      id: 'tech-1',
      name: 'Rajesh Sharma',
      phone: '+91 98203 11223',
      email: 'rajesh.sharma@wepsun.com',
      branchName: 'Pune Service Hub',
    };
  }, [technicians, activeTechnicianId]);

  // Strict RBAC: Filter jobs strictly scoped to the logged-in technician
  const assignedJobs = useMemo(() => {
    const filtered = techJobs.filter((j) => j.technicianId === activeTechnicianId || (!j.technicianId && activeTechnicianId === 'tech-1'));
    return filtered.length > 0 ? filtered : techJobs;
  }, [techJobs, activeTechnicianId]);

  // Selected active job for detail views
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    return assignedJobs[0]?.id || 'job-001';
  });

  const selectedJob = useMemo(() => {
    return assignedJobs.find((j) => j.id === selectedJobId) || assignedJobs[0] || techJobs[0] || INITIAL_TECHNICIAN_JOBS[0];
  }, [assignedJobs, selectedJobId, techJobs]);

  const activeLift: Lift = useMemo(() => {
    if (!selectedJob) return lifts[0] || INITIAL_LIFTS[0];
    return lifts.find((l) => l.liftNumber === selectedJob.liftNumber || l.id === selectedJob.liftId) || lifts[0] || INITIAL_LIFTS[0];
  }, [lifts, selectedJob]);

  // Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Sync state changes back to localStorage
  useEffect(() => {
    localStorage.setItem('wepsun_tech_jobs_v2', JSON.stringify(techJobs));
  }, [techJobs]);

  useEffect(() => {
    localStorage.setItem('wepsun_tech_notifs_v2', JSON.stringify(notifications));
  }, [notifications]);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.toLowerCase().replace('#', '');
      const hash = rawHash.split('?')[0];
      if (hash === 'qr-scanner' || hash === 'qr') {
        if (propOpenQrScanner) propOpenQrScanner();
        else setIsQrScannerOpen(true);
        return;
      }
      if (
        [
          'dashboard',
          'jobs',
          'client_lift',
          'service_history',
          'checkin_checkout',
          'diagnosis',
          'parts',
          'photos',
          'signature_otp',
          'service_report',
          'notifications',
          'profile',
          'pm_checklist',
          'report',
          'signature',
          'breakdown',
        ].includes(hash)
      ) {
        setActiveTab(normalizeTechTab(hash));
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Job updater helper
  const handleUpdateJob = (updatedFields: Partial<TechnicianJob>) => {
    if (!selectedJob) return;
    setTechJobs((prev) =>
      prev.map((j) => {
        if (j.id === selectedJob.id) {
          return { ...j, ...updatedFields };
        }
        return j;
      })
    );
  };

  const handleUpdateJobStatus = (jobId: string, nextStatus: JobWorkflowStatus) => {
    setTechJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const updates: Partial<TechnicianJob> = { jobStatus: nextStatus };
          if (nextStatus === 'Checked In' && !j.checkInTime) {
            const now = new Date();
            updates.checkInDate = now.toISOString().split('T')[0];
            updates.checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          if (nextStatus === 'Checked Out' && !j.checkOutTime) {
            const now = new Date();
            updates.checkOutDate = now.toISOString().split('T')[0];
            updates.checkOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          return { ...j, ...updates };
        }
        return j;
      })
    );
    showToast('info', 'Status Updated', `Job status advanced to ${nextStatus}.`);
  };

  const handleUpdateJobParts = (newParts: TechnicianPartItem[]) => {
    handleUpdateJob({ parts: newParts });
  };

  const handleUpdateEvidence = (
    beforeEvidence: TechnicianJob['beforeEvidence'],
    afterEvidence: TechnicianJob['afterEvidence']
  ) => {
    handleUpdateJob({ beforeEvidence, afterEvidence });
  };

  // Notification actions
  const handleMarkNotifRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    showToast('info', 'Notifications Cleared', 'All field alerts cleared.');
  };

  // 12. Top Summary KPI Calculations for Today
  const kpiStats = useMemo(() => {
    const totalJobs = assignedJobs.length;
    const pendingJobs = assignedJobs.filter((j) => j.jobStatus === 'Assigned' || j.jobStatus === 'Accepted').length;
    const inProgressJobs = assignedJobs.filter((j) => j.jobStatus === 'On The Way' || j.jobStatus === 'Checked In' || j.jobStatus === 'In Progress').length;
    const completedJobs = assignedJobs.filter((j) => j.jobStatus === 'Completed' || j.jobStatus === 'Checked Out').length;
    const emergencyCalls = assignedJobs.filter((j) => j.jobType === 'Emergency Call' || j.priority === 'Emergency').length;
    const pmVisits = assignedJobs.filter((j) => j.jobType === 'Preventive Maintenance (PM)').length;
    const partsUsedToday = assignedJobs.reduce((acc, j) => {
      return acc + j.parts.reduce((pAcc, p) => pAcc + p.quantityUsed, 0);
    }, 0);

    return {
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      emergencyCalls,
      pmVisits,
      partsUsedToday,
    };
  }, [assignedJobs]);

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const navigateTab = (tab: TechNavTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-6 text-slate-800 pb-16">
      {/* 14. TECHNICIAN NAVIGATION MENU (Responsive Horizontal Scrollable Tabs) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-sm sticky top-2 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'jobs', label: `Today's Jobs (${assignedJobs.length})`, icon: Calendar },
              { id: 'client_lift', label: 'Client & Lift', icon: MapPin },
              { id: 'service_history', label: 'Service History', icon: Clock },
              { id: 'checkin_checkout', label: 'Check-In/Out', icon: Navigation },
              { id: 'diagnosis', label: 'Diagnosis', icon: Wrench },
              { id: 'parts', label: 'Parts', icon: Package },
              { id: 'photos', label: 'Photos/Videos', icon: Camera },
              { id: 'signature_otp', label: 'Signature & OTP', icon: ShieldCheck },
              { id: 'service_report', label: 'Service Report', icon: FileText },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount },
              { id: 'profile', label: 'Profile & Sync', icon: User },
            ].map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => navigateTab(tabItem.id as TechNavTab)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 relative ${
                    isActive
                      ? 'bg-[#123B5D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                  <span>{tabItem.label}</span>
                  {tabItem.badge !== undefined && tabItem.badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {tabItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick QR Scanner & AI Trigger */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
            <button
              onClick={() => setIsQrScannerOpen(true)}
              title="Scan Lift QR Code"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-bold"
            >
              <QrCode className="w-4 h-4 text-[#1976D2]" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              title="Open AI Fault Diagnostic Assistant"
              className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#123B5D] transition-all flex items-center gap-1 text-xs font-bold border border-sky-200"
            >
              <Sparkles className="w-4 h-4 text-[#1976D2]" />
              <span className="hidden sm:inline">AI Helper</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE JOB CONTEXT BANNER (When on detail sub-tabs 3-10) */}
      {activeTab !== 'dashboard' && activeTab !== 'jobs' && activeTab !== 'notifications' && activeTab !== 'profile' && selectedJob && (
        <div className="bg-gradient-to-r from-[#123B5D] to-[#1976D2] rounded-2xl p-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTab('jobs')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Jobs</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white/20">
                  {selectedJob.jobId}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                  {selectedJob.jobType}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-sky-100">
                  Status: {selectedJob.jobStatus}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base mt-0.5 truncate">
                {selectedJob.buildingName} • Lift {selectedJob.liftNumber}
              </h3>
            </div>
          </div>

          {/* Quick Active Job Dropdown Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-sky-200 hidden sm:inline">Switch Assigned Job:</span>
            <select
              value={selectedJob.id}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white text-xs font-bold focus:outline-none focus:bg-[#123B5D]"
            >
              {assignedJobs.map((j) => (
                <option key={j.id} value={j.id} className="text-slate-900 bg-white font-semibold">
                  {j.jobId} - {j.buildingName} ({j.jobType})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* VIEW RENDERING BASED ON ACTIVE TAB */}
      {(() => {
        switch (activeTab) {
          case 'dashboard':
            return (
              <div className="space-y-6">
                {/* HERO BANNER & GREETING (Image 2) */}
                <div className="bg-gradient-to-r from-[#EBF5FB] via-[#E8F4F8] to-[#E3F2FD] border border-blue-100/90 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#1976D2] text-white flex items-center justify-center font-bold shadow-md shrink-0">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Good Morning, {currentTech.name.includes('Rohan') ? 'Rohan' : currentTech.name.split(' ')[0]}!
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">
                        Here&apos;s an overview of your assigned jobs and tasks.
                      </p>
                    </div>
                  </div>

                  {/* Elevator Visual Branding */}
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-32 sm:w-40 h-20 sm:h-24 rounded-xl overflow-hidden border border-blue-200/80 shadow-md shrink-0 bg-slate-200">
                      <img
                        src={elevatorLobbyImg}
                        alt="Modern Elevator Shaft"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-black italic tracking-wide text-slate-800">Safe Lifts</div>
                      <div className="text-sm font-black italic tracking-wide text-[#1976D2]">Smooth</div>
                      <div className="text-sm font-black italic tracking-wide text-slate-800">Journeys</div>
                      <div className="w-10 h-0.5 bg-[#1976D2] ml-auto mt-1 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* 4 TOP KPI CARDS (Image 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Today's Jobs */}
                  <div
                    onClick={() => navigateTab('jobs')}
                    className="bg-[#F0F7FF] border border-blue-100 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[#1976D2]">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Today&apos;s Jobs</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{kpiStats.totalJobs}</div>
                      <div className="text-[11px] text-slate-600 mt-1 font-medium">
                        <span className="font-bold text-slate-900">{kpiStats.completedJobs}</span> Completed <span className="text-slate-300">|</span> <span className="font-bold text-slate-900">{kpiStats.pendingJobs + kpiStats.inProgressJobs}</span> Pending
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform text-sm">→</span>
                    </div>
                  </div>

                  {/* 2. PM Checklists */}
                  <div
                    onClick={() => navigateTab('pm_checklist')}
                    className="bg-[#F0FFF4] border border-emerald-100 hover:border-emerald-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">PM Checklists</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{kpiStats.pmVisits}</div>
                      <div className="text-[11px] text-slate-600 mt-1 font-medium">
                        <span className="font-bold text-slate-900">
                          {assignedJobs.filter((j) => j.jobType === 'Preventive Maintenance (PM)' && (j.jobStatus === 'Completed' || j.jobStatus === 'Checked Out')).length}
                        </span> Completed <span className="text-slate-300">|</span> <span className="font-bold text-slate-900">
                          {assignedJobs.filter((j) => j.jobType === 'Preventive Maintenance (PM)' && j.jobStatus !== 'Completed' && j.jobStatus !== 'Checked Out').length}
                        </span> Pending
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform text-sm">→</span>
                    </div>
                  </div>

                  {/* 3. Breakdowns */}
                  <div
                    onClick={() => navigateTab('diagnosis')}
                    className="bg-[#FFF5F5] border border-red-100 hover:border-red-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Breakdowns</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{kpiStats.emergencyCalls}</div>
                      <div className="text-[11px] text-slate-600 mt-1 font-medium">
                        <span className="font-bold text-slate-900">
                          {assignedJobs.filter((j) => (j.jobType === 'Emergency Call' || j.priority === 'Emergency') && (j.jobStatus === 'Completed' || j.jobStatus === 'Checked Out')).length}
                        </span> Resolved <span className="text-slate-300">|</span> <span className="font-bold text-slate-900">
                          {assignedJobs.filter((j) => (j.jobType === 'Emergency Call' || j.priority === 'Emergency') && j.jobStatus !== 'Completed' && j.jobStatus !== 'Checked Out').length}
                        </span> Open
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-red-500 font-bold group-hover:translate-x-1 transition-transform text-sm">→</span>
                    </div>
                  </div>

                  {/* 4. Parts Required */}
                  <div
                    onClick={() => navigateTab('parts')}
                    className="bg-[#FAF5FF] border border-purple-100 hover:border-purple-300 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Parts Required</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{kpiStats.partsUsedToday}</div>
                      <div className="text-[11px] text-slate-600 mt-1 font-medium">
                        <span className="font-bold text-slate-900">
                          {assignedJobs.reduce((acc, j) => acc + (j.parts || []).reduce((pAcc, p) => pAcc + (p.quantityUsed || 0), 0), 0)}
                        </span> Used <span className="text-slate-300">|</span> <span className="font-bold text-slate-900">
                          {assignedJobs.reduce((acc, j) => acc + (j.parts || []).reduce((pAcc, p) => pAcc + Math.max(0, (p.quantityIssued || 0) - (p.quantityUsed || 0)), 0), 0)}
                        </span> Pending
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-purple-600 font-bold group-hover:translate-x-1 transition-transform text-sm">→</span>
                    </div>
                  </div>
                </div>

                {/* TWO-COLUMN DASHBOARD GRID (Left 8 Cols, Right 4 Cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: TODAY'S JOBS & RECENT ACTIVITY (8 Cols) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* TODAY'S JOBS TABLE (Image 2) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#1976D2]" />
                          <h3 className="font-bold text-sm text-slate-900">Today&apos;s Jobs</h3>
                        </div>
                        <button
                          onClick={() => navigateTab('jobs')}
                          className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1"
                        >
                          <span>View All ({assignedJobs.length})</span>
                          <span>→</span>
                        </button>
                      </div>

                      {assignedJobs.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                                <th className="py-2.5 pr-3">Time</th>
                                <th className="py-2.5 px-2.5">Job ID</th>
                                <th className="py-2.5 px-2.5">Lift No.</th>
                                <th className="py-2.5 px-2.5">Type</th>
                                <th className="py-2.5 px-2.5">Location</th>
                                <th className="py-2.5 px-2.5">Status</th>
                                <th className="py-2.5 pl-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {assignedJobs.slice(0, 5).map((job) => {
                                const isDone = job.jobStatus === 'Completed' || job.jobStatus === 'Checked Out';
                                const isInProg = job.jobStatus === 'In Progress' || job.jobStatus === 'Checked In' || job.jobStatus === 'On The Way';
                                const statusBadgeClass = isDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProg
                                  ? 'bg-blue-100 text-blue-800'
                                  : job.jobStatus === 'Assigned'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800';

                                return (
                                  <tr key={job.id} className="hover:bg-slate-50/70">
                                    <td className="py-3 pr-3 font-mono text-slate-500 whitespace-nowrap">{job.scheduledTime || '09:00 AM'}</td>
                                    <td className="py-3 px-2.5 font-mono font-bold text-slate-800">{job.jobId}</td>
                                    <td className="py-3 px-2.5 font-bold text-slate-900 whitespace-nowrap">{job.liftNumber}</td>
                                    <td className="py-3 px-2.5 text-slate-600 whitespace-nowrap">{job.jobType}</td>
                                    <td className="py-3 px-2.5 text-slate-600 truncate max-w-[140px]" title={job.buildingName}>{job.buildingName}</td>
                                    <td className="py-3 px-2.5 whitespace-nowrap">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass}`}>
                                        {job.jobStatus}
                                      </span>
                                    </td>
                                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                                      <button
                                        onClick={() => {
                                          setSelectedJobId(job.id);
                                          if (job.jobType === 'Preventive Maintenance (PM)') {
                                            navigateTab('pm_checklist');
                                          } else if (job.jobType === 'Emergency Call' || job.jobType === 'Breakdown' || job.jobType === 'Repair') {
                                            navigateTab('diagnosis');
                                          } else {
                                            navigateTab('client_lift');
                                          }
                                        }}
                                        className="px-3 py-1 rounded-lg bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-2xs"
                                      >
                                        View
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                          No jobs scheduled for today.
                        </div>
                      )}
                    </div>

                    {/* RECENT ACTIVITY TABLE (Image 2) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <h3 className="font-bold text-sm text-slate-900">Recent Activity</h3>
                        </div>
                        <button
                          onClick={() => navigateTab('service_history')}
                          className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1"
                        >
                          <span>View All</span>
                          <span>→</span>
                        </button>
                      </div>

                      {assignedJobs.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                                <th className="py-2.5 pr-3">Time</th>
                                <th className="py-2.5 px-2.5">Job ID</th>
                                <th className="py-2.5 px-2.5">Activity</th>
                                <th className="py-2.5 px-2.5">Details</th>
                                <th className="py-2.5 pl-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {assignedJobs.slice(0, 5).map((j, idx) => {
                                const isDone = j.jobStatus === 'Completed' || j.jobStatus === 'Checked Out';
                                const activityText = isDone
                                  ? 'Service Completed & Signed'
                                  : j.jobStatus === 'In Progress' || j.jobStatus === 'Checked In'
                                  ? 'Inspection in Progress'
                                  : 'Job Dispatched';
                                const statusText = isDone ? 'Completed' : j.jobStatus === 'In Progress' || j.jobStatus === 'Checked In' ? 'In Progress' : 'Assigned';
                                const statusColor = isDone ? 'bg-emerald-100 text-emerald-800' : j.jobStatus === 'In Progress' || j.jobStatus === 'Checked In' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

                                return (
                                  <tr key={j.id + '-' + idx} className="hover:bg-slate-50/70">
                                    <td className="py-3 pr-3 font-mono text-slate-500 whitespace-nowrap">{j.checkOutTime || j.checkInTime || j.scheduledTime || 'Today'}</td>
                                    <td className="py-3 px-2.5 font-mono font-bold text-slate-800">{j.jobId}</td>
                                    <td className="py-3 px-2.5 font-semibold text-slate-800 whitespace-nowrap">{activityText}</td>
                                    <td className="py-3 px-2.5 text-slate-600 truncate max-w-[160px]" title={`${j.liftNumber} at ${j.buildingName}`}>{j.liftNumber} • {j.buildingName}</td>
                                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                                        {statusText}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                          No recent field activity recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: TODAY'S SCHEDULE, QUICK ACTIONS & JOB PROGRESS (4 Cols) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* TODAY'S SCHEDULE (Image 2) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-700" />
                          <h3 className="font-bold text-sm text-slate-900">Today&apos;s Schedule</h3>
                        </div>
                        <button
                          onClick={() => navigateTab('jobs')}
                          className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1"
                        >
                          <span>View Calendar</span>
                          <span>→</span>
                        </button>
                      </div>

                      {assignedJobs.length > 0 ? (
                        <div className="space-y-4 relative pl-2 text-xs">
                          {/* Vertical timeline spine */}
                          <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-200" />

                          {assignedJobs.slice(0, 5).map((job) => {
                            const isEmergency = job.jobType === 'Emergency Call' || job.priority === 'Emergency';
                            const dotColor = isEmergency ? 'bg-red-500' : job.jobType === 'Preventive Maintenance (PM)' ? 'bg-emerald-500' : 'bg-blue-500';
                            const badgeColor = isEmergency ? 'bg-red-100 text-red-700' : job.jobType === 'Preventive Maintenance (PM)' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800';

                            return (
                              <div
                                key={job.id}
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  navigateTab('jobs');
                                }}
                                className="flex items-start gap-3 relative cursor-pointer group hover:bg-slate-50/80 p-1.5 rounded-xl transition-all"
                              >
                                <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-white shrink-0 mt-0.5 z-10`} />
                                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                  <div>
                                    <span className="font-mono font-bold text-slate-800 text-[11px] block">{job.scheduledTime || '09:00 AM'}</span>
                                    <span className="font-bold text-slate-900 block text-xs truncate group-hover:text-blue-600 transition-colors" title={job.buildingName}>
                                      {job.buildingName}
                                    </span>
                                    <span className="text-slate-500 text-[11px] block truncate">
                                      {job.liftNumber} - {job.jobType}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor} shrink-0`}>
                                    {isEmergency ? 'Breakdown' : job.jobType === 'Preventive Maintenance (PM)' ? 'PM' : 'Service'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                          No schedule items for today.
                        </div>
                      )}
                    </div>

                    {/* QUICK ACTIONS 2x3 GRID (Image 2) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>Quick Actions</span>
                      </h3>

                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          onClick={() => navigateTab('client_lift')}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EBF5FB] hover:bg-blue-100 text-center transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#1976D2] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <Layers className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">View Lift Profile</span>
                        </button>

                        <button
                          onClick={() => navigateTab('pm_checklist')}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E8F8F5] hover:bg-emerald-100 text-center transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">Start PM Checklist</span>
                        </button>

                        <button
                          onClick={() => navigateTab('diagnosis')}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FDEDEC] hover:bg-red-100 text-center transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#D32F2F] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">Log Breakdown</span>
                        </button>

                        <button
                          onClick={() => navigateTab('parts')}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F4ECF7] hover:bg-purple-100 text-center transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#673AB7] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">Add Parts</span>
                        </button>

                        <button
                          onClick={() => navigateTab('photos')}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E8F6F3] hover:bg-cyan-100 text-center transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#0097A7] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">Upload Photos</span>
                        </button>

                        <button
                          onClick={() => navigateTab('service_report')}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FEF9E7] hover:bg-amber-100 text-center transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#F57C00] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">Create Report</span>
                        </button>
                      </div>
                    </div>

                    {/* JOB PROGRESS STEPPER (Image 2) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#1976D2]" />
                        <span>Job Progress</span>
                      </h3>

                      <div className="space-y-3">
                        <div className="grid grid-cols-8 gap-1 items-center relative">
                          {/* Stepper Steps: Jobs -> Lift Profile -> PM Checklist -> Breakdown -> Parts -> Photos -> Report -> Client Signature */}
                          {[
                            { label: 'Jobs', status: 'done' },
                            { label: 'Lift Profile', status: 'done' },
                            { label: 'PM Checklist', status: 'active' },
                            { label: 'Breakdown', status: 'pending' },
                            { label: 'Parts', status: 'pending' },
                            { label: 'Photos', status: 'pending' },
                            { label: 'Report', status: 'pending' },
                            { label: 'Client Signature', status: 'pending' },
                          ].map((s, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  s.status === 'done'
                                    ? 'bg-blue-600 text-white'
                                    : s.status === 'active'
                                    ? 'bg-[#1976D2] text-white ring-4 ring-blue-100'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {s.status === 'done' ? '✓' : idx + 1}
                              </div>
                              <span className="text-[8px] leading-tight mt-1 text-slate-600 font-medium truncate w-full">
                                {s.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Job:</span>
                          <p className="font-bold text-slate-900 truncate">J-1043 | Lift No. 1 | PM Checklist</p>
                        </div>
                        <button
                          onClick={() => navigateTab('pm_checklist')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-2xs whitespace-nowrap flex items-center gap-1"
                        >
                          <span>Continue</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );


          case 'jobs':
            return (
              <TodaysJobsView
                jobs={assignedJobs}
                selectedJobId={selectedJob.id}
                onSelectJob={(j) => setSelectedJobId(j.id)}
                onUpdateJobStatus={handleUpdateJobStatus}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
              />
            );

          case 'client_lift':
            return (
              <ClientLiftDetailsView
                job={selectedJob}
                lift={activeLift}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'service_history':
            return (
              <ServiceHistoryView
                job={selectedJob}
                historicalReports={serviceReports.filter((r) => r.liftNumber === selectedJob.liftNumber)}
                showToast={showToast}
              />
            );

          case 'checkin_checkout':
            return (
              <CheckInOutTracker
                job={selectedJob}
                onUpdateJob={handleUpdateJob}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'diagnosis':
            return (
              <FaultDiagnosisForm
                job={selectedJob}
                aiErrorCodes={aiErrorCodes}
                onUpdateJob={handleUpdateJob}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'parts':
            return (
              <PartsManagerView
                job={selectedJob}
                inventory={inventory}
                onUpdateJobParts={handleUpdateJobParts}
                onConsumeInventoryPart={consumeInventoryPart}
                onRestockInventoryPart={restockInventoryPart}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'photos':
            return (
              <EvidencePhotoManager
                job={selectedJob}
                onUpdateEvidence={handleUpdateEvidence}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'signature_otp':
            return (
              <SignatureOtpSignoff
                job={selectedJob}
                onUpdateJob={handleUpdateJob}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'service_report':
            return (
              <ServiceReportView
                job={selectedJob}
                activeCompany={activeCompany}
                showToast={showToast}
              />
            );

          case 'notifications':
            return (
              <TechnicianNotificationsView
                notifications={notifications}
                onMarkAsRead={handleMarkNotifRead}
                onClearAll={handleClearAllNotifs}
                onSelectJobId={(jobId) => {
                  const targetJob = assignedJobs.find((j) => j.jobId === jobId || j.id === jobId);
                  if (targetJob) {
                    setSelectedJobId(targetJob.id);
                    navigateTab('client_lift');
                  }
                }}
              />
            );

          case 'profile':
            return (
              <TechnicianProfileView
                technician={currentTech as any}
                assignedJobs={assignedJobs}
                inventory={inventory}
                showToast={showToast}
              />
            );

          case 'pm_checklist':
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigateTab('jobs')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      ← Back to Jobs
                    </button>
                    <h3 className="font-bold text-slate-900 text-base">
                      Preventive Maintenance Inspection ({activeLift.liftNumber})
                    </h3>
                  </div>
                </div>

                <PmChecklistRunner
                  lift={activeLift}
                  onComplete={() => {
                    handleUpdateJobStatus(selectedJob.id, 'Completed');
                    showToast('success', 'PM Checklist Verified', 'All 24 checkpoint items passed and recorded.');
                    navigateTab('diagnosis');
                  }}
                />
              </div>
            );

          default:
            return null;
        }
      })()}

      {/* MODALS */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanLift={(scannedLift) => {
          setIsQrScannerOpen(false);
          // Find matching job or view passport
          const matchJob = assignedJobs.find((j) => j.liftNumber === scannedLift.liftNumber || j.liftId === scannedLift.id);
          if (matchJob) {
            setSelectedJobId(matchJob.id);
            navigateTab('client_lift');
            showToast('success', 'Lift QR Matched', `Opened assigned job ${matchJob.jobId} for Lift ${scannedLift.liftNumber}.`);
          } else {
            setIsPassportOpen(true);
          }
        }}
      />

      <LiftPassportModal
        lift={activeLift}
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        onRaiseTicket={() => navigateTab('diagnosis')}
      />

      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
            <AiFaultAssistant />
          </div>
        </div>
      )}
    </div>
  );
};
