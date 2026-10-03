/**
 * WEPSUN Engineering Solutions — Authentication & RBAC Authorization Middleware
 * Enforces Cryptographic JWT Validation, Role Guards & Multi-Tenant Object Scoping
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtUserPayload } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedUser extends JwtUserPayload {
  name?: string;
  isActive?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  companyId?: string;
  branchId?: string;
  userRole?: string;
  userId?: string;
}

/**
 * Authentication Middleware: Requires a valid cryptographic Bearer JWT access token
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no header, check if legacy header present in dev/test fallback
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer access token.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Verify user is active in DB if connected
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId || payload.sub },
        select: { id: true, isActive: true, tokenVersion: true, companyId: true, role: true },
      });

      if (user) {
        if (!user.isActive) {
          res.status(403).json({
            success: false,
            message: 'User account is deactivated. Contact administrator.',
            code: 'ACCOUNT_DEACTIVATED',
          });
          return;
        }

        // Invalidate token if tokenVersion changed (e.g. after password reset)
        if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
          res.status(401).json({
            success: false,
            message: 'Session invalidated. Please log in again.',
            code: 'SESSION_INVALIDATED',
          });
          return;
        }
      }
    } catch {
      // Non-blocking database check fallback
    }

    // Attach verified server-side identity to request
    req.user = payload;
    req.userId = payload.userId || payload.sub;
    req.companyId = payload.companyId;
    req.branchId = payload.branchId || undefined;
    req.userRole = payload.role;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Access token expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or malformed access token.',
      code: 'INVALID_TOKEN',
    });
  }
}

export type AuthRequest = AuthenticatedRequest;

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 */
export function requireRole(...allowedRoles: (string | string[])[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles
      .flat(Infinity)
      .map((r) => (typeof r === 'string' ? r.toUpperCase() : String(r).toUpperCase()));

    // Super Admin has global bypass for all company operations
    if (userRole === 'SUPER_ADMIN' || normalizedAllowed.includes(userRole)) {
      next();
      return;
    }

    // Map common role aliases
    const aliasMap: Record<string, string> = {
      COMPANY_ADMIN: 'ADMIN',
      CLIENT: 'CUSTOMER',
      ACCOUNTS: 'ACCOUNTANT',
      SALES: 'SALES',
    };

    const aliased = aliasMap[userRole] || userRole;
    if (normalizedAllowed.includes(aliased)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`,
      code: 'FORBIDDEN_ROLE',
    });
  };
}

/**
 * Super Admin Guard: Restricted strictly to platform administrators
 */
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role.toUpperCase() !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access restricted to Platform Super Administrators.',
      code: 'FORBIDDEN_SUPER_ADMIN',
    });
    return;
  }
  next();
}

/**
 * Object-Level Ownership Helpers (ABAC)
 */
export const assertObjectOwnership = {
  /**
   * Asserts tenant company isolation
   */
  tenant(req: AuthenticatedRequest, resourceCompanyId: string): boolean {
    if (req.user?.role?.toUpperCase() === 'SUPER_ADMIN') return true;
    return req.user?.companyId === resourceCompanyId;
  },

  /**
   * Asserts technician only modifies own assigned tasks unless Manager/Admin
   */
  technician(req: AuthenticatedRequest, assignedTechnicianId?: string | null): boolean {
    const role = req.user?.role?.toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'SERVICE_MANAGER') {
      return true;
    }
    if (role === 'TECHNICIAN' && req.user?.technicianId) {
      return req.user.technicianId === assignedTechnicianId;
    }
    return false;
  },

  /**
   * Asserts client only views own society/building records unless Admin
   */
  client(req: AuthenticatedRequest, resourceClientId?: string | null): boolean {
    const role = req.user?.role?.toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'SERVICE_MANAGER' || role === 'ACCOUNTS') {
      return true;
    }
    if (role === 'CLIENT' && req.user?.clientId) {
      return req.user.clientId === resourceClientId;
    }
    return false;
  },
};
