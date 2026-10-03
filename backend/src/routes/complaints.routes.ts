import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/complaints — Get complaints with role and object-level scoping
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role?.toUpperCase();
    const isClient = userRole === 'CLIENT';
    const isTech = userRole === 'TECHNICIAN';

    let list: any[] = [];

    try {
      list = await prisma.complaint.findMany({
        where: {
          companyId,
          ...(req.branchId ? { branchId: req.branchId } : {}),
          ...(req.query.status ? { status: req.query.status as any } : {}),
          ...(req.query.liftId ? { liftId: req.query.liftId as string } : {}),
          ...(isClient && req.user!.clientId ? { lift: { clientId: req.user!.clientId } } : {}),
          ...(isTech && req.user!.technicianId ? { assignedTechnicianId: req.user!.technicianId } : {}),
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
      if (isClient && req.user!.clientId) {
        const clientLiftIds = new Set(db.lifts.filter((l) => l.clientId === req.user!.clientId).map((l) => l.id));
        list = list.filter((c) => c.clientId === req.user!.clientId || clientLiftIds.has(c.liftId));
      }
      if (isTech && req.user!.technicianId) {
        list = list.filter((c) => c.assignedTechnicianId === req.user!.technicianId);
      }
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to fetch complaints', code: 'DB_ERROR' });
  }
});

// GET /api/complaints/:id — Get complaint by ID with object-level check
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const id = req.params.id as string;
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

    // Object-level authorization
    const role = req.user!.role?.toUpperCase();
    if (role === 'CLIENT' && req.user!.clientId && (complaint.clientId ? complaint.clientId !== req.user!.clientId : complaint.lift?.clientId !== req.user!.clientId)) {
      res.status(403).json({
        success: false,
        message: 'Access Denied – You are not authorized to view this information.',
        code: 'FORBIDDEN_OBJECT',
      });
      return;
    }
    if (role === 'TECHNICIAN' && req.user!.technicianId && complaint.assignedTechnicianId !== req.user!.technicianId) {
      res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this ticket.', code: 'FORBIDDEN_OBJECT' });
      return;
    }

    res.json({ success: true, data: complaint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching complaint', code: 'DB_ERROR' });
  }
});

// POST /api/complaints — Raise new complaint with transaction
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
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

    const ticketNumber = `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveBranchId = branchId || req.user!.branchId || 'br-mum-1';

    let created: any = null;

    try {
      created = await prisma.$transaction(async (tx) => {
        // 1. Create complaint record
        const comp = await tx.complaint.create({
          data: {
            companyId,
            branchId: effectiveBranchId,
            liftId,
            ticketNumber,
            issueType: issueType || 'LIFT_NOT_MOVING',
            title,
            description,
            priority: priority || (isEmergency ? 'CRITICAL' : 'NORMAL'),
            isEmergency: Boolean(isEmergency),
            status: assignedTechnicianId ? 'ASSIGNED' : 'NEW',
            assignedTechnicianId: assignedTechnicianId || null,
            assignedAt: assignedTechnicianId ? new Date() : null,
          },
        });

        // 2. Add initial timeline entry
        await tx.complaintTimeline.create({
          data: {
            complaintId: comp.id,
            status: comp.status,
            title: 'Breakdown Ticket Logged',
            description: description,
            actorName: req.user!.email || 'Client User',
            actorRole: req.user!.role,
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
        ticketNumber,
        issueType: issueType || 'LIFT_NOT_MOVING',
        title,
        description,
        priority: priority || 'NORMAL',
        isEmergency: Boolean(isEmergency),
        status: assignedTechnicianId ? 'assigned' : 'pending',
        reportedAt: new Date().toISOString(),
      };
      db.complaints.unshift(created);
    }

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to create complaint', code: 'CREATE_ERROR' });
  }
});

// PATCH /api/complaints/:id — Update complaint status & assignment
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const id = req.params.id as string;
    const { status, assignedTechnicianId, diagnosisRemarks, actionTaken, clientRating, clientFeedback } = req.body;

    // Verify ownership for technician
    if (req.user!.role?.toUpperCase() === 'TECHNICIAN' && req.user!.technicianId) {
      const existing = await prisma.complaint.findFirst({
        where: { id, companyId },
      });
      if (existing && existing.assignedTechnicianId !== req.user!.technicianId) {
        res.status(403).json({ success: false, message: 'You can only update complaints assigned to you.', code: 'FORBIDDEN_OBJECT' });
        return;
      }
    }

    let updated = null;

    try {
      updated = await prisma.$transaction(async (tx) => {
        const comp = await tx.complaint.updateMany({
          where: { id, companyId },
          data: {
            ...(status ? { status } : {}),
            ...(assignedTechnicianId ? { assignedTechnicianId, assignedAt: new Date() } : {}),
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
              actorName: req.user!.email,
              actorRole: req.user!.role,
            },
          });
        }

        return comp;
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
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }
    db.complaints[idx] = { ...db.complaints[idx], ...req.body };
    res.json({ success: true, data: db.complaints[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to update complaint', code: 'UPDATE_ERROR' });
  }
});

export default router;
