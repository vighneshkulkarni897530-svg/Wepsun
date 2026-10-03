import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/work-orders — List work orders scoped to tenant and role
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const isTechnician = user.role === 'TECHNICIAN';

    let list: any[] = [];

    try {
      list = await prisma.workOrder.findMany({
        where: {
          companyId,
          ...(user.branchId ? { branchId: user.branchId } : {}),
          ...(isTechnician && user.technicianId ? { technicianId: user.technicianId } : {}),
        },
        include: {
          lift: { include: { building: true, client: true } },
          technician: true,
          quotation: true,
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      list = db.workOrders.filter((w) => w.companyId === companyId);
      if (user.branchId) {
        list = list.filter((w) => w.branchId === user.branchId);
      }
      if (isTechnician && user.technicianId) {
        list = list.filter((w) => w.technicianId === user.technicianId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch work orders', code: 'DB_ERROR' });
  }
});

// GET /api/work-orders/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';

    let wo: any = null;

    try {
      wo = await prisma.workOrder.findFirst({
        where: { id, ...(isSuper ? {} : { companyId }) },
        include: {
          lift: { include: { building: true, client: true } },
          technician: true,
          quotation: true,
          invoice: true,
        },
      });
    } catch {
      wo = db.workOrders.find((w) => w.id === id && (isSuper || w.companyId === companyId));
    }

    if (!wo) {
      res.status(404).json({ success: false, message: 'Work order not found', code: 'NOT_FOUND' });
      return;
    }

    // Role-specific check
    if (user.role === 'TECHNICIAN' && user.technicianId && wo.technicianId !== user.technicianId) {
      res.status(403).json({ success: false, message: 'Access denied: you are not assigned to this work order', code: 'FORBIDDEN' });
      return;
    }

    res.json({ success: true, data: wo });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching work order', code: 'DB_ERROR' });
  }
});

// POST /api/work-orders — Create work order (Admins & Service Managers)
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? req.body.companyId || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const branchId = user.branchId || req.body.branchId || 'br-mum-1';
    const { liftId, technicianId, title, description, priority, scheduledDate, totalAmount, quotationId, complaintId } = req.body;

    const workOrderNumber = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let newWO: any = null;

    try {
      newWO = await prisma.workOrder.create({
        data: {
          companyId,
          branchId,
          workOrderNumber,
          liftId: liftId || (await prisma.lift.findFirst({ where: { companyId } }))?.id || '',
          technicianId: technicianId || null,
          title: title || 'Elevator Maintenance Work Order',
          description: description || 'Scheduled repair/maintenance',
          priority: priority || 'MEDIUM',
          status: technicianId ? 'ASSIGNED' : 'SCHEDULED',
          scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
          totalAmount: Number(totalAmount || 0),
          quotationId: quotationId || null,
          complaintId: complaintId || null,
        },
        include: { lift: true, technician: true },
      });
    } catch {
      newWO = {
        id: `wo-${Date.now()}`,
        companyId,
        branchId,
        workOrderNumber,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        ...req.body,
      };
      db.workOrders.unshift(newWO);
    }

    res.status(201).json({ success: true, data: newWO });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create work order', code: 'CREATE_ERROR' });
  }
});

// PATCH /api/work-orders/:id — Update work order status
router.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { status, technicianId, remarks } = req.body;

    let updated = null;

    try {
      await prisma.workOrder.updateMany({
        where: { id, ...(isSuper ? {} : { companyId }) },
        data: {
          ...(status ? { status } : {}),
          ...(technicianId ? { technicianId } : {}),
          ...(remarks ? { remarks } : {}),
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
      });
      updated = await prisma.workOrder.findUnique({
        where: { id },
        include: { lift: true, technician: true },
      });
      if (updated) {
        res.json({ success: true, data: updated });
        return;
      }
    } catch {
      // Fallback
    }

    const idx = db.workOrders.findIndex((w) => w.id === id && (isSuper || w.companyId === companyId));
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Work order not found', code: 'NOT_FOUND' });
      return;
    }
    db.workOrders[idx] = { ...db.workOrders[idx], ...req.body };
    res.json({ success: true, data: db.workOrders[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update work order', code: 'UPDATE_ERROR' });
  }
});

export default router;
