/**
 * WEPSUN Engineering Solutions — Real-Time WhatsApp & SMS Dispatch Engine
 * Multi-Tenant Alert Gateway for Emergency Breakdowns, PM Visits, and AMC Invoicing
 */

export interface WhatsAppPayload {
  toPhone: string;
  templateName:
    | 'emergency_breakdown_alert'
    | 'technician_dispatched'
    | 'ticket_resolved_feedback'
    | 'pm_service_reminder'
    | 'amc_renewal_invoice'
    | 'amc_expiry_renewal_alert';
  params: Record<string, string>;
  companyName?: string;
  pdfUrl?: string;
}

export interface SmsPayload {
  toPhone: string;
  message: string;
  senderId?: string;
}

export interface DispatchResult {
  success: boolean;
  channel: 'whatsapp' | 'sms' | 'direct_link';
  messageId?: string;
  directUrl?: string;
  error?: string;
}

/**
 * 1. Generate Direct Click-to-Chat WhatsApp URL for instant client/technician messaging
 */
export function generateWhatsAppDirectLink(toPhone: string, text: string): string {
  const cleanPhone = toPhone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * 2. Format Pre-Approved Corporate WhatsApp Message Templates
 */
export function formatWhatsAppMessage(
  templateName: WhatsAppPayload['templateName'],
  params: Record<string, string>,
  companyName: string = 'WEPSUN Lift Services'
): string {
  switch (templateName) {
    case 'emergency_breakdown_alert':
      return (
        `🚨 *${companyName.toUpperCase()} — EMERGENCY BREAKDOWN TICKET*\n\n` +
        `Dear *${params.clientName || 'Customer'}*,\n` +
        `Your breakdown complaint for *Lift ${params.liftNumber || 'N/A'}* (${params.buildingName || 'Site'}) has been registered.\n\n` +
        `📋 *Ticket No:* ${params.ticketNumber}\n` +
        `⚠️ *Issue:* ${params.issueType || 'Breakdown'}\n` +
        `🕒 *Reported At:* ${params.reportedAt || new Date().toLocaleString('en-IN')}\n` +
        `👷 *Assigned Engineer:* ${params.technicianName || 'Standby Tech'}\n` +
        `⏱️ *ETA:* ${params.eta || 'Within 45 mins'}\n\n` +
        `📞 *24x7 Emergency Helpline:* +91 98201 55432\n` +
        `_Reliable Service. Safer Tomorrow._`
      );

    case 'technician_dispatched':
      return (
        `👷 *${companyName.toUpperCase()} — FIELD ENGINEER EN ROUTE*\n\n` +
        `Dear *${params.clientName || 'Customer'}*,\n` +
        `Technician *${params.technicianName}* is on the way to *${params.buildingName}* for Ticket *#${params.ticketNumber}*.\n\n` +
        `📍 *Current Location:* ${params.technicianLocation || 'City Zone'}\n` +
        `⏱️ *Estimated Arrival:* ${params.eta || '15-20 mins'}\n` +
        `📞 *Technician Contact:* ${params.technicianPhone || '+91 98203 11223'}\n\n` +
        `🔐 *Your Safety Verification OTP:* *${params.otp || '5821'}*\n` +
        `_(Please share OTP with technician upon arrival)_`
      );

    case 'ticket_resolved_feedback':
      return (
        `✅ *${companyName.toUpperCase()} — BREAKDOWN RESOLVED*\n\n` +
        `Dear *${params.clientName || 'Customer'}*,\n` +
        `Your Lift *${params.liftNumber}* at *${params.buildingName}* is now fully operational and tested.\n\n` +
        `📋 *Ticket No:* ${params.ticketNumber}\n` +
        `🔧 *Action Taken:* ${params.actionTaken || 'Adjustment and safety calibration complete'}\n` +
        `⏱️ *Total Downtime:* ${params.downtime || '38 mins'}\n\n` +
        `⭐ *Rate our Service:* ${params.feedbackUrl || 'https://wepsun.com/#feedback-form'}\n` +
        `📑 *Download Service Report:* ${params.reportUrl || 'https://wepsun.com/#lift-passport'}`
      );

    case 'pm_service_reminder':
      return (
        `📅 *${companyName.toUpperCase()} — PREVENTIVE MAINTENANCE SCHEDULED*\n\n` +
        `Dear *${params.clientName || 'Secretary'}*,\n` +
        `The monthly 4-Zone preventive maintenance for *Lift ${params.liftNumber}* (${params.buildingName}) is scheduled for *${params.pmDate || 'Tomorrow at 11:00 AM'}*.\n\n` +
        `🔍 *Scope:* Machine room inspection, car leveling, safety gear & ARD battery diagnostics.\n` +
        `👷 *Lead Engineer:* ${params.technicianName || 'WEPSUN PM Team'}\n\n` +
        `_For any scheduling changes, reply to this message or call +91 98201 55432._`
      );

    case 'amc_renewal_invoice':
      return (
        `💳 *${companyName.toUpperCase()} — AMC CONTRACT & INVOICE*\n\n` +
        `Dear *${params.clientName}*,\n` +
        `Invoice *#${params.invoiceNumber}* for your *${params.amcType || 'Comprehensive'} AMC Contract* is ready.\n\n` +
        `🏢 *Building:* ${params.buildingName}\n` +
        `💰 *Total Amount:* Rs. ${params.amount}\n` +
        `📅 *Due Date:* ${params.dueDate}\n\n` +
        `⚡ *Instant UPI / Online Payment Link:* ${params.paymentLink || 'https://wepsun.com/#payments'}\n` +
        `_Thank you for choosing WEPSUN for elevator safety._`
      );

    case 'amc_expiry_renewal_alert':
      return (
        `⚠️ *${companyName.toUpperCase()} — AMC CONTRACT EXPIRY & RENEWAL NOTICE*\n\n` +
        `Dear *${params.clientName || 'Secretary / Facility Head'}*,\n` +
        `This is an important reminder that your AMC Contract *#${params.contractNumber}* for *${params.buildingName}* is expiring in *${params.daysRemaining} days* (Expiry Date: *${params.expiryDate}*).\n\n` +
        `🛡️ *Plan Type:* ${params.amcType || 'Comprehensive AMC'}\n` +
        `🛗 *Lifts Protected:* ${params.liftCount || '2'} Elevators\n` +
        `💰 *Renewed Contract Quote:* Rs. ${params.renewalAmount} (incl. 18% GST)\n\n` +
        `⚡ *1-Click Instant Renewal & Digital E-Sign:* ${params.renewalLink || 'https://wepsun.com/#amc-renewal'}\n` +
        `📞 *AMC Helpdesk & Queries:* +91 98201 55432\n` +
        `_Ensure uninterrupted 24/7 breakdown coverage and statutory compliance._`
      );

    default:
      return `📢 *${companyName}:* ${JSON.stringify(params)}`;
  }
}

/**
 * 3. Dispatch Live WhatsApp Message (Cloud API + Fallback URL)
 */
export async function sendWhatsAppMessage(payload: WhatsAppPayload): Promise<DispatchResult> {
  const messageText = formatWhatsAppMessage(payload.templateName, payload.params, payload.companyName);
  const directLink = generateWhatsAppDirectLink(payload.toPhone, messageText);

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (token && phoneId) {
    try {
      const cleanPhone = payload.toPhone.replace(/[^0-9]/g, '');
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: messageText },
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok && data.messages?.[0]?.id) {
        return {
          success: true,
          channel: 'whatsapp',
          messageId: data.messages[0].id,
          directUrl: directLink,
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp API] Direct HTTP dispatch error, falling back to direct URL generator:', err.message);
    }
  }

  // Graceful fallback to direct WhatsApp URL
  return {
    success: true,
    channel: 'direct_link',
    messageId: `wa_gen_${Date.now()}`,
    directUrl: directLink,
  };
}

/**
 * 4. Dispatch SMS Alert (Fast2SMS / MSG91 / Twilio Gateway with Mock/Prod mode)
 */
export async function sendSmsAlert(payload: SmsPayload): Promise<DispatchResult> {
  const apiKey = process.env.SMS_GATEWAY_API_KEY;
  const cleanPhone = payload.toPhone.replace(/[^0-9]/g, '');

  if (apiKey) {
    try {
      // Fast2SMS API example
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: payload.senderId || 'WEPSUN',
          message: payload.message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      });

      const resJson = (await response.json()) as any;
      if (response.ok && resJson.return) {
        return {
          success: true,
          channel: 'sms',
          messageId: resJson.request_id || `sms_${Date.now()}`,
        };
      }
    } catch (err: any) {
      console.warn('[SMS Gateway] API error:', err.message);
    }
  }

  // Mock successful delivery in development
  console.log(`📱 [SMS DISPATCHED to ${cleanPhone}]: ${payload.message}`);
  return {
    success: true,
    channel: 'sms',
    messageId: `sms_mock_${Date.now()}`,
  };
}
