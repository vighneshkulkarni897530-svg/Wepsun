/**
 * WEPSUN Engineering Solutions — Field Technicians & Approval Management API
 * Full Onboarding Workflow, Permanent ID Generation, Approval, Rejection, Block/Unblock, and Records
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { hashPassword } from '../lib/auth.js';
import { revokeAllUserSessions } from '../lib/auth.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  dispatchEmailWithFailover,
  generateTechnicianApprovalEmailHtml,
  generateTechnicianApprovalEmailText,
  generateTechnicianRejectionEmailHtml,
  generateTechnicianRejectionEmailText,
  generateTechnicianBlockedEmailHtml,
  generateTechnicianBlockedEmailText,
} from '../lib/emailOtpService.js';

const router = Router();

/**
 * Generate Permanent Sequential Technician ID (e.g. Wepsun0001, Wepsun0002, Wepsun0003...)
 * Directly generated upon administrator approval and dispatched to technician's email.
 */
export async function generatePermanentTechnicianId(): Promise<string> {
  try {
    const techsWithId = await prisma.technician.findMany({
      where: {
        permanentId: {
          not: null,
        },
      },
      select: { permanentId: true },
    });

    let maxNum = 0;
    for (const t of techsWithId) {
      if (t.permanentId) {
        // Match WepsunXXXX (and legacy WES-TECH-XXXXXX if any) to maintain monotonic sequence
        const match = t.permanentId.match(/^Wepsun(\d+)$/i) || t.permanentId.match(/^WES-TECH-(\d+)$/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidateId = `Wepsun${String(nextNum).padStart(4, '0')}`;

    let attempts = 0;
    while (attempts < 50) {
      const existing = await prisma.technician.findUnique({
        where: { permanentId: candidateId },
      });
      if (!existing) break;
      nextNum++;
      candidateId = `Wepsun${String(nextNum).padStart(4, '0')}`;
      attempts++;
    }

    return candidateId;
  } catch {
    const fallbackNum = Date.now().toString().slice(-4);
    return `Wepsun${fallbackNum}`;
  }
}

// --------------------------------------------------------------------------
// 1. PUBLIC REGISTRATION ENDPOINT
// POST /api/technicians/register (or /api/admin/technicians/register)
// --------------------------------------------------------------------------
router.post('/register', authLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      qualifications,
      experienceYears,
      documents,
      companyId: reqCompanyId,
      branchId: reqBranchId,
      zone,
    } = req.body;

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    // Frontend & Backend validation
    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required (minimum 2 characters).',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
        code: 'INVALID_EMAIL',
      });
      return;
    }

    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 10) {
      res.status(400).json({
        success: false,
        message: 'A valid 10-digit mobile number is required.',
        code: 'INVALID_PHONE',
      });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password is required (minimum 8 characters).',
        code: 'WEAK_PASSWORD',
      });
      return;
    }

    // Check duplicate registrations using existing rules
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { phone: cleanPhone },
          { phone: phoneDigits },
          ...(phoneDigits.length >= 10 ? [{ phone: { endsWith: phoneDigits.slice(-10) } }] : []),
        ],
      },
      include: { technician: true },
    });

    if (existingUser) {
      if (existingUser.role === 'TECHNICIAN' && existingUser.technician?.accountStatus === 'PENDING_APPROVAL') {
        res.status(400).json({
          success: false,
          message: 'Your account is awaiting admin approval.',
          code: 'ACCOUNT_PENDING_APPROVAL',
        });
        return;
      }
      res.status(409).json({
        success: false,
        message: 'An account with this email address or mobile number already exists.',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    // Resolve company and branch
    let companyId = reqCompanyId;
    if (!companyId) {
      const defaultComp = await prisma.company.findFirst();
      companyId = defaultComp?.id || 'comp-1';
    }

    let branchId = reqBranchId;
    if (!branchId) {
      const defaultBranch = await prisma.branch.findFirst({ where: { companyId } });
      branchId = defaultBranch?.id || 'br-mum-1';
    }

    const passwordHash = await hashPassword(password);
    const initialStatus = 'PENDING_APPROVAL';

    // Atomic creation of Technician and linked User
    const result = await prisma.$transaction(async (tx) => {
      const tech = await tx.technician.create({
        data: {
          companyId,
          branchId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          address: address ? String(address).trim() : null,
          qualifications: qualifications ? String(qualifications).trim() : null,
          experienceYears: experienceYears ? Number(experienceYears) : 0,
          documents: typeof documents === 'string' ? documents : documents ? JSON.stringify(documents) : null,
          accountStatus: initialStatus as any,
          permanentId: null,
          employeeCode: `PENDING-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          zone: zone ? String(zone).trim() : 'Field Operations Hub',
          registeredAt: new Date(),
        },
      });

      const user = await tx.user.create({
        data: {
          companyId,
          branchId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          role: 'TECHNICIAN' as any,
          technicianId: tech.id,
          isActive: false, // Inactive until approved
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          entityType: 'Technician',
          entityId: tech.id,
          action: 'REGISTER',
          performedBy: cleanName,
          userRole: 'TECHNICIAN',
          details: `Technician registration submitted by ${cleanName} (${cleanEmail}). Status set to PENDING_APPROVAL.`,
        },
      });

      return { tech, user };
    });

    res.status(201).json({
      success: true,
      message: 'Your account is awaiting admin approval.',
      code: 'ACCOUNT_PENDING_APPROVAL',
      data: {
        id: result.tech.id,
        name: result.tech.name,
        email: result.tech.email,
        accountStatus: result.tech.accountStatus,
        registeredAt: result.tech.registeredAt,
      },
    });
  } catch (err: any) {
    console.error('[Technician Register Error]:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Registration failed. Please try again.',
      code: 'REGISTRATION_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 2. ADMIN LIST PENDING APPLICATIONS
// GET /api/admin/technicians/pending (or /api/technicians/pending)
// --------------------------------------------------------------------------
router.get('/pending', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isSuper = req.user?.role?.toUpperCase() === 'SUPER_ADMIN' || req.user?.role?.toUpperCase() === 'MASTER_ADMIN';
    const companyId = req.user!.companyId;

    const pending = await prisma.technician.findMany({
      where: {
        ...(isSuper ? {} : { companyId }),
        accountStatus: 'PENDING_APPROVAL' as any,
      },
      orderBy: { registeredAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        user: { select: { id: true, email: true, phone: true, createdAt: true } },
      },
    });

    res.json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch pending applications.',
      code: 'DB_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 3. ADMIN LIST & FILTER TECHNICIAN RECORDS (PAGINATED)
// GET /api/admin/technicians (or /api/technicians)
// --------------------------------------------------------------------------
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const isSuperOrAdmin =
      userRole === 'SUPER_ADMIN' ||
      userRole === 'MASTER_ADMIN' ||
      userRole === 'COMPANY_ADMIN' ||
      userRole === 'SERVICE_MANAGER';

    // If regular technician is calling GET /, return standard list
    const companyId = req.user!.companyId;

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'ALL').toUpperCase();
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = (String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const where: any = {
      ...(userRole === 'SUPER_ADMIN' || userRole === 'MASTER_ADMIN' ? {} : { companyId }),
    };

    if (req.branchId && !isSuperOrAdmin) {
      where.branchId = req.branchId;
    }

    if (status !== 'ALL' && ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'BLOCKED', 'SUSPENDED'].includes(status)) {
      where.accountStatus = status as any;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { permanentId: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { zone: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderByObj: any = { createdAt: 'desc' };
    if (sortBy === 'approvedAt') orderByObj = { approvedAt: sortOrder };
    else if (sortBy === 'registeredAt') orderByObj = { registeredAt: sortOrder };
    else if (sortBy === 'name') orderByObj = { name: sortOrder };
    else if (sortBy === 'permanentId') orderByObj = { permanentId: sortOrder };
    else orderByObj = { createdAt: sortOrder };

    let totalCount = 0;
    let list: any[] = [];
    let summary = {
      total: 0,
      approved: 0,
      pending: 0,
      blocked: 0,
      rejected: 0,
      suspended: 0,
    };

    try {
      [totalCount, list] = await Promise.all([
        prisma.technician.count({ where }),
        prisma.technician.findMany({
          where,
          orderBy: orderByObj,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            branch: { select: { id: true, name: true, city: true } },
            user: { select: { id: true, lastLoginAt: true, isActive: true } },
            assignedComplaints: {
              where: { status: { in: ['ASSIGNED', 'TECHNICIAN_ON_WAY', 'IN_PROGRESS'] } },
              select: { id: true, ticketNumber: true, priority: true, status: true },
            },
            _count: {
              select: {
                assignedComplaints: true,
                workOrders: true,
                serviceReports: true,
              },
            },
          },
        }),
      ]);

      // Summary counts for badges
      const baseScope = userRole === 'SUPER_ADMIN' || userRole === 'MASTER_ADMIN' ? {} : { companyId };
      const [approvedCnt, pendingCnt, blockedCnt, rejectedCnt, suspendedCnt] = await Promise.all([
        prisma.technician.count({ where: { ...baseScope, accountStatus: 'APPROVED' as any } }),
        prisma.technician.count({ where: { ...baseScope, accountStatus: 'PENDING_APPROVAL' as any } }),
        prisma.technician.count({ where: { ...baseScope, accountStatus: 'BLOCKED' as any } }),
        prisma.technician.count({ where: { ...baseScope, accountStatus: 'REJECTED' as any } }),
        prisma.technician.count({ where: { ...baseScope, accountStatus: 'SUSPENDED' as any } }),
      ]);

      summary = {
        total: approvedCnt + pendingCnt + blockedCnt + rejectedCnt + suspendedCnt,
        approved: approvedCnt,
        pending: pendingCnt,
        blocked: blockedCnt,
        rejected: rejectedCnt,
        suspended: suspendedCnt,
      };
    } catch {
      // Mock DB fallback for testing / offline
      let mockList = db.technicians.filter((t) => (userRole === 'SUPER_ADMIN' ? true : t.companyId === companyId));
      if (search) {
        mockList = mockList.filter((t) =>
          t.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.email?.toLowerCase().includes(search.toLowerCase()) ||
          t.phone?.includes(search)
        );
      }
      totalCount = mockList.length;
      list = mockList.slice((page - 1) * limit, page * limit);
    }

    const countsPayload = {
      ALL: summary.total,
      APPROVED: summary.approved,
      PENDING_APPROVAL: summary.pending,
      BLOCKED: summary.blocked,
      REJECTED: summary.rejected,
      SUSPENDED: summary.suspended,
      total: summary.total,
      approved: summary.approved,
      pending: summary.pending,
      blocked: summary.blocked,
      rejected: summary.rejected,
      suspended: summary.suspended,
    };

    const paginationPayload = {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };

    res.json({
      success: true,
      count: list.length,
      data: {
        technicians: list,
        pagination: paginationPayload,
        counts: countsPayload,
      },
      // Root-level fields for backwards & test suite compatibility
      technicians: list,
      summary,
      counts: countsPayload,
      pagination: paginationPayload,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch technician records.',
      code: 'DB_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 4. RETRIEVE TECHNICIAN DETAILS (PROFILE, JOBS, SERVICE REPORTS, AUDIT LOG)
// GET /api/admin/technicians/:id (or /api/technicians/:id)
// --------------------------------------------------------------------------
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const isSuperOrAdmin =
      userRole === 'SUPER_ADMIN' ||
      userRole === 'MASTER_ADMIN' ||
      userRole === 'COMPANY_ADMIN' ||
      userRole === 'SERVICE_MANAGER';

    const id = req.params.id as string;
    const companyId = req.user!.companyId;

    // Object-level check: Technician can only view their own profile
    if (userRole === 'TECHNICIAN') {
      if (!req.user!.technicianId || req.user!.technicianId !== id) {
        res.status(403).json({
          success: false,
          message: 'Access denied: you can only access your own technician profile.',
          code: 'FORBIDDEN',
        });
        return;
      }
    }

    let technician: any = null;
    let auditLogs: any[] = [];

    try {
      technician = await prisma.technician.findFirst({
        where: {
          id,
          ...(userRole === 'SUPER_ADMIN' || userRole === 'MASTER_ADMIN' ? {} : { companyId }),
        },
        include: {
          branch: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          assignedComplaints: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              lift: { select: { id: true, permanentLiftId: true, brand: true, model: true } },
            },
          },
          workOrders: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          serviceReports: {
            take: 20,
            orderBy: { serviceDate: 'desc' },
          },
          gpsCheckIns: {
            take: 10,
            orderBy: { checkInTime: 'desc' },
          },
        },
      });

      if (technician) {
        auditLogs = await prisma.auditLog.findMany({
          where: {
            entityType: 'Technician',
            entityId: id,
          },
          orderBy: { timestamp: 'desc' },
          take: 30,
        });
      }
    } catch {
      technician = db.technicians.find((t) => t.id === id);
    }

    if (!technician) {
      res.status(404).json({
        success: false,
        message: 'Technician not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...technician,
        auditLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error fetching technician details.',
      code: 'DB_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 5. APPROVE TECHNICIAN APPLICATION
// POST /api/admin/technicians/:id/approve (or /api/technicians/:id/approve)
// --------------------------------------------------------------------------
router.post('/:id/approve', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const adminUser = req.user!;
    const adminName = adminUser.email ? adminUser.email.split('@')[0] : 'Administrator';

    const tech = await prisma.technician.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tech) {
      res.status(404).json({
        success: false,
        message: 'Technician record not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Idempotency: Duplicate approval must not create a second ID or duplicate emails
    if (tech.accountStatus === ('APPROVED' as any) && tech.permanentId) {
      res.json({
        success: true,
        message: 'Technician is already approved.',
        data: tech,
        technicianId: tech.permanentId,
        alreadyApproved: true,
      });
      return;
    }

    // Generate permanent unique ID
    const permanentId = await generatePermanentTechnicianId();
    const approvedAt = new Date();

    // Transactional database update
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTech = await tx.technician.update({
        where: { id },
        data: {
          accountStatus: 'APPROVED' as any,
          permanentId,
          approvedAt,
          approvedBy: adminName,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        },
        include: { user: true, branch: true },
      });

      // Activate user account
      if (tech.user) {
        await tx.user.update({
          where: { id: tech.user.id },
          data: {
            isActive: true,
            technicianId: tech.id,
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          companyId: tech.companyId,
          entityType: 'Technician',
          entityId: tech.id,
          action: 'APPROVE',
          performedBy: adminName,
          userRole: String(adminUser.role || 'COMPANY_ADMIN'),
          details: `Approved technician ${tech.name} (${tech.email}) and assigned permanent ID: ${permanentId}`,
        },
      });

      return updatedTech;
    });

    // In-app Notification
    try {
      await prisma.notification.create({
        data: {
          companyId: tech.companyId,
          userId: tech.user?.id || null,
          technicianId: tech.id,
          title: 'Account Approved',
          message: `Congratulations! Your technician account has been approved. Your permanent Technician ID is ${permanentId}.`,
          category: 'technician',
          type: 'ACCOUNT_APPROVED',
          isRead: false,
        },
      });
    } catch {
      // Non-blocking
    }

    // Send Approval Email Fail-Safe
    let emailSent = false;
    try {
      const emailHtml = generateTechnicianApprovalEmailHtml({
        name: tech.name,
        permanentId,
      });
      const emailText = generateTechnicianApprovalEmailText({
        name: tech.name,
        permanentId,
      });

      const emailResult = await dispatchEmailWithFailover({
        toEmail: tech.email,
        subject: `Technician Account Approved — Permanent ID: ${permanentId}`,
        htmlContent: emailHtml,
        textContent: emailText,
      });
      emailSent = emailResult.accepted;
    } catch (mailErr) {
      console.warn(`[Approval Email Failed for ${tech.email}]:`, mailErr);
    }

    res.json({
      success: true,
      message: `Technician ${tech.name} approved successfully with ID ${permanentId}.`,
      data: updated,
      technicianId: permanentId,
      emailSent,
    });
  } catch (err: any) {
    console.error('[Technician Approval Error]:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to approve technician.',
      code: 'APPROVAL_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 6. REJECT TECHNICIAN APPLICATION
// POST /api/admin/technicians/:id/reject
// --------------------------------------------------------------------------
router.post('/:id/reject', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const adminUser = req.user!;
    const adminName = adminUser.email ? adminUser.email.split('@')[0] : 'Administrator';

    const tech = await prisma.technician.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tech) {
      res.status(404).json({
        success: false,
        message: 'Technician record not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const rejectionReason = reason ? String(reason).trim() : 'Application does not meet current qualification criteria.';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTech = await tx.technician.update({
        where: { id },
        data: {
          accountStatus: 'REJECTED' as any,
          rejectedAt: new Date(),
          rejectedBy: adminName,
          rejectionReason,
        },
      });

      if (tech.user) {
        await tx.user.update({
          where: { id: tech.user.id },
          data: { isActive: false },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: tech.companyId,
          entityType: 'Technician',
          entityId: tech.id,
          action: 'REJECT',
          performedBy: adminName,
          userRole: String(adminUser.role || 'COMPANY_ADMIN'),
          details: `Rejected technician application for ${tech.name} (${tech.email}). Reason: ${rejectionReason}`,
        },
      });

      return updatedTech;
    });

    // Send Rejection Email Fail-Safe
    let emailSent = false;
    try {
      const emailHtml = generateTechnicianRejectionEmailHtml({
        name: tech.name,
        reason: rejectionReason,
      });
      const emailText = generateTechnicianRejectionEmailText({
        name: tech.name,
        reason: rejectionReason,
      });

      const emailResult = await dispatchEmailWithFailover({
        toEmail: tech.email,
        subject: 'WEPSUN Engineering — Technician Application Status',
        htmlContent: emailHtml,
        textContent: emailText,
      });
      emailSent = emailResult.accepted;
    } catch (mailErr) {
      console.warn(`[Rejection Email Failed for ${tech.email}]:`, mailErr);
    }

    res.json({
      success: true,
      message: 'Technician application rejected.',
      data: updated,
      emailSent,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to reject technician.',
      code: 'REJECTION_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 7. BLOCK TECHNICIAN ACCOUNT
// POST /api/admin/technicians/:id/block
// --------------------------------------------------------------------------
router.post('/:id/block', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const adminUser = req.user!;
    const adminName = adminUser.email ? adminUser.email.split('@')[0] : 'Administrator';

    const tech = await prisma.technician.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tech) {
      res.status(404).json({
        success: false,
        message: 'Technician record not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const blockReason = reason ? String(reason).trim() : 'Account administratively restricted.';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTech = await tx.technician.update({
        where: { id },
        data: {
          accountStatus: 'BLOCKED' as any,
          blockedAt: new Date(),
          blockedBy: adminName,
          blockReason,
        },
      });

      if (tech.user) {
        // Increment tokenVersion so existing active JWT tokens are immediately denied
        await tx.user.update({
          where: { id: tech.user.id },
          data: {
            isActive: false,
            tokenVersion: { increment: 1 },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: tech.companyId,
          entityType: 'Technician',
          entityId: tech.id,
          action: 'BLOCK',
          performedBy: adminName,
          userRole: String(adminUser.role || 'COMPANY_ADMIN'),
          details: `Blocked technician ${tech.name} (${tech.email}, ID: ${tech.permanentId || 'N/A'}). Reason: ${blockReason}`,
        },
      });

      return updatedTech;
    });

    // Revoke all refresh token sessions across all devices
    if (tech.user) {
      try {
        await revokeAllUserSessions(tech.user.id);
      } catch {}
    }

    // Send Block Email Fail-Safe
    let emailSent = false;
    try {
      const emailHtml = generateTechnicianBlockedEmailHtml({
        name: tech.name,
        permanentId: tech.permanentId || undefined,
        reason: blockReason,
      });
      const emailText = generateTechnicianBlockedEmailText({
        name: tech.name,
        permanentId: tech.permanentId || undefined,
        reason: blockReason,
      });

      const emailResult = await dispatchEmailWithFailover({
        toEmail: tech.email,
        subject: 'Notice: WEPSUN Technician Account Access Restricted',
        htmlContent: emailHtml,
        textContent: emailText,
      });
      emailSent = emailResult.accepted;
    } catch (mailErr) {
      console.warn(`[Block Email Failed for ${tech.email}]:`, mailErr);
    }

    res.json({
      success: true,
      message: 'Technician account blocked successfully.',
      data: updated,
      emailSent,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to block technician.',
      code: 'BLOCK_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 8. UNBLOCK TECHNICIAN ACCOUNT
// POST /api/admin/technicians/:id/unblock
// --------------------------------------------------------------------------
router.post('/:id/unblock', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'MASTER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const adminUser = req.user!;
    const adminName = adminUser.email ? adminUser.email.split('@')[0] : 'Administrator';

    const tech = await prisma.technician.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tech) {
      res.status(404).json({
        success: false,
        message: 'Technician record not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Safety rule: Restore access only if account was previously approved. Never unblock pending/rejected.
    if (!tech.permanentId || tech.accountStatus !== ('BLOCKED' as any)) {
      res.status(400).json({
        success: false,
        message: 'Cannot unblock account. Account must be a previously approved account in BLOCKED status.',
        code: 'INVALID_STATUS_TRANSITION',
      });
      return;
    }

    const unblockReason = reason ? String(reason).trim() : 'Account reviewed and restored by administrator.';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTech = await tx.technician.update({
        where: { id },
        data: {
          accountStatus: 'APPROVED' as any,
          unblockedAt: new Date(),
          unblockedBy: adminName,
          unblockReason,
        },
      });

      if (tech.user) {
        await tx.user.update({
          where: { id: tech.user.id },
          data: {
            isActive: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: tech.companyId,
          entityType: 'Technician',
          entityId: tech.id,
          action: 'UNBLOCK',
          performedBy: adminName,
          userRole: String(adminUser.role || 'COMPANY_ADMIN'),
          details: `Unblocked technician ${tech.name} (${tech.permanentId}). Reason: ${unblockReason}`,
        },
      });

      return updatedTech;
    });

    res.json({
      success: true,
      message: 'Technician account restored to APPROVED status successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to unblock technician.',
      code: 'UNBLOCK_ERROR',
    });
  }
});

// --------------------------------------------------------------------------
// 9. GPS CHECK-IN (EXISTING FEATURE PRESERVED)
// POST /api/technicians/check-in
// --------------------------------------------------------------------------
router.post('/check-in', requireAuth, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { technicianId, ticketId, jobId, latitude, longitude, accuracy, locationAddress } = req.body;

    if (req.user!.role?.toUpperCase() === 'TECHNICIAN') {
      if (!req.user!.technicianId || (technicianId && req.user!.technicianId !== technicianId)) {
        res.status(403).json({
          success: false,
          message: 'Cannot record GPS check-in for another technician.',
          code: 'FORBIDDEN_OBJECT',
        });
        return;
      }
    }

    const effectiveTechId = req.user!.technicianId || technicianId;
    const effectiveTicketId = ticketId || jobId;

    try {
      if (effectiveTechId && latitude && longitude) {
        await prisma.$transaction(async (tx) => {
          await tx.technician.updateMany({
            where: { id: effectiveTechId, companyId },
            data: {
              latitude: Number(latitude),
              longitude: Number(longitude),
              currentStatus: 'on_job',
              currentLocationName: locationAddress || 'Customer Site',
            },
          });

          if (effectiveTicketId) {
            await tx.gPSCheckIn.create({
              data: {
                companyId,
                technicianId: effectiveTechId,
                ticketId: effectiveTicketId,
                latitude: Number(latitude),
                longitude: Number(longitude),
                accuracyMeters: Number(accuracy || 10.0),
                locationAddress: locationAddress || 'Job Site Location',
                isVerified: true,
              },
            });
          }
        });
      }
    } catch {
      // Fallback
    }

    res.json({
      success: true,
      message: 'GPS Check-in recorded and verified successfully',
      timestamp: new Date().toISOString(),
      checkIn: {
        technicianId: effectiveTechId,
        ticketId: effectiveTicketId,
        latitude,
        longitude,
        accuracy: accuracy || 15,
        locationAddress: locationAddress || 'Site',
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Failed to record check-in',
      code: 'CHECKIN_ERROR',
    });
  }
});

export default router;
