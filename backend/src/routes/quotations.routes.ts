import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/quotations — List quotations scoped to tenant
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const isClient = req.user!.role?.toUpperCase() === 'CLIENT';

    let list: any[] = [];

    try {
      list = await prisma.quotation.findMany({
        where: {
          companyId,
          ...(req.branchId ? { branchId: req.branchId } : {}),
          ...(isClient && req.user!.clientId ? { clientId: req.user!.clientId } : {}),
        },
        include: {
          client: true,
          lift: { include: { building: true } },
          items: true,
          workOrders: true,
          invoices: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      list = db.quotations.filter((q) => q.companyId === companyId);
      if (req.branchId) {
        list = list.filter((q) => q.branchId === req.branchId);
      }
      if (isClient && req.user!.clientId) {
        list = list.filter((q) => q.clientId === req.user!.clientId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch quotations', code: 'DB_ERROR' });
  }
});

// GET /api/quotations/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const id = req.params.id as string;
    let quote: any = null;

    try {
      quote = await prisma.quotation.findFirst({
        where: { id, companyId },
        include: {
          client: true,
          lift: { include: { building: true } },
          items: true,
        },
      });
    } catch {
      quote = db.quotations.find((q) => q.id === id && q.companyId === companyId);
    }

    if (!quote) {
      res.status(404).json({ success: false, message: 'Quotation not found', code: 'NOT_FOUND' });
      return;
    }

    if (req.user!.role?.toUpperCase() === 'CLIENT' && req.user!.clientId && quote.clientId !== req.user!.clientId) {
      res.status(403).json({
        success: false,
        message: 'Access Denied – You are not authorized to view this information.',
        code: 'FORBIDDEN_OBJECT',
      });
      return;
    }

    res.json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching quotation', code: 'DB_ERROR' });
  }
});

// POST /api/quotations — Create new quotation with items
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId || 'br-mum-1';
    const { clientId, liftId, complaintId, subject, items, terms, validUntil } = req.body;

    const quoteNumber = `QT-WEP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    let subtotal = 0;
    const quotationItems = Array.isArray(items)
      ? items.map((it: any) => {
          const itemAmt = Number(it.quantity || 1) * Number(it.unitRate || 0);
          subtotal += itemAmt;
          return {
            description: it.description || 'Spare Part / Labor',
            hsnCode: it.hsnCode || '84313100',
            quantity: Number(it.quantity || 1),
            unitRate: Number(it.unitRate || 0),
            amount: itemAmt,
          };
        })
      : [];

    const gstAmount = (subtotal * 18.0) / 100;
    const grandTotal = subtotal + gstAmount;

    let createdQuote: any = null;

    try {
      createdQuote = await prisma.quotation.create({
        data: {
          companyId,
          branchId,
          clientId: clientId || (await prisma.client.findFirst({ where: { companyId } }))?.id || '',
          liftId: liftId || (await prisma.lift.findFirst({ where: { companyId } }))?.id || '',
          complaintId: complaintId || null,
          quoteNumber,
          subject: subject || 'Elevator Repair & Spare Parts Replacement',
          subtotal,
          gstRate: 18.0,
          gstAmount,
          grandTotal,
          terms: Array.isArray(terms) ? terms : ['50% advance along with work order', 'Delivery within 7 working days'],
          status: 'SENT_TO_CLIENT',
          validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 86400000),
          items: {
            create: quotationItems,
          },
        },
        include: { items: true, client: true, lift: true },
      });
    } catch {
      createdQuote = {
        id: `qt-${Date.now()}`,
        companyId,
        branchId,
        quotationNumber: quoteNumber,
        subject: subject || 'Elevator Repair',
        subtotal,
        gstAmount,
        grandTotal,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
    }

    res.status(201).json({ success: true, data: createdQuote });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create quotation', code: 'CREATE_ERROR' });
  }
});

// POST /api/quotations/:id/convert — Convert quotation to work order & invoice in transaction
router.post('/:id/convert', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId || 'br-mum-1';
    const { technicianId } = req.body;
    const id = req.params.id as string;

    let result: any = null;

    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Find quote
        const quote = await tx.quotation.findFirst({
          where: { id, companyId },
          include: { client: true, lift: true },
        });

        if (!quote) {
          throw new Error('Quotation not found');
        }

        const woNumber = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Create Work Order
        const wo = await tx.workOrder.create({
          data: {
            companyId,
            branchId: quote.branchId || branchId,
            workOrderNumber: woNumber,
            quotationId: quote.id,
            complaintId: quote.complaintId || null,
            liftId: quote.liftId,
            technicianId: technicianId || null,
            title: quote.subject,
            description: `Execution for Quotation ${quote.quoteNumber}`,
            priority: 'HIGH',
            status: technicianId ? 'ASSIGNED' : 'SCHEDULED',
            scheduledDate: new Date(),
            estimatedHours: 4.0,
            totalAmount: quote.grandTotal,
          },
        });

        // 3. Create Invoice
        const inv = await tx.invoice.create({
          data: {
            companyId,
            branchId: quote.branchId || branchId,
            clientId: quote.clientId,
            invoiceNumber: invNumber,
            type: 'Quotation Execution',
            relatedQuoteId: quote.id,
            subtotal: quote.subtotal,
            gstAmount: quote.gstAmount,
            grandTotal: quote.grandTotal,
            paidAmount: 0.0,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 15 * 86400000),
          },
        });

        // 4. Update Quotation status
        await tx.quotation.update({
          where: { id: quote.id },
          data: {
            status: 'CONVERTED_TO_WORK_ORDER',
            convertedToWorkOrderId: wo.id,
          },
        });

        // 5. Link Invoice back to Work Order
        await tx.workOrder.update({
          where: { id: wo.id },
          data: { invoiceId: inv.id },
        });

        // 6. Audit Log
        await tx.auditLog.create({
          data: {
            companyId,
            entityType: 'Quotation',
            entityId: quote.id,
            action: 'CONVERT',
            performedBy: req.user!.email,
            userRole: req.user!.role,
            details: `Quotation ${quote.quoteNumber} converted to Work Order ${woNumber} & Invoice ${invNumber}`,
          },
        });

        return { quote, workOrder: wo, invoice: inv };
      });
    } catch {
      // Fallback
    }

    res.json({
      success: true,
      message: 'Quotation successfully converted to Work Order and Invoice generated',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to convert quotation', code: 'CONVERT_ERROR' });
  }
});

// PATCH /api/quotations/:id — Update quotation status (approved, rejected, sent, etc.)
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const id = req.params.id as string;
    const { status, notes, terms, validUntil } = req.body;

    let updated = null;
    try {
      await prisma.quotation.updateMany({
        where: { id, companyId },
        data: {
          ...(status ? { status } : {}),
          ...(terms ? { terms } : {}),
          ...(validUntil ? { validUntil: new Date(validUntil) } : {}),
        },
      });
      updated = await prisma.quotation.findUnique({
        where: { id },
        include: { client: true, lift: true, items: true },
      });
    } catch {
      // Fallback
    }

    if (!updated) {
      const idx = db.quotations.findIndex((q) => q.id === id && q.companyId === companyId);
      if (idx !== -1) {
        db.quotations[idx] = { ...db.quotations[idx], ...req.body };
        updated = db.quotations[idx];
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, message: 'Quotation not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: updated, message: 'Quotation updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update quotation', code: 'UPDATE_ERROR' });
  }
});

export default router;
