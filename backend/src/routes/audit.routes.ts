import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/audit — Get audit logs scoped to tenant (Admins only)
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { entityType, userRole, search } = req.query;

    let result: any[] = [];

    try {
      result = await prisma.auditLog.findMany({
        where: {
          ...(isSuper && !req.query.companyId ? {} : { companyId }),
          ...(entityType && entityType !== 'all' ? { entityType: entityType as string } : {}),
          ...(userRole && userRole !== 'all' ? { userRole: userRole as string } : {}),
          ...(search && typeof search === 'string'
            ? {
                OR: [
                  { performedBy: { contains: search, mode: 'insensitive' } },
                  { details: { contains: search, mode: 'insensitive' } },
                  { action: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { timestamp: 'desc' },
      });
    } catch {
      result = [...db.auditLogs].filter((l) => isSuper || l.companyId === companyId);
      if (entityType && entityType !== 'all') {
        result = result.filter((l) => l.entityType.toLowerCase() === (entityType as string).toLowerCase());
      }
      if (userRole && userRole !== 'all') {
        result = result.filter((l) => l.userRole.toLowerCase() === (userRole as string).toLowerCase());
      }
    }

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch audit logs', code: 'DB_ERROR' });
  }
});

export default router;
