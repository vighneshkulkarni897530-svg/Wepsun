/**
 * WEPSUN Engineering Solutions — Production Health & Monitoring Routes
 * Endpoints:
 * - GET /api/health       -> Liveness probe for load balancers & cloud watchdogs
 * - GET /api/health/db    -> Readiness probe inspecting PostgreSQL, PgBouncer, and table metrics
 * - GET /api/health/metrics -> Performance monitoring (query count, avg latency, slow queries)
 */

import { Router, Request, Response } from 'express';
import { prisma, checkDatabaseConnection, getDatabaseMetrics, getConnectionPoolInfo } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';

const router = Router();

// GET /api/health — High-speed liveness probe
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    service: 'WEPSUN Lift Service & AMC SaaS REST API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: Math.round((memory.rss / 1024 / 1024) * 10) / 10,
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 10) / 10,
    },
    security: {
      auth: 'JWT (HS256) + Refresh Token Rotation',
      rbac: 'Enforced (7 Roles: Super Admin, Company Admin, Service Manager, Technician, Client, Accounts, Sales)',
      multiTenancy: 'Enforced (Server-Side)',
    },
  });
});

// GET /api/health/db — Deep database readiness and table inventory probe
router.get('/db', async (_req: Request, res: Response): Promise<void> => {
  const dbHealth = await checkDatabaseConnection();

  let tableCounts: Record<string, number> = {};

  if (dbHealth.connected) {
    try {
      const [
        companiesCount,
        branchesCount,
        usersCount,
        clientsCount,
        techniciansCount,
        liftsCount,
        complaintsCount,
        emergencyCount,
        serviceReportsCount,
        amcContractsCount,
        invoicesCount,
        inventoryPartsCount,
        auditLogsCount,
      ] = await Promise.all([
        prisma.company.count().catch(() => 0),
        prisma.branch.count().catch(() => 0),
        prisma.user.count().catch(() => 0),
        prisma.client.count().catch(() => 0),
        prisma.technician.count().catch(() => 0),
        prisma.lift.count().catch(() => 0),
        prisma.complaint.count().catch(() => 0),
        prisma.complaint.count({ where: { isEmergency: true } }).catch(() => 0),
        prisma.serviceReport.count().catch(() => 0),
        prisma.amcContract.count().catch(() => 0),
        prisma.invoice.count().catch(() => 0),
        prisma.inventoryPart.count().catch(() => 0),
        prisma.auditLog.count().catch(() => 0),
      ]);

      tableCounts = {
        companies: companiesCount,
        branches: branchesCount,
        users: usersCount,
        clients: clientsCount,
        technicians: techniciansCount,
        lifts: liftsCount,
        complaints: complaintsCount,
        emergencyBreakdowns: emergencyCount,
        serviceReports: serviceReportsCount,
        amcContracts: amcContractsCount,
        invoices: invoicesCount,
        inventoryParts: inventoryPartsCount,
        auditLogs: auditLogsCount,
      };
    } catch (countErr: any) {
      tableCounts = { error: countErr?.message || 'Failed to query table counts' } as any;
    }
  } else {
    // Non-postgres fallback counts
    tableCounts = {
      companies: db.companies?.length || 0,
      branches: db.branches?.length || 0,
      users: db.users?.length || 0,
      clients: db.clients?.length || 0,
      technicians: db.technicians?.length || 0,
      lifts: db.lifts?.length || 0,
      complaints: db.complaints?.length || 0,
      emergencyBreakdowns: db.complaints?.filter((c) => c.isEmergency)?.length || 0,
      serviceReports: db.serviceReports?.length || 0,
      amcContracts: db.amcContracts?.length || 0,
      invoices: db.invoices?.length || 0,
      inventoryParts: db.inventoryParts?.length || 0,
      auditLogs: db.auditLogs?.length || 0,
    };
  }

  const statusCode = dbHealth.connected ? 200 : 503;

  res.status(statusCode).json({
    status: dbHealth.connected ? 'ready' : 'unavailable',
    database: {
      provider: 'postgresql',
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      name: dbHealth.database,
      version: dbHealth.version,
      error: dbHealth.error,
    },
    connectionPool: dbHealth.poolInfo || getConnectionPoolInfo(),
    tableInventory: tableCounts,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/metrics — Performance and slow query monitoring
router.get('/metrics', async (_req: Request, res: Response): Promise<void> => {
  const metrics = getDatabaseMetrics();
  const memory = process.memoryUsage();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    process: {
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 10) / 10,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 10) / 10,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 10) / 10,
      },
    },
    databaseMetrics: metrics,
  });
});

export default router;
