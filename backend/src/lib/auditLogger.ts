/**
 * WEPSUN Engineering Solutions — Enterprise Audit Logging Service
 * Implements immutable, tamper-evident audit history across all business mutations.
 * 
 * Rules:
 * 1. Audit logs are strictly append-only (no UPDATE or DELETE allowed).
 * 2. Every mutation records who, what, when, role, entity, previous values, and new values.
 * 3. Captures IP address and user-agent metadata where available.
 * 4. Non-blocking error handling to ensure primary transactions never fail due to logging.
 */

import { prisma } from './prisma.js';
import type { Request } from 'express';

export type AuditAction =
  | 'CREATE'
  | 'CREATE_EMERGENCY'
  | 'UPDATE'
  | 'STATUS_CHANGE'
  | 'ASSIGN'
  | 'DISPATCH'
  | 'RESOLVE'
  | 'CLOSE'
  | 'ARCHIVE'
  | 'DELETE'
  | 'CONSUME'
  | 'RESTOCK'
  | 'APPROVE'
  | 'BLOCK'
  | 'UNBLOCK'
  | 'PAYMENT_VERIFIED'
  | 'ONBOARD'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'SESSION_REVOKED';

export type AuditEntityType =
  | 'Complaint'
  | 'Lift'
  | 'Building'
  | 'AmcContract'
  | 'Quotation'
  | 'WorkOrder'
  | 'Invoice'
  | 'Payment'
  | 'InventoryPart'
  | 'InventoryMovement'
  | 'ServiceReport'
  | 'CustomerFeedback'
  | 'User'
  | 'Technician'
  | 'Client'
  | 'Company';

export interface AuditLogInput {
  companyId: string;
  entityType: AuditEntityType | string;
  entityId: string;
  action: AuditAction | string;
  performedBy: string;
  userRole: string;
  userId?: string | null;
  previousValues?: Record<string, any> | string | null;
  newValues?: Record<string, any> | string | null;
  details: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  req?: Request | any;
  tx?: any; // Optional Prisma transaction client
}

/**
 * Extracts sanitized IP address and User-Agent from Express request
 */
export function extractRequestMetadata(req?: Request | any): { ipAddress: string | null; userAgent: string | null } {
  if (!req) return { ipAddress: null, userAgent: null };

  const xForwardedFor = req.headers?.['x-forwarded-for'];
  let ipAddress: string | null = null;
  if (typeof xForwardedFor === 'string') {
    ipAddress = xForwardedFor.split(',')[0].trim();
  } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    ipAddress = xForwardedFor[0].trim();
  } else if (req.ip) {
    ipAddress = String(req.ip);
  } else if (req.socket?.remoteAddress) {
    ipAddress = String(req.socket.remoteAddress);
  }

  const rawUserAgent = req.headers?.['user-agent'];
  const userAgent = typeof rawUserAgent === 'string' ? rawUserAgent.substring(0, 500) : null;

  return { ipAddress, userAgent };
}

/**
 * Sanitize sensitive values before storing in audit diffs (passwords, tokens, OTPs)
 */
function sanitizeForAudit(obj: any): any {
  if (!obj) return null;
  if (typeof obj !== 'object') return obj;

  const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'refreshtoken',
    'tokenhash',
    'clientotp',
    'otp',
    'secret',
    'jwt',
  ]);

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForAudit);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeForAudit(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Records an immutable audit log entry in PostgreSQL
 */
export async function recordAuditLog(input: AuditLogInput): Promise<any> {
  const client = input.tx || prisma;

  let ip = input.ipAddress || null;
  let ua = input.userAgent || null;

  if (input.req && (!ip || !ua)) {
    const meta = extractRequestMetadata(input.req);
    ip = ip || meta.ipAddress;
    ua = ua || meta.userAgent;
  }

  const prevClean = input.previousValues ? sanitizeForAudit(input.previousValues) : null;
  const newClean = input.newValues ? sanitizeForAudit(input.newValues) : null;

  const prevStr = prevClean ? (typeof prevClean === 'string' ? prevClean : JSON.stringify(prevClean)) : null;
  const newStr = newClean ? (typeof newClean === 'string' ? newClean : JSON.stringify(newClean)) : null;

  try {
    return await client.auditLog.create({
      data: {
        companyId: input.companyId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        performedBy: input.performedBy || 'System',
        userRole: input.userRole || 'SYSTEM',
        userId: input.userId || null,
        previousValues: prevStr,
        newValues: newStr,
        ipAddress: ip,
        userAgent: ua,
        details: input.details,
      },
    });
  } catch (err: any) {
    // Audit logging is non-blocking to prevent interrupting business mutations
    console.warn(`[AUDIT_LOG_WARNING] Could not persist audit log for ${input.entityType} ${input.entityId}:`, err?.message);
    return null;
  }
}

export default {
  recordAuditLog,
  extractRequestMetadata,
};
