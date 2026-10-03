import { Router } from 'express';
import authRoutes from './auth.routes.js';
import companiesRoutes from './companies.routes.js';
import liftsRoutes from './lifts.routes.js';
import complaintsRoutes from './complaints.routes.js';
import workOrdersRoutes from './workOrders.routes.js';
import inventoryRoutes from './inventory.routes.js';
import amcRoutes from './amc.routes.js';
import quotationsRoutes from './quotations.routes.js';
import invoicesRoutes from './invoices.routes.js';
import techniciansRoutes from './technicians.routes.js';
import qrRoutes from './qr.routes.js';
import aiRoutes from './ai.routes.js';
import feedbackRoutes from './feedback.routes.js';
import notificationsRoutes from './notifications.routes.js';
import serviceReportsRoutes from './serviceReports.routes.js';
import pmRoutes from './pm.routes.js';
import paymentsRoutes from './payments.routes.js';
import auditRoutes from './audit.routes.js';
import telemetryRoutes from './telemetry.routes.js';

const router = Router();

// Domain Routers
router.use('/auth', authRoutes);
router.use('/companies', companiesRoutes);
router.use('/lifts', liftsRoutes);
router.use('/complaints', complaintsRoutes);
router.use('/work-orders', workOrdersRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/amc', amcRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/technicians', techniciansRoutes);
router.use('/qr', qrRoutes);
router.use('/ai', aiRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/service-reports', serviceReportsRoutes);
router.use('/pm', pmRoutes);
router.use('/payments', paymentsRoutes);
router.use('/audit', auditRoutes);
router.use('/telemetry', telemetryRoutes);

export default router;
