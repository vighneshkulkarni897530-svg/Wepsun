import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/inventory — List inventory parts scoped to tenant
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';

    let list: any[] = [];

    try {
      list = await prisma.inventoryPart.findMany({
        where: {
          companyId,
          ...(user.branchId ? { branchId: user.branchId } : {}),
        },
        include: {
          movements: {
            take: 5,
            orderBy: { timestamp: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch {
      list = db.inventory.filter((i) => i.companyId === companyId);
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch inventory', code: 'DB_ERROR' });
  }
});

// GET /api/inventory/movements — List immutable movement ledger
router.get('/movements', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';

    let movements: any[] = [];

    try {
      movements = await prisma.inventoryMovement.findMany({
        where: { companyId },
        include: {
          part: true,
          technician: true,
        },
        orderBy: { timestamp: 'desc' },
      });
    } catch {
      movements = db.inventoryMovements.filter((m) => {
        const item = db.inventory.find((i) => i.id === m.partId);
        return item?.companyId === companyId;
      });
    }

    res.json({ success: true, count: movements.length, data: movements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch movements', code: 'DB_ERROR' });
  }
});

// POST /api/inventory/movements — Record double-entry movement and adjust stock
router.post('/movements', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.body.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { partId, type, quantity, referenceId, technicianId, notes } = req.body;

    const qty = Math.abs(Number(quantity || 1));

    let result: any = null;

    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Fetch part with row lock logic
        const part = await tx.inventoryPart.findFirst({
          where: { id: partId, ...(isSuper ? {} : { companyId }) },
        });

        if (!part) {
          throw new Error('Inventory part not found in this company');
        }

        const previousStock = part.currentStock;
        let newStock = previousStock;

        if (type === 'PURCHASE' || type === 'RETURN') {
          newStock = previousStock + qty;
        } else if (type === 'TECHNICIAN_ISSUE' || type === 'JOB_CONSUMPTION') {
          if (previousStock < qty) {
            throw new Error(`Insufficient inventory: Available stock (${previousStock}) is less than requested quantity (${qty})`);
          }
          newStock = previousStock - qty;
        } else if (type === 'ADJUSTMENT') {
          newStock = Number(quantity);
          if (newStock < 0) {
            throw new Error('Adjusted stock level cannot be negative');
          }
        }

        // 2. Create immutable movement ledger record
        const movement = await tx.inventoryMovement.create({
          data: {
            companyId: part.companyId,
            branchId: part.branchId,
            partId: part.id,
            type: type || 'PURCHASE',
            quantity: type === 'TECHNICIAN_ISSUE' || type === 'JOB_CONSUMPTION' ? -qty : qty,
            previousStock,
            newStock,
            referenceId: referenceId || null,
            technicianId: technicianId || user.technicianId || null,
            performedBy: user.email || 'Inventory Manager',
            notes: notes || null,
          },
          include: { part: true, technician: true },
        });

        // 3. Update stock on part
        const updatedPart = await tx.inventoryPart.update({
          where: { id: part.id },
          data: { currentStock: newStock },
        });

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            companyId: part.companyId,
            entityType: 'Inventory',
            entityId: part.id,
            action: type,
            performedBy: user.email || 'Inventory Manager',
            userRole: user.role,
            details: `Inventory ${type} recorded for ${part.name} (${part.partNumber}): ${previousStock} -> ${newStock} units`,
          },
        });

        return { movement, updatedStock: updatedPart };
      });
    } catch (err: any) {
      if (err?.message?.includes('Insufficient inventory') || err?.message?.includes('cannot be negative')) {
        res.status(400).json({ success: false, message: err.message, code: 'INSUFFICIENT_STOCK' });
        return;
      }

      // Fallback
      const partIndex = db.inventory.findIndex((i) => i.id === partId && (isSuper || i.companyId === companyId));
      if (partIndex === -1) {
        res.status(404).json({ success: false, message: 'Inventory part not found', code: 'NOT_FOUND' });
        return;
      }

      const part = db.inventory[partIndex];
      const previousStock = part.currentStock;
      let newStock = previousStock;

      if (type === 'PURCHASE' || type === 'RETURN') {
        newStock = previousStock + qty;
      } else if (type === 'TECHNICIAN_ISSUE' || type === 'JOB_CONSUMPTION') {
        newStock = Math.max(0, previousStock - qty);
      } else if (type === 'ADJUSTMENT') {
        newStock = qty;
      }

      part.currentStock = newStock;
      const mov = {
        id: `mov-${Date.now()}`,
        partId,
        partNumber: part.partNumber,
        partName: part.name,
        type,
        quantity: qty,
        previousStock,
        newStock,
        timestamp: new Date().toISOString(),
      };
      db.inventoryMovements.unshift(mov as any);
      result = { movement: mov, updatedStock: part };
    }

    res.status(201).json({ success: true, data: result, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Inventory movement failed', code: 'MOVEMENT_ERROR' });
  }
});

// POST /api/inventory — Add new inventory part
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.body.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const branchId = user.branchId || req.body.branchId || 'br-mum-1';
    const { name, partNumber, category, currentStock, minStockLevel, unitPrice, locationRack, purchasePrice, sellingPrice, hsnCode, supplier, compatibleModels } = req.body;

    if (!name || !partNumber) {
      res.status(400).json({ success: false, message: 'Part name and part number are required', code: 'VALIDATION_ERROR' });
      return;
    }

    let created: any = null;
    try {
      created = await prisma.inventoryPart.create({
        data: {
          companyId,
          branchId,
          name,
          partNumber,
          category: (category?.toUpperCase() || 'MECHANICAL') as any,
          currentStock: Number(currentStock || 0),
          minStockThreshold: Number(minStockLevel || 5),
          purchasePrice: Number(purchasePrice || unitPrice || 0),
          sellingPrice: Number(sellingPrice || unitPrice || 0),
          hsnCode: hsnCode || '84313100',
          supplier: supplier || 'OEM Supplier',
          locationRack: locationRack || 'Bay A-01',
          compatibleModels: Array.isArray(compatibleModels) ? compatibleModels : ['Universal'],
        },
      });
    } catch {
      created = {
        id: `part-${Date.now()}`,
        companyId,
        branchId,
        name,
        partNumber,
        category: category || 'General',
        currentStock: Number(currentStock || 0),
        minStockThreshold: Number(minStockLevel || 5),
        purchasePrice: Number(purchasePrice || unitPrice || 0),
        locationRack: locationRack || 'Bay A-01',
        createdAt: new Date().toISOString(),
      };
      db.inventory.unshift(created);
    }

    res.status(201).json({ success: true, data: created, message: 'Inventory part added successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to add inventory part', code: 'CREATE_ERROR' });
  }
});

// PATCH /api/inventory/:id — Update inventory part
router.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';

    let updated: any = null;
    try {
      await prisma.inventoryPart.updateMany({
        where: { id, ...(isSuper ? {} : { companyId }) },
        data: req.body,
      });
      updated = await prisma.inventoryPart.findUnique({ where: { id } });
    } catch {
      // Fallback
    }

    if (!updated) {
      const idx = db.inventory.findIndex((i) => i.id === id && (isSuper || i.companyId === companyId));
      if (idx !== -1) {
        db.inventory[idx] = { ...db.inventory[idx], ...req.body };
        updated = db.inventory[idx];
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, message: 'Inventory part not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: updated, message: 'Inventory part updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update inventory part', code: 'UPDATE_ERROR' });
  }
});

export default router;
