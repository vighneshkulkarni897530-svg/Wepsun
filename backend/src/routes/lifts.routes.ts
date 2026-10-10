import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/lifts — List lifts with tenant and object-level isolation
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const isClient = req.user!.role?.toUpperCase() === 'CLIENT';
    const clientId = req.user!.clientId;

    if (isClient && !clientId) {
      res.json({ success: true, count: 0, data: [] });
      return;
    }

    let list: any[] = [];

    try {
      list = await prisma.lift.findMany({
        where: {
          companyId,
          ...(req.branchId ? { branchId: req.branchId } : {}),
          ...(isClient ? { clientId: clientId! } : {}),
        },
        include: {
          building: true,
          client: true,
          amcContract: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      list = db.lifts.filter((l) => l.companyId === companyId);
      if (req.branchId) {
        list = list.filter((l) => l.branchId === req.branchId);
      }
      if (isClient) {
        list = list.filter((l) => l.clientId === clientId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching lifts', code: 'DB_ERROR' });
  }
});

// GET /api/lifts/:id — Get single lift passport
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const isClient = req.user!.role?.toUpperCase() === 'CLIENT';
    const clientId = req.user!.clientId;
    const id = req.params.id as string;
    let lift: any = null;

    try {
      lift = await prisma.lift.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          building: true,
          client: true,
          amcContract: true,
          complaints: { take: 5, orderBy: { reportedAt: 'desc' } },
          serviceReports: { take: 5, orderBy: { serviceDate: 'desc' } },
          qrCodeTokens: { where: { isActive: true }, take: 1 },
        },
      });
    } catch {
      lift = db.lifts.find((l) => l.id === req.params.id && l.companyId === companyId);
    }

    if (!lift) {
      res.status(404).json({ success: false, message: 'Lift not found in this company', code: 'NOT_FOUND' });
      return;
    }

    // Object-level check for Client
    if (isClient) {
      if (!clientId || lift.clientId !== clientId) {
        res.status(403).json({
          success: false,
          message: 'Access Denied – You are not authorized to view this information.',
          code: 'FORBIDDEN_OBJECT',
        });
        return;
      }
    }

    res.json({ success: true, data: lift });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching lift', code: 'DB_ERROR' });
  }
});

// POST /api/lifts — Create new lift digital passport (Admin only)
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const {
      permanentLiftId,
      branchId,
      buildingId,
      clientId,
      brand,
      model,
      type,
      capacityPersons,
      capacityKg,
      speedMps,
      floors,
      stops,
      machineType,
      motorKw,
      controllerBrand,
      doorOperator,
      installationDate,
      locationDetails,
    } = req.body;

    if (!permanentLiftId || !buildingId || !clientId) {
      res.status(400).json({ success: false, message: 'Missing required fields for lift creation', code: 'VALIDATION_ERROR' });
      return;
    }

    let createdLift: any = null;

    try {
      createdLift = await prisma.lift.create({
        data: {
          companyId,
          branchId: branchId || req.user!.branchId || 'br-mum-1',
          buildingId,
          clientId,
          permanentLiftId,
          brand: brand || 'WEPSUN',
          model: model || 'Standard V3',
          type: type || 'PASSENGER',
          capacityPersons: capacityPersons || 8,
          capacityKg: capacityKg || 544,
          speedMps: speedMps || 1.5,
          floors: floors || 'G+10',
          stops: stops || 11,
          machineType: machineType || 'GEARLESS_PMSM',
          motorKw: motorKw || 5.5,
          controllerBrand: controllerBrand || 'Monarch',
          doorOperator: doorOperator || 'Fermator',
          installationDate: installationDate ? new Date(installationDate) : new Date(),
          locationDetails: locationDetails || 'Main Tower',
        },
      });
    } catch {
      createdLift = {
        id: `lift_${Date.now()}`,
        companyId,
        branchId: branchId || 'br-mum-1',
        buildingId,
        clientId,
        permanentLiftId,
        brand: brand || 'WEPSUN',
        model: model || 'Standard V3',
        type: type || 'PASSENGER',
        capacityPersons: capacityPersons || 8,
        capacityKg: capacityKg || 544,
        speedMps: speedMps || 1.5,
        floors: floors || 'G+10',
        stops: stops || 11,
        machineType: machineType || 'GEARLESS_PMSM',
        motorKw: motorKw || 5.5,
        controllerBrand: controllerBrand || 'Monarch',
        doorOperator: doorOperator || 'Fermator',
        installationDate: new Date().toISOString(),
        locationDetails: locationDetails || 'Main Tower',
        currentStatus: 'OPERATIONAL',
        amcStatus: 'UNASSIGNED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.lifts.unshift(createdLift);
    }

    res.status(201).json({ success: true, data: createdLift });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create lift', code: 'CREATE_ERROR' });
  }
});

// PATCH /api/lifts/:id/status — Update lift status
router.patch('/:id/status', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const id = req.params.id as string;
    const { currentStatus } = req.body;

    try {
      const updated = await prisma.lift.updateMany({
        where: { id, companyId },
        data: { currentStatus },
      });
      if (updated.count > 0) {
        const lift = await prisma.lift.findUnique({ where: { id } });
        res.json({ success: true, data: lift });
        return;
      }
    } catch {
      // Fallback
    }

    const liftIndex = db.lifts.findIndex((l) => l.id === id && l.companyId === companyId);
    if (liftIndex === -1) {
      res.status(404).json({ success: false, message: 'Lift not found', code: 'NOT_FOUND' });
      return;
    }
    db.lifts[liftIndex].currentStatus = currentStatus;
    res.json({ success: true, data: db.lifts[liftIndex] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update lift status', code: 'UPDATE_ERROR' });
  }
});

export default router;
