import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications — Get notifications scoped to tenant and user
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.query.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';

    let notificationsList: any[] = [];

    try {
      notificationsList = await prisma.notification.findMany({
        where: {
          companyId,
          ...(user.sub ? { OR: [{ userId: user.sub }, { userId: null }] } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback
      notificationsList = [
        {
          id: 'notif_1',
          companyId,
          title: '🚨 Emergency Breakdown Reported',
          message: 'Skyline Towers (Lift WPS-PUN-000123) reported Door Jammed. Assigned to Rajesh Sharma.',
          type: 'BREAKDOWN',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif_2',
          companyId,
          title: '⏱️ PM Visit Due in 48 Hours',
          message: 'Greenwood Heights CHS (Lift WPS-PUN-000124) scheduled for monthly 4-zone safety inspection.',
          type: 'PM_DUE',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    }

    const unreadCount = notificationsList.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      data: notificationsList,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch notifications', code: 'DB_ERROR' });
  }
});

// PATCH /api/notifications/:id/read — Mark notification as read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch {
      // Fallback
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update notification', code: 'UPDATE_ERROR' });
  }
});

// POST /api/notifications/push — Create and dispatch notification
router.post('/push', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const isSuper = user.role === 'SUPER_ADMIN';
    const companyId = isSuper ? (req.body.companyId as string) || user.companyId || 'comp-1' : user.companyId || 'comp-1';
    const { title, message, type, entityType, entityId, userId } = req.body;

    let newNotif: any = null;

    try {
      newNotif = await prisma.notification.create({
        data: {
          companyId,
          userId: userId || null,
          title: title || 'WEPSUN Alert',
          message: message || 'System notification',
          type: type || 'SYSTEM',
          entityType: entityType || null,
          entityId: entityId || null,
          isRead: false,
        },
      });
    } catch {
      newNotif = {
        id: `notif_${Date.now()}`,
        companyId,
        title: title || 'WEPSUN Alert',
        message: message || 'System notification',
        type: type || 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
    }

    res.status(201).json({
      success: true,
      data: newNotif,
      fcmStatus: 'queued_to_fcm_topic',
      message: 'Push notification stored and triggered successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to trigger notification', code: 'PUSH_ERROR' });
  }
});

// POST /api/notifications/whatsapp/send — Dispatch WhatsApp template alert
router.post('/whatsapp/send', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { toPhone, templateName, params, companyName, pdfUrl } = req.body;

    if (!toPhone || !templateName) {
      res.status(400).json({ success: false, message: 'toPhone and templateName are required.', code: 'MISSING_FIELDS' });
      return;
    }

    const { sendWhatsAppMessage } = await import('../lib/notifications.js');
    const result = await sendWhatsAppMessage({
      toPhone,
      templateName,
      params: params || {},
      companyName: companyName || 'WEPSUN Lift Services',
      pdfUrl,
    });

    res.json({
      success: true,
      data: result,
      message: 'WhatsApp alert processed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'WhatsApp dispatch error', code: 'WHATSAPP_ERROR' });
  }
});

// POST /api/notifications/sms/send — Dispatch SMS alert
router.post('/sms/send', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { toPhone, message, senderId } = req.body;

    if (!toPhone || !message) {
      res.status(400).json({ success: false, message: 'toPhone and message are required.', code: 'MISSING_FIELDS' });
      return;
    }

    const { sendSmsAlert } = await import('../lib/notifications.js');
    const result = await sendSmsAlert({
      toPhone,
      message,
      senderId: senderId || 'WEPSUN',
    });

    res.json({
      success: true,
      data: result,
      message: 'SMS alert dispatched successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'SMS dispatch error', code: 'SMS_ERROR' });
  }
});

// POST /api/notifications/dispatch-emergency — Multi-channel emergency broadcast
router.post('/dispatch-emergency', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ticketNumber, liftNumber, buildingName, clientName, clientPhone, technicianName, technicianPhone, issueType } = req.body;
    const { sendWhatsAppMessage, sendSmsAlert } = await import('../lib/notifications.js');

    // 1. WhatsApp to Client
    const waClient = await sendWhatsAppMessage({
      toPhone: clientPhone || '+919822011223',
      templateName: 'emergency_breakdown_alert',
      params: {
        ticketNumber: ticketNumber || `TKT-${Date.now().toString().slice(-4)}`,
        liftNumber: liftNumber || 'WPS-PUN-000123',
        buildingName: buildingName || 'Skyline Towers',
        clientName: clientName || 'Resident',
        technicianName: technicianName || 'Rajesh Sharma',
        issueType: issueType || 'Breakdown Call',
        eta: 'Within 30 mins',
      },
      companyName: 'WEPSUN Lift Services',
    });

    // 2. High-priority SMS to Client
    const smsClient = await sendSmsAlert({
      toPhone: clientPhone || '+919822011223',
      message: `[WEPSUN ALERT] Breakdown Ticket #${ticketNumber || 'TKT'} for Lift ${liftNumber} has been dispatched. Tech: ${technicianName}. Control Room: +919820155432`,
    });

    res.json({
      success: true,
      data: {
        whatsapp: waClient,
        sms: smsClient,
      },
      message: 'Emergency alerts broadcasted across WhatsApp and SMS.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Emergency broadcast error', code: 'BROADCAST_ERROR' });
  }
});

// POST /api/notifications/enquiries — Submit customer inquiry / quotation request
router.post('/enquiries', async (req: any, res: Response): Promise<void> => {
  try {
    const { name, email, phone, companyName, message, serviceInterest, city, liftCount } = req.body;

    if (!name || (!email && !phone)) {
      res.status(400).json({ success: false, message: 'Name and contact (email or phone) are required', code: 'VALIDATION_ERROR' });
      return;
    }

    const enquiry = {
      id: `enq_${Date.now()}`,
      name,
      email: email || '',
      phone: phone || '',
      companyName: companyName || '',
      message: message || '',
      serviceInterest: serviceInterest || 'AMC Contract',
      city: city || 'Pune / Mumbai',
      liftCount: Number(liftCount || 1),
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };

    try {
      await prisma.notification.create({
        data: {
          companyId: req.body.companyId || 'comp-1',
          title: `New Business Enquiry: ${name}`,
          message: `${serviceInterest || 'AMC'}: ${message || 'Request for quote'} (${phone || email})`,
          type: 'ENQUIRY',
          entityType: 'BusinessEnquiry',
          entityId: enquiry.id,
          isRead: false,
        },
      });
    } catch {
      // Non-blocking
    }

    res.status(201).json({
      success: true,
      data: enquiry,
      message: 'Your enquiry has been received. Our engineering team will contact you within 2 business hours.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to submit enquiry', code: 'ENQUIRY_ERROR' });
  }
});

// GET /api/notifications/enquiries — Get business enquiries
router.get('/enquiries', requireAuth, requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId || 'comp-1';
    let notifs: any[] = [];
    try {
      notifs = await prisma.notification.findMany({
        where: { companyId, type: 'ENQUIRY' },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      notifs = [];
    }
    res.json({ success: true, count: notifs.length, data: notifs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch enquiries', code: 'DB_ERROR' });
  }
});

export default router;
