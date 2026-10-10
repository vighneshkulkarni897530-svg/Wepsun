import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/complaints — Get complaints with strict role and account-level scoping
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const companyId = user.companyId || 'comp-1';
    const userRole = (user.role || '').toUpperCase();
    const isClient = userRole === 'CLIENT';
    const isTech = userRole === 'TECHNICIAN';
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

    let list: any[] = [];

    try {
      list = await prisma.complaint.findMany({
        where: {
          companyId,
          ...(req.branchId ? { branchId: req.branchId } : {}),
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
      list = db.complaints.filter((c) => c.companyId === companyId);
      if (req.branchId) {
        list = list.filter((c) => c.branchId === req.branchId);
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

// GET /api/complaints/:id — Get complaint by ID with strict ownership verification
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const companyId = user.companyId || 'comp-1';
    const id = req.params.id as string;
    const userRole = (user.role || '').toUpperCase();
    const currentUserId = user.userId || user.sub;

    let complaint: any = null;

    try {
      complaint = await prisma.complaint.findFirst({
        where: { id, companyId },
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
      complaint = db.complaints.find((c) => c.id === id && c.companyId === companyId);
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
    const companyId = user.companyId || 'comp-1';
    const userRole = (user.role || '').toUpperCase();
    const currentUserId = user.userId || user.sub;
    const {
      liftId,
      branchId,
      issueType,
      title,
      description,
      priority,
      isEmergency,
      assignedTechnicianId,
    } = req.body;

    if (!liftId || !title || !description) {
      res.status(400).json({ success: false, message: 'Lift ID, title, and description are required', code: 'VALIDATION_ERROR' });
      return;
    }

    // If caller is a Client, ensure they own the lift
    if (userRole === 'CLIENT') {
      if (!user.clientId) {
        res.status(403).json({
          success: false,
          message: 'Client account is not properly linked to an active client organization.',
          code: 'UNLINKED_CLIENT',
        });
        return;
      }

      let ownedLift = null;
      try {
        ownedLift = await prisma.lift.findFirst({
          where: { id: liftId, companyId, clientId: user.clientId },
        });
      } catch {
        ownedLift = db.lifts.find((l) => l.id === liftId && l.companyId === companyId && l.clientId === user.clientId);
      }

      if (!ownedLift) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You can only raise complaints for your authorized lifts.',
          code: 'FORBIDDEN_LIFT',
        });
        return;
      }
    }

    const ticketNumber = `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
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
            issueType: issueType || 'LIFT_NOT_MOVING',
            title,
            description,
            priority: priority || (isEmergency ? 'CRITICAL' : 'NORMAL'),
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

        // 4. Create notification
        await tx.notification.create({
          data: {
            companyId,
            userId: currentUserId,
            title: `New Ticket: ${ticketNumber}`,
            message: `Priority: ${priority || 'NORMAL'} - ${title}`,
            type: 'BREAKDOWN',
            entityType: 'Complaint',
            entityId: comp.id,
          },
        });

        return comp;
      });
    } catch {
      // Fallback
      created = {
        id: `tkt-${Date.now()}`,
        companyId,
        branchId: effectiveBranchId,
        liftId,
        clientId: effectiveClientId,
        createdById: currentUserId,
        ticketNumber,
        issueType: issueType || 'LIFT_NOT_MOVING',
        title,
        description,
        priority: priority || 'NORMAL',
        isEmergency: Boolean(isEmergency),
        status: effectiveTechId ? 'assigned' : 'pending',
        reportedAt: new Date().toISOString(),
      };
      db.complaints.unshift(created);
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
    const companyId = user.companyId || 'comp-1';
    const id = req.params.id as string;
    const userRole = (user.role || '').toUpperCase();
    const currentUserId = user.userId || user.sub;
    const { status, assignedTechnicianId, diagnosisRemarks, actionTaken, clientRating, clientFeedback, clientSignature } = req.body;

    let existing: any = null;
    try {
      existing = await prisma.complaint.findFirst({
        where: { id, companyId },
        include: { lift: true },
      });
    } catch {
      existing = db.complaints.find((c) => c.id === id && c.companyId === companyId);
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
            ...(status === 'CLOSED' ? { status: 'CLOSED', closedAt: new Date() } : {}),
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
      if (!user.technicianId || existing.assignedTechnicianId !== user.technicianId) {
        res.status(403).json({ success: false, message: 'You can only update complaints assigned to you.', code: 'FORBIDDEN_OBJECT' });
        return;
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.complaint.updateMany({
          where: { id, companyId },
          data: {
            ...(status ? { status } : {}),
            ...(userRole !== 'TECHNICIAN' && assignedTechnicianId ? { assignedTechnicianId, assignedAt: new Date() } : {}),
            ...(diagnosisRemarks ? { diagnosisRemarks } : {}),
            ...(actionTaken ? { actionTaken } : {}),
            ...(clientRating ? { clientRating: Number(clientRating) } : {}),
            ...(clientFeedback ? { clientFeedback } : {}),
            ...(status === 'CLOSED' || status === 'RESOLVED' ? { closedAt: new Date() } : {}),
          },
        });

        if (status) {
          await tx.complaintTimeline.create({
            data: {
              complaintId: id,
              status: status as any,
              title: `Status updated to ${status}`,
              description: actionTaken || diagnosisRemarks || 'Complaint status updated',
              actorName: user.name || user.email,
              actorRole: user.role,
            },
          });
        }
      });

      const freshRecord = await prisma.complaint.findUnique({
        where: { id },
        include: { lift: true, assignedTechnician: true, timelineEntries: true },
      });

      if (freshRecord) {
        res.json({ success: true, data: freshRecord });
        return;
      }
    } catch {
      // Fallback
    }

    const idx = db.complaints.findIndex((c) => c.id === id && c.companyId === companyId);
    if (idx !== -1) {
      db.complaints[idx] = { ...db.complaints[idx], ...req.body };
      res.json({ success: true, data: db.complaints[idx] });
      return;
    }

    res.json({ success: true, data: existing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update complaint', code: 'UPDATE_ERROR' });
  }
});

export default router;
