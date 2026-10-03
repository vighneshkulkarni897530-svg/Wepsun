import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { TenantRequest } from '../middleware/tenantScope.js';

const router = Router();

// GET /api/qr/lift/:token — Public QR Passport lookup by secure cryptographic token
router.get('/lift/:token', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    let lift: any = null;

    try {
      // Find active QR token
      const qrRecord: any = await prisma.qRCodeToken.findFirst({
        where: { token, isActive: true },
        include: {
          lift: {
            include: {
              building: true,
              client: true,
            },
          },
          company: true,
        },
      });

      if (qrRecord && qrRecord.lift) {
        const l = qrRecord.lift;
        lift = {
          liftNumber: l.permanentLiftId || l.liftNumber || 'WEP-LIFT',
          buildingName: l.building?.name || 'Customer Premise',
          locationDetails: l.locationDetails || 'Main Elevator Bank',
          brand: l.brand,
          model: l.model,
          type: l.type,
          capacityPersons: l.capacityPersons,
          capacityKg: l.capacityKg,
          speedMps: l.speedMps,
          floors: l.floors,
          stops: l.stops,
          currentStatus: l.currentStatus,
          safetyCertificateNumber: l.safetyCertificateNumber || 'CERT-MH-2025-998',
          safetyCertificateExpiry: l.safetyCertificateExpiry || new Date(Date.now() + 180 * 86400000),
          serviceProvider: qrRecord.company?.name || 'WEPSUN Engineering Solution Pvt. Ltd.',
          emergencyHelpline: '+91 98201 55432 / 1800-200-9377',
          sosEndpoint: '/api/complaints',
        };
      }
    } catch {
      // Fallback
      const mockLift: any = db.lifts.find((l: any) => l.qrToken === token || l.qrCodeData === token || l.id === token);
      if (mockLift) {
        lift = {
          liftNumber: mockLift.liftNumber || mockLift.permanentLiftId || 'WEP-LIFT',
          buildingName: mockLift.buildingName,
          locationDetails: mockLift.locationDetails,
          brand: mockLift.brand,
          model: mockLift.model,
          type: mockLift.type,
          capacityPersons: mockLift.capacityPersons,
          capacityKg: mockLift.capacityKg,
          speedMps: mockLift.speedMps,
          floors: mockLift.floors,
          stops: mockLift.stops,
          currentStatus: mockLift.currentStatus,
          safetyCertificateNumber: mockLift.safetyCertificateNumber,
          safetyCertificateExpiry: mockLift.safetyCertificateExpiry,
          serviceProvider: 'WEPSUN Engineering Solution Pvt. Ltd.',
          emergencyHelpline: '+91 98201 55432 / 1800-200-9377',
          sosEndpoint: '/api/complaints',
        };
      }
    }

    if (!lift) {
      res.status(404).json({
        success: false,
        error: 'Elevator QR Record Not Found',
        message: 'Invalid or expired QR token.',
      });
      return;
    }

    res.json({ success: true, data: lift });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error resolving QR token', code: 'QR_ERROR' });
  }
});

export default router;
