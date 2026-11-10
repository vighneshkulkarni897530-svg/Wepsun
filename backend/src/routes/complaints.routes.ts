import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { serverCache } from '../lib/cache.js';
import { EventEmitter } from 'events';

export const complaintEvents = new EventEmitter();
complaintEvents.setMaxListeners(200);

const router = Router();

// GET /api/complaints — Get complaints with strict role and account-level scoping
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const userRole = (user.role || '').toUpperCase();
    const isClient = userRole === 'CLIENT';
    const isTech = userRole === 'TECHNICIAN';
    const isMasterOrSuper = userRole === 'MASTER_ADMIN' || userRole === 'SUPER_ADMIN';
    const isAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN', 'SERVICE_MANAGER'].includes(userRole);
    const companyId = user.companyId;
    if (!companyId && !isAdmin) {
      res.status(403).json({ success: false, message: 'Tenant company context required', code: 'TENANT_REQUIRED' });
      return;
    }
    const currentUserId = user.userId || user.sub;

    // Strict client isolation: If client has no clientId, return empty list
    if (isClient && !user.clientId) {
      res.json({ success: true, count: 0, data: [] });
      return;
    }

    // Strict technician isolation: If technician has no technicianId, return empty list
    if (isTech && !user.technicianId) {
      res.json({ success: true, count: 0, data: [] });
      return;
    }

    const queryCompanyId = req.query.companyId as string | undefined;
    const companyFilter = isMasterOrSuper
      ? (queryCompanyId && queryCompanyId !== 'all' ? queryCompanyId : undefined)
      : (queryCompanyId && queryCompanyId !== 'all' ? queryCompanyId : companyId);
    const branchFilter = req.query.branchId && req.query.branchId !== 'all' ? (req.query.branchId as string) : (isAdmin ? undefined : req.branchId);

    let list: any[] = [];

    try {
      list = await prisma.complaint.findMany({
        where: {
          ...(companyFilter ? { companyId: companyFilter } : {}),
          ...(branchFilter ? { branchId: branchFilter } : {}),
          ...(req.query.status ? { status: req.query.status as any } : {}),
          ...(req.query.liftId ? { liftId: req.query.liftId as string } : {}),
          ...(isClient
            ? {
                OR: [
                  { clientId: user.clientId! },
                  { lift: { clientId: user.clientId! } },
                  { createdById: currentUserId },
                ],
              }
            : {}),
          ...(isTech ? { assignedTechnicianId: user.technicianId! } : {}),
        },
        include: {
          lift: {
            include: {
              building: true,
              client: true,
            },
          },
          assignedTechnician: true,
          timelineEntries: {
            orderBy: { timestamp: 'asc' },
          },
        },
        orderBy: { reportedAt: 'desc' },
      });
    } catch {
      list = companyFilter ? db.complaints.filter((c) => c.companyId === companyFilter) : [...db.complaints];
      if (branchFilter) {
        list = list.filter((c) => c.branchId === branchFilter);
      }
      if (isClient) {
        const clientLiftIds = new Set(
          db.lifts.filter((l) => l.clientId === user.clientId).map((l) => l.id)
        );
        list = list.filter(
          (c) =>
            c.clientId === user.clientId ||
            clientLiftIds.has(c.liftId) ||
            (c as any).createdById === currentUserId
        );
      }
      if (isTech) {
        list = list.filter((c) => c.assignedTechnicianId === user.technicianId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch complaints', code: 'DB_ERROR' });
  }
});


// GET /api/complaints/stream — Real-time Server-Sent Events (SSE) stream for instant synchronization
router.get('/stream', (req: any, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const onCreated = (comp: any) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'COMPLAINT_CREATED', data: comp })}\n\n`);
    } catch {}
  };

  const onUpdated = (comp: any) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'COMPLAINT_UPDATED', data: comp })}\n\n`);
    } catch {}
  };

  complaintEvents.on('complaint_created', onCreated);
  complaintEvents.on('complaint_updated', onUpdated);

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {}
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    complaintEvents.off('complaint_created', onCreated);
    complaintEvents.off('complaint_updated', onUpdated);
    res.end();
  });
});

// GET /api/complaints/:id — Get complaint by ID with strict ownership verification
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const companyId = user.companyId;
    if (!companyId) {
      res.status(403).json({ success: false, message: 'Tenant company context required', code: 'TENANT_REQUIRED' });
      return;
    }
    const id = req.params.id as string;
    const userRole = (user.role || '').toUpperCase();
    const isMasterOrSuper = userRole === 'MASTER_ADMIN' || userRole === 'SUPER_ADMIN';
    const currentUserId = user.userId || user.sub;

    let complaint: any = null;

    try {
      complaint = await prisma.complaint.findFirst({
        where: isMasterOrSuper ? { id } : { id, companyId },
        include: {
          lift: {
            include: {
              building: true,
              client: true,
            },
          },
          assignedTechnician: true,
          timelineEntries: { orderBy: { timestamp: 'asc' } },
          serviceReport: true,
          gpsCheckIns: true,
        },
      });
    } catch {
      complaint = db.complaints.find((c) => c.id === id && (isMasterOrSuper || c.companyId === companyId));
    }

    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }

    // Strict account-level authorization checks (Prevent IDOR)
    if (userRole === 'CLIENT') {
      const isOwner =
        (user.clientId && complaint.clientId === user.clientId) ||
        (user.clientId && complaint.lift?.clientId === user.clientId) ||
        (complaint.createdById && complaint.createdById === currentUserId);

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'Access Denied – You are not authorized to view this complaint.',
          code: 'FORBIDDEN_OBJECT',
        });
        return;
      }
    } else if (userRole === 'TECHNICIAN') {
      const isAssigned = user.technicianId && complaint.assignedTechnicianId === user.technicianId;
      if (!isAssigned) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this service ticket.',
          code: 'FORBIDDEN_OBJECT',
        });
        return;
      }
    }

    res.json({ success: true, data: complaint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching complaint', code: 'DB_ERROR' });
  }
});

// POST /api/complaints — Raise new complaint with verified authenticated ownership & transaction
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const companyId = user.companyId;
    if (!companyId) {
      res.status(403).json({ success: false, message: 'Tenant company context required', code: 'TENANT_REQUIRED' });
      return;
    }
    const userRole = (user.role || '').toUpperCase();
    const currentUserId = user.userId || user.sub;
    let {
      liftId,
      liftNumber,
      buildingId,
      buildingName,
      branchId,
      clientId,
      clientName,
      clientPhone,
      clientEmail,
      issueType,
      title,
      description,
      priority,
      isEmergency,
      beforePhotos,
      assignedTechnicianId,
      emergencyType,
      trappedPassengerCount,
      currentLocation,
      safetyNoticeAcknowledged,
    } = req.body;

    if (!liftId || !title || !description) {
      res.status(400).json({ success: false, message: 'Lift ID, title, and description are required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Normalize issueType to Prisma enum
    const validIssueTypes: Record<string, string> = {
      stuck_passengers: 'STUCK_PASSENGERS',
      lift_not_moving: 'LIFT_NOT_MOVING',
      door_jammed: 'DOOR_JAMMED',
      doors_not_opening: 'DOOR_JAMMED',
      unusual_sound_vibration: 'UNUSUAL_SOUND_VIBRATION',
      strange_noise: 'UNUSUAL_SOUND_VIBRATION',
      floor_leveling_error: 'FLOOR_LEVELING_ERROR',
      leveling_issue: 'FLOOR_LEVELING_ERROR',
      buttons_not_working: 'BUTTONS_NOT_WORKING',
      cop_lop_buttons: 'BUTTONS_NOT_WORKING',
      ard_failure: 'ARD_FAILURE',
      emergency_alarm: 'EMERGENCY_ALARM',
      water_seepage: 'WATER_SEEPAGE',
      routine_check: 'ROUTINE_CHECK',
      other: 'OTHER',
    };
    const normalizedIssueType = (issueType && validIssueTypes[String(issueType).toLowerCase()])
      ? (validIssueTypes[String(issueType).toLowerCase()] as any)
      : (typeof issueType === 'string' && issueType.toUpperCase() in validIssueTypes ? issueType.toUpperCase() as any : 'LIFT_NOT_MOVING');

    const validPriorities: Record<string, string> = {
      critical: 'CRITICAL',
      high: 'HIGH',
      normal: 'NORMAL',
      medium: 'NORMAL',
      low: 'LOW',
    };
    const normalizedPriority = (priority && validPriorities[String(priority).toLowerCase()])
      ? (validPriorities[String(priority).toLowerCase()] as any)
      : (isEmergency ? 'CRITICAL' : 'NORMAL');

    // If caller is a Client, ensure they own or are authorized for the lift
    if (userRole === 'CLIENT') {
      if (!user.clientId) {
        user.clientId = `client-${currentUserId.replace(/^usr-/, '')}`;
      }

      let ownedLift = null;
      try {
        // 1. Direct ID match
        ownedLift = await prisma.lift.findFirst({
          where: {
            id: liftId,
            companyId,
            ...(user.clientId ? { clientId: user.clientId } : {}),
          },
        });

        // 2. Match by permanentLiftId or client's authorized lifts
        if (!ownedLift) {
          ownedLift = await prisma.lift.findFirst({
            where: {
              companyId,
              clientId: user.clientId,
              OR: [
                { permanentLiftId: liftId },
                { id: liftId },
              ],
            },
          });
        }

        // 3. Fallback to any active lift belonging to this client in this company
        if (!ownedLift) {
          ownedLift = await prisma.lift.findFirst({
            where: { companyId, clientId: user.clientId },
          });
          if (ownedLift) {
            liftId = ownedLift.id;
          }
        }

        // 4. If client has no lift in Postgres, auto-provision default equipment
        if (!ownedLift) {
          let building = await prisma.building.findFirst({
            where: { companyId, clientId: user.clientId },
          });
          if (!building) {
            building = await prisma.building.create({
              data: {
                companyId,
                branchId: branchId || user.branchId || 'br-mum-1',
                clientId: user.clientId,
                name: `${user.name || 'Client'} Heights`,
                address: 'Palm Beach Road, Sector 19, Vashi',
                city: 'Navi Mumbai',
                pinCode: '400703',
                contactPerson: user.name || 'Society Manager',
                contactPhone: (user as any).phone || '+91 98200 12345',
                totalLifts: 2,
              },
            });
          }

          ownedLift = await (prisma.lift.create as any)({
            data: {
              companyId,
              branchId: building.branchId,
              buildingId: building.id,
              clientId: user.clientId,
              permanentLiftId: 'WPS-MUM-001',
              brand: 'WEPSUN Gearless PMSM',
              model: 'AeroGlide-V3',
              type: 'PASSENGER',
              capacityPersons: 10,
              capacityKg: 680,
              speedMps: 1.5,
              floors: 'G + 14 Floors',
              stops: 15,
              currentStatus: 'OPERATIONAL',
              locationDetails: 'Wing A - Passenger Elevator',
            },
          });
          liftId = ownedLift.id;
        }
      } catch {
        ownedLift = db.lifts.find((l) => (l.id === liftId || l.clientId === user.clientId) && l.companyId === companyId);
        if (ownedLift) {
          liftId = ownedLift.id;
        }
      }

      if (!ownedLift) {
        // If still not found, check mock database or create in mock
        const mockLift = {
          id: liftId || `lift-${user.clientId}-1`,
          companyId,
          branchId: branchId || 'br-mum-1',
          buildingId: `bld-${user.clientId}`,
          clientId: user.clientId,
          liftNumber: 'WPS-MUM-001',
          brand: 'WEPSUN Gearless PMSM',
          model: 'AeroGlide-V3',
          type: 'Passenger',
          capacityPersons: 10,
          capacityKg: 680,
          currentStatus: 'operational',
        };
        db.lifts.push(mockLift as any);
        liftId = mockLift.id;
        ownedLift = mockLift;
      }
    }

    const ticketNumber = req.body.ticketNumber || (isEmergency ? `EMG-2026-${Math.floor(1000 + Math.random() * 9000)}` : `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    const effectiveBranchId = branchId || user.branchId || 'br-mum-1';
    const effectiveClientId = userRole === 'CLIENT' ? user.clientId : req.body.clientId || null;
    // Clients cannot self-assign technicians; only admins and managers can
    const effectiveTechId = userRole === 'CLIENT' ? null : assignedTechnicianId || null;

    let created: any = null;

    try {
      created = await prisma.$transaction(async (tx) => {
        // 1. Create complaint record with explicit account ownership
        const comp = await tx.complaint.create({
          data: {
            companyId,
            branchId: effectiveBranchId,
            liftId,
            clientId: effectiveClientId,
            createdById: currentUserId,
            ticketNumber,
            issueType: normalizedIssueType,
            title,
            description,
            priority: normalizedPriority,
            isEmergency: Boolean(isEmergency),
            status: effectiveTechId ? 'ASSIGNED' : 'NEW',
            assignedTechnicianId: effectiveTechId,
            assignedAt: effectiveTechId ? new Date() : null,
          },
          include: {
            lift: { include: { building: true, client: true } },
            assignedTechnician: true,
          },
        });

        // 2. Add initial timeline entry
        await tx.complaintTimeline.create({
          data: {
            complaintId: comp.id,
            status: comp.status,
            title: 'Breakdown Ticket Logged',
            description: description,
            actorName: user.name || user.email || 'Client User',
            actorRole: user.role,
          },
        });

        // 3. Update lift status if emergency or breakdown
        await tx.lift.updateMany({
          where: { id: liftId, companyId },
          data: { currentStatus: 'BREAKDOWN' },
        });

        // 4. Create broadcast notification for Admin & Operations Desk
        await tx.notification.create({
          data: {
            companyId,
            userId: null,
            title: isEmergency ? `🚨 Emergency Breakdown: ${ticketNumber}` : `📋 New Service Complaint: ${ticketNumber}`,
            message: `Priority: ${normalizedPriority} • ${title} (${comp.lift?.permanentLiftId || 'Lift'})`,
            type: isEmergency ? 'EMERGENCY' : 'BREAKDOWN',
            entityType: 'Complaint',
            entityId: comp.id,
          },
        });

        // 5. Create confirmation notification for Client
        await tx.notification.create({
          data: {
            companyId,
            userId: currentUserId,
            title: `Ticket Logged: ${ticketNumber}`,
            message: `Your breakdown request has been received. Our service desk is dispatching an engineer.`,
            type: 'BREAKDOWN',
            entityType: 'Complaint',
            entityId: comp.id,
          },
        });

        // 6. If technician assigned on creation, notify technician
        if (effectiveTechId) {
          const techUser = await tx.user.findFirst({
            where: { technicianId: effectiveTechId, companyId },
          });
          if (techUser) {
            await tx.notification.create({
              data: {
                companyId,
                userId: techUser.id,
                title: `👷 New Job Assigned: ${ticketNumber}`,
                message: `You have been assigned to Ticket #${ticketNumber} at ${comp.lift?.permanentLiftId || 'Site'}.`,
                type: 'BREAKDOWN',
                entityType: 'Complaint',
                entityId: comp.id,
              },
            });
          }
        }

        serverCache.del('sync_');
        serverCache.del('complaints_');
        complaintEvents.emit('complaint_created', comp);
        return comp;
      }, { timeout: 25000, maxWait: 10000 });
    } catch {
      // Fallback
      created = {
        id: `tkt-${Date.now()}`,
        companyId,
        branchId: effectiveBranchId,
        liftId,
        liftNumber: liftNumber || ownedLift?.liftNumber || ownedLift?.permanentLiftId || 'LIFT-01',
        buildingId: buildingId || ownedLift?.buildingId || '',
        buildingName: buildingName || ownedLift?.buildingName || 'Building Complex',
        clientId: effectiveClientId,
        clientName: clientName || (ownedLift as any)?.clientName || user.name || 'Valued Society',
        clientPhone: clientPhone || (ownedLift as any)?.clientPhone || (user as any).phone || '+91 85959 40077',
        clientEmail: clientEmail || user.email || '',
        createdById: currentUserId,
        ticketNumber,
        issueType: normalizedIssueType,
        title,
        description,
        priority: normalizedPriority,
        isEmergency: Boolean(isEmergency),
        emergencyType: emergencyType || (isEmergency ? 'Emergency Breakdown' : undefined),
        trappedPassengerCount: trappedPassengerCount !== undefined ? Number(trappedPassengerCount) : undefined,
        currentLocation: currentLocation || '',
        safetyNoticeAcknowledged: Boolean(safetyNoticeAcknowledged),
        beforePhotos: Array.isArray(beforePhotos) ? beforePhotos : [],
        afterPhotos: [],
        status: effectiveTechId ? 'assigned' : 'pending',
        reportedAt: new Date().toISOString(),
        timeline: [
          {
            id: `tl-${Date.now()}`,
            status: effectiveTechId ? 'assigned' : 'pending',
            title: isEmergency ? 'EMERGENCY SOS REGISTERED' : 'Complaint Registered',
            description,
            timestamp: new Date().toISOString(),
            actorName: user.name || 'Client',
            actorRole: user.role || 'client',
          }
        ]
      };
      db.complaints.unshift(created);
      serverCache.del('sync_');
      serverCache.del('complaints_');
      complaintEvents.emit('complaint_created', created);
    }

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create complaint', code: 'CREATE_ERROR' });
  }
});

// PATCH /api/complaints/:id — Update complaint status & assignment with RBAC checks
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const userRole = (user.role || '').toUpperCase();
    const isMasterOrSuper = userRole === 'MASTER_ADMIN' || userRole === 'SUPER_ADMIN';
    const isAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN', 'SERVICE_MANAGER'].includes(userRole);
    const companyId = user.companyId;
    if (!companyId && !isAdmin) {
      res.status(403).json({ success: false, message: 'Tenant company context required', code: 'TENANT_REQUIRED' });
      return;
    }
    const id = req.params.id as string;
    const currentUserId = user.userId || user.sub;
    const { status, assignedTechnicianId, priority, diagnosisRemarks, actionTaken, clientRating, clientFeedback, clientSignature } = req.body;
    const validPrioritiesPatch: Record<string, string> = { critical: 'CRITICAL', high: 'HIGH', normal: 'NORMAL', medium: 'NORMAL', low: 'LOW' };
    const normalizedPriorityPatch = priority ? (validPrioritiesPatch[String(priority).toLowerCase()] || String(priority).toUpperCase()) as any : undefined;

    const validStatuses: Record<string, string> = {
      new: 'NEW',
      pending: 'NEW',
      assigned: 'ASSIGNED',
      accepted: 'ASSIGNED',
      technician_on_way: 'TECHNICIAN_ON_WAY',
      en_route: 'TECHNICIAN_ON_WAY',
      arrived: 'IN_PROGRESS',
      in_progress: 'IN_PROGRESS',
      inspection_repair: 'INSPECTION_REPAIR',
      waiting_for_parts: 'WAITING_FOR_PARTS',
      resolved: 'RESOLVED',
      client_confirmation: 'CLIENT_CONFIRMATION',
      closed: 'CLOSED',
      cancelled: 'CANCELLED',
      archived: 'ARCHIVED',
    };
    const normalizedStatus = status ? (validStatuses[String(status).toLowerCase()] || String(status).toUpperCase()) as any : undefined;

    let existing: any = null;
    try {
      existing = await prisma.complaint.findFirst({
        where: isAdmin || isMasterOrSuper ? { id } : { id, companyId },
        include: { lift: true },
      });
    } catch {
      existing = db.complaints.find((c) => c.id === id && (isAdmin || isMasterOrSuper || c.companyId === companyId));
    }

    if (!existing) {
      res.status(404).json({ success: false, message: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }

    // Role-specific authorization
    if (userRole === 'CLIENT') {
      const isOwner =
        (user.clientId && existing.clientId === user.clientId) ||
        (user.clientId && existing.lift?.clientId === user.clientId) ||
        (existing.createdById && existing.createdById === currentUserId);

      if (!isOwner) {
        res.status(403).json({ success: false, message: 'Access denied: You do not own this complaint.', code: 'FORBIDDEN_OBJECT' });
        return;
      }

      // Clients can only submit rating, feedback, and signature
      try {
        const updatedComp = await prisma.complaint.update({
          where: { id },
          data: {
            ...(clientRating ? { clientRating: Number(clientRating) } : {}),
            ...(clientFeedback ? { clientFeedback } : {}),
            ...(clientSignature ? { clientSignature } : {}),
            ...(normalizedStatus === 'CLOSED' ? { status: 'CLOSED', closedAt: new Date() } : {}),
          },
          include: { lift: true, assignedTechnician: true, timelineEntries: true },
        });
        res.json({ success: true, data: updatedComp });
        return;
      } catch {
        existing.clientRating = clientRating ? Number(clientRating) : existing.clientRating;
        existing.clientFeedback = clientFeedback || existing.clientFeedback;
        res.json({ success: true, data: existing });
        return;
      }
    }

    if (userRole === 'TECHNICIAN') {
      const techId = user.technicianId || user.userId || user.sub;
      const isAssignedToThisTech =
        !existing.assignedTechnicianId ||
        existing.assignedTechnicianId === techId ||
        existing.assignedTechnicianId === user.technicianId ||
        existing.assignedTechnicianId === user.userId ||
        (user.name && existing.assignedTechnicianName && existing.assignedTechnicianName.toLowerCase() === user.name.toLowerCase());

      if (!isAssignedToThisTech) {
        res.status(403).json({ success: false, message: 'You can only update complaints assigned to you.', code: 'FORBIDDEN_OBJECT' });
        return;
      }
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          let resolvedTechId: string | null = null;
          let resolvedTechName: string | null = req.body.assignedTechnicianName || null;
          let resolvedTechPhone: string | null = req.body.technicianPhone || null;
          let techUser: any = null;

          if (userRole !== 'TECHNICIAN' && assignedTechnicianId) {
            let tech = await tx.technician.findUnique({
              where: { id: assignedTechnicianId },
              include: { user: true },
            });

            if (!tech) {
              tech = await tx.technician.findFirst({
                where: {
                  OR: [
                    { employeeCode: assignedTechnicianId },
                    { email: assignedTechnicianId },
                    { name: { contains: req.body.assignedTechnicianName || assignedTechnicianId, mode: 'insensitive' } },
                  ],
                },
                include: { user: true },
              });
            }

            if (tech) {
              resolvedTechId = tech.id;
              resolvedTechName = tech.name;
              resolvedTechPhone = tech.phone;
              techUser = tech.user;
            } else if (req.body.assignedTechnicianName) {
              resolvedTechId = assignedTechnicianId;
              resolvedTechName = req.body.assignedTechnicianName;
              resolvedTechPhone = req.body.technicianPhone || '';
            }
          }

          await tx.complaint.updateMany({
            where: isAdmin || isMasterOrSuper ? { id } : { id, companyId },
            data: {
              ...(normalizedStatus ? { status: normalizedStatus } : {}),
              ...(normalizedPriorityPatch ? { priority: normalizedPriorityPatch } : {}),
              ...(userRole !== 'TECHNICIAN' && resolvedTechId ? { assignedTechnicianId: resolvedTechId, assignedAt: new Date() } : {}),
              ...(req.body.technicianEta ? { technicianEta: req.body.technicianEta } : {}),
              ...(diagnosisRemarks ? { diagnosisRemarks } : {}),
              ...(actionTaken ? { actionTaken } : {}),
              ...(clientRating ? { clientRating: Number(clientRating) } : {}),
              ...(clientFeedback ? { clientFeedback } : {}),
              ...(normalizedStatus === 'CLOSED' || normalizedStatus === 'RESOLVED' || normalizedStatus === 'ARCHIVED' ? { closedAt: new Date() } : {}),
            },
          });

          if (normalizedStatus) {
            await tx.complaintTimeline.create({
              data: {
                complaintId: id,
                status: normalizedStatus,
                title: `Status updated to ${normalizedStatus}`,
                description: actionTaken || diagnosisRemarks || 'Complaint status updated',
                actorName: user.name || user.email,
                actorRole: user.role,
              },
            });
          }

          // Notification: Technician Assigned (Admin -> Tech & Admin -> Client)
          if (resolvedTechId && userRole !== 'TECHNICIAN' && resolvedTechId !== existing.assignedTechnicianId) {
            if (techUser?.id) {
              await tx.notification.create({
                data: {
                  companyId: existing.companyId || companyId || 'comp-1',
                  userId: techUser.id,
                  title: `👷 New Job Assigned: ${existing.ticketNumber}`,
                  message: `You have been assigned to Ticket #${existing.ticketNumber} at ${existing.lift?.permanentLiftId || 'Site'}.`,
                  type: 'BREAKDOWN',
                  entityType: 'Complaint',
                  entityId: id,
                },
              });
            }

            if (existing.createdById) {
              await tx.notification.create({
                data: {
                  companyId: existing.companyId || companyId || 'comp-1',
                  userId: existing.createdById,
                  title: `👨‍🔧 Technician Assigned: ${resolvedTechName || 'Field Engineer'}`,
                  message: `${resolvedTechName || 'A technician'} has been assigned to your Ticket #${existing.ticketNumber}.`,
                  type: 'BREAKDOWN',
                  entityType: 'Complaint',
                  entityId: id,
                },
              });
            }
          }

        // Notification: Technician On The Way (Tech -> Client)
        if (normalizedStatus === 'TECHNICIAN_ON_WAY') {
          if (existing.createdById) {
            await tx.notification.create({
              data: {
                companyId,
                userId: existing.createdById,
                title: '🚚 Field Engineer En Route',
                message: `Technician is travelling to your site for Ticket #${existing.ticketNumber}.`,
                type: 'BREAKDOWN',
                entityType: 'Complaint',
                entityId: id,
              },
            });
          }
        }

        // Notification: Resolved / Closed (Tech -> Client & Tech -> Admin)
        if (normalizedStatus === 'RESOLVED') {
          if (existing.createdById) {
            await tx.notification.create({
              data: {
                companyId,
                userId: existing.createdById,
                title: `✅ Breakdown Resolved: ${existing.ticketNumber}`,
                message: 'Your lift service request is completed and operational. Please rate your experience.',
                type: 'BREAKDOWN',
                entityType: 'Complaint',
                entityId: id,
              },
            });
          }
          await tx.notification.create({
            data: {
              companyId,
              userId: null,
              title: `✅ Ticket Resolved: ${existing.ticketNumber}`,
              message: `Service completed for Ticket #${existing.ticketNumber}. Lift operational.`,
              type: 'BREAKDOWN',
              entityType: 'Complaint',
              entityId: id,
            },
          });
        }
      }, { timeout: 25000, maxWait: 10000 });

      const freshRecord = await prisma.complaint.findUnique({
        where: { id },
        include: { lift: true, assignedTechnician: true, timelineEntries: true },
      });

      if (freshRecord) {
        serverCache.del('sync_');
        serverCache.del('complaints_');
        complaintEvents.emit('complaint_updated', freshRecord);
        res.json({ success: true, data: freshRecord });
        return;
      }
    } catch {
      // Fallback
    }

    const idx = db.complaints.findIndex((c) => (c.id === id || c.ticketNumber === id) && (isMasterOrSuper || c.companyId === companyId));
    if (idx !== -1) {
      const existingRecord = db.complaints[idx];
      const normalizedStatusStr = normalizedStatus ? String(normalizedStatus).toLowerCase() : (req.body.status ? String(req.body.status).toLowerCase() : existingRecord.status);
      const updated = {
        ...existingRecord,
        ...req.body,
        status: normalizedStatusStr,
        priority: req.body.priority || existingRecord.priority,
        assignedTechnicianId: req.body.assignedTechnicianId || existingRecord.assignedTechnicianId,
        assignedTechnicianName: req.body.assignedTechnicianName || existingRecord.assignedTechnicianName,
        technicianPhone: req.body.technicianPhone || existingRecord.technicianPhone,
        technicianEta: req.body.technicianEta || existingRecord.technicianEta,
        assignedAt: req.body.assignedAt || (req.body.assignedTechnicianId && !existingRecord.assignedAt ? new Date().toISOString() : existingRecord.assignedAt),
        arrivedAt: req.body.arrivedAt || (normalizedStatusStr === 'inspection_repair' && !existingRecord.arrivedAt ? new Date().toISOString() : existingRecord.arrivedAt),
        resolvedAt: req.body.resolvedAt || (normalizedStatusStr === 'resolved' && !existingRecord.resolvedAt ? new Date().toISOString() : existingRecord.resolvedAt),
        closedAt: req.body.closedAt || (normalizedStatusStr === 'closed' && !existingRecord.closedAt ? new Date().toISOString() : existingRecord.closedAt),
        diagnosisRemarks: req.body.diagnosisRemarks || existingRecord.diagnosisRemarks,
        actionTaken: req.body.actionTaken || existingRecord.actionTaken,
        resolutionReport: req.body.resolutionReport || existingRecord.resolutionReport,
        passengerRescueConfirmed: req.body.passengerRescueConfirmed !== undefined ? req.body.passengerRescueConfirmed : existingRecord.passengerRescueConfirmed,
      };

      if (req.body.status && req.body.status !== existingRecord.status) {
        updated.timeline = [
          ...(existingRecord.timeline || []),
          {
            id: `tl-${Date.now()}`,
            status: normalizedStatusStr,
            title: `Status: ${normalizedStatusStr.toUpperCase()}`,
            description: req.body.actionTaken || req.body.diagnosisRemarks || req.body.resolutionReport || `Status changed to ${normalizedStatusStr}`,
            timestamp: new Date().toISOString(),
            actorName: user.name || user.email || 'Service Desk',
            actorRole: userRole.toLowerCase(),
          }
        ];
      }

      db.complaints[idx] = updated;
      serverCache.del('sync_');
      serverCache.del('complaints_');
      complaintEvents.emit('complaint_updated', updated);
      res.json({ success: true, data: updated });
      return;
    }
    res.json({ success: true, data: existing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update complaint', code: 'UPDATE_ERROR' });
  }
});

export default router;
