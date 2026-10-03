import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/companies — Get all companies (SuperAdmin) or active company
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role?.toUpperCase() === 'SUPER_ADMIN';
    const effectiveCompanyId = req.user?.companyId || 'comp-1';
    let companies = [];

    try {
      if (isSuperAdmin) {
        companies = await prisma.company.findMany({
          where: { isActive: true },
          include: { branches: true },
        });
      } else {
        const company = await prisma.company.findUnique({
          where: { id: effectiveCompanyId },
          include: { branches: true },
        });
        companies = company ? [company] : [];
      }
    } catch {
      // Fallback
      if (isSuperAdmin) {
        companies = db.companies;
      } else {
        const found = db.companies.find((c) => c.id === effectiveCompanyId);
        companies = found ? [found] : [db.companies[0]];
      }
    }

    res.json({ success: true, count: companies.length, data: companies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to retrieve companies', code: 'DB_ERROR' });
  }
});

// GET /api/companies/branches — Get branches for active tenant company
router.get('/branches', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'comp-1';
    let branches = [];

    try {
      branches = await prisma.branch.findMany({
        where: { companyId, isActive: true },
      });
    } catch {
      branches = db.branches.filter((b) => b.companyId === companyId);
    }

    res.json({ success: true, count: branches.length, data: branches });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to retrieve branches', code: 'DB_ERROR' });
  }
});

export default router;
