import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/clients
 * Returns all real registered clients with their linked buildings, lifts, users, and AMC contracts.
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const companyId = user.companyId || 'comp-1';
    const role = (user.role || '').toUpperCase();
    const isClient = role === 'CLIENT';
    const isAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN', 'SERVICE_MANAGER'].includes(role);

    if (isClient && !isAdmin) {
      // Clients can only fetch their own client entity
      const clientId = user.clientId;
      if (!clientId) {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
      try {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          include: {
            users: { select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, isActive: true, createdAt: true } },
            buildings: { include: { lifts: true } },
            lifts: true,
            amcContracts: { orderBy: { createdAt: 'desc' } },
          },
        });
        res.json({ success: true, count: client ? 1 : 0, data: client ? [client] : [] });
        return;
      } catch {
        const client = (db as any).clients?.find((c: any) => c.id === clientId);
        res.json({ success: true, count: client ? 1 : 0, data: client ? [client] : [] });
        return;
      }
    }

    let clients: any[] = [];
    try {
      clients = await prisma.client.findMany({
        where: { companyId },
        include: {
          users: {
            select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
          },
          buildings: {
            include: {
              lifts: true,
            },
          },
          lifts: true,
          amcContracts: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      clients = (db as any).clients?.filter((c: any) => c.companyId === companyId) || [];
    }

    // Also include any User who registered as CLIENT but might not yet have a linked Client table row
    try {
      const clientUsers = await prisma.user.findMany({
        where: { companyId, role: 'CLIENT' },
        select: { id: true, name: true, email: true, phone: true, role: true, clientId: true, avatarUrl: true, createdAt: true },
      });

      for (const u of clientUsers) {
        const alreadyLinked = clients.some(
          (c) => (u.clientId && c.id === u.clientId) || (u.email && c.email?.toLowerCase() === u.email.toLowerCase())
        );
        if (!alreadyLinked) {
          clients.push({
            id: u.clientId || `cli-${u.id}`,
            companyId,
            name: `${u.name} Property`,
            contactPerson: u.name,
            email: u.email,
            phone: u.phone || '',
            billingAddress: 'Registered Client Premises',
            users: [u],
            buildings: [],
            lifts: [],
            amcContracts: [],
            createdAt: u.createdAt,
            updatedAt: u.createdAt,
          });
        }
      }
    } catch {
      // In-memory fallback
      const inMemoryUsers = (db.users || []).filter((u: any) => (u.role || '').toLowerCase() === 'client');
      for (const u of inMemoryUsers) {
        const alreadyLinked = clients.some(
          (c) => (u.clientId && c.id === u.clientId) || (u.email && c.email?.toLowerCase() === u.email.toLowerCase())
        );
        if (!alreadyLinked) {
          clients.push({
            id: u.clientId || `cli-${u.id}`,
            companyId,
            name: `${u.name} Property`,
            contactPerson: u.name,
            email: u.email,
            phone: u.phone || '',
            billingAddress: 'Registered Client Premises',
            users: [u],
            buildings: [],
            lifts: [],
            amcContracts: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    res.json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Failed to retrieve clients',
      code: 'DB_ERROR',
    });
  }
});

/**
 * POST /api/clients
 * Registers a new client along with their building & initial lifts.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const companyId = user.companyId || 'comp-1';
    const { name, contactPerson, email, phone, societyName, address, initialLiftsCount, amcTier } = req.body;

    if (!name && !societyName) {
      res.status(400).json({ success: false, message: 'Client or Society name is required' });
      return;
    }

    const clientName = societyName || name;
    const repName = contactPerson || name;

    try {
      const client = await prisma.client.create({
        data: {
          companyId,
          name: clientName,
          contactPerson: repName,
          email: email || null,
          phone: phone || '',
          billingAddress: address || 'Site Address, Mumbai',
        },
      });

      // Create linked building
      const building = await prisma.building.create({
        data: {
          companyId,
          branchId: user.branchId || 'br-mum-1',
          clientId: client.id,
          name: clientName,
          address: address || 'Site Address, Mumbai',
          city: 'Mumbai',
          pinCode: '400001',
          contactPerson: repName,
          contactPhone: phone || '',
          totalLifts: Number(initialLiftsCount) || 1,
        },
      });

      // Create initial lifts if specified
      const liftCount = Math.max(1, Number(initialLiftsCount) || 1);
      const createdLifts = [];
      for (let i = 1; i <= liftCount; i++) {
        const idSuffix = client.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'LIFT';
        const liftNumber = `WPS-${idSuffix}-0${i}`;
        const lift = await prisma.lift.create({
          data: {
            companyId,
            branchId: user.branchId || 'br-mum-1',
            buildingId: building.id,
            clientId: client.id,
            permanentLiftId: liftNumber,
            brand: 'WEPSUN Gearless PMSM',
            model: 'AeroGlide-V3',
            type: 'PASSENGER',
            capacityPersons: 8,
            capacityKg: 544,
            speedMps: 1.5,
            floors: 'G + 10 Floors',
            stops: 11,
            machineType: 'GEARLESS_PMSM',
            motorKw: 5.5,
            controllerBrand: 'Monarch NICE 3000+',
            doorOperator: 'Fermator VVVF4+',
            currentStatus: 'OPERATIONAL',
            locationDetails: `Passenger Elevator ${i}`,
          },
        });
        createdLifts.push(lift);
      }

      res.status(201).json({
        success: true,
        message: 'Client registered successfully with building & lifts',
        data: {
          ...client,
          buildings: [{ ...building, lifts: createdLifts }],
          lifts: createdLifts,
          amcContracts: [],
          users: [],
        },
      });
    } catch (dbErr: any) {
      console.warn('[ClientsRoute] Prisma error, fallback to in-memory:', dbErr);
      const fallbackClient = {
        id: `cli-${Date.now()}`,
        companyId,
        name: clientName,
        contactPerson: repName,
        email: email || '',
        phone: phone || '',
        billingAddress: address || 'Site Address',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        buildings: [
          {
            id: `bld-${Date.now()}`,
            name: clientName,
            address: address || 'Site Address',
            totalLifts: Number(initialLiftsCount) || 1,
            lifts: [],
          },
        ],
        lifts: [],
        amcContracts: [],
        users: [],
      };
      (db as any).clients = (db as any).clients || [];
      (db as any).clients.unshift(fallbackClient);

      res.status(201).json({
        success: true,
        message: 'Client registered successfully (in-memory fallback)',
        data: fallbackClient,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Failed to register client',
    });
  }
});

/**
 * PUT /api/clients/:id
 * Updates existing client details.
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, billingAddress } = req.body;

    try {
      const updated = await prisma.client.update({
        where: { id },
        data: {
          ...(name ? { name } : {}),
          ...(contactPerson ? { contactPerson } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(billingAddress ? { billingAddress } : {}),
        },
        include: { buildings: true, lifts: true },
      });
      res.json({ success: true, message: 'Client details updated', data: updated });
    } catch (dbErr: any) {
      const memClient = (db as any).clients?.find((c: any) => c.id === id);
      if (memClient) {
        if (name) memClient.name = name;
        if (contactPerson) memClient.contactPerson = contactPerson;
        if (email) memClient.email = email;
        if (phone) memClient.phone = phone;
        if (billingAddress) memClient.billingAddress = billingAddress;
        memClient.updatedAt = new Date().toISOString();
        res.json({ success: true, message: 'Client details updated (in-memory mode)', data: memClient });
        return;
      }
      res.status(404).json({ success: false, message: 'Client not found or update failed' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update client' });
  }
});

export default router;
