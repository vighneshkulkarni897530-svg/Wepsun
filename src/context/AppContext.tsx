import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Company,
  Branch,
  User,
  UserRole,
  Building,
  Lift,
  Technician,
  Complaint,
  ComplaintStatus,
  PmRecord,
  AmcContract,
  Quotation,
  QuotationStatus,
  WorkOrder,
  WorkOrderStatus,
  Invoice,
  InventoryItem,
  InventoryMovement,
  ServiceReport,
  AiErrorCode,
  BusinessEnquiry,
  PartReplaced,
  GPSCheckIn,
  AuditLog,
  CustomerFeedback,
  DemoAccount,
  PartReplacementRecord,
  ClientNotification,
  ClientProfile,
  AppNotification,
  NotificationPriority,
  NotificationCategory,
} from '../types';
import type { WepsunModalOptions, WepsunModalType } from '../components/common/WepsunModal';
import {
  INITIAL_COMPANIES,
  INITIAL_BRANCHES,
  INITIAL_USERS,
  DEMO_ACCOUNTS,
  INITIAL_BUILDINGS,
  INITIAL_LIFTS,
  INITIAL_TECHNICIANS,
  INITIAL_COMPLAINTS,
  INITIAL_AMC_CONTRACTS,
  INITIAL_QUOTATIONS,
  INITIAL_WORK_ORDERS,
  INITIAL_INVOICES,
  INITIAL_INVENTORY,
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_SERVICE_REPORTS,
  INITIAL_AUDIT_LOGS,
  AI_ERROR_CODES_DATABASE,
  INITIAL_BUSINESS_ENQUIRIES,
  INITIAL_FEEDBACKS,
  INITIAL_PARTS_REPLACEMENTS,
  INITIAL_CLIENT_NOTIFICATIONS,
  INITIAL_APP_NOTIFICATIONS,
} from '../data/initialData';
import { apiService, checkServerHealth, clearTokens, getAccessToken, getRefreshToken } from '../services/api';
import {
  restoreAuthenticatedSession,
  terminateSession,
  cacheUserSession,
  isMasterAdminSessionValid,
  registerSessionLifecycle,
  isTokenExpired,
  getCachedUserSession,
} from '../services/sessionManager';
import { getNetworkStatus, subscribeNetworkStatus } from '../services/nativeApp';
import { playNotificationSound, isSoundEnabled as getSoundPref, setSoundEnabled } from '../utils/notificationSound';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'emergency';
  title: string;
  message: string;
}

interface AppContextType {
  // Multi-Tenancy & Roles
  companies: Company[];
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  activeCompany: Company;
  branches: Branch[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User;
  users: User[];
  demoAccounts: DemoAccount[];
  loginAsUser: (userOrId: User | string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isMasterAuthenticated: boolean;
  activeClientId: string;
  setActiveClientId: (id: string) => void;
  activeTechnicianId: string;
  setActiveTechnicianId: (id: string) => void;

  // Stores (All & Tenant-Scoped)
  buildings: Building[];
  lifts: Lift[];
  technicians: Technician[];
  complaints: Complaint[];
  pmRecords: PmRecord[];
  amcContracts: AmcContract[];
  quotations: Quotation[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  inventory: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  serviceReports: ServiceReport[];
  feedbacks: CustomerFeedback[];
  aiErrorCodes: AiErrorCode[];
  enquiries: BusinessEnquiry[];
  auditLogs: AuditLog[];
  gpsCheckIns: GPSCheckIn[];

  // Tenant-Filtered View Helpers
  tenantBuildings: Building[];
  tenantLifts: Lift[];
  tenantTechnicians: Technician[];
  tenantComplaints: Complaint[];
  tenantAmcContracts: AmcContract[];
  tenantQuotations: Quotation[];
  tenantWorkOrders: WorkOrder[];
  tenantInvoices: Invoice[];
  tenantInventory: InventoryItem[];
  tenantMovements: InventoryMovement[];
  tenantReports: ServiceReport[];
  tenantFeedbacks: CustomerFeedback[];
  tenantAuditLogs: AuditLog[];

  // Client-Scoped Isolated View Helpers (Strict RBAC Zero Data Leakage)
  clientScopedBuildings: Building[];
  clientScopedLifts: Lift[];
  clientScopedComplaints: Complaint[];
  clientScopedAmcContracts: AmcContract[];
  clientScopedQuotations: Quotation[];
  clientScopedInvoices: Invoice[];
  clientScopedReports: ServiceReport[];
  clientScopedPmRecords: PmRecord[];
  clientScopedFeedbacks: CustomerFeedback[];
  clientScopedPartsHistory: PartReplacementRecord[];
  clientScopedNotifications: ClientNotification[];
  clientProfile: ClientProfile;
  verifyClientAccess: (resourceClientId?: string | null) => boolean;

  // Mutators
  updateUserProfile: (profile: Partial<User>) => void;
  updateTechnicianProfile: (techId: string, profile: Partial<Technician>) => void;
  updateClientProfile: (profile: Partial<ClientProfile>) => void;
  changeClientPassword: (oldPass: string, newPass: string) => boolean;
  rejectQuotation: (quoteId: string, reason?: string) => void;
  requestQuoteClarification: (quoteId: string, notes: string) => void;
  requestPmReschedule: (liftId: string, preferredDate: string, timeSlot: string, reason: string) => void;

  // Centralized Notification System
  notifications: AppNotification[];
  roleNotifications: AppNotification[];
  unreadNotificationsCount: number;
  criticalNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'> & { timestamp?: string; isRead?: boolean }
  ) => AppNotification;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  createComplaint: (complaintData: Partial<Complaint>) => Complaint;
  assignTechnician: (ticketId: string, technicianId: string, eta?: string) => void;
  updateComplaintStatus: (ticketId: string, status: ComplaintStatus, extra?: Partial<Complaint>) => void;
  checkInJob: (ticketId: string, gpsData?: { lat: number; lng: number; address: string; accuracy?: number }) => void;
  completeJobAndGenerateReport: (
    ticketId: string,
    data: {
      diagnosis: string;
      rootCause: string;
      actionTaken: string;
      partsReplaced: PartReplaced[];
      recommendations: string;
      liftOperatingStatus: 'Fully Operational & Safe' | 'Operational with Observation' | 'Shut Down (Parts Pending)';
      beforePhotos: string[];
      afterPhotos: string[];
      technicianSignature: string;
      clientSignature: string;
      clientOtpVerified: boolean;
    }
  ) => ServiceReport;
  submitPmRecord: (record: Partial<PmRecord>) => PmRecord;
  createQuotation: (quoteData: Partial<Quotation>) => Quotation;
  updateQuotationStatus: (quoteId: string, status: QuotationStatus, notes?: string) => void;
  approveQuotation: (quoteId: string) => void;
  convertQuotationToWorkOrder: (quoteId: string, technicianId?: string, scheduledDate?: string) => WorkOrder;
  createWorkOrder: (orderData: Partial<WorkOrder>) => WorkOrder;
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrderStatus, extra?: Partial<WorkOrder>) => void;
  payInvoice: (invoiceId: string, method: 'UPI / QR' | 'NEFT / RTGS' | 'Credit Card' | 'Cheque', txId: string) => void;
  recordInventoryMovement: (movement: Omit<InventoryMovement, 'id' | 'timestamp'>) => void;
  consumeInventoryPart: (partId: string, quantity: number, refId?: string, techName?: string) => void;
  restockInventoryPart: (partId: string, quantity: number, poNumber?: string) => void;
  addNewInventoryItem: (itemData: Partial<InventoryItem>) => InventoryItem;
  updateInventoryItem: (partId: string, itemData: Partial<InventoryItem>) => void;
  addNewLift: (liftData: Partial<Lift>) => Lift;
  updateLift: (liftId: string, liftData: Partial<Lift>) => void;
  addNewBuilding: (buildingData: Partial<Building>) => Building;
  updateBuilding: (buildingId: string, buildingData: Partial<Building>) => void;
  createAmcContract: (contractData: Partial<AmcContract>) => AmcContract;
  renewAmcContract: (contractId: string, newEndDate: string) => void;
  submitBusinessEnquiry: (enquiry: Partial<BusinessEnquiry>) => BusinessEnquiry;
  rateService: (ticketId: string, rating: number, feedback: string) => void;
  submitCustomerFeedback: (feedback: Partial<CustomerFeedback>) => CustomerFeedback;
  replyToCustomerFeedback: (feedbackId: string, replyMessage: string) => void;
  updateFeedbackStatus: (feedbackId: string, status: CustomerFeedback['status']) => void;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  resetDemoData: () => void;

  // Cloud Synchronization & Real-time Network State
  isServerConnected: boolean;
  serverLatencyMs: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncedAt: Date | null;
  syncWithServer: (silent?: boolean) => Promise<void>;
  testServerConnection: (customUrl?: string) => Promise<{ connected: boolean; latencyMs: number; error?: string }>;

  // Toasts
  toasts: ToastNotification[];
  showToast: (type: ToastNotification['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Modern WepSun Modal & Pop-up System
  modal: WepsunModalOptions | null;
  openModal: (options: WepsunModalOptions) => void;
  closeModal: () => void;
  showConfirmModal: (options: {
    title?: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: WepsunModalType;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  showSuccessModal: (title?: string, message?: string | React.ReactNode, onContinue?: () => void) => void;
  showErrorModal: (title?: string, message?: string | React.ReactNode, onRetry?: () => void) => void;
  showWarningModal: (title?: string, message?: string | React.ReactNode, onConfirm?: () => void) => void;
  showDeleteModal: (title?: string, message?: string | React.ReactNode, onDelete?: () => void | Promise<void>) => void;
  showLogoutModal: (onLogout?: () => void) => void;
  showLoginErrorModal: (message?: string, onRetry?: () => void) => void;
  showAccessDeniedModal: (message?: string, onOk?: () => void) => void;
  showNetworkModal: (onRetry?: () => void) => void;
  showUpdateModal: (title?: string, message?: string, onViewDetails?: () => void) => void;
  showLoadingModal: (title?: string, message?: string) => void;
  hideLoadingModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'wepsun_lift_saas_v2_';

function safeStorageParse<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch (err) {
    console.warn(`[AppContext] Error parsing localStorage key "${key}", falling back to initial data.`, err);
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-Tenancy & Active Company/Branch
  const [companies] = useState<Company[]>(INITIAL_COMPANIES);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_PREFIX + 'companyId') || 'comp-1';
  });

  const [branches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_PREFIX + 'branchId') || 'all';
  });

  const setActiveCompanyId = (id: string) => {
    setActiveCompanyIdState(id);
    localStorage.setItem(STORAGE_PREFIX + 'companyId', id);
  };

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    localStorage.setItem(STORAGE_PREFIX + 'branchId', id);
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  // Current Role & Mock User (Defaults to Client unless valid Master Admin session exists)
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const isMasterAuth =
      typeof window !== 'undefined' &&
      (localStorage.getItem('wepsun_master_authenticated') === 'true' ||
        sessionStorage.getItem('wepsun_master_authenticated') === 'true');

    const savedRole = localStorage.getItem(STORAGE_PREFIX + 'role') as UserRole;
    if (savedRole === 'company_admin' || savedRole === 'master_admin' || savedRole === 'super_admin') {
      if (isMasterAuth) {
        return savedRole;
      }
      return 'client';
    }
    return savedRole || 'client';
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const isMasterAuth =
      typeof window !== 'undefined' &&
      (localStorage.getItem('wepsun_master_authenticated') === 'true' ||
        sessionStorage.getItem('wepsun_master_authenticated') === 'true');
    const savedUserId = localStorage.getItem(STORAGE_PREFIX + 'userId');
    if (savedUserId && (savedUserId.includes('admin') || savedUserId.includes('master')) && !isMasterAuth) {
      return 'usr-client-priya';
    }
    return savedUserId || 'usr-client-priya';
  });

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_PREFIX + 'clientId') || '';
  });
  const [activeTechnicianId, setActiveTechnicianId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_PREFIX + 'technicianId') || '';
  });
  const [users, setUsers] = useState<User[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'users', INITIAL_USERS);
  });
  const [demoAccounts] = useState<DemoAccount[]>(DEMO_ACCOUNTS);

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  // Entities
  const [buildings, setBuildings] = useState<Building[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'buildings', INITIAL_BUILDINGS);
  });

  const [lifts, setLifts] = useState<Lift[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'lifts', INITIAL_LIFTS);
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'technicians', INITIAL_TECHNICIANS);
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'complaints', INITIAL_COMPLAINTS);
  });

  const [pmRecords, setPmRecords] = useState<PmRecord[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'pmRecords', []);
  });

  const [amcContracts, setAmcContracts] = useState<AmcContract[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'amcContracts', INITIAL_AMC_CONTRACTS);
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'quotations', INITIAL_QUOTATIONS);
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'workOrders', INITIAL_WORK_ORDERS);
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'invoices', INITIAL_INVOICES);
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'inventory', INITIAL_INVENTORY);
  });

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'inventoryMovements', INITIAL_INVENTORY_MOVEMENTS);
  });

  const [serviceReports, setServiceReports] = useState<ServiceReport[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'serviceReports', INITIAL_SERVICE_REPORTS);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'auditLogs', INITIAL_AUDIT_LOGS);
  });

  const [gpsCheckIns, setGpsCheckIns] = useState<GPSCheckIn[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'gpsCheckIns', []);
  });

  const [aiErrorCodes] = useState<AiErrorCode[]>(AI_ERROR_CODES_DATABASE);

  const [enquiries, setEnquiries] = useState<BusinessEnquiry[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'enquiries', INITIAL_BUSINESS_ENQUIRIES);
  });

  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'feedbacks', INITIAL_FEEDBACKS);
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'buildings', JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'lifts', JSON.stringify(lifts));
  }, [lifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pmRecords', JSON.stringify(pmRecords));
  }, [pmRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'amcContracts', JSON.stringify(amcContracts));
  }, [amcContracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'workOrders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'inventoryMovements', JSON.stringify(inventoryMovements));
  }, [inventoryMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'serviceReports', JSON.stringify(serviceReports));
  }, [serviceReports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'gpsCheckIns', JSON.stringify(gpsCheckIns));
  }, [gpsCheckIns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  // Live Server & Cloud Synchronization State
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [serverLatencyMs, setServerLatencyMs] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const testServerConnection = useCallback(async (customUrl?: string) => {
    const res = await checkServerHealth(customUrl);
    setIsServerConnected(res.connected);
    setServerLatencyMs(res.latencyMs);
    return res;
  }, []);

  const syncWithServer = useCallback(async (silent = false) => {
    const net = await getNetworkStatus();
    if (!net.connected) {
      setIsServerConnected(false);
      setSyncStatus('offline');
      if (!silent) showToast('warning', 'Offline Mode Active', 'Device is offline. Changes are saved locally.');
      return;
    }

    setSyncStatus('syncing');
    try {
      const health = await checkServerHealth();
      setIsServerConnected(health.connected);
      setServerLatencyMs(health.latencyMs);

      if (!health.connected) {
        setSyncStatus('error');
        if (!silent) showToast('info', 'Local Cache Mode', `Backend API unreachable (${health.error || 'Check server'}). Using local data.`);
        return;
      }

      const serverData = await apiService.syncAllTenantData({
        companyId: activeCompanyId,
        branchId: activeBranchId,
        userRole: currentRole,
      });

      if (serverData.lifts !== null && Array.isArray(serverData.lifts)) {
        setLifts(serverData.lifts.map((sl: any) => ({
          ...sl,
          liftNumber: sl.permanentLiftId || sl.liftNumber || 'LIFT',
          buildingName: sl.building?.name || sl.buildingName || 'Complex',
        })));
      }

      if (serverData.complaints !== null && Array.isArray(serverData.complaints)) {
        setComplaints(serverData.complaints);
      }

      if (serverData.workOrders !== null && Array.isArray(serverData.workOrders)) {
        setWorkOrders(serverData.workOrders);
      }

      if (serverData.amcContracts !== null && Array.isArray(serverData.amcContracts)) {
        setAmcContracts(serverData.amcContracts);
      }

      if (serverData.quotations !== null && Array.isArray(serverData.quotations)) {
        setQuotations(serverData.quotations);
      }

      if (serverData.invoices !== null && Array.isArray(serverData.invoices)) {
        setInvoices(serverData.invoices);
      }

      if (serverData.inventory !== null && Array.isArray(serverData.inventory)) {
        setInventory(serverData.inventory);
      }

      if (serverData.technicians !== null && Array.isArray(serverData.technicians)) {
        setTechnicians(serverData.technicians);
      }

      if (serverData.feedbacks !== null && Array.isArray(serverData.feedbacks)) {
        setFeedbacks(serverData.feedbacks);
      }

      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      if (!silent) {
        showToast('success', 'Server Synchronized', `Connected to PostgreSQL backend (${health.latencyMs}ms).`);
      }
    } catch (err: any) {
      console.warn('[AppContext] Cloud sync error:', err);
      setSyncStatus('error');
    }
  }, [activeCompanyId, activeBranchId, currentRole]);

  // Real-time network change listener & automatic sync
  useEffect(() => {
    const unsub = subscribeNetworkStatus((status) => {
      if (status.connected) {
        syncWithServer(true);
      } else {
        setIsServerConnected(false);
        setSyncStatus('offline');
      }
    });

    syncWithServer(true);
    return () => unsub();
  }, [syncWithServer]);

  // Current User representation based on activeUserId or current role
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const isMasterAuth =
      typeof window !== 'undefined' &&
      (localStorage.getItem('wepsun_master_authenticated') === 'true' ||
        sessionStorage.getItem('wepsun_master_authenticated') === 'true');

    const saved = safeStorageParse<User | null>(STORAGE_PREFIX + 'currentUser', null);
    if (saved) {
      if ((saved.role === 'company_admin' || saved.role === 'master_admin' || saved.role === 'super_admin') && !isMasterAuth) {
        return INITIAL_USERS.find((u) => u.role === 'client') || INITIAL_USERS[2];
      }
      return saved;
    }
    const savedUserId = localStorage.getItem(STORAGE_PREFIX + 'userId');
    if (savedUserId) {
      const found = INITIAL_USERS.find((u) => u.id === savedUserId);
      if (found) {
        if ((found.role === 'company_admin' || found.role === 'master_admin' || found.role === 'super_admin') && !isMasterAuth) {
          return INITIAL_USERS.find((u) => u.role === 'client') || INITIAL_USERS[2];
        }
        return found;
      }
    }
    return INITIAL_USERS.find((u) => u.role === 'client') || INITIAL_USERS[2] || INITIAL_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isExplicitLogout = localStorage.getItem('wepsun_explicit_logout') === 'true';
    if (isExplicitLogout) return false;
    const token = getAccessToken();
    const refresh = getRefreshToken();
    if (!token && !refresh) return false;
    if (token && !isTokenExpired(token, 0)) return true;
    if (refresh) return true;
    return false;
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Authenticate session against backend API and restore state on application startup
  useEffect(() => {
    let isMounted = true;
    const validateAndRestoreSession = async () => {
      try {
        const result = await restoreAuthenticatedSession();
        if (!isMounted) return;

        if (result.status === 'restored' || result.status === 'offline') {
          if (result.user) {
            setCurrentUserState(result.user);
            setActiveUserId(result.user.id);
            if (result.user.clientId) {
              setActiveClientId(result.user.clientId);
            }
            if (result.user.technicianId) {
              setActiveTechnicianId(result.user.technicianId);
            }
          }
          setCurrentRoleState(result.role);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('[AppContext] Session restoration error:', err);
        if (isMounted) {
          const cached = getCachedUserSession();
          if (cached && cached.user) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    validateAndRestoreSession();

    // Register foreground & background lifecycle listener
    const cleanupLifecycle = registerSessionLifecycle({
      onSessionRevoked: (msg) => {
        if (isMounted) {
          setIsAuthenticated(false);
          if (msg) showToast('warning', 'Session Ended', msg);
        }
      },
      onSessionRefreshed: () => {
        // Transparent token refresh succeeded in background
      },
    });

    return () => {
      isMounted = false;
      cleanupLifecycle();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  const loginAsUser = (target: User | string) => {
    let userObj: User | undefined;
    if (typeof target === 'string') {
      userObj = users.find(
        (u) => u.id === target || u.email.toLowerCase() === target.toLowerCase() || u.phone === target
      );
      if (!userObj) {
        const demo = demoAccounts.find(
          (d) =>
            d.id === target ||
            d.email.toLowerCase() === target.toLowerCase() ||
            d.phone === target
        );
        if (demo) {
          userObj = {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            phone: demo.phone,
            role: demo.role,
            companyId: demo.companyId,
            branchId: demo.branchId,
            clientId: (demo as any).clientId || (demo.role === 'client' ? (demo.id === 'usr-client-priya' ? 'client-priya' : 'client-1') : undefined),
            technicianId: (demo as any).technicianId || (demo.role === 'technician' ? (demo.id === 'usr-tech-rohan' ? 'tech-rohan' : 'tech-1') : undefined),
            avatar: demo.avatar,
            companyName: demo.companyName,
            designation: demo.title,
            isActive: true,
          };
        }
      }
    } else {
      userObj = { ...target };
    }

    if (!userObj) {
      showToast('info', 'Welcome', 'Logged in successfully');
      return;
    }

    // Auto-assign distinct client or technician ID if missing
    if (userObj.role === 'client') {
      if (!userObj.clientId) {
        userObj.clientId = 'client-' + (userObj.id ? userObj.id.replace('usr-', '') : Date.now());
      }
    }
    if (userObj.role === 'technician') {
      if (!userObj.technicianId) {
        userObj.technicianId = 'tech-' + (userObj.id ? userObj.id.replace('usr-', '') : Date.now());
      }
    }

    const finalUser = userObj;
    setIsAuthenticated(true);

    // Ensure distinct ClientProfile exists and equipment is provisioned
    if (finalUser.role === 'client' && finalUser.clientId) {
      const cid = finalUser.clientId;
      setClientProfiles((prev) => {
        if (prev[cid]) return prev;
        return {
          ...prev,
          [cid]: {
            clientId: cid,
            companyName: finalUser.companyName || '',
            contactPerson: finalUser.name || '',
            phone: finalUser.phone || '',
            email: finalUser.email || '',
            address: finalUser.address || '',
            city: finalUser.city || '',
            pincode: finalUser.pincode || '',
            gstin: '',
            logo: finalUser.avatar || '',
            registeredBuildings: [],
            totalLifts: 0,
          },
        };
      });

      // Auto-provision building, lifts and active AMC if client has no lifts
      setBuildings((prev) => {
        if (prev.some((b) => b.clientId === cid)) return prev;
        const bldId = 'bld-' + cid;
        const lift1Id = 'lift-' + cid + '-1';
        const lift2Id = 'lift-' + cid + '-2';
        const newBld: Building = {
          id: bldId,
          companyId: finalUser.companyId || 'comp-1',
          branchId: finalUser.branchId || 'br-mum-1',
          name: finalUser.companyName || `${finalUser.name} Heights`,
          address: finalUser.address || 'Palm Beach Road, Sector 19, Vashi',
          landmark: 'Opp. Inorbit Mall',
          city: finalUser.city || 'Navi Mumbai',
          pinCode: '400703',
          contactPerson: finalUser.name,
          contactPhone: finalUser.phone || '+91 98200 12345',
          clientId: cid,
          clientName: finalUser.name,
          totalLifts: 2,
          liftIds: [lift1Id, lift2Id],
        };
        return [...prev, newBld];
      });

      setLifts((prev) => {
        if (prev.some((l) => l.clientId === cid)) return prev;
        const bldId = 'bld-' + cid;
        const bldName = finalUser.companyName || `${finalUser.name} Heights`;
        const lift1Id = 'lift-' + cid + '-1';
        const lift2Id = 'lift-' + cid + '-2';
        const lift1: Lift = {
          id: lift1Id,
          companyId: finalUser.companyId || 'comp-1',
          branchId: finalUser.branchId || 'br-mum-1',
          liftNumber: 'WPS-MUM-001',
          buildingId: bldId,
          buildingName: bldName,
          clientId: cid,
          clientName: finalUser.name,
          clientPhone: finalUser.phone || '+91 98200 12345',
          brand: 'WEPSUN Gearless PMSM',
          model: 'AeroGlide-V3',
          type: 'Passenger',
          capacityPersons: 10,
          capacityKg: 680,
          speedMps: 1.5,
          floors: 'G + 14 Floors',
          stops: 15,
          machineType: 'Gearless PMSM',
          motorKw: 7.5,
          controllerBrand: 'Monarch NICE 3000+',
          doorOperator: 'Fermator VVVF4+',
          ardSystem: 'Automatic Rescue Device 415V 15KVA',
          governorSpeed: 1.75,
          ropeDiaMm: 10,
          installationDate: '2023-04-10',
          warrantyExpiry: '2024-04-10',
          currentStatus: 'operational',
          amcStatus: 'active',
          lastPmDate: '2025-08-12',
          nextPmDate: '2025-09-15',
          qrCodeData: `WPS-LIFT-${lift1Id}`,
          safetyCertificateNumber: 'CERT-MH-2025-089',
          safetyCertificateExpiry: '2026-08-01',
          locationDetails: 'Wing A - Passenger Elevator',
        };
        const lift2: Lift = {
          id: lift2Id,
          companyId: finalUser.companyId || 'comp-1',
          branchId: finalUser.branchId || 'br-mum-1',
          liftNumber: 'WPS-MUM-002',
          buildingId: bldId,
          buildingName: bldName,
          clientId: cid,
          clientName: finalUser.name,
          clientPhone: finalUser.phone || '+91 98200 12345',
          brand: 'WEPSUN Heavy Duty',
          model: 'CargoMaster-Pro',
          type: 'Freight / Goods',
          capacityPersons: 15,
          capacityKg: 1020,
          speedMps: 1.0,
          floors: 'G + 14 Floors',
          stops: 15,
          machineType: 'Geared Traction',
          motorKw: 11,
          controllerBrand: 'Step F5021',
          doorOperator: 'Wittur Hydra',
          ardSystem: 'Automatic Rescue Device 415V 20KVA',
          governorSpeed: 1.25,
          ropeDiaMm: 12,
          installationDate: '2023-04-10',
          warrantyExpiry: '2024-04-10',
          currentStatus: 'operational',
          amcStatus: 'active',
          lastPmDate: '2025-08-10',
          nextPmDate: '2025-09-20',
          qrCodeData: `WPS-LIFT-${lift2Id}`,
          safetyCertificateNumber: 'CERT-MH-2025-090',
          safetyCertificateExpiry: '2026-08-01',
          locationDetails: 'Service Core - Goods/Stretcher Elevator',
        };
        return [...prev, lift1, lift2];
      });

      setAmcContracts((prev) => {
        if (prev.some((a) => a.clientId === cid)) return prev;
        const bldId = 'bld-' + cid;
        const bldName = finalUser.companyName || `${finalUser.name} Heights`;
        const lift1Id = 'lift-' + cid + '-1';
        const lift2Id = 'lift-' + cid + '-2';
        const newAmc: AmcContract = {
          id: 'amc-' + cid + '-1',
          companyId: finalUser.companyId || 'comp-1',
          branchId: finalUser.branchId || 'br-mum-1',
          contractNumber: 'AMC-WEP-2025-' + (cid.slice(-4) || '9901'),
          clientId: cid,
          clientName: finalUser.name,
          buildingId: bldId,
          buildingName: bldName,
          liftIds: [lift1Id, lift2Id],
          amcType: 'Comprehensive',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          contractValue: 84000,
          gstRate: 18,
          gstAmount: 15120,
          totalAmount: 99120,
          paymentStatus: 'paid',
          coveredParts: ['Motor', 'Controller PCB', 'Door Drive', 'Brakes', 'Safety Gears'],
          excludedParts: ['Glass Panels', 'Cab Decorative Light Fixtures'],
          pmFrequency: 'Monthly (12 Visits/Year)',
          pmVisitsDone: 8,
          pmVisitsTotal: 12,
          status: 'active',
          createdDate: '2025-01-01',
        };
        return [...prev, newAmc];
      });

      setActiveClientId(cid);
    }

    // Ensure distinct Technician record exists
    if (finalUser.role === 'technician' && finalUser.technicianId) {
      const tid = finalUser.technicianId;
      setTechnicians((prev) => {
        if (prev.some((t) => t.id === tid)) return prev;
        const newTech: Technician = {
          id: tid,
          companyId: finalUser.companyId || 'comp-1',
          branchId: finalUser.branchId || 'br-mum-1',
          name: finalUser.name,
          employeeCode: 'TECH-' + Math.floor(100 + Math.random() * 900),
          phone: finalUser.phone || '+91 98200 00000',
          email: finalUser.email || 'tech@wepsun.com',
          avatar: finalUser.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          zone: 'Central Service Zone',
          currentStatus: 'available',
          totalResolved: 15,
          avgResolutionMinutes: 38,
          customerRating: 4.9,
          totalRatingsCount: 12,
          repeatComplaintRatePct: 1.5,
          pmCompletionPct: 98,
          monthlyRevenueContribution: 150000,
          branchName: 'Mumbai Central Branch',
          vehicleNumber: 'MH-01-WEP-2026',
          specialization: 'Gearless PMSM & MRL Elevators',
          certifications: ['Certified Elevator Safety Inspector (CESI)', 'Monarch & Step Drive Certified'],
          bio: 'Field service engineer specializing in preventive maintenance and rapid emergency troubleshooting.',
        };
        return [...prev, newTech];
      });
      setActiveTechnicianId(tid);
    }

    // Save/update in users state
    setUsers((prev) => {
      const idx = prev.findIndex(
        (u) => u.id === finalUser.id || (u.email && finalUser.email && u.email.toLowerCase() === finalUser.email.toLowerCase())
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...finalUser };
        return updated;
      }
      return [...prev, finalUser];
    });

    setCurrentUserState(finalUser);
    setActiveUserId(finalUser.id);
    localStorage.setItem(STORAGE_PREFIX + 'userId', finalUser.id);
    setCurrentRoleState(finalUser.role);
    localStorage.setItem(STORAGE_PREFIX + 'role', finalUser.role);

    if (finalUser.companyId) {
      setActiveCompanyIdState(finalUser.companyId);
      localStorage.setItem(STORAGE_PREFIX + 'companyId', finalUser.companyId);
    }
    if (finalUser.branchId) {
      setActiveBranchIdState(finalUser.branchId);
      localStorage.setItem(STORAGE_PREFIX + 'branchId', finalUser.branchId);
    }
    if (finalUser.clientId) {
      localStorage.setItem(STORAGE_PREFIX + 'clientId', finalUser.clientId);
    } else {
      localStorage.removeItem(STORAGE_PREFIX + 'clientId');
    }
    if (finalUser.technicianId) {
      localStorage.setItem(STORAGE_PREFIX + 'technicianId', finalUser.technicianId);
    } else {
      localStorage.removeItem(STORAGE_PREFIX + 'technicianId');
    }

    cacheUserSession(finalUser, finalUser.role, isMasterAdminSessionValid());
    setIsAuthenticated(true);
    localStorage.removeItem('wepsun_explicit_logout');

    showToast(
      'success',
      'Authentication Successful',
      `Logged in as ${finalUser.name} (${finalUser.role.replace('_', ' ').toUpperCase()})`
    );
  };

  const setCurrentRole = (role: UserRole) => {
    if (role === currentRole && currentUser.role === role) return;
    setCurrentRoleState(role);
    localStorage.setItem(STORAGE_PREFIX + 'role', role);

    // Check if current user is already of this role
    if (currentUser.role === role) {
      return;
    }

    const roleUser = users.find((u) => u.role === role) || INITIAL_USERS.find((u) => u.role === role);
    if (roleUser) {
      setCurrentUserState(roleUser);
      setActiveUserId(roleUser.id);
      localStorage.setItem(STORAGE_PREFIX + 'userId', roleUser.id);
      if (roleUser.companyId) {
        setActiveCompanyIdState(roleUser.companyId);
        localStorage.setItem(STORAGE_PREFIX + 'companyId', roleUser.companyId);
      }
      if (roleUser.branchId) {
        setActiveBranchIdState(roleUser.branchId);
        localStorage.setItem(STORAGE_PREFIX + 'branchId', roleUser.branchId);
      }
      if (roleUser.clientId) {
        setActiveClientId(roleUser.clientId);
      }
      if (roleUser.technicianId) {
        setActiveTechnicianId(roleUser.technicianId);
      }
    }
    showToast('info', 'Role Switched', `Active Mode: ${role.replace('_', ' ').toUpperCase()}`);
  };

  // Toast Helpers (Bottom-right notifications disabled per user preference)
  const showToast = (_type: ToastNotification['type'], _title: string, _message: string) => {
    // Disabled bottom-right notifications
  };

  const removeToast = (_id: string) => {
    setToasts([]);
  };

  // Modern WepSun Modal & Pop-up System
  const [modalState, setModalState] = useState<WepsunModalOptions | null>(null);

  const openModal = useCallback((options: WepsunModalOptions) => {
    setModalState(options);
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const showConfirmModal = useCallback((options: {
    title?: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: WepsunModalType;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    openModal({
      type: options.type || 'warning',
      title: options.title || 'Are you sure?',
      message: options.message,
      primaryAction: {
        label: options.confirmLabel || 'Confirm',
        variant: options.type === 'delete' ? 'danger' : 'primary',
        onClick: options.onConfirm,
      },
      secondaryAction: {
        label: options.cancelLabel || 'Cancel',
        variant: 'secondary',
        onClick: options.onCancel,
      },
    });
  }, [openModal]);

  const showSuccessModal = useCallback((title?: string, message?: string | React.ReactNode, onContinue?: () => void) => {
    openModal({
      type: 'success',
      title: title || 'Successfully Saved!',
      message: message || 'Your changes have been saved successfully.',
      primaryAction: {
        label: 'Continue',
        variant: 'primary',
        onClick: onContinue,
      },
    });
  }, [openModal]);

  const showErrorModal = useCallback((title?: string, message?: string | React.ReactNode, onRetry?: () => void) => {
    openModal({
      type: 'error',
      title: title || 'Something Went Wrong',
      message: message || "We couldn't complete your request. Please try again.",
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: onRetry,
      },
      secondaryAction: {
        label: 'Cancel',
        variant: 'secondary',
      },
    });
  }, [openModal]);

  const showWarningModal = useCallback((title?: string, message?: string | React.ReactNode, onConfirm?: () => void) => {
    openModal({
      type: 'warning',
      title: title || 'Are You Sure?',
      message: message || 'This action may affect your existing data.',
      primaryAction: {
        label: 'Continue',
        variant: 'warning',
        onClick: onConfirm,
      },
      secondaryAction: {
        label: 'Cancel',
        variant: 'secondary',
      },
    });
  }, [openModal]);

  const showDeleteModal = useCallback((title?: string, message?: string | React.ReactNode, onDelete?: () => void | Promise<void>) => {
    openModal({
      type: 'delete',
      title: title || 'Delete This Item?',
      message: message || 'This action cannot be undone.',
      primaryAction: {
        label: 'Delete',
        variant: 'danger',
        onClick: onDelete,
      },
      secondaryAction: {
        label: 'Cancel',
        variant: 'secondary',
      },
    });
  }, [openModal]);

  const showLogoutModal = useCallback((onLogoutConfirm?: () => void) => {
    openModal({
      type: 'logout',
      title: 'Logout?',
      message: 'Are you sure you want to logout from WepSun Engineering Solution?',
      primaryAction: {
        label: 'Logout',
        variant: 'warning',
        onClick: () => {
          if (onLogoutConfirm) {
            onLogoutConfirm();
          } else {
            logout();
          }
        },
      },
      secondaryAction: {
        label: 'Cancel',
        variant: 'secondary',
      },
    });
  }, [openModal]);

  const showLoginErrorModal = useCallback((message?: string, onRetry?: () => void) => {
    openModal({
      type: 'login_error',
      title: 'Invalid Credentials',
      message: message || 'Please check your ID and password and try again.',
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: onRetry,
      },
    });
  }, [openModal]);

  const showAccessDeniedModal = useCallback((message?: string, onOk?: () => void) => {
    openModal({
      type: 'access_denied',
      title: 'Access Denied',
      message: message || "You don't have permission to access this section.",
      primaryAction: {
        label: 'OK',
        variant: 'primary',
        onClick: onOk,
      },
    });
  }, [openModal]);

  const showNetworkModal = useCallback((onRetry?: () => void) => {
    openModal({
      type: 'network_error',
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      primaryAction: {
        label: 'Retry',
        variant: 'primary',
        onClick: onRetry,
      },
    });
  }, [openModal]);

  const showUpdateModal = useCallback((title?: string, message?: string, onViewDetails?: () => void) => {
    openModal({
      type: 'update',
      title: title || 'New Update Available',
      message: message || 'A new feature or service update is available for WepSun Engineering Solution.',
      primaryAction: {
        label: 'View Details',
        variant: 'primary',
        onClick: onViewDetails,
      },
      secondaryAction: {
        label: 'Later',
        variant: 'secondary',
      },
    });
  }, [openModal]);

  const showLoadingModal = useCallback((title?: string, message?: string) => {
    openModal({
      type: 'loading',
      title: title || 'Please wait…',
      message: message || 'Processing your request securely with WepSun Cloud Services.',
      showCloseButton: false,
      closeOnBackdropClick: false,
    });
  }, [openModal]);

  const hideLoadingModal = useCallback(() => {
    setModalState((prev) => (prev?.type === 'loading' ? null : prev));
  }, []);

  const isMasterAuthenticated = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (!isAuthenticated) return false;
    return isMasterAdminSessionValid();
  }, [isAuthenticated, currentRole]);

  const logout = useCallback(async () => {
    await terminateSession();
    clearTokens();
    if (typeof window !== 'undefined') {
      const clientUser = INITIAL_USERS.find((u) => u.role === 'client') || INITIAL_USERS[2];
      setCurrentUserState({
        ...clientUser,
        clientId: undefined,
        technicianId: undefined,
        name: '',
        email: '',
      });
      setCurrentRoleState('client');
      setActiveUserId('');
      setActiveClientId('');
      setActiveTechnicianId('');

      setBuildings([]);
      setLifts([]);
      setComplaints([]);
      setPmRecords([]);
      setAmcContracts([]);
      setQuotations([]);
      setWorkOrders([]);
      setInvoices([]);
      setServiceReports([]);
      setFeedbacks([]);
      setClientNotifications([]);
      setAppNotifications([]);
      setGpsCheckIns([]);

      setIsAuthenticated(false);

      window.history.replaceState(null, '', '#login');
      window.location.hash = 'login';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }

    setIsAuthenticated(false);
    // Clear all existing toasts so no notifications pop up on logout
    setToasts([]);
  }, []);

  // Audit Log Mutator
  const addAuditLog = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: entry.companyId || activeCompanyId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      performedBy: entry.performedBy || currentUser.name,
      userRole: entry.userRole || currentRole,
      details: entry.details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Tenant-Scoped Data Selectors
  const isSuperAdmin = currentRole === 'super_admin';
  const filterByTenant = useCallback(<T extends { companyId?: string; branchId?: string }>(items: T[]): T[] => {
    if (isSuperAdmin && activeCompanyId === 'all') return items;
    return items.filter((item) => {
      const matchCompany = !item.companyId || item.companyId === activeCompanyId;
      const matchBranch = activeBranchId === 'all' || !item.branchId || item.branchId === activeBranchId;
      return matchCompany && matchBranch;
    });
  }, [isSuperAdmin, activeCompanyId, activeBranchId]);

  const tenantBuildings = useMemo(() => filterByTenant(buildings), [filterByTenant, buildings]);
  const tenantLifts = useMemo(() => filterByTenant(lifts), [filterByTenant, lifts]);
  const tenantTechnicians = useMemo(() => filterByTenant(technicians), [filterByTenant, technicians]);
  const tenantComplaints = useMemo(() => filterByTenant(complaints), [filterByTenant, complaints]);
  const tenantAmcContracts = useMemo(() => filterByTenant(amcContracts), [filterByTenant, amcContracts]);
  const tenantQuotations = useMemo(() => filterByTenant(quotations), [filterByTenant, quotations]);
  const tenantWorkOrders = useMemo(() => filterByTenant(workOrders), [filterByTenant, workOrders]);
  const tenantInvoices = useMemo(() => filterByTenant(invoices), [filterByTenant, invoices]);
  const tenantInventory = useMemo(() => filterByTenant(inventory), [filterByTenant, inventory]);
  const tenantMovements = useMemo(() => filterByTenant(inventoryMovements), [filterByTenant, inventoryMovements]);
  const tenantReports = useMemo(() => filterByTenant(serviceReports), [filterByTenant, serviceReports]);
  const tenantFeedbacks = useMemo(() => filterByTenant(feedbacks), [filterByTenant, feedbacks]);
  const tenantAuditLogs = useMemo(() => isSuperAdmin && activeCompanyId === 'all'
    ? auditLogs
    : auditLogs.filter((l) => l.companyId === activeCompanyId), [auditLogs, isSuperAdmin, activeCompanyId]);

  const [partsReplacements, setPartsReplacements] = useState<PartReplacementRecord[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'partsReplacements', INITIAL_PARTS_REPLACEMENTS);
  });

  const [clientNotifications, setClientNotifications] = useState<ClientNotification[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'clientNotifications', INITIAL_CLIENT_NOTIFICATIONS);
  });

  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    return safeStorageParse(STORAGE_PREFIX + 'appNotifications', INITIAL_APP_NOTIFICATIONS);
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return getSoundPref();
  });

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        playNotificationSound('standard');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'appNotifications', JSON.stringify(appNotifications));
  }, [appNotifications]);

  const [clientProfiles, setClientProfiles] = useState<Record<string, ClientProfile>>(() => {
    return safeStorageParse<Record<string, ClientProfile>>(STORAGE_PREFIX + 'clientProfiles', {
      'client-1': {
        clientId: 'client-1',
        companyName: 'Greenwood Heights Co-op Housing Society Ltd.',
        contactPerson: 'Sanjay Deshmukh (Secretary) / Arvind Mehta',
        phone: '+91 98220 11223',
        email: 'client@greenwood.com',
        address: 'Plot 42, Sector 19, Palm Beach Road, Vashi',
        city: 'Navi Mumbai',
        pincode: '400703',
        gstin: '27AABCG9812L1Z4',
        logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=150&auto=format&fit=crop&q=80',
        registeredBuildings: ['Greenwood Heights CHS - Wing A & B'],
        totalLifts: 4,
      },
      'client-2': {
        clientId: 'client-2',
        companyName: 'Apex Infrastructure & Tech Real Estate Ltd.',
        contactPerson: 'Meera Nambiar (Facility Head)',
        phone: '+91 98450 33445',
        email: 'facility@techparkinfinity.com',
        address: 'Tower B, MIDC Industrial Area, Airoli Knowledge Park',
        city: 'Navi Mumbai',
        pincode: '400708',
        gstin: '27AAACA9876E1ZT',
        logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
        registeredBuildings: ['Apex Infotech Business Park'],
        totalLifts: 6,
      },
      'client-priya': {
        clientId: 'client-priya',
        companyName: 'Sunrise Towers Housing Society',
        contactPerson: 'Priya Sharma (Society Representative)',
        phone: '+91 98200 12345',
        email: 'priya.sharma@towers.com',
        address: 'Sunrise Towers, Main Road, Andheri West',
        city: 'Mumbai',
        pincode: '400053',
        gstin: '27AABCS5542K1Z9',
        logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        registeredBuildings: ['Sunrise Towers - Wing A & B'],
        totalLifts: 2,
      },
      'client-3': {
        clientId: 'client-3',
        companyName: 'CityCare Health Services Pvt. Ltd.',
        contactPerson: 'Dr. Neha Joshi (Admin Director)',
        phone: '+91 98205 33441',
        email: 'admin@citycarehospital.in',
        address: 'Hospital Complex, Near Teen Hath Naka, Thane West',
        city: 'Thane',
        pincode: '400602',
        gstin: '27AABCC3321D1ZQ',
        logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
        registeredBuildings: ['CityCare Multispeciality Hospital Complex'],
        totalLifts: 3,
      },
      'client-4': {
        clientId: 'client-4',
        companyName: 'Royal Palms Welfare Association',
        contactPerson: 'Sunil Nair (Society Manager)',
        phone: '+91 98190 22449',
        email: 'manager@royalpalmsmumbai.org',
        address: 'Aarey Milk Colony, Goregaon East',
        city: 'Mumbai',
        pincode: '400065',
        gstin: '27AABCR9944M1Z2',
        logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&auto=format&fit=crop&q=80',
        registeredBuildings: ['Royal Palms Luxury Residency'],
        totalLifts: 2,
      },
    });
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'partsReplacements', JSON.stringify(partsReplacements));
  }, [partsReplacements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'clientNotifications', JSON.stringify(clientNotifications));
  }, [clientNotifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'clientProfiles', JSON.stringify(clientProfiles));
  }, [clientProfiles]);

  const effectiveClientId = currentUser.clientId || activeClientId || '';

  const clientProfile: ClientProfile = useMemo(() => {
    return (
      clientProfiles[effectiveClientId] || {
        clientId: effectiveClientId,
        companyName: currentUser.companyName || '',
        contactPerson: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        pincode: currentUser.pincode || '',
        gstin: '',
        registeredBuildings: [],
        totalLifts: lifts.filter((l) => l.clientId === effectiveClientId).length || 0,
      }
    );
  }, [clientProfiles, effectiveClientId, currentUser, lifts]);

  const clientScopedLifts = useMemo(() => {
    return lifts.filter((l) => l.clientId === effectiveClientId);
  }, [lifts, effectiveClientId]);

  const clientScopedBuildings = useMemo(() => {
    const clientLiftBuildingIds = new Set(clientScopedLifts.map((l) => l.buildingId));
    return buildings.filter((b) => clientLiftBuildingIds.has(b.id) || b.clientId === effectiveClientId);
  }, [buildings, clientScopedLifts, effectiveClientId]);

  const clientScopedComplaints = useMemo(() => {
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    return complaints.filter((c) => c.clientId === effectiveClientId || clientLiftIds.has(c.liftId));
  }, [complaints, clientScopedLifts, effectiveClientId]);

  const clientScopedAmcContracts = useMemo(() => {
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    return amcContracts.filter(
      (a) =>
        a.clientId === effectiveClientId ||
        (a.liftIds && a.liftIds.some((id) => clientLiftIds.has(id)))
    );
  }, [amcContracts, clientScopedLifts, effectiveClientId]);

  const clientScopedQuotations = useMemo(() => {
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    return quotations.filter((q) => q.clientId === effectiveClientId || (q.liftId && clientLiftIds.has(q.liftId)));
  }, [quotations, clientScopedLifts, effectiveClientId]);

  const clientScopedInvoices = useMemo(() => {
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    return invoices.filter((i) => i.clientId === effectiveClientId || (i.liftId && clientLiftIds.has(i.liftId)));
  }, [invoices, clientScopedLifts, effectiveClientId]);

  const clientScopedReports = useMemo(() => {
    const clientLiftNumbers = new Set(clientScopedLifts.map((l) => l.liftNumber.toLowerCase()));
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    return serviceReports.filter(
      (r) =>
        r.clientId === effectiveClientId ||
        (r.liftId && clientLiftIds.has(r.liftId)) ||
        (r.liftNumber && clientLiftNumbers.has(r.liftNumber.toLowerCase()))
    );
  }, [serviceReports, clientScopedLifts, effectiveClientId]);

  const clientScopedPmRecords = useMemo(() => {
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    const clientLiftNumbers = new Set(clientScopedLifts.map((l) => l.liftNumber.toLowerCase()));
    return pmRecords.filter(
      (p) =>
        clientLiftIds.has(p.liftId) || (p.liftNumber && clientLiftNumbers.has(p.liftNumber.toLowerCase()))
    );
  }, [pmRecords, clientScopedLifts]);

  const clientScopedFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => f.clientId === effectiveClientId);
  }, [feedbacks, effectiveClientId]);

  const clientScopedPartsHistory = useMemo(() => {
    const clientLiftIds = new Set(clientScopedLifts.map((l) => l.id));
    const clientLiftNumbers = new Set(clientScopedLifts.map((l) => l.liftNumber.toLowerCase()));
    return partsReplacements.filter(
      (p) =>
        p.clientId === effectiveClientId ||
        clientLiftIds.has(p.liftId) ||
        clientLiftNumbers.has(p.liftNumber.toLowerCase())
    );
  }, [partsReplacements, clientScopedLifts, effectiveClientId]);

  const clientScopedNotifications = useMemo(() => {
    return clientNotifications.filter((n) => n.clientId === effectiveClientId);
  }, [clientNotifications, effectiveClientId]);

  const roleNotifications = useMemo(() => {
    return appNotifications.filter((n) => {
      if (currentRole === 'client') {
        return (
          (!n.clientId || n.clientId === effectiveClientId) &&
          (n.targetRole === 'client' || n.targetRole === 'all' || !n.targetRole)
        );
      }
      if (currentRole === 'technician') {
        return (
          (!n.technicianId || n.technicianId === activeTechnicianId) &&
          (n.targetRole === 'technician' || n.targetRole === 'all' || !n.targetRole)
        );
      }
      return true;
    });
  }, [appNotifications, currentRole, effectiveClientId, activeTechnicianId]);

  const unreadNotificationsCount = useMemo(() => {
    return roleNotifications.filter((n) => !n.isRead).length;
  }, [roleNotifications]);

  const criticalNotificationsCount = useMemo(() => {
    return roleNotifications.filter((n) => !n.isRead && (n.priority === 'critical' || n.priority === 'urgent')).length;
  }, [roleNotifications]);

  const verifyClientAccess = useCallback(
    (resourceClientId?: string | null): boolean => {
      if (currentRole !== 'client') return true; // Admins and technicians have staff visibility
      if (!resourceClientId) return false;
      return resourceClientId === effectiveClientId;
    },
    [currentRole, effectiveClientId]
  );

  // Profile Mutators
  const updateUserProfile = (userData: Partial<User>) => {
    setCurrentUserState((prev) => ({ ...prev, ...userData }));
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...userData } : u))
    );

    // Sync to client profile if current user is client
    if (currentUser.role === 'client' && effectiveClientId) {
      setClientProfiles((prev) => {
        const existing = prev[effectiveClientId] || clientProfile;
        return {
          ...prev,
          [effectiveClientId]: {
            ...existing,
            contactPerson: userData.name || existing.contactPerson,
            email: userData.email || existing.email,
            phone: userData.phone || existing.phone,
            logo: userData.avatar || existing.logo,
            address: userData.address || existing.address,
            city: userData.city || existing.city,
            companyName: userData.companyName || existing.companyName,
          },
        };
      });
    }

    // Sync to technician record if current user is technician
    if (currentUser.role === 'technician' && activeTechnicianId) {
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === activeTechnicianId
            ? {
              ...t,
              name: userData.name || t.name,
              email: userData.email || t.email,
              phone: userData.phone || t.phone,
              avatar: userData.avatar || t.avatar,
            }
            : t
        )
      );
    }

    showToast('success', 'Profile Saved', 'Your personal account profile details have been saved.');
  };

  const updateTechnicianProfile = (techId: string, data: Partial<Technician>) => {
    setTechnicians((prev) =>
      prev.map((t) => (t.id === techId ? { ...t, ...data } : t))
    );
    if (currentUser.technicianId === techId || currentUser.id === techId) {
      setCurrentUserState((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        avatar: data.avatar || prev.avatar,
      }));
      setUsers((prev) =>
        prev.map((u) =>
          u.technicianId === techId || u.id === techId
            ? {
              ...u,
              name: data.name || u.name,
              email: data.email || u.email,
              phone: data.phone || u.phone,
              avatar: data.avatar || u.avatar,
            }
            : u
        )
      );
    }
    showToast('success', 'Technician Profile Saved', 'Field engineer credentials and vehicle details updated.');
  };

  const updateClientProfile = (profileData: Partial<ClientProfile>) => {
    setClientProfiles((prev) => {
      const existing = prev[effectiveClientId] || clientProfile;
      return {
        ...prev,
        [effectiveClientId]: {
          ...existing,
          ...profileData,
        },
      };
    });
    // Sync current user state
    setCurrentUserState((prev) => ({
      ...prev,
      name: profileData.contactPerson || profileData.companyName || prev.name,
      email: profileData.email || prev.email,
      phone: profileData.phone || prev.phone,
      avatar: profileData.logo || prev.avatar,
      address: profileData.address || prev.address,
      city: profileData.city || prev.city,
      companyName: profileData.companyName || prev.companyName,
    }));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id || u.clientId === effectiveClientId
          ? {
            ...u,
            name: profileData.contactPerson || profileData.companyName || u.name,
            email: profileData.email || u.email,
            phone: profileData.phone || u.phone,
            avatar: profileData.logo || u.avatar,
            address: profileData.address || u.address,
            city: profileData.city || u.city,
            companyName: profileData.companyName || u.companyName,
          }
          : u
      )
    );
    showToast('success', 'Profile Updated', 'Your client profile information has been saved successfully.');
  };

  const changeClientPassword = (oldPass: string, newPass: string): boolean => {
    if (!oldPass || !newPass) {
      showToast('error', 'Password Error', 'Please enter your current and new password.');
      return false;
    }
    if (newPass.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters long.');
      return false;
    }
    showToast('success', 'Password Changed', 'Your account password has been updated securely.');
    return true;
  };

  const rejectQuotation = (quoteId: string, reason?: string) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? {
            ...q,
            status: 'rejected',
            clientFeedback: reason || 'Rejected by client',
          }
          : q
      )
    );
    showToast('info', 'Quotation Rejected', 'Quotation has been marked as rejected.');
  };

  const requestQuoteClarification = (quoteId: string, notes: string) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? {
            ...q,
            status: 'clarification_requested',
            clarificationNotes: notes,
          }
          : q
      )
    );
    showToast('success', 'Clarification Sent', 'Your query has been sent to the service operations desk.');
  };

  const requestPmReschedule = (liftId: string, preferredDate: string, timeSlot: string, reason: string) => {
    const targetLift = lifts.find((l) => l.id === liftId);
    showToast(
      'success',
      'Reschedule Request Logged',
      `PM reschedule requested for ${targetLift?.liftNumber || 'Lift'} on ${preferredDate} (${timeSlot}). Our team will confirm shortly.`
    );
  };

  const markNotificationRead = useCallback((id: string) => {
    setAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setClientNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    playNotificationSound('markRead');
    apiService.markNotificationRead(id, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background markNotificationRead API sync:', err));
  }, [activeCompanyId, activeBranchId, currentRole, activeUserId]);

  const markAllNotificationsRead = useCallback(() => {
    const roleIds = new Set(roleNotifications.map((n) => n.id));
    setAppNotifications((prev) =>
      prev.map((n) => (roleIds.has(n.id) ? { ...n, isRead: true } : n))
    );
    setClientNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    playNotificationSound('markRead');
    showToast('success', 'All Caught Up!', 'All notifications marked as read.');
  }, [roleNotifications, showToast]);

  const deleteNotification = useCallback((id: string) => {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
    setClientNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    const roleIds = new Set(roleNotifications.map((n) => n.id));
    setAppNotifications((prev) => prev.filter((n) => !roleIds.has(n.id)));
    setClientNotifications((prev) =>
      prev.filter((n) => n.clientId !== effectiveClientId)
    );
    showToast('info', 'Notifications Cleared', 'All alerts have been cleared from your notification center.');
  }, [roleNotifications, effectiveClientId, showToast]);

  const addNotification = useCallback(
    (
      notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'> & { timestamp?: string; isRead?: boolean }
    ): AppNotification => {
      const newNotif: AppNotification = {
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: notif.timestamp || new Date().toISOString(),
        isRead: notif.isRead || false,
        ...notif,
      };

      setAppNotifications((prev) => [newNotif, ...prev]);

      if (notif.clientId) {
        const clientNotif: ClientNotification = {
          id: newNotif.id,
          clientId: notif.clientId,
          title: notif.title,
          message: notif.message,
          timestamp: newNotif.timestamp,
          category: (notif.category === 'emergency' ? 'complaint' : notif.category) as any,
          priority: notif.priority,
          isRead: false,
          actionTab: notif.actionTab,
          referenceId: notif.referenceId,
          buildingName: notif.buildingName,
          liftNumber: notif.liftNumber,
        };
        setClientNotifications((prev) => [clientNotif, ...prev]);
      }

      if (newNotif.priority === 'critical' || newNotif.priority === 'urgent') {
        playNotificationSound('urgent');
      } else {
        playNotificationSound('standard');
      }

      return newNotif;
    },
    []
  );

  // Complaints Mutator
  const createComplaint = (complaintData: Partial<Complaint>): Complaint => {
    const ticketId = 'tkt-' + Date.now();
    const count = complaints.length + 1;
    const ticketNumber = `TKT-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const targetLift = lifts.find((l) => l.id === complaintData.liftId);

    const newComplaint: Complaint = {
      id: ticketId,
      companyId: targetLift?.companyId || activeCompanyId,
      branchId: targetLift?.branchId || (activeBranchId !== 'all' ? activeBranchId : 'br-thn-1'),
      ticketNumber,
      liftId: complaintData.liftId || '',
      liftNumber: complaintData.liftNumber || targetLift?.liftNumber || 'LIFT-00',
      buildingId: complaintData.buildingId || targetLift?.buildingId || '',
      buildingName: complaintData.buildingName || targetLift?.buildingName || '',
      clientId: complaintData.clientId || targetLift?.clientId || currentUser.clientId || activeClientId || '',
      clientName: complaintData.clientName || targetLift?.clientName || currentUser.companyName || currentUser.name || 'Valued Society',
      clientPhone: complaintData.clientPhone || targetLift?.clientPhone || currentUser.phone || '',
      clientEmail: complaintData.clientEmail || currentUser.email || '',
      issueType: complaintData.issueType || 'lift_not_moving',
      title: complaintData.title || 'Lift Breakdown Reported',
      description: complaintData.description || '',
      priority: complaintData.priority || 'normal',
      isEmergency: !!complaintData.isEmergency,
      status: 'pending',
      reportedAt: new Date().toISOString(),
      partsReplaced: [],
      beforePhotos: [],
      afterPhotos: [],
      clientOtp: otp,
      timeline: [
        {
          id: 'tl-' + Date.now(),
          status: 'pending',
          title: complaintData.isEmergency ? 'EMERGENCY SOS REGISTERED' : 'Complaint Registered',
          description: `Ticket ${ticketNumber} raised by ${complaintData.clientName || 'Client'}.`,
          timestamp: new Date().toISOString(),
          actorName: currentUser.name,
          actorRole: currentRole,
        },
      ],
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    if (complaintData.liftId) {
      setLifts((prev) =>
        prev.map((lift) =>
          lift.id === complaintData.liftId
            ? { ...lift, currentStatus: complaintData.isEmergency ? 'breakdown' : 'under_maintenance' }
            : lift
        )
      );
    }

    addAuditLog({
      companyId: newComplaint.companyId,
      entityType: 'Complaint',
      entityId: newComplaint.id,
      action: 'CREATE_COMPLAINT',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Created complaint ${newComplaint.ticketNumber} for lift ${newComplaint.liftNumber}. Priority: ${newComplaint.priority}`,
    });

    // Cloud Database Persistence
    apiService.createComplaint(newComplaint, {
      companyId: newComplaint.companyId,
      branchId: newComplaint.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background createComplaint API sync:', err));

    addNotification({
      type: newComplaint.isEmergency ? 'emergency_breakdown' : 'complaint_assigned',
      category: newComplaint.isEmergency ? 'emergency' : 'complaint',
      priority: newComplaint.isEmergency ? 'critical' : (newComplaint.priority === 'high' ? 'high' : 'normal'),
      title: newComplaint.isEmergency ? `🚨 Emergency SOS: ${newComplaint.buildingName}` : `Breakdown Ticket #${newComplaint.ticketNumber}`,
      message: `${newComplaint.title} - ${newComplaint.buildingName} (${newComplaint.liftNumber}).`,
      targetRole: 'all',
      buildingName: newComplaint.buildingName,
      liftNumber: newComplaint.liftNumber,
      ticketNumber: newComplaint.ticketNumber,
      clientId: newComplaint.clientId,
      actionTab: 'complaints',
      actionLabel: 'View Ticket',
    });

    if (newComplaint.isEmergency) {
      showToast('emergency', '🚨 Emergency SOS Dispatched!', `Ticket ${ticketNumber} created. Priority escalated to CRITICAL.`);
    } else {
      showToast('success', 'Complaint Registered', `Ticket ${ticketNumber} created successfully.`);
    }

    return newComplaint;
  };

  const assignTechnician = (ticketId: string, technicianId: string, eta = '45 mins') => {
    const tech = technicians.find((t) => t.id === technicianId);
    if (!tech) return;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === ticketId) {
          const updatedTimeline = [
            ...(c.timeline || []),
            {
              id: 'tl-' + Date.now(),
              status: 'assigned' as ComplaintStatus,
              title: 'Technician Assigned',
              description: `Assigned to ${tech.name} (Code: ${tech.employeeCode}). Estimated ETA: ${eta}.`,
              timestamp: new Date().toISOString(),
              actorName: currentUser.name,
              actorRole: currentRole,
            },
          ];
          return {
            ...c,
            status: 'assigned',
            assignedTechnicianId: tech.id,
            assignedTechnicianName: tech.name,
            technicianPhone: tech.phone,
            technicianPhoto: tech.avatar,
            technicianEta: eta,
            assignedAt: new Date().toISOString(),
            timeline: updatedTimeline,
          };
        }
        return c;
      })
    );

    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === technicianId ? { ...t, currentStatus: 'traveling', activeJobId: ticketId } : t
      )
    );

    addAuditLog({
      companyId: activeCompanyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'ASSIGN_TECHNICIAN',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Assigned technician ${tech.name} to ticket ${ticketId}.`,
    });

    // Cloud Database Persistence
    apiService.assignTechnician(ticketId, tech.id, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background assignTechnician API sync:', err));

    const targetComp = complaints.find((c) => c.id === ticketId);
    addNotification({
      type: 'technician_dispatched',
      category: 'technician',
      priority: 'high',
      title: `👨‍🔧 Technician Dispatched: ${tech.name}`,
      message: `${tech.name} assigned to Ticket #${targetComp?.ticketNumber || ticketId} at ${targetComp?.buildingName || 'Building'} (ETA: ${eta}).`,
      targetRole: 'all',
      buildingName: targetComp?.buildingName,
      ticketNumber: targetComp?.ticketNumber,
      technicianId: tech.id,
      clientId: targetComp?.clientId,
      actionTab: 'complaints',
      actionLabel: 'Track Technician',
    });

    showToast('info', 'Technician Dispatched', `${tech.name} has been assigned (ETA: ${eta}).`);
  };

  const updateComplaintStatus = (ticketId: string, status: ComplaintStatus, extra?: Partial<Complaint>) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === ticketId) {
          const updatedTimeline = [
            ...(c.timeline || []),
            {
              id: 'tl-' + Date.now(),
              status,
              title: `Status: ${status.replace('_', ' ').toUpperCase()}`,
              description: extra?.diagnosisRemarks || `Ticket moved to ${status}.`,
              timestamp: new Date().toISOString(),
              actorName: currentUser.name,
              actorRole: currentRole,
            },
          ];
          return { ...c, status, ...extra, timeline: updatedTimeline };
        }
        return c;
      })
    );

    // Cloud Database Persistence
    apiService.updateComplaint(ticketId, { status, ...extra }, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background updateComplaint API sync:', err));
  };

  const checkInJob = (ticketId: string, gpsData?: { lat: number; lng: number; address: string; accuracy?: number }) => {
    const checkInTime = new Date().toISOString();
    const tech = technicians.find((t) => t.id === activeTechnicianId) || technicians[0];

    const gpsRecord: GPSCheckIn = {
      id: 'gps-' + Date.now(),
      companyId: activeCompanyId,
      ticketId,
      technicianId: tech.id,
      technicianName: tech.name,
      latitude: gpsData?.lat || 19.0762,
      longitude: gpsData?.lng || 72.9982,
      accuracyMeters: gpsData?.accuracy || 12,
      locationAddress: gpsData?.address || 'On Site GPS Verified',
      checkInTime,
      distanceFromSiteMeters: 15,
      isVerified: true,
    };

    setGpsCheckIns((prev) => [gpsRecord, ...prev]);

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === ticketId) {
          const updatedTimeline = [
            ...(c.timeline || []),
            {
              id: 'tl-' + Date.now(),
              status: 'inspection_repair' as ComplaintStatus,
              title: 'GPS Site Check-In Verified',
              description: `Technician arrived on site (${gpsRecord.latitude.toFixed(4)}° N, ${gpsRecord.longitude.toFixed(4)}° E). Inspection started.`,
              timestamp: checkInTime,
              actorName: tech.name,
              actorRole: 'Technician',
            },
          ];
          return {
            ...c,
            status: 'inspection_repair',
            checkInTime,
            timeline: updatedTimeline,
          };
        }
        return c;
      })
    );

    setTechnicians((prev) =>
      prev.map((t) => (t.id === tech.id ? { ...t, currentStatus: 'on_job' } : t))
    );

    addAuditLog({
      companyId: activeCompanyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'GPS_CHECK_IN',
      performedBy: tech.name,
      userRole: 'technician',
      details: `GPS check-in verified at coordinates ${gpsRecord.latitude}, ${gpsRecord.longitude}.`,
    });

    // Cloud Database Persistence
    apiService.recordGpsCheckIn(gpsRecord, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: 'technician',
      userId: tech.id,
    }).catch((err) => console.warn('[AppContext] Background GPS check-in API sync:', err));

    showToast('success', 'GPS Check-In Verified', `On-site arrival logged at ${new Date().toLocaleTimeString()}.`);
  };

  // Inventory Movement Recorder
  const recordInventoryMovement = (movement: Omit<InventoryMovement, 'id' | 'timestamp'>) => {
    const newMovement: InventoryMovement = {
      ...movement,
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
    };
    setInventoryMovements((prev) => [newMovement, ...prev]);

    // Update current stock on item
    setInventory((prev) =>
      prev.map((item) =>
        item.id === movement.partId
          ? { ...item, currentStock: movement.newStock }
          : item
      )
    );

    addAuditLog({
      companyId: movement.companyId,
      entityType: 'Inventory',
      entityId: movement.partId,
      action: movement.type,
      performedBy: movement.performedBy,
      userRole: currentRole,
      details: `Inventory ${movement.type}: ${movement.quantity > 0 ? '+' : ''}${movement.quantity} units of ${movement.partName}. New stock: ${movement.newStock}`,
    });

    // Cloud Database Persistence
    apiService.recordInventoryMovement(newMovement, {
      companyId: movement.companyId,
      branchId: movement.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background recordInventoryMovement API sync:', err));
  };

  const consumeInventoryPart = (partId: string, quantity: number, refId = 'MANUAL', techName = currentUser.name) => {
    const item = inventory.find((i) => i.id === partId);
    if (!item) return;
    const prevStock = item.currentStock;
    const newStock = Math.max(0, prevStock - quantity);

    recordInventoryMovement({
      companyId: item.companyId || activeCompanyId,
      branchId: item.branchId || 'br-thn-1',
      partId: item.id,
      partNumber: item.partNumber,
      partName: item.name,
      type: 'JOB_CONSUMPTION',
      quantity: -quantity,
      previousStock: prevStock,
      newStock,
      referenceId: refId,
      technicianName: techName,
      performedBy: currentUser.name,
      notes: `Consumed for job ${refId}.`,
    });
  };

  const restockInventoryPart = (partId: string, quantity: number, poNumber = 'PO-MANUAL') => {
    const item = inventory.find((i) => i.id === partId);
    if (!item) return;
    const prevStock = item.currentStock;
    const newStock = prevStock + quantity;

    recordInventoryMovement({
      companyId: item.companyId || activeCompanyId,
      branchId: item.branchId || 'br-thn-1',
      partId: item.id,
      partNumber: item.partNumber,
      partName: item.name,
      type: 'PURCHASE',
      quantity: quantity,
      previousStock: prevStock,
      newStock,
      referenceId: poNumber,
      performedBy: currentUser.name,
      notes: `Restock received under PO ${poNumber}.`,
    });

    showToast('success', 'Inventory Restocked', `Added ${quantity} units of ${item.name}.`);
  };

  const addNewInventoryItem = (itemData: Partial<InventoryItem>): InventoryItem => {
    const newItem: InventoryItem = {
      id: 'part-' + Date.now(),
      companyId: itemData.companyId || activeCompanyId,
      branchId: itemData.branchId || (activeBranchId !== 'all' ? activeBranchId : 'br-thn-1'),
      partNumber: itemData.partNumber || `WPS-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: itemData.name || 'New Spare Part',
      category: itemData.category || 'mechanical',
      currentStock: Number(itemData.currentStock) || 0,
      minStockThreshold: Number(itemData.minStockThreshold) || 2,
      unit: itemData.unit || 'Nos',
      purchasePrice: Number(itemData.purchasePrice) || 0,
      sellingPrice: Number(itemData.sellingPrice) || 0,
      hsnCode: itemData.hsnCode || '84313100',
      supplier: itemData.supplier || 'OEM Direct Supplier',
      locationRack: itemData.locationRack || 'Bay A-01',
      compatibleModels: itemData.compatibleModels || ['Universal / All Models'],
      imageUrl: itemData.imageUrl || 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    };

    setInventory((prev) => [newItem, ...prev]);

    if (newItem.currentStock > 0) {
      recordInventoryMovement({
        companyId: newItem.companyId,
        branchId: newItem.branchId,
        partId: newItem.id,
        partNumber: newItem.partNumber,
        partName: newItem.name,
        type: 'PURCHASE',
        quantity: newItem.currentStock,
        previousStock: 0,
        newStock: newItem.currentStock,
        referenceId: 'INITIAL-CATALOG-ENTRY',
        performedBy: currentUser.name,
        notes: `Initial catalog addition with ${newItem.currentStock} ${newItem.unit} opening stock.`,
      });
    }

    addAuditLog({
      companyId: newItem.companyId,
      entityType: 'Inventory',
      entityId: newItem.id,
      action: 'ADD_PART_TO_CATALOG',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Added new spare part ${newItem.partNumber} (${newItem.name}) with opening stock ${newItem.currentStock} ${newItem.unit}.`,
    });

    // Cloud Database Persistence
    apiService.createInventoryItem(newItem, {
      companyId: newItem.companyId,
      branchId: newItem.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background addNewInventoryItem API sync:', err));

    showToast('success', 'Part Added to Inventory', `Added ${newItem.name} (${newItem.partNumber}) to catalog.`);
    return newItem;
  };

  const updateInventoryItem = (partId: string, itemData: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === partId ? { ...item, ...itemData } : item))
    );

    // Cloud Database Persistence
    apiService.updateInventoryItem(partId, itemData, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background updateInventoryItem API sync:', err));

    showToast('info', 'Part Updated', 'Inventory specifications updated successfully.');
  };

  // Job Completion & PDF Service Report Generator
  const completeJobAndGenerateReport = (
    ticketId: string,
    data: {
      diagnosis: string;
      rootCause: string;
      actionTaken: string;
      partsReplaced: PartReplaced[];
      recommendations: string;
      liftOperatingStatus: 'Fully Operational & Safe' | 'Operational with Observation' | 'Shut Down (Parts Pending)';
      beforePhotos: string[];
      afterPhotos: string[];
      technicianSignature: string;
      clientSignature: string;
      clientOtpVerified: boolean;
    }
  ): ServiceReport => {
    const complaint = complaints.find((c) => c.id === ticketId);
    const lift = lifts.find((l) => l.id === complaint?.liftId);
    const tech = technicians.find((t) => t.id === complaint?.assignedTechnicianId) || technicians[0];

    const reportCount = serviceReports.length + 1;
    const reportNumber = `WPS-SR-${reportCount.toString().padStart(6, '0')}`;
    const reportId = 'sr-' + Date.now();
    const now = new Date().toISOString();

    const report: ServiceReport = {
      id: reportId,
      companyId: complaint?.companyId || activeCompanyId,
      branchId: complaint?.branchId || 'br-thn-1',
      clientId: complaint?.clientId || lift?.clientId || currentUser.clientId || activeClientId || '',
      reportNumber,
      ticketId,
      ticketNumber: complaint?.ticketNumber || 'TKT-000',
      liftId: lift?.id || complaint?.liftId || '',
      liftNumber: lift?.liftNumber || complaint?.liftNumber || 'WEP-LIFT',
      liftBrand: lift?.brand || 'WEPSUN Elevator',
      liftModel: lift?.model || 'MRL Series',
      buildingName: complaint?.buildingName || lift?.buildingName || '',
      buildingAddress: lift?.locationDetails || 'Building Premises',
      clientName: complaint?.clientName || 'Client',
      clientContact: complaint?.clientPhone || '',
      technicianId: tech.id,
      technicianName: tech.name,
      technicianPhone: tech.phone,
      serviceDate: new Date().toISOString().split('T')[0],
      serviceStartTime: complaint?.checkInTime ? new Date(complaint.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00',
      serviceEndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      serviceType: complaint?.isEmergency ? 'Emergency Call' : 'Breakdown Repair',
      initialDiagnosis: data.diagnosis,
      rootCause: data.rootCause,
      workPerformed: data.actionTaken,
      partsReplaced: data.partsReplaced,
      technicianRecommendations: data.recommendations,
      liftOperatingStatusAfterWork: data.liftOperatingStatus,
      beforePhotos: data.beforePhotos,
      afterPhotos: data.afterPhotos,
      technicianSignature: data.technicianSignature,
      clientSignature: data.clientSignature,
      clientOtpVerified: data.clientOtpVerified,
      createdAt: now,
    };

    // Deduct parts from inventory ledger automatically
    data.partsReplaced.forEach((part) => {
      consumeInventoryPart(part.partId, part.quantity, complaint?.ticketNumber, tech.name);
    });

    setServiceReports((prev) => [report, ...prev]);

    // Close / Resolve Complaint
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === ticketId) {
          const updatedTimeline = [
            ...(c.timeline || []),
            {
              id: 'tl-' + Date.now(),
              status: 'closed' as ComplaintStatus,
              title: 'Job Completed & Report Generated',
              description: `Service Report ${reportNumber} signed and archived. Status: ${data.liftOperatingStatus}.`,
              timestamp: now,
              actorName: tech.name,
              actorRole: 'Technician',
            },
          ];
          return {
            ...c,
            status: 'closed',
            checkOutTime: now,
            diagnosisRemarks: data.diagnosis,
            actionTaken: data.actionTaken,
            partsReplaced: data.partsReplaced,
            beforePhotos: data.beforePhotos,
            afterPhotos: data.afterPhotos,
            technicianSignature: data.technicianSignature,
            clientSignature: data.clientSignature,
            serviceReportId: reportId,
            closedAt: now,
            timeline: updatedTimeline,
          };
        }
        return c;
      })
    );

    // Update lift status
    if (lift) {
      setLifts((prev) =>
        prev.map((l) =>
          l.id === lift.id
            ? {
              ...l,
              currentStatus: data.liftOperatingStatus === 'Shut Down (Parts Pending)' ? 'breakdown' : 'operational',
              lastPmDate: new Date().toISOString().split('T')[0],
            }
            : l
        )
      );
    }

    // Set technician available
    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === tech.id
          ? {
            ...t,
            currentStatus: 'available',
            activeJobId: undefined,
            totalResolved: t.totalResolved + 1,
          }
          : t
      )
    );

    addAuditLog({
      companyId: report.companyId,
      entityType: 'Complaint',
      entityId: ticketId,
      action: 'COMPLETE_JOB_REPORT',
      performedBy: tech.name,
      userRole: 'technician',
      details: `Generated Service Report ${reportNumber} for ticket ${complaint?.ticketNumber}. Replaced ${data.partsReplaced.length} parts.`,
    });

    // Cloud Database Persistence
    apiService.createServiceReport(report, {
      companyId: report.companyId,
      branchId: report.branchId,
      userRole: 'technician',
      userId: tech.id,
    }).catch((err) => console.warn('[AppContext] Background createServiceReport API sync:', err));

    showToast('success', 'Service Report Created', `Report ${reportNumber} generated. Client notified.`);
    return report;
  };

  // PM Record Mutator
  const submitPmRecord = (recordData: Partial<PmRecord>): PmRecord => {
    const pmCount = pmRecords.length + 1;
    const pmNumber = `PM-${new Date().getFullYear()}-${pmCount.toString().padStart(4, '0')}`;
    const nextPmDate = new Date();
    nextPmDate.setMonth(nextPmDate.getMonth() + 1);

    const targetLift = lifts.find((l) => l.id === recordData.liftId);

    const newRecord: PmRecord = {
      id: 'pm-' + Date.now(),
      companyId: targetLift?.companyId || activeCompanyId,
      branchId: targetLift?.branchId || 'br-thn-1',
      pmNumber,
      liftId: recordData.liftId || '',
      liftNumber: recordData.liftNumber || targetLift?.liftNumber || '',
      buildingName: recordData.buildingName || targetLift?.buildingName || '',
      clientName: recordData.clientName || targetLift?.clientName || '',
      technicianId: recordData.technicianId || activeTechnicianId,
      technicianName: recordData.technicianName || 'Rajesh Sharma',
      date: new Date().toISOString().split('T')[0],
      items: recordData.items || [],
      overallStatus: recordData.overallStatus || 'passed',
      remarks: recordData.remarks || 'Monthly preventive maintenance visit completed.',
      technicianSignature: recordData.technicianSignature || 'Rajesh Sharma (Verified Tech)',
      clientSignature: recordData.clientSignature,
      nextPmDate: nextPmDate.toISOString().split('T')[0],
    };

    setPmRecords((prev) => [newRecord, ...prev]);

    if (recordData.liftId) {
      setLifts((prev) =>
        prev.map((l) =>
          l.id === recordData.liftId
            ? {
              ...l,
              lastPmDate: newRecord.date,
              nextPmDate: newRecord.nextPmDate,
              currentStatus: newRecord.overallStatus === 'critical_issues' ? 'inspection_required' : 'operational',
            }
            : l
        )
      );
    }

    addAuditLog({
      companyId: newRecord.companyId,
      entityType: 'Lift',
      entityId: newRecord.liftId,
      action: 'PM_INSPECTION_SUBMITTED',
      performedBy: newRecord.technicianName,
      userRole: 'technician',
      details: `Submitted PM Checklist ${pmNumber}. Status: ${newRecord.overallStatus}. Next PM: ${newRecord.nextPmDate}`,
    });

    // Cloud Database Persistence
    apiService.submitPmExecution(newRecord, {
      companyId: newRecord.companyId,
      branchId: newRecord.branchId,
      userRole: 'technician',
      userId: newRecord.technicianId,
    }).catch((err) => console.warn('[AppContext] Background submitPmRecord API sync:', err));

    showToast('success', 'PM Checklist Submitted', `Routine maintenance ${pmNumber} logged successfully.`);
    return newRecord;
  };

  // Quotation Mutators
  const createQuotation = (quoteData: Partial<Quotation>): Quotation => {
    const quoteCount = quotations.length + 1;
    const quoteNumber = `QT-WEP-${new Date().getFullYear()}-${quoteCount.toString().padStart(3, '0')}`;
    const subtotal = (quoteData.items || []).reduce((acc, item) => acc + item.amount, 0);
    const gstRate = 18;
    const gstAmount = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + gstAmount;

    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);

    const newQuote: Quotation = {
      id: 'qt-' + Date.now(),
      companyId: activeCompanyId,
      branchId: activeBranchId !== 'all' ? activeBranchId : 'br-thn-1',
      quoteNumber,
      complaintId: quoteData.complaintId,
      liftId: quoteData.liftId || '',
      liftNumber: quoteData.liftNumber || '',
      buildingName: quoteData.buildingName || '',
      clientId: quoteData.clientId || (currentRole === 'client' ? (currentUser.clientId || effectiveClientId) : (activeClientId || '')),
      clientName: quoteData.clientName || (currentRole === 'client' ? (currentUser.companyName || currentUser.name || 'Valued Society') : 'Valued Society'),
      clientEmail: quoteData.clientEmail || (currentRole === 'client' ? currentUser.email : ''),
      clientPhone: quoteData.clientPhone || (currentRole === 'client' ? (currentUser.phone || '') : ''),
      subject: quoteData.subject || 'Lift Repair & Spare Parts Quotation',
      items: quoteData.items || [],
      subtotal,
      gstRate,
      gstAmount,
      grandTotal,
      terms: quoteData.terms || [
        '1. Prices are valid for 30 days.',
        '2. Payment: 50% advance, balance upon signoff.',
        '3. Replaced parts carry 12-Month replacement warranty.',
      ],
      status: 'sent_to_client',
      createdAt: new Date().toISOString(),
      validUntil: validDate.toISOString().split('T')[0],
    };

    setQuotations((prev) => [newQuote, ...prev]);

    addAuditLog({
      companyId: newQuote.companyId,
      entityType: 'Quotation',
      entityId: newQuote.id,
      action: 'CREATE_QUOTATION',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Generated quotation ${quoteNumber} for ₹${grandTotal.toLocaleString('en-IN')}.`,
    });

    // Cloud Database Persistence
    apiService.createQuotation(newQuote, {
      companyId: newQuote.companyId,
      branchId: newQuote.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background createQuotation API sync:', err));

    showToast('success', 'Quotation Issued', `Quotation ${quoteNumber} sent to client.`);
    return newQuote;
  };

  const updateQuotationStatus = (quoteId: string, status: QuotationStatus, notes?: string) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? {
            ...q,
            status,
            clarificationNotes: notes || q.clarificationNotes,
          }
          : q
      )
    );

    // Cloud Database Persistence
    apiService.updateQuotationStatus(quoteId, status, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background updateQuotationStatus API sync:', err));
  };

  const approveQuotation = (quoteId: string) => {
    const quote = quotations.find((q) => q.id === quoteId);
    if (!quote) return;

    updateQuotationStatus(quoteId, 'approved');
    addNotification({
      type: 'quotation_approved',
      category: 'quotation',
      priority: 'normal',
      title: `📝 Quotation #${quote.quoteNumber} Approved`,
      message: `Quotation approved for ${quote.buildingName}. Total: ₹${quote.grandTotal.toLocaleString('en-IN')}. Work order generated.`,
      targetRole: 'all',
      clientId: quote.clientId,
      buildingName: quote.buildingName,
      referenceId: quote.id,
      amount: quote.grandTotal,
      actionTab: 'quotations',
      actionLabel: 'View Quotation',
    });
    showToast('success', 'Quotation Approved', `Quotation ${quote.quoteNumber} has been approved.`);
  };

  // Convert Quotation -> Work Order -> Generate Invoice
  const convertQuotationToWorkOrder = (quoteId: string, technicianId?: string, scheduledDate?: string): WorkOrder => {
    const quote = quotations.find((q) => q.id === quoteId);
    const tech = technicians.find((t) => t.id === technicianId) || technicians[0];
    const woCount = workOrders.length + 1;
    const workOrderNumber = `WO-${new Date().getFullYear()}-${woCount.toString().padStart(4, '0')}`;
    const invCount = invoices.length + 1;
    const invoiceNumber = `INV-WEP-${new Date().getFullYear()}-${invCount.toString().padStart(3, '0')}`;

    const workOrderId = 'wo-' + Date.now();
    const invoiceId = 'inv-' + Date.now();

    const newWorkOrder: WorkOrder = {
      id: workOrderId,
      companyId: quote?.companyId || activeCompanyId,
      branchId: quote?.branchId || 'br-thn-1',
      workOrderNumber,
      quotationId: quoteId,
      complaintId: quote?.complaintId,
      liftId: quote?.liftId || '',
      liftNumber: quote?.liftNumber || '',
      buildingName: quote?.buildingName || '',
      clientId: quote?.clientId || '',
      clientName: quote?.clientName || '',
      technicianId: tech?.id,
      technicianName: tech?.name,
      title: `Execution: ${quote?.subject || 'Approved Lift Repair'}`,
      description: `Field execution of approved quotation ${quote?.quoteNumber}. Total: ₹${quote?.grandTotal.toLocaleString('en-IN')}`,
      priority: 'high',
      status: 'assigned',
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      estimatedHours: 4,
      totalAmount: quote?.grandTotal || 0,
      invoiceId: invoiceId,
      createdAt: new Date().toISOString(),
      remarks: `Assigned to ${tech?.name}.`,
    };

    // Auto-generate invoice
    const newInvoice: Invoice = {
      id: invoiceId,
      companyId: quote?.companyId || activeCompanyId,
      branchId: quote?.branchId || 'br-thn-1',
      invoiceNumber,
      clientId: quote?.clientId || '',
      clientName: quote?.clientName || '',
      buildingName: quote?.buildingName || '',
      type: 'Parts Replacement',
      relatedQuoteId: quoteId,
      relatedWorkOrderId: workOrderId,
      subtotal: quote?.subtotal || 0,
      gstAmount: quote?.gstAmount || 0,
      grandTotal: quote?.grandTotal || 0,
      paidAmount: 0,
      status: 'pending',
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      invoiceDate: new Date().toISOString().split('T')[0],
    };

    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    // Update quotation reference
    setQuotations((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'converted_to_work_order', convertedToWorkOrderId: workOrderId } : q))
    );

    addAuditLog({
      companyId: newWorkOrder.companyId,
      entityType: 'Quotation',
      entityId: quoteId,
      action: 'CONVERT_TO_WORK_ORDER',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Converted quote ${quote?.quoteNumber} to Work Order ${workOrderNumber} and generated Invoice ${invoiceNumber}.`,
    });

    // Cloud Database Persistence
    apiService.convertQuotationToWorkOrder(quoteId, tech?.id, {
      companyId: newWorkOrder.companyId,
      branchId: newWorkOrder.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background convertQuotationToWorkOrder API sync:', err));

    showToast('success', 'Work Order Created', `Converted to ${workOrderNumber} and Invoice ${invoiceNumber} issued.`);
    return newWorkOrder;
  };

  const createWorkOrder = (orderData: Partial<WorkOrder>): WorkOrder => {
    const count = workOrders.length + 1;
    const workOrderNumber = `WO-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    const newOrder: WorkOrder = {
      id: 'wo-' + Date.now(),
      companyId: activeCompanyId,
      branchId: activeBranchId !== 'all' ? activeBranchId : 'br-thn-1',
      workOrderNumber,
      quotationId: orderData.quotationId,
      complaintId: orderData.complaintId,
      liftId: orderData.liftId || '',
      liftNumber: orderData.liftNumber || '',
      buildingName: orderData.buildingName || '',
      clientId: orderData.clientId || (currentRole === 'client' ? (currentUser.clientId || effectiveClientId) : (activeClientId || '')),
      clientName: orderData.clientName || (currentRole === 'client' ? (currentUser.companyName || currentUser.name || '') : ''),
      technicianId: orderData.technicianId,
      technicianName: orderData.technicianName,
      title: orderData.title || 'Field Work Order',
      description: orderData.description || '',
      priority: orderData.priority || 'medium',
      status: 'scheduled',
      scheduledDate: orderData.scheduledDate || new Date().toISOString().split('T')[0],
      estimatedHours: orderData.estimatedHours || 3,
      totalAmount: orderData.totalAmount || 0,
      createdAt: new Date().toISOString(),
    };
    setWorkOrders((prev) => [newOrder, ...prev]);

    // Cloud Database Persistence
    apiService.createWorkOrder(newOrder, {
      companyId: newOrder.companyId,
      branchId: newOrder.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background createWorkOrder API sync:', err));

    return newOrder;
  };

  const updateWorkOrderStatus = (workOrderId: string, status: WorkOrderStatus, extra?: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((w) => (w.id === workOrderId ? { ...w, status, ...extra } : w))
    );

    // Cloud Database Persistence
    apiService.updateWorkOrderStatus(workOrderId, status, extra, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background updateWorkOrderStatus API sync:', err));
  };

  // Invoices & Payments
  const payInvoice = (invoiceId: string, method: 'UPI / QR' | 'NEFT / RTGS' | 'Credit Card' | 'Cheque', txId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
            ...inv,
            status: 'paid',
            paidAmount: inv.grandTotal,
            paymentMethod: method,
            transactionId: txId,
          }
          : inv
      )
    );

    addAuditLog({
      companyId: activeCompanyId,
      entityType: 'Invoice',
      entityId: invoiceId,
      action: 'PAYMENT_RECEIVED',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Payment received via ${method} (Tx: ${txId}). Invoice marked as PAID.`,
    });

    // Cloud Database Persistence
    apiService.payInvoice(invoiceId, method, txId, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background payInvoice API sync:', err));

    const targetInv = invoices.find((inv) => inv.id === invoiceId);
    if (targetInv) {
      addNotification({
        type: 'payment_received',
        category: 'payment',
        priority: 'normal',
        title: `💰 Payment Received: ₹${targetInv.grandTotal.toLocaleString('en-IN')}`,
        message: `Invoice #${targetInv.invoiceNumber} for ${targetInv.buildingName} settled via ${method}.`,
        targetRole: 'all',
        clientId: targetInv.clientId,
        buildingName: targetInv.buildingName,
        referenceId: targetInv.id,
        amount: targetInv.grandTotal,
        actionTab: 'invoices',
        actionLabel: 'View Receipt',
      });
    }

    showToast('success', 'Payment Successful', `Verified transaction ${txId}. Receipt emailed.`);
  };

  // Lift Registry Mutators
  const addNewLift = (liftData: Partial<Lift>): Lift => {
    const liftCount = lifts.length + 1;
    const liftNumber = liftData.liftNumber || `WPS-PUN-${liftCount.toString().padStart(6, '0')}`;
    const qrToken = `wep-token-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newLift: Lift = {
      id: 'lift-' + Date.now(),
      companyId: liftData.companyId || activeCompanyId,
      branchId: liftData.branchId || (activeBranchId !== 'all' ? activeBranchId : 'br-thn-1'),
      liftNumber,
      buildingId: liftData.buildingId || (buildings.length > 0 ? buildings[0].id : 'bld-1'),
      buildingName: liftData.buildingName || (buildings.length > 0 ? buildings[0].name : 'Primary Premises'),
      clientId: liftData.clientId || (currentRole === 'client' ? (currentUser.clientId || effectiveClientId) : (activeClientId || '')),
      clientName: liftData.clientName || (currentRole === 'client' ? (currentUser.companyName || currentUser.name || 'Valued Client') : 'Valued Client'),
      clientPhone: liftData.clientPhone || (currentRole === 'client' ? (currentUser.phone || '+91 98200 00000') : '+91 98200 00000'),
      brand: liftData.brand || 'WEPSUN MRL Traction',
      model: liftData.model || 'WEP-MAX 3000 Eco',
      type: liftData.type || 'Passenger',
      capacityPersons: liftData.capacityPersons || 8,
      capacityKg: liftData.capacityKg || 544,
      speedMps: liftData.speedMps || 1.5,
      floors: liftData.floors || 'G + 10 Floors',
      stops: liftData.stops || 11,
      machineType: liftData.machineType || 'Gearless PMSM',
      motorKw: liftData.motorKw || 5.5,
      controllerBrand: liftData.controllerBrand || 'Monarch NICE 3000+',
      doorOperator: liftData.doorOperator || 'Fermator VVVF4+',
      ardSystem: liftData.ardSystem || 'WEPSUN Smart ARD 15kVA',
      governorSpeed: liftData.governorSpeed || 1.75,
      ropeDiaMm: liftData.ropeDiaMm || 10,
      installationDate: liftData.installationDate || new Date().toISOString().split('T')[0],
      warrantyExpiry: liftData.warrantyExpiry || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      currentStatus: 'operational',
      amcStatus: 'unassigned',
      lastPmDate: new Date().toISOString().split('T')[0],
      nextPmDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      qrCodeData: liftNumber,
      qrToken,
      safetyCertificateNumber: `MH-EI-LIFT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      safetyCertificateExpiry: new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0],
      locationDetails: liftData.locationDetails || 'Main Passenger Shaft',
    };

    setLifts((prev) => [...prev, newLift]);

    addAuditLog({
      companyId: newLift.companyId,
      entityType: 'Lift',
      entityId: newLift.id,
      action: 'ADD_NEW_LIFT',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Added new lift ${newLift.liftNumber} at ${newLift.buildingName}. Generated QR Token.`,
    });

    // Cloud Database Persistence
    apiService.createLift(newLift, {
      companyId: newLift.companyId,
      branchId: newLift.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background addNewLift API sync:', err));

    showToast('success', 'Lift Registered', `Lift Digital Passport created for ${newLift.liftNumber}.`);
    return newLift;
  };

  const updateLift = (liftId: string, liftData: Partial<Lift>) => {
    setLifts((prev) =>
      prev.map((lift) => (lift.id === liftId ? { ...lift, ...liftData } : lift))
    );

    // Cloud Database Persistence
    if (liftData.currentStatus) {
      apiService.updateLiftStatus(liftId, liftData.currentStatus, {
        companyId: activeCompanyId,
        branchId: activeBranchId,
        userRole: currentRole,
        userId: activeUserId,
      }).catch((err) => console.warn('[AppContext] Background updateLiftStatus API sync:', err));
    }

    showToast('info', 'Lift Updated', 'Digital Passport details updated.');
  };

  // Building Registry Mutators
  const addNewBuilding = (buildingData: Partial<Building>): Building => {
    const newBuilding: Building = {
      id: 'bld-' + Date.now(),
      companyId: buildingData.companyId || activeCompanyId,
      branchId: buildingData.branchId || (activeBranchId !== 'all' ? activeBranchId : 'br-thn-1'),
      name: buildingData.name || 'New Building Complex',
      address: buildingData.address || 'Address Details',
      landmark: buildingData.landmark || '',
      city: buildingData.city || 'Mumbai',
      pinCode: buildingData.pinCode || '400001',
      contactPerson: buildingData.contactPerson || 'Building Secretary / Manager',
      contactPhone: buildingData.contactPhone || '+91 98200 00000',
      clientId: buildingData.clientId || (currentRole === 'client' ? (currentUser.clientId || effectiveClientId) : (activeClientId || '')),
      clientName: buildingData.clientName || (currentRole === 'client' ? (currentUser.companyName || currentUser.name || 'Client / Society Organization') : 'Client / Society Organization'),
      totalLifts: buildingData.totalLifts || 0,
      liftIds: buildingData.liftIds || [],
      lat: buildingData.lat || 19.076,
      lng: buildingData.lng || 72.8777,
    };

    setBuildings((prev) => [newBuilding, ...prev]);

    addAuditLog({
      companyId: newBuilding.companyId,
      entityType: 'Building',
      entityId: newBuilding.id,
      action: 'ADD_NEW_BUILDING',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Registered building "${newBuilding.name}" for client "${newBuilding.clientName}".`,
    });

    showToast('success', 'Building Registered', `"${newBuilding.name}" added successfully.`);
    return newBuilding;
  };

  const updateBuilding = (buildingId: string, buildingData: Partial<Building>) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, ...buildingData } : b))
    );
    addAuditLog({
      companyId: activeCompanyId,
      entityType: 'Building',
      entityId: buildingId,
      action: 'UPDATE_BUILDING',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Updated building profile details for ID ${buildingId}.`,
    });
    showToast('info', 'Building Updated', 'Building records updated.');
  };

  // AMC Mutators
  const createAmcContract = (contractData: Partial<AmcContract>): AmcContract => {
    const amcCount = amcContracts.length + 1;
    const contractNumber = `AMC-WEP-${new Date().getFullYear()}-${amcCount.toString().padStart(3, '0')}`;
    const contractValue = contractData.contractValue || 150000;
    const gstRate = 18;
    const gstAmount = Math.round(contractValue * 0.18);
    const totalAmount = contractValue + gstAmount;

    const newAmc: AmcContract = {
      id: 'amc-' + Date.now(),
      companyId: activeCompanyId,
      branchId: activeBranchId !== 'all' ? activeBranchId : 'br-thn-1',
      contractNumber,
      clientId: contractData.clientId || (currentRole === 'client' ? (currentUser.clientId || effectiveClientId) : (activeClientId || '')),
      clientName: contractData.clientName || (currentRole === 'client' ? (currentUser.companyName || currentUser.name || 'Valued Society') : 'Valued Society'),
      buildingId: contractData.buildingId || 'bld-1',
      buildingName: contractData.buildingName || 'Greenwood Heights CHS',
      liftIds: contractData.liftIds || ['lift-1'],
      amcType: contractData.amcType || 'Comprehensive',
      startDate: contractData.startDate || new Date().toISOString().split('T')[0],
      endDate: contractData.endDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      contractValue,
      gstRate,
      gstAmount,
      totalAmount,
      paymentStatus: 'pending',
      coveredParts: contractData.coveredParts || ['Inverter Drive', 'Motherboard', 'Light Curtain', 'PM Visits'],
      excludedParts: contractData.excludedParts || ['Cabin Aesthetics', 'Civil Works'],
      pmFrequency: contractData.pmFrequency || 'Monthly (12 Visits/Year)',
      pmVisitsDone: 0,
      pmVisitsTotal: 12,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0],
    };

    setAmcContracts((prev) => [newAmc, ...prev]);

    // Update lifts
    if (newAmc.liftIds) {
      setLifts((prev) =>
        prev.map((l) =>
          newAmc.liftIds.includes(l.id)
            ? { ...l, amcStatus: 'active', activeAmcId: newAmc.id }
            : l
        )
      );
    }

    addAuditLog({
      companyId: newAmc.companyId,
      entityType: 'AmcContract',
      entityId: newAmc.id,
      action: 'CREATE_AMC_CONTRACT',
      performedBy: currentUser.name,
      userRole: currentRole,
      details: `Created AMC Contract ${contractNumber} for ${newAmc.buildingName}. Total: ₹${totalAmount.toLocaleString('en-IN')}`,
    });

    // Cloud Database Persistence
    apiService.createAmcContract(newAmc, {
      companyId: newAmc.companyId,
      branchId: newAmc.branchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background createAmcContract API sync:', err));

    showToast('success', 'AMC Activated', `Contract ${contractNumber} generated successfully.`);
    return newAmc;
  };

  const renewAmcContract = (contractId: string, newEndDate: string) => {
    setAmcContracts((prev) =>
      prev.map((amc) =>
        amc.id === contractId ? { ...amc, endDate: newEndDate, status: 'active' } : amc
      )
    );

    // Cloud Database Persistence
    apiService.renewAmcContract(contractId, { newEndDate }, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background renewAmcContract API sync:', err));

    showToast('success', 'AMC Renewed', `Contract validity extended to ${newEndDate}.`);
  };

  const submitBusinessEnquiry = (enquiry: Partial<BusinessEnquiry>): BusinessEnquiry => {
    const newEnq: BusinessEnquiry = {
      id: 'enq-' + Date.now(),
      companyId: activeCompanyId,
      clientName: enquiry.clientName || 'Prospect',
      phone: enquiry.phone || '',
      email: enquiry.email || '',
      societyOrBuilding: enquiry.societyOrBuilding || '',
      city: enquiry.city || 'Mumbai',
      enquiryType: enquiry.enquiryType || 'AMC Contract Quotation',
      numberOfLifts: enquiry.numberOfLifts || 1,
      numberOfFloors: enquiry.numberOfFloors || 10,
      message: enquiry.message || '',
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    setEnquiries((prev) => [newEnq, ...prev]);

    // Cloud Database Persistence
    apiService.submitBusinessEnquiry(newEnq, {
      companyId: activeCompanyId,
      skipAuth: true,
    }).catch((err) => console.warn('[AppContext] Background submitBusinessEnquiry API sync:', err));

    showToast('success', 'Enquiry Received', 'Our sales engineering team will connect within 2 business hours.');
    return newEnq;
  };

  const rateService = (ticketId: string, rating: number, feedback: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === ticketId ? { ...c, clientRating: rating, clientFeedback: feedback } : c))
    );
    setServiceReports((prev) =>
      prev.map((r) => (r.ticketId === ticketId ? { ...r, clientRating: rating, clientFeedback: feedback } : r))
    );

    // Also create a feedback item
    const targetComp = complaints.find(c => c.id === ticketId);
    if (targetComp) {
      submitCustomerFeedback({
        ticketId: targetComp.id,
        ticketNumber: targetComp.ticketNumber,
        liftId: targetComp.liftId,
        liftNumber: targetComp.liftNumber,
        buildingName: targetComp.buildingName,
        clientId: targetComp.clientId,
        clientName: targetComp.clientName,
        technicianId: targetComp.assignedTechnicianId,
        technicianName: targetComp.assignedTechnicianName,
        overallRating: rating,
        comments: feedback,
        serviceType: 'Breakdown Resolution',
      });
    } else {
      showToast('success', 'Feedback Submitted', `Thank you for rating our service ${rating}/5 stars!`);
    }
  };

  const submitCustomerFeedback = (feedbackData: Partial<CustomerFeedback>): CustomerFeedback => {
    const newFeedback: CustomerFeedback = {
      id: 'fb-' + Date.now(),
      companyId: feedbackData.companyId || activeCompanyId,
      branchId: feedbackData.branchId || (activeBranchId !== 'all' ? activeBranchId : 'br-thn-1'),
      ticketId: feedbackData.ticketId,
      ticketNumber: feedbackData.ticketNumber,
      serviceReportId: feedbackData.serviceReportId,
      liftId: feedbackData.liftId || '',
      liftNumber: feedbackData.liftNumber || 'WPS-LIFT-01',
      buildingName: feedbackData.buildingName || 'Building Complex',
      clientId: feedbackData.clientId || (currentRole === 'client' ? (currentUser.clientId || effectiveClientId) : (activeClientId || '')),
      clientName: feedbackData.clientName || currentUser.name || 'Valued Client',
      clientPhone: feedbackData.clientPhone || currentUser.phone,
      technicianId: feedbackData.technicianId,
      technicianName: feedbackData.technicianName,
      overallRating: feedbackData.overallRating || 5,
      ratingsBreakdown: feedbackData.ratingsBreakdown || {
        punctuality: 5,
        technicalSkill: 5,
        communication: 5,
        rideSmoothness: 5,
      },
      serviceType: feedbackData.serviceType || 'Breakdown Resolution',
      tags: feedbackData.tags || [],
      comments: feedbackData.comments || '',
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    setFeedbacks((prev) => [newFeedback, ...prev]);

    if (newFeedback.ticketId) {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === newFeedback.ticketId
            ? { ...c, clientRating: newFeedback.overallRating, clientFeedback: newFeedback.comments }
            : c
        )
      );
    }

    addAuditLog({
      companyId: newFeedback.companyId,
      entityType: 'Complaint',
      entityId: newFeedback.id,
      action: 'CUSTOMER_FEEDBACK_SUBMITTED',
      performedBy: newFeedback.clientName,
      userRole: 'client',
      details: `Customer submitted ${newFeedback.overallRating}★ rating for Lift ${newFeedback.liftNumber} (${newFeedback.buildingName})`,
    });

    // Cloud Database Persistence
    apiService.submitCustomerFeedback(newFeedback, {
      companyId: newFeedback.companyId,
      branchId: newFeedback.branchId,
      userRole: 'client',
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background submitCustomerFeedback API sync:', err));

    showToast('success', 'Review Recorded', `Thank you for rating WEPSUN ${newFeedback.overallRating}/5 stars!`);
    return newFeedback;
  };

  const replyToCustomerFeedback = (feedbackId: string, replyMessage: string) => {
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId
          ? {
            ...fb,
            status: 'action_taken',
            adminReply: {
              message: replyMessage,
              repliedBy: currentUser.name || 'Service Manager',
              repliedAt: new Date().toISOString(),
            },
          }
          : fb
      )
    );

    // Cloud Database Persistence
    apiService.replyFeedback(feedbackId, replyMessage, currentUser.name, {
      companyId: activeCompanyId,
      branchId: activeBranchId,
      userRole: currentRole,
      userId: activeUserId,
    }).catch((err) => console.warn('[AppContext] Background replyFeedback API sync:', err));

    showToast('success', 'Reply Sent', 'Your response has been published to the client review.');
  };

  const updateFeedbackStatus = (feedbackId: string, status: CustomerFeedback['status']) => {
    setFeedbacks((prev) =>
      prev.map((fb) => (fb.id === feedbackId ? { ...fb, status } : fb))
    );
    showToast('info', 'Feedback Status Updated', `Status updated to ${status}.`);
  };

  const resetDemoData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        companies,
        activeCompanyId,
        setActiveCompanyId,
        activeCompany,
        branches,
        activeBranchId,
        setActiveBranchId,
        currentRole,
        setCurrentRole,
        currentUser,
        users,
        demoAccounts,
        loginAsUser,
        logout,
        isAuthenticated,
        isAuthLoading,
        isMasterAuthenticated,
        activeClientId,
        setActiveClientId,
        activeTechnicianId,
        setActiveTechnicianId,
        buildings,
        lifts,
        technicians,
        complaints,
        pmRecords,
        amcContracts,
        quotations,
        workOrders,
        invoices,
        inventory,
        inventoryMovements,
        serviceReports,
        feedbacks,
        aiErrorCodes,
        enquiries,
        auditLogs,
        gpsCheckIns,
        tenantBuildings,
        tenantLifts,
        tenantTechnicians,
        tenantComplaints,
        tenantAmcContracts,
        tenantQuotations,
        tenantWorkOrders,
        tenantInvoices,
        tenantInventory,
        tenantMovements,
        tenantReports,
        tenantFeedbacks,
        tenantAuditLogs,
        clientScopedBuildings,
        clientScopedLifts,
        clientScopedComplaints,
        clientScopedAmcContracts,
        clientScopedQuotations,
        clientScopedInvoices,
        clientScopedReports,
        clientScopedPmRecords,
        clientScopedFeedbacks,
        clientScopedPartsHistory,
        clientScopedNotifications,
        clientProfile,
        verifyClientAccess,
        updateUserProfile,
        updateTechnicianProfile,
        updateClientProfile,
        changeClientPassword,
        rejectQuotation,
        requestQuoteClarification,
        requestPmReschedule,
        notifications: appNotifications,
        roleNotifications,
        unreadNotificationsCount,
        criticalNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        isSoundEnabled: soundEnabled,
        toggleSound,
        createComplaint,
        assignTechnician,
        updateComplaintStatus,
        checkInJob,
        completeJobAndGenerateReport,
        submitPmRecord,
        createQuotation,
        updateQuotationStatus,
        approveQuotation,
        convertQuotationToWorkOrder,
        createWorkOrder,
        updateWorkOrderStatus,
        payInvoice,
        recordInventoryMovement,
        consumeInventoryPart,
        restockInventoryPart,
        addNewInventoryItem,
        updateInventoryItem,
        addNewLift,
        updateLift,
        addNewBuilding,
        updateBuilding,
        createAmcContract,
        renewAmcContract,
        submitBusinessEnquiry,
        rateService,
        submitCustomerFeedback,
        replyToCustomerFeedback,
        updateFeedbackStatus,
        addAuditLog,
        resetDemoData,
        // Server Synchronization & Network State
        isServerConnected,
        serverLatencyMs,
        syncStatus,
        lastSyncedAt,
        syncWithServer,
        testServerConnection,

        toasts,
        showToast,
        removeToast,

        // Modern WepSun Modal & Pop-up System
        modal: modalState,
        openModal,
        closeModal,
        showConfirmModal,
        showSuccessModal,
        showErrorModal,
        showWarningModal,
        showDeleteModal,
        showLogoutModal,
        showLoginErrorModal,
        showAccessDeniedModal,
        showNetworkModal,
        showUpdateModal,
        showLoadingModal,
        hideLoadingModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
