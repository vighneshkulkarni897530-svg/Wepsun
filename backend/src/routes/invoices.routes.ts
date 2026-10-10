import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/invoices — List invoices scoped to tenant and user role
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const isClient = user.role === 'CLIENT';

    if (isClient && !user.clientId) {
      res.json({ success: true, count: 0, data: [] });
      return;
    }

    let list: any[] = [];

    try {
      list = await prisma.invoice.findMany({
        where: {
          companyId,
          ...(user.branchId ? { branchId: user.branchId } : {}),
          ...(isClient ? { clientId: user.clientId! } : {}),
        },
        include: {
          client: true,
          amcContract: true,
          quotation: true,
          payments: true,
        },
        orderBy: { invoiceDate: 'desc' },
      });
    } catch {
      list = db.invoices.filter((i) => i.companyId === companyId);
      if (user.branchId) {
        list = list.filter((i) => i.branchId === user.branchId);
      }
      if (isClient) {
        list = list.filter((i) => i.clientId === user.clientId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch invoices', code: 'DB_ERROR' });
  }
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';

    let invoice: any = null;

    try {
      invoice = await prisma.invoice.findFirst({
        where: { id, ...(isSuper ? {} : { companyId }) },
        include: {
          client: true,
          amcContract: true,
          quotation: true,
          payments: true,
        },
      });
    } catch {
      invoice = db.invoices.find((i) => i.id === id && (isSuper || i.companyId === companyId));
    }

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found', code: 'NOT_FOUND' });
      return;
    }

    // Client ownership check
    if (user.role === 'CLIENT') {
      if (!user.clientId || invoice.clientId !== user.clientId) {
        res.status(403).json({ success: false, message: 'Access Denied – You are not authorized to view this information.', code: 'FORBIDDEN' });
        return;
      }
    }

    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching invoice', code: 'DB_ERROR' });
  }
});

// POST /api/invoices/:id/pay — Record invoice payment in transaction
router.post('/:id/pay', requireAuth, requireRole(['CLIENT', 'ACCOUNTS', 'SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id as string;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { paymentMethod, transactionId, amount } = req.body;

    const txnId = transactionId || `TXN-WEP-${Math.floor(10000000 + Math.random() * 90000000)}`;

    let updatedInvoice: any = null;

    try {
      updatedInvoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.findFirst({
          where: { id, ...(isSuper ? {} : { companyId }) },
        });

        if (!inv) {
          throw new Error('Invoice not found');
        }

        if (user.role === 'CLIENT') {
          if (!user.clientId || inv.clientId !== user.clientId) {
            throw new Error('Access Denied – You are not authorized to view this information.');
          }
        }

        const payAmount = Number(amount || inv.grandTotal);

        // 1. Create Payment record
        await tx.payment.create({
          data: {
            invoiceId: inv.id,
            amount: payAmount,
            method: (paymentMethod || 'UPI_QR') as any,
            transactionId: txnId,
            verified: true,
          },
        });

        // 2. Update Invoice
        const updated = await tx.invoice.update({
          where: { id: inv.id },
          data: {
            status: 'PAID',
            paidAmount: payAmount,
            paymentMethod: (paymentMethod || 'UPI_QR') as any,
            transactionId: txnId,
          },
          include: { payments: true, client: true },
        });

        // 3. Audit Log
        await tx.auditLog.create({
          data: {
            companyId: inv.companyId,
            entityType: 'Invoice',
            entityId: inv.id,
            action: 'PAYMENT_RECEIVED',
            performedBy: user.email || 'Client',
            userRole: user.role,
            details: `Payment of ₹${payAmount} recorded for Invoice ${inv.invoiceNumber} (Txn: ${txnId})`,
          },
        });

        return updated;
      });
    } catch (err: any) {
      if (err?.message?.includes('Forbidden')) {
        res.status(403).json({ success: false, message: err.message, code: 'FORBIDDEN' });
        return;
      }
      // Fallback
      const invIndex = db.invoices.findIndex((i) => i.id === id && (isSuper || i.companyId === companyId));
      if (invIndex === -1) {
        res.status(404).json({ success: false, message: 'Invoice not found', code: 'NOT_FOUND' });
        return;
      }
      db.invoices[invIndex].status = 'paid';
      db.invoices[invIndex].paymentMethod = paymentMethod || 'UPI / QR';
      db.invoices[invIndex].transactionId = txnId;
      updatedInvoice = db.invoices[invIndex];
    }

    res.json({ success: true, data: updatedInvoice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Payment processing failed', code: 'PAYMENT_ERROR' });
  }
});

export default router;
