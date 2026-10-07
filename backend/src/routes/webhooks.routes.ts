/**
 * WEPSUN Engineering Solutions — Email Delivery & Provider Webhooks API
 * Ingests delivery events (delivered, bounced, complained) from Resend Webhooks
 * for real-time delivery telemetry without storing sensitive message content.
 */

import { Router, Request, Response } from 'express';
import { maskEmail } from '../lib/emailOtpService.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

export interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      message: string;
      code: string;
    };
  };
}

// In-memory delivery events store for live telemetry monitoring
export const recentDeliveryEvents: Array<{
  id: string;
  type: string;
  recipient: string;
  timestamp: string;
  details?: string;
}> = [];

// POST /api/webhooks/resend — Resend Delivery Webhook Ingestion
router.post('/resend', async (req: Request, res: Response): Promise<void> => {
  const event = req.body as ResendWebhookEvent;

  if (!event || !event.type || !event.data) {
    res.status(400).json({ success: false, message: 'Invalid webhook payload structure.' });
    return;
  }

  const eventType = event.type;
  const messageId = event.data.id || 'unknown';
  const recipients = Array.isArray(event.data.to) ? event.data.to : [];
  const maskedRecipients = recipients.map(maskEmail).join(', ');

  console.log(`[RESEND_WEBHOOK] event=${eventType} messageId=${messageId} recipients=[${maskedRecipients}] timestamp=${event.created_at || new Date().toISOString()}`);

  if (eventType === 'email.bounced') {
    const bounceReason = event.data.bounce?.message || 'Undeliverable / Mailbox unavailable';
    console.warn(`[RESEND_WEBHOOK_BOUNCE] messageId=${messageId} recipient=${maskedRecipients} reason="${bounceReason}"`);
  }

  if (eventType === 'email.complained') {
    console.warn(`[RESEND_WEBHOOK_COMPLAINT] messageId=${messageId} recipient=${maskedRecipients} (User marked as spam)`);
  }

  // Record safe event in telemetry buffer (max 100 recent events)
  recentDeliveryEvents.unshift({
    id: messageId,
    type: eventType,
    recipient: maskedRecipients,
    timestamp: event.created_at || new Date().toISOString(),
    details: event.data.bounce?.message,
  });

  if (recentDeliveryEvents.length > 100) {
    recentDeliveryEvents.pop();
  }

  // Non-blocking Audit Log creation for bounces or complaints
  if (eventType === 'email.bounced' || eventType === 'email.complained') {
    try {
      await prisma.auditLog.create({
        data: {
          companyId: 'comp-1',
          entityType: 'EmailDelivery',
          entityId: messageId,
          action: eventType.toUpperCase().replace('.', '_'),
          performedBy: 'Resend Webhook Service',
          userRole: 'SYSTEM',
          details: `Email delivery event '${eventType}' recorded for recipient: ${maskedRecipients}`,
        },
      });
    } catch {
      // Non-blocking
    }
  }

  res.json({ received: true, eventId: messageId, type: eventType });
});

export default router;
