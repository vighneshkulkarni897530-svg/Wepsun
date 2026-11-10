/**
 * WEPSUN Engineering Solutions — Enterprise Audit Trail API
 * Provides immutable, tamper-resistant access to system audit logs.
 * Strictly enforces RBAC (Super Admin, Company Admin, Master Admin only).
 * Prohibits any modification or deletion of audit history.
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/audit — Get paginated, filtered audit logs (Admins only)
router.get(
  '/',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const isSuper = user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN';
      const companyId = isSuper ? (req.query.companyId as string) || user.companyId : user.companyId;

      if (!companyId && !isSuper) {
        res.status(403).json({ success: false, message: 'Tenant company context required', code: 'TENANT_REQUIRED' });
        return;
      }

      const {
        entityType,
        entityId,
        action,
        userRole,
        userId,
        dateFrom,
        dateTo,
        search,
      } = req.query;

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
      const skip = (page - 1) * limit;

      // Build Prisma WHERE clause
      const where: any = {
        ...(isSuper && !req.query.companyId ? {} : { companyId }),
        ...(entityType && entityType !== 'all' ? { entityType: entityType as string } : {}),
        ...(entityId ? { entityId: entityId as string } : {}),
        ...(action && action !== 'all' ? { action: action as string } : {}),
        ...(userRole && userRole !== 'all' ? { userRole: userRole as string } : {}),
        ...(userId ? { userId: userId as string } : {}),
      };

      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
        if (dateTo) where.timestamp.lte = new Date(dateTo as string);
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { performedBy: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { entityType: { contains: search, mode: 'insensitive' } },
          { entityId: { contains: search, mode: 'insensitive' } },
        ];
      }

      let total = 0;
      let logs: any[] = [];

      try {
        [total, logs] = await Promise.all([
          prisma.auditLog.count({ where }),
          prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
          }),
        ]);
      } catch {
        // Fallback to mockDb in non-postgres test environments
        let list = [...(db.auditLogs || [])].filter((l) => isSuper || l.companyId === companyId);
        if (entityType && entityType !== 'all') {
          list = list.filter((l) => l.entityType?.toLowerCase() === (entityType as string).toLowerCase());
        }
        if (action && action !== 'all') {
          list = list.filter((l) => l.action?.toLowerCase() === (action as string).toLowerCase());
        }
        if (userRole && userRole !== 'all') {
          list = list.filter((l) => l.userRole?.toLowerCase() === (userRole as string).toLowerCase());
        }
        if (search && typeof search === 'string') {
          const s = search.toLowerCase();
          list = list.filter(
            (l) =>
              l.performedBy?.toLowerCase().includes(s) ||
              l.details?.toLowerCase().includes(s) ||
              l.action?.toLowerCase().includes(s)
          );
        }
        total = list.length;
        logs = list.slice(skip, skip + limit);
      }

      res.json({
        success: true,
        count: logs.length,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Failed to fetch audit logs', code: 'DB_ERROR' });
    }
  }
);

// GET /api/audit/:id — Retrieve single audit record with full state diff
router.get(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const isSuper = user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN';
      const companyId = user.companyId;
      const id = req.params.id as string;

      let log: any = null;
      try {
        log = await prisma.auditLog.findFirst({
          where: isSuper ? { id } : { id, companyId },
        });
      } catch {
        log = (db.auditLogs || []).find((l: any) => l.id === id && (isSuper || l.companyId === companyId));
      }

      if (!log) {
        res.status(404).json({ success: false, message: 'Audit log record not found', code: 'NOT_FOUND' });
        return;
      }

      res.json({ success: true, data: log });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Failed to retrieve audit log', code: 'DB_ERROR' });
    }
  }
);

// IMMUTABILITY GUARANTEE: Explicitly reject any update or delete attempts on audit logs
router.all(['/', '/:id'], (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.status(405).json({
      success: false,
      message: 'Audit records are immutable and append-only. Modifications and deletions are strictly prohibited by system security policy.',
      code: 'IMMUTABLE_RECORD',
    });
    return;
  }
  next();
});

export default router;
