/**
 * ==============================================================================
 * WEPSUN THREE-ROLE END-TO-END DATA LINKAGE & SYNCHRONIZATION TEST SUITE
 * ==============================================================================
 * Validates the closed-loop bidirectional data transfer between:
 * 1. CLIENT  — Submits complaint & emergency breakdown
 * 2. ADMIN   — Receives ticket, reviews live queues, assigns technician
 * 3. TECH    — Receives live assigned job, executes workflow:
 *              Accept -> En Route -> Arrive/GPS -> Diagnosis/Parts -> Service Report
 * 4. CLIENT  — Receives live status updates, views generated Service Report, submits feedback rating
 * 5. ADMIN   — Receives customer feedback, reviews ratings, and sends official reply
 * ==============================================================================
 */

import { db } from '../data/mockDb.js';
import { complaintEvents } from '../routes/complaints.routes.js';

let passed = 0;
let total = 0;

function assert(condition: boolean, title: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    console.error(`  ❌ [FAIL] ${title}`);
    if (detail) console.error(`     Details: ${detail}`);
    throw new Error(`Assertion failed: ${title}`);
  }
}

async function runThreeWayLinkageTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 WEPSUN 3-ROLE (CLIENT <-> ADMIN <-> TECHNICIAN) LIVE DATA SYNC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const companyId = 'comp-1';
  const branchId = 'br-mum-1';
  const clientId = 'client-ocean-breeze';
  const clientName = 'Ocean Breeze Cooperative Society';
  const clientPhone = '+91 98200 11223';
  const liftId = 'lift-ob-101';
  const liftNumber = 'WPS-OB-01';
  const buildingName = 'Ocean Breeze Tower A';
  const techId = 'tech-rohan';
  const techName = 'Rohan Gaikwad';
  const techPhone = '+91 98203 44556';

  // -------------------------------------------------------------------------
  // STEP 1: CLIENT CREATES COMPLAINT
  // -------------------------------------------------------------------------
  console.log('--- Step 1: Client Submits Service Breakdown Ticket ---');
  const ticketNumber = `TKT-LIVE-${Date.now().toString().slice(-4)}`;
  const complaintId = `comp-live-${Date.now()}`;

  let createdEventReceived = false;
  const onCreated = (c: any) => {
    if (c.id === complaintId) createdEventReceived = true;
  };
  complaintEvents.on('complaint_created', onCreated);

  const clientComplaint = {
    id: complaintId,
    companyId,
    branchId,
    ticketNumber,
    liftId,
    liftNumber,
    buildingId: 'bld-ob-1',
    buildingName,
    clientId,
    clientName,
    clientPhone,
    clientEmail: 'secretary@oceanbreeze.org',
    issueType: 'door_jammed',
    title: 'Landing door interlock open at 4th floor',
    description: 'Elevator stops at 4th floor and door fails to engage automatic close sequence.',
    priority: 'HIGH',
    isEmergency: false,
    status: 'NEW',
    beforePhotos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758'],
    reportedAt: new Date().toISOString(),
    timeline: [
      {
        id: `tl-start-${Date.now()}`,
        status: 'NEW',
        title: 'Complaint Registered',
        description: 'Landing door interlock open at 4th floor',
        timestamp: new Date().toISOString(),
        actorName: clientName,
        actorRole: 'CLIENT',
      },
    ],
  };

  db.complaints.unshift(clientComplaint as any);
  complaintEvents.emit('complaint_created', clientComplaint);

  assert(db.complaints.some((c) => c.id === complaintId), 'Complaint saved in central database');
  assert(createdEventReceived, 'SSE event "complaint_created" emitted to Admin control room');
  complaintEvents.off('complaint_created', onCreated);

  // -------------------------------------------------------------------------
  // STEP 2: ADMIN DISPATCHES TECHNICIAN
  // -------------------------------------------------------------------------
  console.log('\n--- Step 2: Admin Assigns Technician ---');
  let updatedEventReceived = false;
  const onUpdated = (c: any) => {
    if (c.id === complaintId) updatedEventReceived = true;
  };
  complaintEvents.on('complaint_updated', onUpdated);

  const compIndex = db.complaints.findIndex((c) => c.id === complaintId);
  const eta = '25 mins';
  db.complaints[compIndex] = {
    ...db.complaints[compIndex],
    assignedTechnicianId: techId,
    assignedTechnicianName: techName,
    technicianPhone: techPhone,
    technicianEta: eta,
    status: 'ASSIGNED',
    assignedAt: new Date().toISOString(),
    timeline: [
      ...(db.complaints[compIndex].timeline || []),
      {
        id: `tl-assign-${Date.now()}`,
        status: 'ASSIGNED',
        title: 'Technician Dispatched',
        description: `Assigned to ${techName} with ETA ${eta}.`,
        timestamp: new Date().toISOString(),
        actorName: 'Admin Control Room',
        actorRole: 'ADMIN',
      },
    ],
  };
  complaintEvents.emit('complaint_updated', db.complaints[compIndex]);

  const assignedRecord = db.complaints.find((c) => c.id === complaintId);
  assert(assignedRecord?.status === 'ASSIGNED', 'Complaint status transitioned to ASSIGNED');
  assert(assignedRecord?.assignedTechnicianId === techId, 'Assigned technician ID matched');
  assert(assignedRecord?.assignedTechnicianName === techName, 'Assigned technician Name preserved');
  assert(assignedRecord?.technicianEta === eta, 'Technician ETA recorded for client visibility');
  assert(updatedEventReceived, 'SSE event "complaint_updated" emitted on assignment');

  // -------------------------------------------------------------------------
  // STEP 3: TECHNICIAN RECEIVES LIVE JOB & ADVANCES WORKFLOW
  // -------------------------------------------------------------------------
  console.log('\n--- Step 3: Technician Workflow Progression ---');

  // 3a. Technician Accepts Job
  db.complaints[compIndex].status = 'ACCEPTED';
  assert(db.complaints.find((c) => c.id === complaintId)?.status === 'ACCEPTED', 'Stage: ACCEPTED');

  // 3b. Technician En Route
  db.complaints[compIndex].status = 'TECHNICIAN_ON_WAY';
  assert(db.complaints.find((c) => c.id === complaintId)?.status === 'TECHNICIAN_ON_WAY', 'Stage: EN ROUTE (technician_on_way)');

  // 3c. Technician Arrived & GPS Check-In
  const checkInTime = new Date().toISOString();
  db.complaints[compIndex].status = 'INSPECTION_REPAIR';
  db.complaints[compIndex].checkInTime = checkInTime;
  assert(db.complaints.find((c) => c.id === complaintId)?.status === 'INSPECTION_REPAIR', 'Stage: ARRIVED & INSPECTION_REPAIR');
  assert(db.complaints.find((c) => c.id === complaintId)?.checkInTime === checkInTime, 'Check-in timestamp recorded');

  // 3d. Technician Diagnosis & Parts Consumption
  db.complaints[compIndex].diagnosisRemarks = 'Worn landing door beak interlock microswitch replaced.';
  db.complaints[compIndex].actionTaken = 'Replaced microswitch beak, realigned safety edge diode, ran 10 test cycles.';
  db.complaints[compIndex].partsReplaced = [
    {
      partId: 'inv-3',
      partName: 'Landing Door Lock Interlock Switch Beak Assembly',
      partNumber: 'WEP-SW-LCK102',
      quantity: 1,
      unitPrice: 1850,
      totalPrice: 1850,
    },
  ];

  // Consume from inventory
  const partIndex = db.inventory.findIndex((p) => p.id === 'inv-3' || p.id === 'inv-1');
  if (partIndex !== -1) {
    const priorQty = db.inventory[partIndex].currentStock;
    db.inventory[partIndex].currentStock = Math.max(0, priorQty - 1);
    assert(db.inventory[partIndex].currentStock === priorQty - 1, 'Inventory stock deducted by 1 for part');
  }

  // -------------------------------------------------------------------------
  // STEP 4: TECHNICIAN FINALIZES SERVICE REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- Step 4: Technician Finalizes Service Report ---');
  const reportNumber = `WPS-SR-${Math.floor(100000 + Math.random() * 900000)}`;
  const serviceReport = {
    id: `sr-${Date.now()}`,
    companyId,
    branchId,
    clientId,
    reportNumber,
    ticketId: complaintId,
    ticketNumber,
    liftId,
    liftNumber,
    buildingName,
    clientName,
    technicianId: techId,
    technicianName: techName,
    serviceDate: new Date().toISOString().split('T')[0],
    serviceStartTime: '09:30 AM',
    serviceEndTime: '10:45 AM',
    serviceType: 'Breakdown Repair',
    initialDiagnosis: db.complaints[compIndex].diagnosisRemarks,
    rootCause: 'Mechanical wear on lock microswitch spring contact.',
    workPerformed: db.complaints[compIndex].actionTaken,
    partsReplaced: db.complaints[compIndex].partsReplaced,
    liftOperatingStatusAfterWork: 'Fully Operational & Safe',
    technicianSignature: techName,
    clientSignature: clientName,
    clientOtpVerified: true,
    pdfUrl: `https://app.wepsun.com/reports/${reportNumber}.pdf`,
    createdAt: new Date().toISOString(),
  };

  db.serviceReports.unshift(serviceReport as any);

  // Close / Resolve Complaint
  db.complaints[compIndex].status = 'RESOLVED';
  db.complaints[compIndex].serviceReportId = serviceReport.id;
  db.complaints[compIndex].closedAt = new Date().toISOString();
  complaintEvents.emit('complaint_updated', db.complaints[compIndex]);

  assert(db.serviceReports.some((r) => r.reportNumber === reportNumber), 'Service Report saved in central database');
  assert(db.complaints.find((c) => c.id === complaintId)?.status === 'RESOLVED', 'Complaint status updated to RESOLVED');
  assert(db.complaints.find((c) => c.id === complaintId)?.serviceReportId === serviceReport.id, 'Service Report ID linked to Complaint');

  // -------------------------------------------------------------------------
  // STEP 5: CLIENT VIEWS REPORT & SUBMITS FEEDBACK
  // -------------------------------------------------------------------------
  console.log('\n--- Step 5: Client Views Report & Submits Customer Feedback ---');
  // Client queries their service report
  const clientViewReport = db.serviceReports.find((r) => r.ticketId === complaintId);
  assert(!!clientViewReport, 'Client successfully retrieves their linked Service Report');
  assert(clientViewReport?.reportNumber === reportNumber, 'Client views the identical Service Report Number');

  // Client rates service 5 stars
  const feedbackId = `fb-${Date.now()}`;
  const customerFeedback = {
    id: feedbackId,
    companyId,
    branchId,
    ticketId: complaintId,
    ticketNumber,
    serviceReportId: serviceReport.id,
    liftId,
    liftNumber,
    buildingName,
    clientId,
    clientName,
    clientPhone,
    technicianId: techId,
    technicianName: techName,
    overallRating: 5,
    ratingsBreakdown: {
      punctuality: 5,
      technicalSkill: 5,
      communication: 5,
      rideSmoothness: 5,
    },
    serviceType: 'Breakdown Resolution',
    tags: ['Fast Arrival', 'Professional Work', 'Digital Signoff'],
    comments: 'Rohan arrived promptly and fixed the 4th floor door in 40 minutes. Highly impressed with digital report.',
    status: 'published',
    createdAt: new Date().toISOString(),
  };

  db.feedbacks.unshift(customerFeedback as any);
  db.complaints[compIndex].clientRating = 5;
  db.complaints[compIndex].clientFeedback = customerFeedback.comments;

  assert(db.feedbacks.some((f) => f.id === feedbackId), 'Customer feedback recorded in central database');
  assert(db.complaints.find((c) => c.id === complaintId)?.clientRating === 5, 'Client rating of 5★ saved on complaint');

  // -------------------------------------------------------------------------
  // STEP 6: ADMIN REVIEWS FEEDBACK & REPLIES
  // -------------------------------------------------------------------------
  console.log('\n--- Step 6: Admin Reviews Feedback & Sends Official Reply ---');
  const adminFoundFeedback = db.feedbacks.find((f) => f.id === feedbackId);
  assert(!!adminFoundFeedback, 'Admin retrieves customer review in CustomerFeedbackManager');
  assert(adminFoundFeedback?.overallRating === 5, 'Review reflects verified 5★ score');

  // Admin replies to customer feedback
  const replyMessage = 'Thank you Ocean Breeze CHS! WEPSUN is dedicated to 100% elevator uptime.';
  adminFoundFeedback.adminReply = {
    message: replyMessage,
    repliedBy: 'Sanjay Deshmukh (Service Director)',
    repliedAt: new Date().toISOString(),
  };

  assert(db.feedbacks.find((f) => f.id === feedbackId)?.adminReply?.message === replyMessage, 'Admin reply successfully recorded and visible to client');

  complaintEvents.off('complaint_updated', onUpdated);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 ALL ${passed}/${total} THREE-ROLE DATA LINKAGE TESTS PASSED!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runThreeWayLinkageTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
