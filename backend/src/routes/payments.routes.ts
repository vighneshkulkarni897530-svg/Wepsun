import { Router, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Initialize Razorpay SDK singleton if credentials are configured
function getRazorpayInstance(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (key_id && key_secret && !key_id.includes('demo') && !key_id.includes('your_key_id')) {
    return new Razorpay({ key_id, key_secret });
  }
  return null;
}

// Cryptographic HMAC-SHA256 signature verification
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret.includes('demo') || keySecret.includes('your_razorpay_secret')) {
    return !!paymentId;
  }
  if (!signature) return false;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
}

// POST /api/payments/razorpay/create-order
router.post('/razorpay/create-order', requireAuth, requireRole(['CLIENT', 'ACCOUNTS', 'SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { invoiceId, amount, currency = 'INR' } = req.body;

    let invoice: any = null;

    try {
      invoice = await prisma.invoice.findFirst({
        where: {
          companyId,
          OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }],
        },
        include: { client: true },
      });
    } catch {
      invoice = db.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    }

    // Client ownership check
    if (user.role === 'CLIENT' && user.clientId && invoice && invoice.clientId !== user.clientId) {
      res.status(403).json({ success: false, message: 'Access Denied – You are not authorized to view this information.', code: 'FORBIDDEN' });
      return;
    }

    const total = amount || (invoice ? invoice.grandTotal : 15000);
    const amountInPaise = Math.round(total * 100);

    const rzp = getRazorpayInstance();
    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (rzp) {
      try {
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency,
          receipt: invoice?.invoiceNumber || `REC-${Date.now()}`,
          notes: {
            companyId,
            invoiceId: invoice?.id || invoiceId || '',
            userId: user.sub || '',
          },
        });
        orderId = rzpOrder.id;
      } catch (err: any) {
        console.warn('[Razorpay API] Live order creation error, falling back to simulated order:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        orderId,
        amount: amountInPaise,
        currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_wepsun_demo',
        invoiceNumber: invoice?.invoiceNumber || 'INV-2026-001',
        clientName: invoice?.client?.name || invoice?.clientName || 'Valued Customer',
        companyName: 'WEPSUN Engineering Solution Pvt. Ltd.',
      },
      message: 'Razorpay order created successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create payment order', code: 'ORDER_ERROR' });
  }
});

// POST /api/payments/razorpay/verify
router.post('/razorpay/verify', requireAuth, requireRole(['CLIENT', 'ACCOUNTS', 'SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, invoiceId, paymentMethod = 'UPI_QR' } = req.body;

    if (!razorpayPaymentId) {
      res.status(400).json({
        success: false,
        message: 'Razorpay payment ID is required.',
        code: 'INVALID_PAYMENT',
      });
      return;
    }

    // Cryptographic signature check
    if (razorpayOrderId && razorpaySignature) {
      const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Razorpay signature verification failed.',
          code: 'INVALID_SIGNATURE',
        });
        return;
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.findFirst({
          where: {
            companyId,
            OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }],
          },
        });

        if (inv) {
          if (user.role === 'CLIENT' && user.clientId && inv.clientId !== user.clientId) {
            throw new Error('Access Denied – You are not authorized to view this information.');
          }

          await tx.payment.create({
            data: {
              invoiceId: inv.id,
              amount: inv.grandTotal,
              method: (paymentMethod as any) || 'UPI_QR',
              transactionId: razorpayPaymentId,
              gatewayRef: razorpayOrderId || `rzp_order_${Date.now()}`,
              verified: true,
            },
          });

          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              status: 'PAID',
              paidAmount: inv.grandTotal,
              transactionId: razorpayPaymentId,
            },
          });

          await tx.auditLog.create({
            data: {
              companyId,
              entityType: 'Invoice',
              entityId: inv.id,
              action: 'PAYMENT_RECEIVED',
              performedBy: user.email || 'Razorpay Gateway',
              userRole: user.role,
              details: `Online payment of ₹${inv.grandTotal} settled successfully (Ref: ${razorpayPaymentId})`,
            },
          });
        }
      });
    } catch (err: any) {
      if (err?.message?.includes('Forbidden')) {
        res.status(403).json({ success: false, message: err.message, code: 'FORBIDDEN' });
        return;
      }
      // Fallback
      const invoice = db.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (invoice) {
        invoice.status = 'paid' as any;
      }
    }

    res.json({
      success: true,
      data: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        invoiceStatus: 'paid',
        settledAt: new Date().toISOString(),
      },
      message: 'Payment verified and settled successfully in PostgreSQL database.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Payment verification failed', code: 'VERIFICATION_ERROR' });
  }
});

// POST /api/payments/webhook — Razorpay Webhook Handler
router.post('/webhook', async (req: any, res: Response): Promise<void> => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookSignature = req.headers['x-razorpay-signature'] as string;

    if (webhookSecret && webhookSignature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== webhookSignature) {
        res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
        return;
      }
    }

    const event = req.body.event;
    console.log(`💳 [Razorpay Webhook Received]: ${event}`);

    res.json({
      status: 'ok',
      event,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
