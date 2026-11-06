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
  LogOut,
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
  ServiceReport,
} from '../../types';
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
import { TechnicianCreateQuotationModal } from './TechnicianCreateQuotationModal';
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
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  activeTab: propActiveTab,
  onNavigateTab,
}) => {
  const {
    activeTechnicianId,
    currentUser,
    technicians,
    lifts,
    complaints,
    workOrders,
    updateWorkOrderStatus,
    updateComplaintStatus,
    checkInJob,
    completeJobAndGenerateReport,
    inventory,
    consumeInventoryPart,
    restockInventoryPart,
    showToast,
    activeCompany,
    serviceReports,
    aiErrorCodes,
    notifications: appNotifications,
    markNotificationRead,
    deleteNotification,
    showLogoutModal,
    logout,
  } = useApp();

  // Clear obsolete mock technician storage
  useEffect(() => {
    try {
      localStorage.removeItem('wepsun_tech_jobs_v2');
      localStorage.removeItem('wepsun_tech_notifs_v2');
    } catch {}
  }, []);

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

  // Current logged in technician profile
  const currentTech = useMemo(() => {
    const matched = technicians.find(
      (t) =>
        t.id === activeTechnicianId ||
        t.email === currentUser?.email ||
        (t as any).userId === currentUser?.id ||
        t.id === currentUser?.technicianId
    );
    if (matched) return matched;
    if (currentUser && (currentUser.role === 'technician' || currentUser.technicianId)) {
      return {
        id: currentUser.technicianId || currentUser.id,
        name: currentUser.name || 'Field Engineer',
        phone: currentUser.phone || '+91 85959 40077',
        email: currentUser.email || '',
        branchName: 'Service Hub',
        employeeCode: 'TECH-WPS-LIVE',
        currentStatus: 'available' as const,
        zone: 'Operational Zone',
      };
    }
    return (
      technicians[0] || {
        id: activeTechnicianId || 'tech-field',
        name: currentUser?.name || 'Field Technician',
        phone: currentUser?.phone || '+91 85959 40077',
        email: currentUser?.email || '',
        branchName: 'Service Hub',
        employeeCode: 'TECH-WPS-LIVE',
        currentStatus: 'available' as const,
        zone: 'Operational Zone',
      }
    );
  }, [technicians, activeTechnicianId, currentUser]);

  const effectiveTechId = useMemo(() => {
    if (activeTechnicianId) return activeTechnicianId;
    if (currentUser?.technicianId) return currentUser.technicianId;
    if (currentTech?.id) return currentTech.id;
    if (currentUser?.role === 'technician') return currentUser.id;
    return technicians[0]?.id || '';
  }, [activeTechnicianId, currentUser, currentTech, technicians]);

  // Dynamic conversion: Map live complaints assigned by Admin into TechnicianJob records
  const liveComplaintJobs = useMemo(() => {
    const relevantComplaints = complaints.filter((c) => {
      if (c.status === 'archived' || c.isArchived) return false;
      if (effectiveTechId) {
        if (c.assignedTechnicianId === effectiveTechId) return true;
        if (currentUser?.id && c.assignedTechnicianId === currentUser.id) return true;
        if (currentTech?.name && c.assignedTechnicianName && c.assignedTechnicianName.toLowerCase() === currentTech.name.toLowerCase()) return true;
      }
      if (currentUser?.role === 'technician' && !c.assignedTechnicianId) {
        return true;
      }
      if (!effectiveTechId) {
        return !!(c.assignedTechnicianId || c.status === 'assigned' || c.status === 'technician_on_way' || c.status === 'inspection_repair');
      }
      return false;
    });

    return relevantComplaints.map((c): TechnicianJob => {
      let mappedStatus: JobWorkflowStatus = 'Assigned';
      if (c.status === 'accepted') mappedStatus = 'Accepted';
      else if (c.status === 'technician_on_way' || c.status === 'en_route') mappedStatus = 'On The Way';
      else if (c.status === 'inspection_repair' || c.status === 'in_progress' || c.status === 'arrived') {
        mappedStatus = c.checkInTime ? 'In Progress' : 'Checked In';
      } else if (c.status === 'resolved') mappedStatus = 'Completed';
      else if (c.status === 'closed') mappedStatus = 'Checked Out';

      const jobPriority: JobPriority =
        c.priority === 'critical' || c.isEmergency ? 'Emergency' : c.priority === 'high' ? 'High' : 'Medium';

      return {
        id: c.id,
        jobId: c.ticketNumber,
        jobType: c.isEmergency ? 'Emergency Call' : 'Breakdown',
        priority: jobPriority,
        clientName: c.clientName || 'Client Society',
        clientId: c.clientId || '',
        contactPerson: c.clientName || 'Site Representative',
        clientPhone: c.clientPhone || '+91 85959 40077',
        clientEmail: c.clientEmail || '',
        serviceAddress: c.buildingName || 'Building Complex',
        buildingName: c.buildingName || 'Building Complex',
        buildingId: c.buildingId || '',
        liftId: c.liftId,
        liftNumber: c.liftNumber,
        locationDetails: `${c.buildingName || 'Building'} - ${c.liftNumber}`,
        scheduledDate: c.reportedAt ? c.reportedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        scheduledTime: c.technicianEta || 'Within 45 mins',
        jobStatus: mappedStatus,
        estimatedDuration: '45 mins',
        assignedBy: 'Control Room Dispatch',
        assignedAt: c.assignedAt || c.reportedAt || new Date().toISOString(),
        technicianId: c.assignedTechnicianId || effectiveTechId || '',
        technicianName: c.assignedTechnicianName || currentTech.name,
        checkInDate: c.checkInTime ? c.checkInTime.split('T')[0] : undefined,
        checkInTime: c.checkInTime ? new Date(c.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        checkOutDate: c.closedAt ? c.closedAt.split('T')[0] : undefined,
        checkOutTime: c.closedAt ? new Date(c.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        complaintReported: `${c.title}${c.description ? ' - ' + c.description : ''}`,
        faultCategory: c.issueType || 'Elevator Breakdown',
        diagnosis: c.diagnosisRemarks,
        workPerformed: c.actionTaken,
        parts: (c.partsReplaced || []).map((p, idx) => ({
          id: `part-comp-${idx}`,
          partId: p.partId,
          partName: p.partName,
          partNumber: p.partNumber,
          category: 'mechanical',
          quantityIssued: p.quantity,
          quantityUsed: p.quantity,
          quantityReturned: 0,
          unitCost: p.unitPrice,
          totalCost: p.totalPrice,
          warranty: '1 Year OEM Warranty',
          reasonForReplacement: 'Component Replacement',
          oldPartCondition: 'Worn Out / Fatigued',
          newPartCondition: 'Brand New (OEM)',
          inventoryReference: c.ticketNumber,
        })),
        beforeEvidence: (c.beforePhotos || []).map((url, i) => ({
          id: `bef-${i}`,
          url,
          description: 'Initial Breakdown State',
          uploadedAt: c.reportedAt || new Date().toISOString(),
          type: 'photo',
        })),
        afterEvidence: (c.afterPhotos || []).map((url, i) => ({
          id: `aft-${i}`,
          url,
          description: 'Rectified Operational State',
          uploadedAt: new Date().toISOString(),
          type: 'photo',
        })),
        clientSignature: c.clientSignature,
        clientNameSigned: c.clientName,
        technicianSignature: c.technicianSignature,
        otpSent: true,
        otpVerified: !!c.clientSignature || c.status === 'resolved' || c.status === 'closed',
        otpVerifiedAt: c.closedAt,
        serviceReportNumber: c.serviceReportId ? `WPS-SR-${c.serviceReportId.slice(-6)}` : undefined,
      };
    });
  }, [complaints, effectiveTechId, currentUser, currentTech]);

  // Dynamic conversion: Map live work orders assigned to technician
  const liveWorkOrderJobs = useMemo(() => {
    const relevantWOs = (workOrders || []).filter((wo) => {
      if (wo.status === 'cancelled') return false;
      if (effectiveTechId) {
        if (wo.technicianId === effectiveTechId || wo.technicianId === currentUser?.id) return true;
        if (currentTech?.name && wo.technicianName && wo.technicianName.toLowerCase() === currentTech.name.toLowerCase()) return true;
      }
      if (currentUser?.role === 'technician' && !wo.technicianId) return true;
      if (!effectiveTechId) return true;
      return false;
    });

    return relevantWOs.map((wo): TechnicianJob => {
      let mappedStatus: JobWorkflowStatus = 'Assigned';
      if (wo.status === 'in_progress') mappedStatus = 'In Progress';
      else if (wo.status === 'completed') mappedStatus = 'Completed';

      const jobType: JobType =
        wo.title?.toLowerCase().includes('pm') || wo.title?.toLowerCase().includes('maintenance')
          ? 'Preventive Maintenance (PM)'
          : wo.priority === 'critical'
          ? 'Emergency Call'
          : 'Repair';

      const priority: JobPriority =
        wo.priority === 'critical' ? 'Emergency' : wo.priority === 'high' ? 'High' : 'Medium';

      return {
        id: wo.id,
        jobId: wo.workOrderNumber,
        jobType,
        priority,
        clientName: wo.clientName || 'Client Complex',
        clientId: wo.clientId || '',
        contactPerson: wo.clientName || 'Site Coordinator',
        clientPhone: '+91 85959 40077',
        clientEmail: '',
        serviceAddress: wo.buildingName || 'Building Premises',
        buildingName: wo.buildingName || 'Building Premises',
        buildingId: '',
        liftId: wo.liftId,
        liftNumber: wo.liftNumber,
        locationDetails: `${wo.buildingName} - ${wo.liftNumber}`,
        scheduledDate: wo.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: '10:00 AM',
        jobStatus: mappedStatus,
        estimatedDuration: `${wo.estimatedHours || 2} hrs`,
        assignedBy: 'Operations Dispatch',
        assignedAt: wo.createdAt || new Date().toISOString(),
        technicianId: wo.technicianId || effectiveTechId || '',
        technicianName: wo.technicianName || currentTech.name,
        complaintReported: wo.title + (wo.description ? ' - ' + wo.description : ''),
        faultCategory: 'Mechanical & Electrical',
        diagnosis: '',
        workPerformed: '',
        parts: [],
        beforeEvidence: [],
        afterEvidence: [],
        otpSent: false,
        otpVerified: wo.status === 'completed',
      };
    });
  }, [workOrders, effectiveTechId, currentUser, currentTech]);

  // Local state for interactive draft adjustments
  const [jobDrafts, setJobDrafts] = useState<Record<string, Partial<TechnicianJob>>>({});

  // Unified Live Assigned Jobs
  const assignedJobs = useMemo(() => {
    const combined = [...liveComplaintJobs];
    const complaintJobIds = new Set(liveComplaintJobs.map((j) => j.id));
    liveWorkOrderJobs.forEach((woJob) => {
      if (!complaintJobIds.has(woJob.id)) {
        combined.push(woJob);
      }
    });

    return combined.map((j) => {
      const draft = jobDrafts[j.id];
      return draft ? { ...j, ...draft } : j;
    });
  }, [liveComplaintJobs, liveWorkOrderJobs, jobDrafts]);

  // Selected active job for detail views
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const selectedJob = useMemo(() => {
    if (!assignedJobs || assignedJobs.length === 0) return null;
    if (selectedJobId) {
      const found = assignedJobs.find((j) => j.id === selectedJobId);
      if (found) return found;
    }
    return assignedJobs[0];
  }, [assignedJobs, selectedJobId]);

  const activeLift: Lift = useMemo(() => {
    if (!selectedJob) return lifts[0];
    return (
      lifts.find((l) => l.liftNumber === selectedJob.liftNumber || l.id === selectedJob.liftId) ||
      lifts[0]
    );
  }, [lifts, selectedJob]);

  // Live Technician Notifications
  const notifications: TechNotificationItem[] = useMemo(() => {
    const filtered = (appNotifications || []).filter((n) => {
      if (n.category === 'technician') return true;
      if (n.type === 'technician_dispatched' || n.type === 'emergency') return true;
      if (effectiveTechId && n.technicianId === effectiveTechId) return true;
      return false;
    });

    return filtered.map((n): TechNotificationItem => {
      const mappedPriority: 'normal' | 'high' | 'urgent' =
        n.priority === 'urgent' || (n.priority as any) === 'critical' ? 'urgent' : n.priority === 'high' ? 'high' : 'normal';

      return {
        id: n.id,
        technicianId: n.technicianId || effectiveTechId || '',
        title: n.title,
        message: n.message,
        timestamp: n.timestamp || new Date().toISOString(),
        isRead: !!n.isRead,
        type: n.type === 'emergency' ? 'emergency_call' : n.type === 'technician_dispatched' ? 'job_assigned' : 'job_reminder',
        priority: mappedPriority,
        jobId: n.ticketNumber || n.referenceId,
      };
    });
  }, [appNotifications, effectiveTechId]);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.toLowerCase().replace('#', '');
      const hash = rawHash.split('?')[0];
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

  // Job updater helper: updates local technician job state and syncs to AppContext complaint
  const handleUpdateJob = (updatedFields: Partial<TechnicianJob>) => {
    if (!selectedJob) return;

    // Check if selectedJob corresponds to a complaint
    const targetComp = complaints.find((c) => c.id === selectedJob.id || c.ticketNumber === selectedJob.jobId);
    if (targetComp) {
      updateComplaintStatus(targetComp.id, targetComp.status, {
        diagnosisRemarks: updatedFields.diagnosis !== undefined ? updatedFields.diagnosis : targetComp.diagnosisRemarks,
        actionTaken: updatedFields.workPerformed !== undefined ? updatedFields.workPerformed : targetComp.actionTaken,
        clientSignature: updatedFields.clientSignature !== undefined ? updatedFields.clientSignature : targetComp.clientSignature,
        technicianSignature: updatedFields.technicianSignature !== undefined ? updatedFields.technicianSignature : targetComp.technicianSignature,
        beforePhotos: updatedFields.beforeEvidence ? updatedFields.beforeEvidence.map((e) => e.url) : targetComp.beforePhotos,
        afterPhotos: updatedFields.afterEvidence ? updatedFields.afterEvidence.map((e) => e.url) : targetComp.afterPhotos,
      });
    }

    setJobDrafts((prev) => ({
      ...prev,
      [selectedJob.id]: {
        ...(prev[selectedJob.id] || {}),
        ...updatedFields,
      },
    }));
  };

  const handleUpdateJobStatus = (jobId: string, nextStatus: JobWorkflowStatus) => {
    // Sync to AppContext complaint status
    const targetComp = complaints.find((c) => c.id === jobId || c.ticketNumber === jobId);
    if (targetComp) {
      if (nextStatus === 'Accepted') {
        updateComplaintStatus(targetComp.id, 'accepted');
      } else if (nextStatus === 'On The Way') {
        updateComplaintStatus(targetComp.id, 'technician_on_way');
      } else if (nextStatus === 'Checked In' || nextStatus === 'In Progress') {
        checkInJob(targetComp.id);
        updateComplaintStatus(targetComp.id, 'inspection_repair', { checkInTime: new Date().toISOString() });
      } else if (nextStatus === 'Completed') {
        updateComplaintStatus(targetComp.id, 'resolved', { resolvedAt: new Date().toISOString() });
      } else if (nextStatus === 'Checked Out') {
        updateComplaintStatus(targetComp.id, 'closed', { closedAt: new Date().toISOString() });
      }
    }

    // Sync to AppContext work order status
    const targetWo = (workOrders || []).find((w) => w.id === jobId || w.workOrderNumber === jobId);
    if (targetWo) {
      if (nextStatus === 'On The Way' || nextStatus === 'Checked In' || nextStatus === 'In Progress') {
        updateWorkOrderStatus(targetWo.id, 'in_progress');
      } else if (nextStatus === 'Completed' || nextStatus === 'Checked Out') {
        updateWorkOrderStatus(targetWo.id, 'completed');
      }
    }

    setJobDrafts((prev) => {
      const existing = prev[jobId] || {};
      const updates: Partial<TechnicianJob> = { jobStatus: nextStatus };
      const now = new Date();
      if (nextStatus === 'Checked In' && !existing.checkInTime) {
        updates.checkInDate = now.toISOString().split('T')[0];
        updates.checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (nextStatus === 'Checked Out' && !existing.checkOutTime) {
        updates.checkOutDate = now.toISOString().split('T')[0];
        updates.checkOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return {
        ...prev,
        [jobId]: { ...existing, ...updates },
      };
    });
    showToast('info', 'Status Updated', `Job status advanced to ${nextStatus}.`);
  };

  // Full integration: Complete job and generate official service report in AppContext
  const handleFinalizeServiceReport = (reportData: ServiceReport) => {
    if (!selectedJob) return;
    completeJobAndGenerateReport(selectedJob.id, {
      diagnosis: selectedJob.diagnosis || 'Elevator defect diagnosed and rectified per safety standards.',
      rootCause: selectedJob.rootCause || 'Operating wear and tear on components.',
      actionTaken: selectedJob.workPerformed || 'Replaced parts, tested safety interlocks, and calibrated ride smoothness.',
      partsReplaced: (selectedJob.parts || []).map((p) => ({
        partId: p.partId,
        partName: p.partName,
        partNumber: p.partNumber,
        quantity: p.quantityUsed,
        unitPrice: p.unitCost,
        totalPrice: p.totalCost,
      })),
      recommendations: selectedJob.recommendations || selectedJob.technicianRemarks || 'Keep landing sills free of dust.',
      liftOperatingStatus:
        selectedJob.liftSafetyStatus === 'Out of Service'
          ? 'Shut Down (Parts Pending)'
          : selectedJob.liftSafetyStatus === 'Temporarily Unsafe'
          ? 'Operational with Observation'
          : 'Fully Operational & Safe',
      beforePhotos: (selectedJob.beforeEvidence || []).map((b) => b.url),
      afterPhotos: (selectedJob.afterEvidence || []).map((a) => a.url),
      technicianSignature: selectedJob.technicianSignature || currentTech.name,
      clientSignature: selectedJob.clientSignature || selectedJob.clientNameSigned || selectedJob.clientName,
      clientOtpVerified: !!selectedJob.otpVerified,
    });

    handleUpdateJobStatus(selectedJob.id, 'Completed');
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
    markNotificationRead(id);
  };

  const handleClearAllNotifs = () => {
    notifications.forEach((n) => deleteNotification(n.id));
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm sticky top-2 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center justify-between gap-2">
          {/* Scrollable Tabs */}
          <div className="flex-1 min-w-0 overflow-x-auto touch-pan-x scrollbar-none pb-0.5 flex items-center gap-1.5">
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 relative min-h-[40px] touch-manipulation cursor-pointer ${
                    isActive
                      ? 'bg-[#123B5D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                  <span>{tabItem.label}</span>
                  {tabItem.badge !== undefined && tabItem.badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                      {tabItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick AI Trigger & Logout */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1.5 sm:pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              title="Open AI Fault Diagnostic Assistant"
              className="p-2 min-h-[38px] rounded-xl bg-sky-50 hover:bg-sky-100 text-[#123B5D] transition-all flex items-center gap-1 text-xs font-bold border border-sky-200 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#1976D2] shrink-0" />
              <span className="hidden sm:inline">AI Helper</span>
            </button>

            <button
              type="button"
              onClick={() => showLogoutModal(() => logout())}
              title="Logout from WEPSUN"
              className="p-2 min-h-[38px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all flex items-center gap-1 text-xs font-bold border border-rose-200 cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE JOB CONTEXT BANNER (When on detail sub-tabs 3-10) */}
      {activeTab !== 'dashboard' && activeTab !== 'jobs' && activeTab !== 'notifications' && activeTab !== 'profile' && selectedJob && (
        <div className="bg-gradient-to-r from-[#123B5D] to-[#1976D2] rounded-2xl p-3.5 sm:p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigateTab('jobs')}
              className="p-2 min-h-[38px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Jobs</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white/20">
                  {selectedJob.jobId}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                  {selectedJob.jobType}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-sky-100">
                  {selectedJob.jobStatus}
                </span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm md:text-base mt-1 truncate">
                {selectedJob.buildingName} • Lift {selectedJob.liftNumber}
              </h3>
            </div>
          </div>

          {/* Quick Active Job Dropdown Switcher & Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsCreateQuoteOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
              title="Generate repair quotation for this job"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Quotation</span>
            </button>
            <span className="text-[11px] text-sky-200 hidden md:inline shrink-0">Switch Job:</span>
            <select
              value={selectedJob.id}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full sm:w-auto max-w-full sm:max-w-xs px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white text-xs font-bold focus:outline-none focus:bg-[#123B5D] truncate"
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

                        <button
                          onClick={() => setIsCreateQuoteOpen(true)}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F3E5F5] hover:bg-purple-100 text-center transition-all group col-span-3 sm:col-span-1"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#7B1FA2] text-white flex items-center justify-center mb-1.5 shadow-2xs">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">Create Quote</span>
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
                selectedJobId={selectedJob?.id || ''}
                onSelectJob={(j) => setSelectedJobId(j.id)}
                onUpdateJobStatus={handleUpdateJobStatus}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
              />
            );

          case 'client_lift':
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Please select an active ticket or work order from Today's Jobs.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
            return (
              <ClientLiftDetailsView
                job={selectedJob}
                lift={activeLift}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'service_history':
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Please select an active ticket from Today's Jobs to view its service history.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
            return (
              <ServiceHistoryView
                job={selectedJob}
                historicalReports={serviceReports.filter((r) => r.liftNumber === selectedJob.liftNumber)}
                showToast={showToast}
              />
            );

          case 'checkin_checkout':
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select a ticket from Today's Jobs to record GPS site arrival or departure.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
            return (
              <CheckInOutTracker
                job={selectedJob}
                onUpdateJob={handleUpdateJob}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'diagnosis':
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select a ticket from Today's Jobs to document fault diagnosis and corrective actions.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
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
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select an active job to issue or consume replacement parts from warehouse inventory.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
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
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select an active job to upload before and after proof photos.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
            return (
              <EvidencePhotoManager
                job={selectedJob}
                onUpdateEvidence={handleUpdateEvidence}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'signature_otp':
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select an active job to obtain digital customer signature or OTP signoff.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
            return (
              <SignatureOtpSignoff
                job={selectedJob}
                onUpdateJob={handleUpdateJob}
                onNavigateToTab={(tab) => navigateTab(tab as TechNavTab)}
                showToast={showToast}
              />
            );

          case 'service_report':
            if (!selectedJob) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No Job Selected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select a completed job to review or generate the official digital service report.
                  </p>
                  <button
                    onClick={() => navigateTab('jobs')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#123B5D] text-white text-xs font-bold hover:bg-[#0e2f4a]"
                  >
                    View Assigned Jobs
                  </button>
                </div>
              );
            }
            return (
              <ServiceReportView
                job={selectedJob}
                activeCompany={activeCompany}
                showToast={showToast}
                onFinalizeReport={handleFinalizeServiceReport}
              />
            );

          case 'notifications':
            return (
              <TechnicianNotificationsView
                notifications={notifications}
                onMarkAsRead={handleMarkNotifRead}
                onClearAll={handleClearAllNotifs}
                onBack={() => {
                  if (onNavigateTab) {
                    onNavigateTab('jobs');
                  } else {
                    setActiveTab('jobs');
                    window.location.hash = 'jobs';
                  }
                }}
                onNavigateTab={(t) => {
                  if (onNavigateTab) {
                    onNavigateTab(t as any);
                  } else {
                    setActiveTab(t as any);
                    window.location.hash = t;
                  }
                }}
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
                    if (selectedJob) {
                      handleUpdateJobStatus(selectedJob.id, 'Completed');
                    }
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

      {/* Technician Create Quotation Modal */}
      {isCreateQuoteOpen && selectedJob && (
        <TechnicianCreateQuotationModal
          isOpen={isCreateQuoteOpen}
          onClose={() => setIsCreateQuoteOpen(false)}
          job={selectedJob}
          onSuccess={() => {
            setIsCreateQuoteOpen(false);
            showToast('success', 'Quotation Dispatched', 'Estimate sent to Admin and Client for immediate review.');
          }}
        />
      )}
    </div>
  );
};
