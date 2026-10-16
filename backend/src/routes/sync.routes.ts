import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { serverCache } from '../lib/cache.js';

const router = Router();

/**
 * GET /api/sync
 * High-performance batch synchronization endpoint.
 * Collapses 16 client round-trips into a single HTTP request with parallel queries & in-memory caching.
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  const user = req.user!;
  const companyId = user.companyId || 'comp-1';
  const role = (user.role || 'CLIENT').toUpperCase();
  const isClient = role === 'CLIENT';
  const isTech = role === 'TECHNICIAN';
  const isAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN', 'SERVICE_MANAGER'].includes(role);
  const clientId = user.clientId;
  const technicianId = user.technicianId;

  // Check short-lived cache (8s TTL) to prevent repeated DB waterfalls on quick navigation
  const activeUserId = (user as any).id || (user as any).sub || (user as any).userId || '';
  const cacheKey = `sync_${activeUserId}_${role}_${companyId}`;
  const cachedData = serverCache.get<any>(cacheKey);
  if (cachedData) {
    res.json({
      success: true,
      durationMs: Date.now() - startTime,
      cached: true,
      data: cachedData,
    });
    return;
  }

  try {
    // 1. Cached Company & Branches (TTL: 60 seconds)
    const [companies, branches] = await Promise.all([
      serverCache.getOrSet(`companies_${companyId}`, async () => {
        try {
          const comp = await prisma.company.findUnique({
            where: { id: companyId },
            include: { branches: true },
          });
          return comp ? [comp] : db.companies;
        } catch {
          return db.companies;
        }
      }, 60000),

      serverCache.getOrSet(`branches_${companyId}`, async () => {
        try {
          return await prisma.branch.findMany({
            where: { companyId, isActive: true },
          });
        } catch {
          return db.branches.filter((b) => b.companyId === companyId);
        }
      }, 60000),
    ]);

    // 2. Parallel fetch for all transactional entities scoped to user role & tenant
    const [
      buildingsResult,
      liftsResult,
      complaintsResult,
      workOrdersResult,
      amcResult,
      quotationsResult,
      invoicesResult,
      inventoryResult,
      inventoryMovementsResult,
      serviceReportsResult,
      techniciansResult,
      feedbackResult,
      auditResult,
      notificationsResult,
    ] = await Promise.allSettled([
      // Buildings
      prisma.building.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
        },
        include: { client: true, lifts: true },
      }).catch(() => db.buildings.filter(b => b.companyId === companyId && (!isClient || !clientId || b.clientId === clientId))),

      // Lifts
      prisma.lift.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
        },
        include: { building: true, client: true },
      }).catch(() => db.lifts.filter(l => l.companyId === companyId && (!isClient || !clientId || l.clientId === clientId))),

      // Complaints
      prisma.complaint.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
          ...(isTech && technicianId ? { assignedTechnicianId: technicianId } : {}),
        },
        include: {
          lift: { include: { building: true } },
          client: true,
          assignedTechnician: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => db.complaints.filter(c => c.companyId === companyId)),

      // Work Orders
      prisma.workOrder.findMany({
        where: {
          companyId,
          ...(isTech && technicianId ? { technicianId } : {}),
        },
        include: {
          lift: { include: { building: true, client: true } },
          technician: true,
          client: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => db.workOrders.filter(w => w.companyId === companyId)),

      // AMC Contracts
      prisma.amcContract.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
        },
        include: {
          client: true,
          lifts: { include: { building: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => db.amcContracts.filter(a => a.companyId === companyId)),

      // Quotations
      prisma.quotation.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
        },
        include: {
          client: true,
          lift: { include: { building: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => db.quotations.filter(q => q.companyId === companyId)),

      // Invoices
      prisma.invoice.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
        },
        include: {
          client: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => db.invoices.filter(i => i.companyId === companyId)),

      // Inventory (Admin only)
      isAdmin
        ? prisma.inventoryPart.findMany({
            where: { companyId },
            take: 100,
          }).catch(() => db.inventory)
        : Promise.resolve([]),

      // Inventory Movements (Admin only)
      isAdmin
        ? prisma.inventoryMovement.findMany({
            where: { companyId },
            orderBy: { timestamp: 'desc' },
            take: 50,
          }).catch(() => db.inventoryMovements)
        : Promise.resolve([]),

      // Service Reports
      prisma.serviceReport.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
          ...(isTech && technicianId ? { technicianId } : {}),
        },
        include: { lift: true, client: true, technician: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => db.serviceReports.filter(sr => sr.companyId === companyId)),

      // Technicians
      (isAdmin || isTech)
        ? prisma.technician.findMany({
            where: { companyId },
          }).catch(() => db.technicians)
        : Promise.resolve([]),

      // Customer Feedback
      prisma.customerFeedback.findMany({
        where: {
          companyId,
          ...(isClient && clientId ? { clientId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }).catch(() => db.feedbacks || []),

      // Audit Logs (Admin only)
      isAdmin
        ? prisma.auditLog.findMany({
            where: { companyId },
            orderBy: { timestamp: 'desc' },
            take: 50,
          }).catch(() => db.auditLogs || [])
        : Promise.resolve([]),

      // Notifications
      prisma.notification.findMany({
        where: {
          companyId,
          OR: [{ userId: activeUserId }, { userId: null }],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }).catch(() => db.notifications || []),
    ]);

    const durationMs = Date.now() - startTime;

    const payloadData = {
      companies,
      branches,
      buildings: buildingsResult.status === 'fulfilled' ? buildingsResult.value : [],
      lifts: liftsResult.status === 'fulfilled' ? liftsResult.value : [],
      complaints: complaintsResult.status === 'fulfilled' ? complaintsResult.value : [],
      workOrders: workOrdersResult.status === 'fulfilled' ? workOrdersResult.value : [],
      amcContracts: amcResult.status === 'fulfilled' ? amcResult.value : [],
      quotations: quotationsResult.status === 'fulfilled' ? quotationsResult.value : [],
      invoices: invoicesResult.status === 'fulfilled' ? invoicesResult.value : [],
      inventory: inventoryResult.status === 'fulfilled' ? inventoryResult.value : [],
      inventoryMovements: inventoryMovementsResult.status === 'fulfilled' ? inventoryMovementsResult.value : [],
      serviceReports: serviceReportsResult.status === 'fulfilled' ? serviceReportsResult.value : [],
      technicians: techniciansResult.status === 'fulfilled' ? techniciansResult.value : [],
      feedbacks: feedbackResult.status === 'fulfilled' ? feedbackResult.value : [],
      auditLogs: auditResult.status === 'fulfilled' ? auditResult.value : [],
      notifications: notificationsResult.status === 'fulfilled' ? notificationsResult.value : [],
    };

    serverCache.set(cacheKey, payloadData, 10000);

    res.json({
      success: true,
      durationMs,
      cached: false,
      data: payloadData,
    });
  } catch (err: any) {
    console.error('[SyncRoute] Batch sync error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to synchronize tenant data',
      error: err?.message,
    });
  }
});

export default router;
