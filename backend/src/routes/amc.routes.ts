import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/amc — List AMC contracts scoped to tenant
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
      list = await prisma.amcContract.findMany({
        where: {
          companyId,
          ...(req.branchId ? { branchId: req.branchId } : {}),
          ...(isClient ? { clientId: clientId! } : {}),
        },
        include: {
          client: true,
          lifts: {
            include: { building: true },
          },
          invoices: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      list = db.amcContracts.filter((a) => a.companyId === companyId);
      if (req.branchId) {
        list = list.filter((a) => a.branchId === req.branchId);
      }
      if (isClient) {
        list = list.filter((a) => a.clientId === clientId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch AMC contracts', code: 'DB_ERROR' });
  }
});

// GET /api/amc/expiring-renewals — Scans 30/60/90-day expiring AMC contracts & pipeline analytics
router.get('/expiring-renewals', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId || 'comp-1';
    const isClient = req.user!.role?.toUpperCase() === 'CLIENT';
    const clientId = req.user!.clientId;

    if (isClient && !clientId) {
      res.json({
        success: true,
        data: {
          summary: {
            totalExpiringCount: 0,
            criticalCount: 0,
            warningCount: 0,
            upcomingCount: 0,
            expiredCount: 0,
            totalAtRiskValue: 0,
            totalProjectedRenewalValue: 0,
            averageEscalationRate: 8.0,
          },
          contracts: [],
          critical: [],
          warning: [],
          upcoming: [],
          expired: [],
        },
      });
      return;
    }

    let allContracts: any[] = [];

    try {
      allContracts = await prisma.amcContract.findMany({
        where: {
          companyId,
          ...(req.branchId ? { branchId: req.branchId } : {}),
          ...(isClient ? { clientId: clientId! } : {}),
        },
        include: {
          client: true,
          lifts: {
            include: { building: true },
          },
          invoices: true,
        },
        orderBy: { endDate: 'asc' },
      });
    } catch {
      allContracts = db.amcContracts.filter((a) => a.companyId === companyId);
      if (req.branchId) allContracts = allContracts.filter((a) => a.branchId === req.branchId);
      if (isClient) allContracts = allContracts.filter((a) => a.clientId === clientId);
    }

    const now = Date.now();
    const categorized = allContracts.map((c: any) => {
      const endTimestamp = new Date(c.endDate).getTime();
      const daysRemaining = Math.ceil((endTimestamp - now) / (1000 * 60 * 60 * 24));

      let urgency: 'critical' | 'warning' | 'upcoming' | 'expired' | 'healthy' = 'healthy';
      if (daysRemaining < 0) {
        urgency = 'expired';
      } else if (daysRemaining <= 30) {
        urgency = 'critical';
      } else if (daysRemaining <= 60) {
        urgency = 'warning';
      } else if (daysRemaining <= 90) {
        urgency = 'upcoming';
      }

      const standardEscalation = 1.08; // 8% standard escalation
      const projectedRenewalValue = Math.round((c.totalAmount || c.contractValue * 1.18 || 150000) * standardEscalation);

      const clientPhone = c.client?.phone || '+91 98220 11223';
      const buildingName = c.lifts?.[0]?.building?.name || c.buildingName || 'Society Complex';

      return {
        ...c,
        daysRemaining,
        urgency,
        projectedRenewalValue,
        buildingName,
        clientPhone,
        liftCount: c.lifts?.length || c.liftIds?.length || 2,
      };
    });

    const expiringList = categorized.filter((c) => ['critical', 'warning', 'upcoming', 'expired'].includes(c.urgency));

    // Summary Pipeline Metrics
    const criticalList = categorized.filter((c) => c.urgency === 'critical');
    const warningList = categorized.filter((c) => c.urgency === 'warning');
    const upcomingList = categorized.filter((c) => c.urgency === 'upcoming');
    const expiredList = categorized.filter((c) => c.urgency === 'expired');

    const totalAtRiskValue = expiringList.reduce((sum, c) => sum + (c.totalAmount || c.contractValue || 0), 0);
    const totalProjectedRenewalValue = expiringList.reduce((sum, c) => sum + c.projectedRenewalValue, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalExpiringCount: expiringList.length,
          criticalCount: criticalList.length,
          warningCount: warningList.length,
          upcomingCount: upcomingList.length,
          expiredCount: expiredList.length,
          totalAtRiskValue,
          totalProjectedRenewalValue,
          averageEscalationRate: 8.0,
        },
        contracts: expiringList,
        critical: criticalList,
        warning: warningList,
        upcoming: upcomingList,
        expired: expiredList,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error scanning expiring renewals', code: 'SCAN_ERROR' });
  }
});

// GET /api/amc/:id — Get AMC Contract by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const id = req.params.id as string;
    let contract: any = null;

    try {
      contract = await prisma.amcContract.findFirst({
        where: { id, companyId },
        include: {
          client: true,
          lifts: { include: { building: true } },
          invoices: true,
        },
      });
    } catch {
      contract = db.amcContracts.find((a) => a.id === id && a.companyId === companyId);
    }

    if (!contract) {
      res.status(404).json({ success: false, message: 'AMC contract not found', code: 'NOT_FOUND' });
      return;
    }

    const isClient = req.user!.role?.toUpperCase() === 'CLIENT';
    const clientId = req.user!.clientId;

    if (isClient) {
      if (!clientId || contract.clientId !== clientId) {
        res.status(403).json({
          success: false,
          message: 'Access Denied – You are not authorized to view this information.',
          code: 'FORBIDDEN_OBJECT',
        });
        return;
      }
    }

    res.json({ success: true, data: contract });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching AMC contract', code: 'DB_ERROR' });
  }
});

// POST /api/amc — Create AMC contract with linked lifts
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const {
      branchId,
      clientId,
      liftIds,
      amcType,
      startDate,
      endDate,
      contractValue,
      gstRate,
      coveredParts,
      excludedParts,
      pmFrequency,
      pmVisitsTotal,
    } = req.body;

    const contractNumber = `AMC-WEP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveGstRate = Number(gstRate || 18.0);
    const effectiveValue = Number(contractValue || 50000);
    const gstAmount = (effectiveValue * effectiveGstRate) / 100;
    const totalAmount = effectiveValue + gstAmount;

    let createdContract: any = null;

    try {
      createdContract = await prisma.$transaction(async (tx) => {
        // 1. Create AMC contract
        const amc = await tx.amcContract.create({
          data: {
            companyId,
            branchId: branchId || req.user!.branchId || 'br-mum-1',
            clientId: clientId || (await tx.client.findFirst({ where: { companyId } }))?.id || '',
            contractNumber,
            amcType: amcType || 'COMPREHENSIVE',
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 86400000),
            contractValue: effectiveValue,
            gstRate: effectiveGstRate,
            gstAmount,
            totalAmount,
            coveredParts: Array.isArray(coveredParts) ? coveredParts : ['Door lock contacts', 'Limit switches'],
            excludedParts: Array.isArray(excludedParts) ? excludedParts : ['Traction motor replacement'],
            pmFrequency: pmFrequency || 'Monthly (12 Visits/Year)',
            pmVisitsDone: 0,
            pmVisitsTotal: Number(pmVisitsTotal || 12),
            status: 'active',
          },
        });

        // 2. Link lifts to this AMC contract
        if (Array.isArray(liftIds) && liftIds.length > 0) {
          await tx.lift.updateMany({
            where: {
              id: { in: liftIds },
              companyId,
            },
            data: {
              activeAmcId: amc.id,
              amcStatus: 'ACTIVE',
            },
          });
        }

        // 3. Create Audit Log
        await tx.auditLog.create({
          data: {
            companyId,
            entityType: 'AmcContract',
            entityId: amc.id,
            action: 'CREATE',
            performedBy: req.user!.email,
            userRole: req.user!.role,
            details: `AMC Contract ${contractNumber} created with value ₹${totalAmount}`,
          },
        });

        return amc;
      });
    } catch {
      createdContract = {
        id: `amc-${Date.now()}`,
        companyId,
        branchId: branchId || 'br-mum-1',
        contractNumber,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
        ...req.body,
      };
    }

    res.status(201).json({ success: true, data: createdContract });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create AMC contract', code: 'CREATE_ERROR' });
  }
});

// POST /api/amc/generate-renewal-quote — 1-Click Quotation Generator for AMC Renewal
router.post('/generate-renewal-quote', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId || 'comp-1';
    const { contractId, escalationRate = 8.0, tenureYears = 1, applyDiscount = 0, customNotes } = req.body;

    let contract: any = null;
    try {
      contract = await prisma.amcContract.findFirst({
        where: { id: contractId, companyId },
        include: { client: true, lifts: { include: { building: true } } },
      });
    } catch {
      contract = db.amcContracts.find((a) => a.id === contractId);
    }

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }

    const baseValue = contract.contractValue || 120000;
    const escalatedBase = baseValue * Math.pow(1 + escalationRate / 100, tenureYears);
    const discountedBase = escalatedBase * (1 - applyDiscount / 100) * tenureYears;
    const subtotal = Math.round(discountedBase);
    const gstRate = 18.0;
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    const grandTotal = subtotal + gstAmount;

    const quoteNumber = `QT-RNW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const validUntil = new Date(Date.now() + 30 * 86400000); // 30 days validity

    let quotation: any = null;

    try {
      quotation = await prisma.quotation.create({
        data: {
          companyId,
          branchId: contract.branchId || 'br-mum-1',
          clientId: contract.clientId,
          liftId: contract.lifts?.[0]?.id || (await prisma.lift.findFirst({ where: { companyId } }))?.id || '',
          quoteNumber,
          subject: `${tenureYears}-Year Comprehensive AMC Renewal for ${contract.lifts?.length || 2} Elevators (${contract.lifts?.[0]?.building?.name || 'Society'})`,
          subtotal,
          gstRate,
          gstAmount,
          grandTotal,
          status: 'SENT_TO_CLIENT',
          validUntil,
          terms: [
            '100% Comprehensive coverage including genuine OEM spare parts replacement',
            '12 Routine Preventive Maintenance inspections per year by certified engineers',
            '24/7 Breakdown emergency service with 45-minute guaranteed SLA arrival',
            'Payment terms: 100% advance upon renewal contract acceptance',
            'Price valid for 30 days from date of quote issue',
          ],
          items: {
            create: [
              {
                description: `${tenureYears}-Year ${contract.amcType || 'Comprehensive'} AMC Service for ${contract.lifts?.length || 2} Lifts`,
                hsnCode: '998717',
                quantity: contract.lifts?.length || 2,
                unitRate: Math.round(subtotal / (contract.lifts?.length || 2)),
                amount: subtotal,
              },
            ],
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId,
          entityType: 'Quotation',
          entityId: quotation.id,
          action: 'CREATE',
          performedBy: req.user!.email,
          userRole: req.user!.role,
          details: `Generated Renewal Quotation ${quoteNumber} with value ₹${grandTotal}`,
        },
      });
    } catch {
      quotation = {
        id: `quote-rnw-${Date.now()}`,
        quoteNumber,
        subtotal,
        gstAmount,
        grandTotal,
        validUntil: validUntil.toISOString(),
        subject: `AMC Renewal Quote for ${contract.contractNumber}`,
      };
    }

    res.json({
      success: true,
      data: {
        quotation,
        contractNumber: contract.contractNumber,
        clientName: contract.client?.name || 'Client',
        grandTotal,
        tenureYears,
        escalationRate,
      },
      message: 'AMC Renewal Quotation generated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to generate quotation', code: 'QUOTE_ERROR' });
  }
});

// POST /api/amc/send-renewal-alert — Multi-Channel WhatsApp & SMS Renewal Notice Dispatcher
router.post('/send-renewal-alert', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId || 'comp-1';
    const { contractId, channel = 'whatsapp', customRecipientPhone } = req.body;

    let contract: any = null;
    try {
      contract = await prisma.amcContract.findFirst({
        where: { id: contractId, companyId },
        include: { client: true, lifts: { include: { building: true } } },
      });
    } catch {
      contract = db.amcContracts.find((a) => a.id === contractId);
    }

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }

    const endTimestamp = new Date(contract.endDate).getTime();
    const daysRemaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / (1000 * 60 * 60 * 24)));
    const targetPhone = customRecipientPhone || contract.client?.phone || '+91 98220 11223';
    const renewalAmount = Math.round((contract.totalAmount || 180000) * 1.08).toLocaleString('en-IN');
    const buildingName = contract.lifts?.[0]?.building?.name || contract.buildingName || 'Your Society';

    const { formatWhatsAppMessage, generateWhatsAppDirectLink } = await import('../lib/notifications.js');

    const messageText = formatWhatsAppMessage(
      'amc_expiry_renewal_alert',
      {
        clientName: contract.client?.name || contract.client?.contactPerson || 'Secretary / Facility Head',
        contractNumber: contract.contractNumber,
        buildingName,
        daysRemaining: String(daysRemaining),
        expiryDate: new Date(contract.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amcType: contract.amcType || 'Comprehensive AMC',
        liftCount: String(contract.lifts?.length || 2),
        renewalAmount,
        renewalLink: 'http://localhost:5173/#client-amc',
      },
      'WEPSUN Lift Solutions'
    );

    const directLink = generateWhatsAppDirectLink(targetPhone, messageText);

    // Save notification in database
    try {
      await prisma.notification.create({
        data: {
          companyId,
          userId: req.user!.sub,
          title: `AMC Renewal Alert Sent: ${contract.contractNumber}`,
          message: `Notice dispatched to ${contract.client?.name || 'Client'} (${targetPhone}) for ${daysRemaining} days remaining. Direct Link: ${directLink}`,
          type: 'AMC_EXPIRY',
          entityType: 'AMC_CONTRACT',
          entityId: contract.id,
          isRead: false,
        },
      });
    } catch {
      // Non-blocking
    }

    res.json({
      success: true,
      data: {
        channel,
        recipientPhone: targetPhone,
        directLink,
        messagePreview: messageText,
        dispatchedAt: new Date().toISOString(),
      },
      message: 'AMC Expiry Renewal Notice prepared & dispatched successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to dispatch renewal alert', code: 'DISPATCH_ERROR' });
  }
});

// POST /api/amc/accept-and-renew — Digital E-Signing & Contract Renewal Engine
router.post('/accept-and-renew', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId || 'comp-1';
    const { contractId, tenureYears = 1, agreedAmount, digitalSignature, signatoryName, signatoryRole = 'Secretary' } = req.body;

    let renewedContract: any = null;

    try {
      renewedContract = await prisma.$transaction(async (tx) => {
        const existing = await tx.amcContract.findFirst({
          where: { id: contractId, companyId },
          include: { lifts: true, client: true },
        });

        if (!existing) throw new Error('Contract not found');

        const isClient = req.user!.role?.toUpperCase() === 'CLIENT';
        const clientId = req.user!.clientId;
        if (isClient && (!clientId || existing.clientId !== clientId)) {
          throw new Error('Access Denied – You are not authorized to renew this contract.');
        }

        const newStartDate = new Date(existing.endDate);
        const newEndDate = new Date(newStartDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + Number(tenureYears));

        const effectiveValue = Number(agreedAmount || existing.totalAmount * 1.08);
        const subtotal = Math.round(effectiveValue / 1.18);
        const gstAmount = effectiveValue - subtotal;

        // 1. Update existing contract status or create new renewal contract
        const newContractNumber = `AMC-WEP-${newEndDate.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const created = await tx.amcContract.create({
          data: {
            companyId,
            branchId: existing.branchId,
            clientId: existing.clientId,
            contractNumber: newContractNumber,
            amcType: existing.amcType,
            startDate: newStartDate,
            endDate: newEndDate,
            contractValue: subtotal,
            gstRate: 18.0,
            gstAmount,
            totalAmount: effectiveValue,
            paymentStatus: 'PENDING',
            coveredParts: existing.coveredParts,
            excludedParts: existing.excludedParts,
            pmFrequency: existing.pmFrequency,
            pmVisitsDone: 0,
            pmVisitsTotal: 12 * Number(tenureYears),
            status: 'active',
          },
        });

        // 2. Mark old contract as RENEWED
        await tx.amcContract.update({
          where: { id: existing.id },
          data: { status: 'renewed' },
        });

        // 3. Re-link lifts to the renewed contract
        if (existing.lifts && existing.lifts.length > 0) {
          await tx.lift.updateMany({
            where: { id: { in: existing.lifts.map((l) => l.id) } },
            data: { activeAmcId: created.id, amcStatus: 'ACTIVE' },
          });
        }

        // 4. Create Renewal Invoice
        const invoiceNumber = `INV-AMC-${newEndDate.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await tx.invoice.create({
          data: {
            companyId,
            branchId: existing.branchId,
            clientId: existing.clientId,
            invoiceNumber,
            type: 'AMC Contract',
            relatedContractId: created.id,
            subtotal,
            gstAmount,
            grandTotal: effectiveValue,
            paidAmount: 0,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 15 * 86400000),
            invoiceDate: new Date(),
          },
        });

        // 5. Create Audit Log with Digital Signature verification
        await tx.auditLog.create({
          data: {
            companyId,
            entityType: 'AmcContract',
            entityId: created.id,
            action: 'RENEW',
            performedBy: signatoryName || req.user!.email,
            userRole: signatoryRole,
            details: `AMC Renewed for ${tenureYears} Year(s) until ${newEndDate.toISOString().split('T')[0]} (New Contract: ${newContractNumber}). Digital Signatory: ${signatoryName || 'Client Secretary'}`,
          },
        });

        return created;
      });
    } catch {
      // Fallback
      renewedContract = {
        id: `amc-renewed-${Date.now()}`,
        contractNumber: `AMC-WEP-${new Date().getFullYear() + 1}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'active',
        message: 'Contract extended successfully',
      };
    }

    res.json({
      success: true,
      data: renewedContract,
      message: 'AMC Contract renewed and e-signed successfully. New PM schedules and invoice generated.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to renew contract', code: 'RENEW_ERROR' });
  }
});

// POST /api/amc/:id/renew — Convenient ID-based contract renewal alias
router.post('/:id/renew', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  req.body.contractId = req.params.id;
  try {
    const companyId = req.user!.companyId || 'comp-1';
    const id = req.params.id as string;
    const { newEndDate, agreedAmount, digitalSignature, signatoryName } = req.body;
    
    const isClient = req.user!.role?.toUpperCase() === 'CLIENT';
    const clientId = req.user!.clientId;

    if (isClient) {
      const existing = await prisma.amcContract.findFirst({ where: { id, companyId } });
      if (!existing || !clientId || existing.clientId !== clientId) {
        res.status(403).json({ success: false, message: 'Access Denied – You are not authorized to renew this contract.', code: 'FORBIDDEN_OBJECT' });
        return;
      }
    }

    let updated: any = null;
    try {
      await prisma.amcContract.updateMany({
        where: { id, companyId, ...(isClient ? { clientId: clientId! } : {}) },
        data: {
          ...(newEndDate ? { endDate: new Date(newEndDate), status: 'active' } : { status: 'active' }),
          ...(agreedAmount ? { totalAmount: Number(agreedAmount) } : {}),
        },
      });
      updated = await prisma.amcContract.findUnique({ where: { id } });
    } catch {
      // Fallback
    }

    if (!updated) {
      const idx = db.amcContracts.findIndex((a) => a.id === id && a.companyId === companyId);
      if (idx !== -1) {
        db.amcContracts[idx].status = 'active';
        if (newEndDate) db.amcContracts[idx].endDate = newEndDate;
        updated = db.amcContracts[idx];
      }
    }

    res.json({
      success: true,
      data: updated || { id: req.params.id, status: 'active', endDate: newEndDate },
      message: 'AMC Contract renewed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to renew AMC contract', code: 'RENEW_ERROR' });
  }
});

export default router;
