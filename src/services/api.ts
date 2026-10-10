/**
 * WEPSUN Frontend API Client & Real-time Cloud Synchronization Service
 * Production-ready HTTP/HTTPS REST API client supporting JWT Bearer authentication,
 * transparent token refresh, timeout handling, offline resiliency, and multi-tenant scoping.
 */

import { Capacitor } from '@capacitor/core';

const STORAGE_API_URL_KEY = 'wepsun_custom_api_url';
const TOKEN_KEY = 'wepsun_access_token';
const REFRESH_TOKEN_KEY = 'wepsun_refresh_token';

const DEFAULT_CLOUD_API_URL = 'https://wepsun.onrender.com/api';

// Guarantee window.Capacitor global availability
if (typeof window !== 'undefined' && !(window as any).Capacitor) {
  (window as any).Capacitor = Capacitor;
}

/**
 * Resolves the active backend API base URL automatically.
 * Priority order:
 * 1. Runtime User Config (localStorage 'wepsun_custom_api_url')
 * 2. Vite Environment Variable (VITE_API_URL)
 * 3. Default Production Cloud Backend (https://wepsun.onrender.com/api)
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_API_URL_KEY);
    if (custom && custom.trim().length > 0) {
      return custom.trim().replace(/\/+$/, '');
    }

    const isNative =
      Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== 'web' ||
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:';

    const isLocalOrLan =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.startsWith('172.') ||
      window.location.hostname.endsWith('.local');

    if (isLocalOrLan && !isNative) {
      return '/api';
    }
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return DEFAULT_CLOUD_API_URL;
}

export function setApiBaseUrl(url: string): void {
  if (!url || url.trim() === '' || url.trim() === '/api') {
    localStorage.removeItem(STORAGE_API_URL_KEY);
  } else {
    localStorage.setItem(STORAGE_API_URL_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.removeItem('wepsun_explicit_logout');
  sessionStorage.removeItem('wepsun_explicit_logout');
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface ApiRequestOptions extends RequestInit {
  companyId?: string;
  branchId?: string;
  userRole?: string;
  userId?: string;
  skipAuth?: boolean;
  timeoutMs?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  status?: number;
  latencyMs?: number;
}

/**
 * Checks server health and database latency
 */
export async function checkServerHealth(customUrl?: string): Promise<{
  connected: boolean;
  latencyMs: number;
  data?: any;
  error?: string;
}> {
  const baseUrl = customUrl ? customUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      const json = await res.json().catch(() => ({ status: 'ok' }));
      return { connected: true, latencyMs, data: json };
    }
    return { connected: false, latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err.name === 'AbortError' ? 'Connection timed out (8s)' : err.message || 'Cannot reach API server',
    };
  }
}

// Token refresh synchronization queue
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    }
  } catch {
    // Network or server error
  }
  return null;
}

/**
 * Generic HTTP/HTTPS REST fetcher with timeout, auth token injection, and transparent retry
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const isAuthRoute = endpoint.includes('/auth/');
  const defaultTimeout = isAuthRoute ? 60000 : 25000;
  const {
    companyId,
    branchId,
    userRole,
    userId,
    headers,
    skipAuth,
    timeoutMs = defaultTimeout,
    ...rest
  } = options;

  const accessToken = getAccessToken();
  const baseUrl = getApiBaseUrl();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-version': '2.0.0',
    ...(accessToken && !skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(companyId ? { 'x-company-id': companyId } : {}),
    ...(userRole ? { 'x-user-role': userRole } : {}),
    ...(branchId ? { 'x-branch-id': branchId } : {}),
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let response = await fetch(`${baseUrl}${normalizedEndpoint}`, {
      headers: requestHeaders,
      signal: controller.signal,
      ...rest,
    });
    clearTimeout(timeoutId);

    // If 401 Unauthorized, attempt transparent refresh (unless calling auth routes)
    if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/master') && !endpoint.startsWith('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefreshToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshed(newToken);
          requestHeaders.Authorization = `Bearer ${newToken}`;
          response = await fetch(`${baseUrl}${normalizedEndpoint}`, {
            headers: requestHeaders,
            ...rest,
          });
        }
      } else {
        // Wait for active refresh
        const retryPromise = new Promise<Response>((resolve) => {
          subscribeTokenRefresh(async (newToken) => {
            requestHeaders.Authorization = `Bearer ${newToken}`;
            const retryRes = await fetch(`${baseUrl}${normalizedEndpoint}`, {
              headers: requestHeaders,
              ...rest,
            });
            resolve(retryRes);
          });
        });
        response = await retryPromise;
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      let friendlyError = errJson.message || `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 404 && endpoint.includes('/auth/send-otp')) {
        friendlyError = 'Backend is updating live OTP service. Please deploy latest commit on Render or use local connection.';
      }
      return {
        success: false,
        error: friendlyError,
        message: friendlyError,
        code: errJson.code,
        status: response.status,
        latencyMs,
      };
    }

    const json = await response.json().catch(() => ({ success: true }));
    return {
      ...json,
      status: response.status,
      latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || String(err.message || '').toLowerCase().includes('abort');
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const friendlyErrorMessage = isOffline
      ? 'Device is currently offline. Please check your internet connection.'
      : isTimeout
        ? 'Server connection took longer than expected. Please wait a moment and tap again.'
        : err.message || 'Network connection to backend API failed.';

    return {
      success: false,
      error: friendlyErrorMessage,
      message: friendlyErrorMessage,
      code: isOffline ? 'OFFLINE' : isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      latencyMs,
    };
  }
}

/**
 * WEPSUN Full-Stack API Client Service
 */
export const apiService = {
  // Authentication & Session
  initiateMaster2FA: (payload: { masterId: string }) =>
    apiFetch('/auth/master-id/initiate', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  verifyMaster2FA: (payload: { challengeToken: string; emailOtp: string; smsOtp?: string; rememberMe?: boolean }) =>
    apiFetch('/auth/master-id/verify', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  resendMaster2FA: (payload: { challengeToken: string }) =>
    apiFetch('/auth/master-id/resend', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  verifyMasterId: (payload: { masterId: string; rememberMe?: boolean }) =>
    apiFetch('/auth/master-id', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  login: (payload: { email?: string; phone?: string; password?: string; otp?: string; companyCode?: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  googleLogin: (payload: {
    credential?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    picture?: string;
    role?: string;
    companyId?: string;
    googleId?: string;
  }) =>
    apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  getDemoUsers: () =>
    apiFetch('/auth/demo-users', { skipAuth: true }),
  demoLogin: (payload: { identifier?: string; role?: string; userId?: string }) =>
    apiFetch('/auth/demo-login', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  refreshSession: (refreshToken: string) =>
    apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }), skipAuth: true }),
  logout: (refreshToken?: string) =>
    apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logoutAll: () =>
    apiFetch('/auth/logout-all', { method: 'POST' }),
  getMe: (options?: ApiRequestOptions) =>
    apiFetch('/auth/me', options),
  changePassword: (payload: { currentPassword: string; newPassword: string }, options?: ApiRequestOptions) =>
    apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(payload), ...options }),
  forgotPassword: (email: string) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }), skipAuth: true }),
  resetPassword: (payload: { token: string; newPassword: string }) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),

  // Firebase Email OTP Authentication
  sendOtp: (payload: { email: string; name?: string; type: 'signup' | 'forgot_password' }) =>
    apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  verifySignupOtp: (payload: {
    email: string;
    otp: string;
    name: string;
    phone?: string;
    role: string;
    password?: string;
    companyId?: string;
  }) =>
    apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  sendForgotPasswordOtp: (payload: { email: string }) =>
    apiFetch('/auth/forgot-password-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  verifyForgotPasswordOtp: (payload: { email: string; otp: string; newPassword: string }) =>
    apiFetch('/auth/verify-forgot-password-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  resendOtp: (payload: { email: string; type: 'signup' | 'forgot_password'; name?: string }) =>
    apiFetch('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),

  // Companies & Branches
  getCompanies: (options?: ApiRequestOptions) => apiFetch('/companies', options),
  getBranches: (options?: ApiRequestOptions) => apiFetch('/companies/branches', options),

  // Lifts & Equipment Directory
  getLifts: (options?: ApiRequestOptions) => apiFetch('/lifts', options),
  getLiftById: (id: string, options?: ApiRequestOptions) => apiFetch(`/lifts/${id}`, options),
  createLift: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/lifts', { method: 'POST', body: JSON.stringify(payload), ...options }),
  updateLiftStatus: (id: string, currentStatus: string, options?: ApiRequestOptions) =>
    apiFetch(`/lifts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ currentStatus }), ...options }),

  // Complaints & Breakdown Tickets
  getComplaints: (options?: ApiRequestOptions) => apiFetch('/complaints', options),
  getComplaintById: (id: string, options?: ApiRequestOptions) => apiFetch(`/complaints/${id}`, options),
  createComplaint: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/complaints', { method: 'POST', body: JSON.stringify(payload), ...options }),
  updateComplaint: (id: string, payload: any, options?: ApiRequestOptions) =>
    apiFetch(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(payload), ...options }),
  assignTechnician: (id: string, assignedTechnicianId: string, options?: ApiRequestOptions) =>
    apiFetch(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ assignedTechnicianId, status: 'ASSIGNED' }), ...options }),

  // Work Orders
  getWorkOrders: (options?: ApiRequestOptions) => apiFetch('/work-orders', options),
  getWorkOrderById: (id: string, options?: ApiRequestOptions) => apiFetch(`/work-orders/${id}`, options),
  createWorkOrder: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/work-orders', { method: 'POST', body: JSON.stringify(payload), ...options }),
  updateWorkOrderStatus: (id: string, status: string, extra?: any, options?: ApiRequestOptions) =>
    apiFetch(`/work-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }), ...options }),

  // Inventory & Movement Ledger
  getInventory: (options?: ApiRequestOptions) => apiFetch('/inventory', options),
  getInventoryMovements: (options?: ApiRequestOptions) => apiFetch('/inventory/movements', options),
  recordInventoryMovement: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/inventory/movements', { method: 'POST', body: JSON.stringify(payload), ...options }),
  createInventoryItem: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/inventory', { method: 'POST', body: JSON.stringify(payload), ...options }),
  updateInventoryItem: (id: string, payload: any, options?: ApiRequestOptions) =>
    apiFetch(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(payload), ...options }),

  // AMC Contracts & Renewals
  getAmcContracts: (options?: ApiRequestOptions) => apiFetch('/amc', options),
  getAmcContractById: (id: string, options?: ApiRequestOptions) => apiFetch(`/amc/${id}`, options),
  getExpiringRenewals: (options?: ApiRequestOptions) => apiFetch('/amc/expiring-renewals', options),
  createAmcContract: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/amc', { method: 'POST', body: JSON.stringify(payload), ...options }),
  renewAmcContract: (id: string, payload: any, options?: ApiRequestOptions) =>
    apiFetch(`/amc/${id}/renew`, { method: 'POST', body: JSON.stringify(payload), ...options }),

  // Quotations & Estimates
  getQuotations: (options?: ApiRequestOptions) => apiFetch('/quotations', options),
  getQuotationById: (id: string, options?: ApiRequestOptions) => apiFetch(`/quotations/${id}`, options),
  createQuotation: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/quotations', { method: 'POST', body: JSON.stringify(payload), ...options }),
  updateQuotationStatus: (id: string, status: string, options?: ApiRequestOptions) =>
    apiFetch(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }), ...options }),
  convertQuotationToWorkOrder: (id: string, technicianId?: string, options?: ApiRequestOptions) =>
    apiFetch(`/quotations/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify({ technicianId }),
      ...options,
    }),

  // Invoices & Billing
  getInvoices: (options?: ApiRequestOptions) => apiFetch('/invoices', options),
  getInvoiceById: (id: string, options?: ApiRequestOptions) => apiFetch(`/invoices/${id}`, options),
  payInvoice: (id: string, paymentMethod: string, transactionId: string, options?: ApiRequestOptions) =>
    apiFetch(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, transactionId }),
      ...options,
    }),

  // Online Payment Gateway (Razorpay)
  createRazorpayOrder: (invoiceId: string, amount?: number, options?: ApiRequestOptions) =>
    apiFetch('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ invoiceId, amount }),
      ...options,
    }),
  verifyRazorpayPayment: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    }),

  // Field Technicians & GPS Check-ins
  getTechnicians: (options?: ApiRequestOptions) => apiFetch('/technicians', options),
  getTechnicianById: (id: string, options?: ApiRequestOptions) => apiFetch(`/technicians/${id}`, options),
  recordGpsCheckIn: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/technicians/check-in', { method: 'POST', body: JSON.stringify(payload), ...options }),

  // Preventive Maintenance (PM)
  getPmSchedules: (options?: ApiRequestOptions) => apiFetch('/pm/schedules', options),
  getPmExecutions: (options?: ApiRequestOptions) => apiFetch('/pm/executions', options),
  submitPmExecution: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/pm/complete', { method: 'POST', body: JSON.stringify(payload), ...options }),

  // Digital Service Reports
  getServiceReports: (options?: ApiRequestOptions) => apiFetch('/service-reports', options),
  getServiceReportById: (id: string, options?: ApiRequestOptions) => apiFetch(`/service-reports/${id}`, options),
  createServiceReport: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/service-reports', { method: 'POST', body: JSON.stringify(payload), ...options }),

  // Customer Feedback & Reviews
  getFeedbacks: (options?: ApiRequestOptions) => apiFetch('/feedback', options),
  submitCustomerFeedback: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/feedback/submit', { method: 'POST', body: JSON.stringify(payload), ...options }),
  replyFeedback: (id: string, replyMessage: string, adminName?: string, options?: ApiRequestOptions) =>
    apiFetch(`/feedback/${id}/reply`, { method: 'POST', body: JSON.stringify({ replyMessage, adminName }), ...options }),
  resolveFeedback: (id: string, options?: ApiRequestOptions) =>
    apiFetch(`/feedback/${id}/resolve`, { method: 'POST', ...options }),

  // Notifications, WhatsApp & SMS Alerts
  getNotifications: (options?: ApiRequestOptions) => apiFetch('/notifications', options),
  markNotificationRead: (id: string, options?: ApiRequestOptions) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH', ...options }),
  sendWhatsAppAlert: (payload: {
    toPhone: string;
    templateName: string;
    params: Record<string, string>;
    companyName?: string;
  }, options?: ApiRequestOptions) =>
    apiFetch('/notifications/whatsapp/send', { method: 'POST', body: JSON.stringify(payload), ...options }),
  sendSmsAlert: (payload: { toPhone: string; message: string; senderId?: string }, options?: ApiRequestOptions) =>
    apiFetch('/notifications/sms/send', { method: 'POST', body: JSON.stringify(payload), ...options }),
  dispatchEmergencyAlert: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/notifications/dispatch-emergency', { method: 'POST', body: JSON.stringify(payload), ...options }),
  submitBusinessEnquiry: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/notifications/enquiries', { method: 'POST', body: JSON.stringify(payload), ...options }),
  getBusinessEnquiries: (options?: ApiRequestOptions) =>
    apiFetch('/notifications/enquiries', options),

  // WhatsApp Deep-link opener (Browser/Mobile)
  openWhatsAppDirect: (toPhone: string, text: string) => {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  // AI Fault Diagnostics
  getAiErrorCodes: () => apiFetch('/ai/error-codes'),
  diagnoseFault: (payload: { symptom?: string; errorCode?: string; driveBrand?: string }) =>
    apiFetch('/ai/diagnose', { method: 'POST', body: JSON.stringify(payload) }),

  // Audit Logs
  getAuditLogs: (options?: ApiRequestOptions) => apiFetch('/audit', options),

  // IoT Telemetry
  getTelemetryOverview: (options?: ApiRequestOptions) => apiFetch('/telemetry/overview', options),
  getLiftTelemetry: (liftId: string, options?: ApiRequestOptions) => apiFetch(`/telemetry/${liftId}`, options),
  simulateTelemetryEvent: (payload: any, options?: ApiRequestOptions) =>
    apiFetch('/telemetry/simulate', { method: 'POST', body: JSON.stringify(payload), ...options }),

  // Batch Cloud Sync for Multi-Tenant Data Store
  syncAllTenantData: async (options?: ApiRequestOptions) => {
    const results = await Promise.allSettled([
      apiFetch('/companies', options),
      apiFetch('/companies/branches', options),
      apiFetch('/lifts', options),
      apiFetch('/complaints', options),
      apiFetch('/work-orders', options),
      apiFetch('/amc', options),
      apiFetch('/quotations', options),
      apiFetch('/invoices', options),
      apiFetch('/inventory', options),
      apiFetch('/inventory/movements', options),
      apiFetch('/service-reports', options),
      apiFetch('/technicians', options),
      apiFetch('/feedback', options),
      apiFetch('/audit', options),
    ]);

    return {
      companies: results[0].status === 'fulfilled' ? results[0].value.data : null,
      branches: results[1].status === 'fulfilled' ? results[1].value.data : null,
      lifts: results[2].status === 'fulfilled' ? results[2].value.data : null,
      complaints: results[3].status === 'fulfilled' ? results[3].value.data : null,
      workOrders: results[4].status === 'fulfilled' ? results[4].value.data : null,
      amcContracts: results[5].status === 'fulfilled' ? results[5].value.data : null,
      quotations: results[6].status === 'fulfilled' ? results[6].value.data : null,
      invoices: results[7].status === 'fulfilled' ? results[7].value.data : null,
      inventory: results[8].status === 'fulfilled' ? results[8].value.data : null,
      inventoryMovements: results[9].status === 'fulfilled' ? results[9].value.data : null,
      serviceReports: results[10].status === 'fulfilled' ? results[10].value.data : null,
      technicians: results[11].status === 'fulfilled' ? results[11].value.data : null,
      feedbacks: results[12].status === 'fulfilled' ? results[12].value.data?.feedbacks || results[12].value.data : null,
      auditLogs: results[13].status === 'fulfilled' ? results[13].value.data : null,
    };
  },
};
