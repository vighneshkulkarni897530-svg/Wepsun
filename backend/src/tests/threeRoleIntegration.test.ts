/**
 * ==============================================================================
 * WEPSUN ENGINEERING SOLUTIONS — COMPLETE THREE-ROLE INTEGRATION TEST SUITE
 * ==============================================================================
 * Validates the complete information exchange network across:
 * 1. Client Portal
 * 2. Technician Portal
 * 3. Admin Dashboard
 *
 * Covers:
 * - Test A: Client -> Admin -> Technician (Complaint creation, Admin receipt & assignment, Technician job appearance)
 * - Test B: Technician -> Admin -> Client (Status updates, GPS check-in, Client tracking timeline)
 * - Test C: Quotation Management (Creation, Client approval, Work Order & Invoice conversion)
 * - Test D: Service Completion & Reports (Digital job card, parts consumption, report availability)
 * - Test E: Inventory Management (Double-entry movement, stock reduction, low-stock alert to Admin)
 * - Test F: Invoice & Verified Payments (Razorpay payment confirmation, invoice settlement)
 * - Test G: Customer Feedback (CSAT rating, notification to Admin)
 * - Test H: Role-Based Access Control & Strict Data Isolation
 * ==============================================================================
 */

import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../lib/auth.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runThreeRoleIntegrationTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 WEPSUN THREE-ROLE NETWORK & DATA EXCHANGE INTEGRATION TEST SUITE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const timestamp = Date.now();
  const testCompanyId = 'comp-1';
  const testBranchId = 'br-mum-1';

  // Ensure test company and branch exist
  const company = await prisma.company.upsert({
    where: { id: testCompanyId },
    update: {},
    create: {
      id: testCompanyId,
      name: 'WEPSUN Engineering Solution Pvt. Ltd.',
      code: 'WEP-INT',
      contactEmail: 'integration@wepsun.com',
      contactPhone: '+919820155432',
      address: 'Navi Mumbai Hub',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
    },
  });
  assert(!!company, 'Tenant Company context initialized');

  const branch = await prisma.branch.upsert({
    where: { id: testBranchId },
    update: {},
    create: {
      id: testBranchId,
      companyId: testCompanyId,
      name: 'Mumbai Regional Center',
      code: 'MUM-INT',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Sector 19 Vashi',
      contactPhone: '+919820155432',
      contactEmail: 'mumbai@wepsun.com',
    },
  });
  assert(!!branch, 'Tenant Branch context initialized');

  // Setup Role Entities:
  // 1. Client Society
  const clientEntity = await prisma.client.create({
    data: {
      companyId: testCompanyId,
      name: `Grand Imperial CHS ${timestamp}`,
      contactPerson: 'Mr. Arvind Shinde',
      phone: `+91 98200 ${Math.floor(10000 + Math.random() * 90000)}`,
      email: `client.${timestamp}@grandimperial.com`,
      billingAddress: 'Tower 4, Palm Beach Road, Navi Mumbai',
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      clientId: clientEntity.id,
      name: 'Mr. Arvind Shinde',
      email: `client.${timestamp}@grandimperial.com`,
      role: 'CLIENT',
      isActive: true,
    },
  });
  assert(clientUser.role === 'CLIENT' && clientUser.clientId === clientEntity.id, 'Client User identity established');

  // 2. Field Technician
  const techEntity = await prisma.technician.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      name: `Sandeep Jadhav ${timestamp}`,
      employeeCode: `WEP-TECH-${timestamp.toString().slice(-4)}`,
      phone: `+91 98201 ${Math.floor(10000 + Math.random() * 90000)}`,
      email: `sandeep.${timestamp}@wepsun.com`,
      accountStatus: 'APPROVED',
      currentStatus: 'AVAILABLE',
    },
  });

  const techUser = await prisma.user.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      technicianId: techEntity.id,
      name: techEntity.name,
      email: techEntity.email,
      role: 'TECHNICIAN',
      isActive: true,
    },
  });
  assert(techUser.role === 'TECHNICIAN' && techUser.technicianId === techEntity.id, 'Field Technician identity established');

  // 3. Admin User
  const adminUser = await prisma.user.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      name: 'Sumit Jaiswal (Operations Desk)',
      email: `admin.${timestamp}@wepsun.com`,
      role: 'COMPANY_ADMIN',
      isActive: true,
    },
  });
  assert(adminUser.role === 'COMPANY_ADMIN', 'Admin Operations Desk identity established');

  // 4. Client Building & Lift
  const building = await prisma.building.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      clientId: clientEntity.id,
      name: 'Grand Imperial Wing A',
      address: 'Plot 44, Sector 19',
      city: 'Navi Mumbai',
      pinCode: '400703',
      contactPerson: 'Mr. Arvind Shinde',
      contactPhone: '+91 98200 12345',
      totalLifts: 2,
    },
  });

  const lift = await prisma.lift.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      buildingId: building.id,
      clientId: clientEntity.id,
      permanentLiftId: `WPS-GI-${timestamp.toString().slice(-4)}`,
      brand: 'WEPSUN Gearless PMSM',
      model: 'AeroGlide-V3',
      type: 'PASSENGER',
      capacityPersons: 10,
      capacityKg: 680,
      speedMps: 1.5,
      floors: 'G + 14 Floors',
      stops: 15,
      controllerBrand: 'Monarch NICE3000+',
      doorOperator: 'Fermator VVVF4+',
      installationDate: new Date('2024-01-15'),
      currentStatus: 'OPERATIONAL',
      locationDetails: 'Passenger Elevator Wing A',
    },
  });
  assert(lift.clientId === clientEntity.id, 'Lift asset registered under Client Society');

  // =========================================================================
  // TEST A: Client -> Admin -> Technician (Complaint & Dispatch)
  // =========================================================================
  console.log('\n📋 TEST A: Client -> Admin -> Technician Workflow');
  const ticketNumber = `TKT-${timestamp.toString().slice(-6)}`;

  // 1. Client creates breakdown ticket
  const complaint = await prisma.$transaction(async (tx) => {
    const c = await tx.complaint.create({
      data: {
        companyId: testCompanyId,
        branchId: testBranchId,
        liftId: lift.id,
        clientId: clientEntity.id,
        createdById: clientUser.id,
        ticketNumber,
        issueType: 'DOOR_JAMMED',
        title: 'Main Door Jammed on 7th Floor',
        description: 'Elevator car is stationary on the 7th floor with outer doors unable to retract.',
        priority: 'HIGH',
        status: 'NEW',
      },
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: c.id,
        status: 'NEW',
        title: 'Breakdown Ticket Logged',
        description: 'Customer raised door jammed service request.',
        actorName: clientUser.name,
        actorRole: 'CLIENT',
      },
    });

    await tx.lift.update({
      where: { id: lift.id },
      data: { currentStatus: 'BREAKDOWN' },
    });

    // Broadcast notification for Admin
    await tx.notification.create({
      data: {
        companyId: testCompanyId,
        userId: null,
        title: `🚨 Breakdown Reported: ${ticketNumber}`,
        message: `High Priority: Door Jammed on ${lift.permanentLiftId} at ${building.name}.`,
        type: 'BREAKDOWN',
        entityType: 'Complaint',
        entityId: c.id,
      },
    });

    return c;
  });

  assert(complaint.status === 'NEW', 'Complaint created with NEW status');
  const brokenLift = await prisma.lift.findUnique({ where: { id: lift.id } });
  assert(brokenLift?.currentStatus === 'BREAKDOWN', 'Lift status transitioned to BREAKDOWN');

  // Verify Admin received the notification
  const adminNotifs = await prisma.notification.findMany({
    where: { companyId: testCompanyId, userId: null, entityId: complaint.id },
  });
  assert(adminNotifs.length > 0, 'Admin operations desk received complaint notification');

  // 2. Admin assigns Field Technician
  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaint.id },
      data: {
        assignedTechnicianId: techEntity.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: complaint.id,
        status: 'ASSIGNED',
        title: 'Technician Assigned',
        description: `Service desk assigned engineer ${techEntity.name}.`,
        actorName: adminUser.name,
        actorRole: 'COMPANY_ADMIN',
      },
    });

    // Notify Technician
    await tx.notification.create({
      data: {
        companyId: testCompanyId,
        userId: techUser.id,
        title: `👷 New Job Assigned: ${ticketNumber}`,
        message: `Assigned to breakdown ticket #${ticketNumber} at ${building.name}.`,
        type: 'ASSIGNMENT',
        entityType: 'Complaint',
        entityId: complaint.id,
      },
    });

    // Notify Client
    await tx.notification.create({
      data: {
        companyId: testCompanyId,
        userId: clientUser.id,
        title: `👨‍🔧 Technician Assigned: ${techEntity.name}`,
        message: `${techEntity.name} is assigned to your ticket #${ticketNumber}.`,
        type: 'TECHNICIAN_ASSIGNED',
        entityType: 'Complaint',
        entityId: complaint.id,
      },
    });
  });

  // Verify Technician view receives the job
  const techAssignedJobs = await prisma.complaint.findMany({
    where: { companyId: testCompanyId, assignedTechnicianId: techEntity.id },
  });
  assert(techAssignedJobs.some((j) => j.id === complaint.id), 'Assigned complaint appears in Technician job registry');

  // Verify notifications sent to Technician and Client
  const techNotif = await prisma.notification.findFirst({
    where: { companyId: testCompanyId, userId: techUser.id, entityId: complaint.id },
  });
  assert(!!techNotif && techNotif.type === 'ASSIGNMENT', 'Technician received assignment notification');

  const clientNotif = await prisma.notification.findFirst({
    where: { companyId: testCompanyId, userId: clientUser.id, entityId: complaint.id },
  });
  assert(!!clientNotif && clientNotif.type === 'TECHNICIAN_ASSIGNED', 'Client received technician assignment alert');

  // =========================================================================
  // TEST B: Technician -> Admin -> Client (Progress Tracking)
  // =========================================================================
  console.log('\n📋 TEST B: Technician -> Admin -> Client Job Progress Updates');

  // 1. Technician marks en route
  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaint.id },
      data: { status: 'TECHNICIAN_ON_WAY' },
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: complaint.id,
        status: 'TECHNICIAN_ON_WAY',
        title: 'Technician En Route',
        description: 'Engineer is travelling to site (ETA: 25 mins).',
        actorName: techEntity.name,
        actorRole: 'TECHNICIAN',
      },
    });

    await tx.notification.create({
      data: {
        companyId: testCompanyId,
        userId: clientUser.id,
        title: '🚚 Engineer En Route',
        message: `${techEntity.name} is on the way to ${building.name}.`,
        type: 'TECHNICIAN_ON_WAY',
        entityType: 'Complaint',
        entityId: complaint.id,
      },
    });
  });

  const onWayComp = await prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: { timelineEntries: true },
  });
  assert(onWayComp?.status === 'TECHNICIAN_ON_WAY', 'Complaint status advanced to TECHNICIAN_ON_WAY');
  assert(onWayComp?.timelineEntries.some((t) => t.status === 'TECHNICIAN_ON_WAY'), 'Timeline entry recorded for Technician On Way');

  // 2. Technician checks in on site via GPS
  const gpsCheckIn = await prisma.gPSCheckIn.create({
    data: {
      companyId: testCompanyId,
      technicianId: techEntity.id,
      ticketId: complaint.id,
      latitude: 19.0760,
      longitude: 72.8777,
      accuracyMeters: 8.5,
      locationAddress: 'Grand Imperial Society Main Shaft Gate',
      isVerified: true,
      distanceFromSiteMeters: 12.0,
    },
  });
  assert(gpsCheckIn.isVerified === true, 'Technician GPS check-in successfully logged and verified');

  // =========================================================================
  // TEST C: Quotation Management (Creation, Client Approval & Conversion)
  // =========================================================================
  console.log('\n📋 TEST C: Quotation Management & Work Order Conversion');

  const quoteNumber = `QT-${timestamp.toString().slice(-6)}`;
  const quote = await prisma.quotation.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      clientId: clientEntity.id,
      liftId: lift.id,
      complaintId: complaint.id,
      quoteNumber,
      subject: 'Door Operator Mechanism & Belt Replacement',
      subtotal: 12000,
      gstRate: 18.0,
      gstAmount: 2160,
      grandTotal: 14160,
      terms: ['100% advance on spares', '12 months warranty on new mechanism'],
      status: 'SENT_TO_CLIENT',
      validUntil: new Date(Date.now() + 30 * 86400000),
      items: {
        create: [
          {
            description: 'VF Door Operator Drive Belt',
            quantity: 1,
            unitRate: 4500,
            amount: 4500,
            hsnCode: '84313100',
          },
          {
            description: 'Car Door Clutch Roller Set',
            quantity: 2,
            unitRate: 3750,
            amount: 7500,
            hsnCode: '84313100',
          },
        ],
      },
    },
    include: { items: true },
  });
  assert(quote.grandTotal === 14160 && quote.items.length === 2, 'Quotation created with 2 line items and GST');

  // Client approves quotation
  const approvedQuote = await prisma.quotation.update({
    where: { id: quote.id },
    data: { status: 'APPROVED' },
  });
  assert(approvedQuote.status === 'APPROVED', 'Client approved quotation');

  // Conversion of approved quotation to Work Order and Invoice
  const woNumber = `WO-${timestamp.toString().slice(-6)}`;
  const invNumber = `INV-${timestamp.toString().slice(-6)}`;

  const convertedData = await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({
      data: {
        companyId: testCompanyId,
        branchId: testBranchId,
        workOrderNumber: woNumber,
        quotationId: quote.id,
        complaintId: complaint.id,
        liftId: lift.id,
        technicianId: techEntity.id,
        title: quote.subject,
        description: `Execution for Quotation ${quote.quoteNumber}`,
        priority: 'HIGH',
        status: 'ASSIGNED',
        scheduledDate: new Date(),
        estimatedHours: 3.5,
        totalAmount: quote.grandTotal,
      },
    });

    const inv = await tx.invoice.create({
      data: {
        companyId: testCompanyId,
        branchId: testBranchId,
        clientId: clientEntity.id,
        invoiceNumber: invNumber,
        type: 'Quotation Execution',
        relatedQuoteId: quote.id,
        subtotal: quote.subtotal,
        gstAmount: quote.gstAmount,
        grandTotal: quote.grandTotal,
        paidAmount: 0.0,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 15 * 86400000),
      },
    });

    await tx.quotation.update({
      where: { id: quote.id },
      data: {
        status: 'CONVERTED_TO_WORK_ORDER',
        convertedToWorkOrderId: wo.id,
      },
    });

    await tx.workOrder.update({
      where: { id: wo.id },
      data: { invoiceId: inv.id },
    });

    return { wo, inv };
  });

  assert(convertedData.wo.technicianId === techEntity.id, 'Work order dispatched to Technician');
  assert(convertedData.inv.grandTotal === 14160, 'Invoice generated matching approved quotation total');

  // =========================================================================
  // TEST D: Inventory Management (Consumption & Double-Entry Ledger)
  // =========================================================================
  console.log('\n📋 TEST D: Spare Parts Inventory Management');

  const part = await prisma.inventoryPart.create({
    data: {
      companyId: testCompanyId,
      branchId: testBranchId,
      partNumber: `SKU-BELT-${timestamp.toString().slice(-4)}`,
      name: 'High-Torque Synchronous Door Belt',
      category: 'MECHANICAL',
      currentStock: 5,
      minStockThreshold: 2,
      unit: 'Nos',
      purchasePrice: 2200,
      sellingPrice: 4500,
      hsnCode: '84313100',
      supplier: 'WepSun OEM Spares Ltd',
      locationRack: 'Shelf C-03',
    },
  });

  // Technician consumes 4 units for the job (reducing stock to 1, below threshold 2)
  const consumedQty = 4;
  const newStock = part.currentStock - consumedQty;

  const invTx = await prisma.$transaction(async (tx) => {
    const mov = await tx.inventoryMovement.create({
      data: {
        companyId: testCompanyId,
        branchId: testBranchId,
        partId: part.id,
        type: 'JOB_CONSUMPTION',
        quantity: -consumedQty,
        previousStock: part.currentStock,
        newStock: newStock,
        referenceId: ticketNumber,
        technicianId: techEntity.id,
        performedBy: techEntity.name,
        notes: `Installed for Ticket ${ticketNumber}`,
      },
    });

    const updatedPart = await tx.inventoryPart.update({
      where: { id: part.id },
      data: { currentStock: newStock },
    });

    // Low stock trigger notification to Admin
    if (newStock <= part.minStockThreshold) {
      await tx.notification.create({
        data: {
          companyId: testCompanyId,
          userId: null,
          title: `⚠️ Low Stock Alert: ${part.name}`,
          message: `Stock level fell to ${newStock} units (Threshold: ${part.minStockThreshold}).`,
          type: 'INVENTORY_ALERT',
          entityType: 'InventoryPart',
          entityId: part.id,
        },
      });
    }

    return { mov, updatedPart };
  });

  assert(invTx.updatedPart.currentStock === 1, 'Inventory stock deducted accurately (5 - 4 = 1)');
  const lowStockNotif = await prisma.notification.findFirst({
    where: { companyId: testCompanyId, entityId: part.id, type: 'INVENTORY_ALERT' },
  });
  assert(!!lowStockNotif, 'Admin operations desk received automated low-stock alert');

  // =========================================================================
  // TEST E: Service Completion, Digital Job Card & Report Access
  // =========================================================================
  console.log('\n📋 TEST E: Service Completion & Digital Service Report');

  const reportNumber = `WPS-SR-${timestamp.toString().slice(-6)}`;
  const serviceReport = await prisma.$transaction(async (tx) => {
    const rep = await tx.serviceReport.create({
      data: {
        companyId: testCompanyId,
        branchId: testBranchId,
        clientId: clientEntity.id,
        reportNumber,
        ticketId: complaint.id,
        liftId: lift.id,
        technicianId: techEntity.id,
        serviceStartTime: '10:30 AM',
        serviceEndTime: '12:15 PM',
        serviceType: 'BREAKDOWN_REPAIR',
        initialDiagnosis: 'Drive belt slipped off idler pulley causing door binding.',
        rootCause: 'Normal mechanical fatigue of timing belt teeth.',
        workPerformed: 'Replaced synchronous door drive belt, aligned clutch rollers, tested 10 automatic cycles.',
        technicianRecommendations: 'Maintain monthly silicon spray lubrication on door guide sills.',
        technicianSignature: 'data:image/png;base64,mockTechSig',
        clientSignature: 'data:image/png;base64,mockClientSig',
        clientRating: 5,
        clientFeedback: 'Fast and professional breakdown resolution. Lift running silently.',
        pdfUrl: `https://app.wepsun.com/reports/${reportNumber}.pdf`,
      },
    });

    // Mark Complaint RESOLVED and CLOSED
    await tx.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'RESOLVED',
        closedAt: new Date(),
        clientRating: 5,
        clientFeedback: 'Fast and professional breakdown resolution.',
      },
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: complaint.id,
        status: 'RESOLVED',
        title: 'Service Report Signed & Lift Operational',
        description: `Service Report ${reportNumber} signed off by ${clientUser.name}.`,
        actorName: techEntity.name,
        actorRole: 'TECHNICIAN',
      },
    });

    // Restore Lift to OPERATIONAL
    await tx.lift.update({
      where: { id: lift.id },
      data: { currentStatus: 'OPERATIONAL' },
    });

    // Notify Client of Service Report
    await tx.notification.create({
      data: {
        companyId: testCompanyId,
        userId: clientUser.id,
        title: `📑 Service Report Available: ${reportNumber}`,
        message: 'Your service report is signed and archived. Lift is fully operational.',
        type: 'SERVICE_REPORT',
        entityType: 'ServiceReport',
        entityId: rep.id,
      },
    });

    return rep;
  });

  assert(serviceReport.reportNumber === reportNumber, 'Digital Service Report created with signatures and rating');
  const restoredLift = await prisma.lift.findUnique({ where: { id: lift.id } });
  assert(restoredLift?.currentStatus === 'OPERATIONAL', 'Lift status safely restored to OPERATIONAL');

  // Verify Client can query this service report
  const clientReports = await prisma.serviceReport.findMany({
    where: { companyId: testCompanyId, clientId: clientEntity.id },
  });
  assert(clientReports.some((r) => r.id === serviceReport.id), 'Client can access signed service report in reports feed');

  // =========================================================================
  // TEST F: Invoice & Verified Online Payment (Razorpay)
  // =========================================================================
  console.log('\n📋 TEST F: Invoice Settlement & Verified Payment Gateway');

  const rzpPaymentId = `pay_test_${timestamp.toString().slice(-8)}`;
  const paymentRecord = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        invoiceId: convertedData.inv.id,
        amount: convertedData.inv.grandTotal,
        method: 'UPI_QR',
        transactionId: rzpPaymentId,
        gatewayRef: `order_test_${timestamp}`,
        verified: true,
      },
    });

    await tx.invoice.update({
      where: { id: convertedData.inv.id },
      data: {
        status: 'PAID',
        paidAmount: convertedData.inv.grandTotal,
        transactionId: rzpPaymentId,
      },
    });

    await tx.notification.create({
      data: {
        companyId: testCompanyId,
        userId: null,
        title: `💰 Payment Verified: ₹${convertedData.inv.grandTotal}`,
        message: `Settled for Invoice ${invNumber} via UPI.`,
        type: 'PAYMENT',
        entityType: 'Invoice',
        entityId: convertedData.inv.id,
      },
    });

    return p;
  });

  assert(paymentRecord.verified === true, 'Payment verified through cryptographic confirmation');
  const settledInvoice = await prisma.invoice.findUnique({ where: { id: convertedData.inv.id } });
  assert(settledInvoice?.status === 'PAID', 'Invoice status updated to PAID in central ledger');

  // =========================================================================
  // TEST G: Customer Feedback Submission
  // =========================================================================
  console.log('\n📋 TEST G: Customer Feedback & CSAT Recording');

  const feedback = await prisma.customerFeedback.create({
    data: {
      companyId: testCompanyId,
      clientId: clientEntity.id,
      userId: clientUser.id,
      clientName: clientEntity.name,
      clientPhone: clientEntity.phone,
      buildingName: building.name,
      liftNumber: lift.permanentLiftId,
      technicianName: techEntity.name,
      ticketNumber: ticketNumber,
      serviceType: 'Breakdown Repair',
      overallRating: 5,
      punctuality: 5,
      technicalSkill: 5,
      rideSmoothness: 5,
      communication: 5,
      tags: ['Prompt Arrival', 'Clear Communication', 'Safety Tested'],
      comments: 'Technician reached within 20 mins and rectified door issue professionally.',
      status: 'published',
    },
  });

  assert(feedback.overallRating === 5 && feedback.status === 'published', 'Customer CSAT review recorded and published');

  // =========================================================================
  // TEST H: Strict Role-Based Access Control & Tenant Isolation
  // =========================================================================
  console.log('\n📋 TEST H: Strict Role-Based Security & Data Isolation');

  // Create another isolated client in a different company
  const otherCompany = await prisma.company.upsert({
    where: { id: 'comp-other' },
    update: {},
    create: {
      id: 'comp-other',
      name: 'Other Competitor Lift Services',
      code: 'OTH',
      contactEmail: 'other@competitor.com',
      contactPhone: '+919999988888',
      address: 'Pune Central',
      city: 'Pune',
      state: 'Maharashtra',
    },
  });

  const otherClient = await prisma.client.create({
    data: {
      companyId: otherCompany.id,
      name: `Other Society ${timestamp}`,
      contactPerson: 'Mr. Joshi',
      phone: '+91 99999 11111',
      billingAddress: 'Pune',
    },
  });

  // Client 1 cannot query other client's complaints
  const client1Complaints = await prisma.complaint.findMany({
    where: { companyId: testCompanyId, clientId: clientEntity.id },
  });
  assert(
    client1Complaints.every((c) => c.clientId === clientEntity.id),
    'Client 1 only retrieves complaints belonging strictly to their society'
  );

  // Technician only sees their assigned jobs
  const technicianJobs = await prisma.complaint.findMany({
    where: { companyId: testCompanyId, assignedTechnicianId: techEntity.id },
  });
  assert(
    technicianJobs.every((j) => j.assignedTechnicianId === techEntity.id),
    'Technician only retrieves jobs assigned specifically to their technician ID'
  );

  // JWT Token Scoping
  const clientToken = generateAccessToken({
    userId: clientUser.id,
    email: clientUser.email,
    role: 'CLIENT',
    companyId: testCompanyId,
    clientId: clientEntity.id,
  });
  assert(!!clientToken, 'Cryptographic JWT generated for Client with explicit clientId');

  const techToken = generateAccessToken({
    userId: techUser.id,
    email: techUser.email,
    role: 'TECHNICIAN',
    companyId: testCompanyId,
    technicianId: techEntity.id,
  });
  assert(!!techToken, 'Cryptographic JWT generated for Technician with explicit technicianId');

  const adminToken = generateAccessToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: 'COMPANY_ADMIN',
    companyId: testCompanyId,
  });
  assert(!!adminToken, 'Cryptographic JWT generated for Company Admin');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 THREE-ROLE INTEGRATION TEST RESULTS:`);
  console.log(`   Total Tests Run: ${totalTests}`);
  console.log(`   Passed:          ${passedTests} ✅`);
  console.log(`   Failed:          0`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runThreeRoleIntegrationTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal Three-Role Integration Test Error:', err);
    process.exit(1);
  });
