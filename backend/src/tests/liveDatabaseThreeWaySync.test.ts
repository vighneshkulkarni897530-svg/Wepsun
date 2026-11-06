/**
 * Live PostgreSQL End-to-End 3-Role Synchronization Test
 * Validates real database queries, foreign keys, transaction handling, and cross-role updates.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function runLiveSyncTest() {
  console.log('\n======================================================');
  console.log('🧪 LIVE POSTGRESQL 3-ROLE SYNC & INFORMATION TRANSFER');
  console.log('======================================================\n');

  const companyId = 'comp-1';
  const branchId = 'br-mum-1';
  const clientId = 'client-1';
  const liftId = 'lift-traction';
  const techId = 'tech-rohan';

  // 1. Verify Prerequisites
  console.log('1. Verifying database prerequisites...');
  const comp = await prisma.company.findUnique({ where: { id: companyId } });
  if (!comp) throw new Error('Company comp-1 missing');
  console.log(`   ✓ Company: ${comp.name}`);

  const lift = await prisma.lift.findUnique({ where: { id: liftId } });
  if (!lift) throw new Error('Lift lift-traction missing');
  console.log(`   ✓ Equipment: ${lift.brand} (${lift.permanentLiftId})`);

  const tech = await prisma.technician.findUnique({ where: { id: techId } });
  if (!tech) throw new Error('Technician tech-rohan missing');
  console.log(`   ✓ Field Engineer: ${tech.name} (${tech.employeeCode})`);

  // 2. Client Action: Raise Complaint
  console.log('\n2. [CLIENT ROLE] Raising emergency breakdown ticket...');
  const ticketNumber = `TKT-LIVE-${Date.now().toString().slice(-5)}`;
  const complaint = await prisma.complaint.create({
    data: {
      companyId,
      branchId,
      clientId,
      liftId,
      ticketNumber,
      issueType: 'STUCK_PASSENGERS',
      title: 'Emergency: Lift halted between floors 4 & 5',
      description: 'Elevator halted abruptly with 2 passengers inside. Urgent dispatch required.',
      priority: 'CRITICAL',
      isEmergency: true,
      status: 'NEW',
    },
  });
  console.log(`   ✓ Complaint logged: Ticket ${complaint.ticketNumber} (ID: ${complaint.id})`);
  console.log(`   ✓ Initial Status: ${complaint.status}, Assigned Tech: ${complaint.assignedTechnicianId || 'None'}`);

  // 3. Admin Action: Assign Technician
  console.log('\n3. [ADMIN ROLE] Dispatching Technician Rohan Gaikwad...');
  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: 'ASSIGNED',
      assignedTechnician: { connect: { id: techId } },
      technicianEta: '20 mins',
      assignedAt: new Date(),
    },
    include: { assignedTechnician: true },
  });
  console.log(`   ✓ Foreign Key & Update succeeded without P2003 violation!`);
  console.log(`   ✓ Updated Status: ${updatedComplaint.status}`);
  console.log(`   ✓ Verified Assigned Engineer: ${updatedComplaint.assignedTechnician?.name} (${updatedComplaint.assignedTechnicianId})`);

  // 4. Technician Action: Update Workflow Statuses
  console.log('\n4. [TECHNICIAN ROLE] Technician acknowledges & advances workflow...');

  // 4a. On The Way
  const onWayComp = await prisma.complaint.update({
    where: { id: complaint.id },
    data: { status: 'TECHNICIAN_ON_WAY' },
  });
  console.log(`   ✓ Status advanced: ${onWayComp.status} (Client notified that tech is en route)`);

  // 4b. Arrived & In Progress
  const inProgressComp = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: 'IN_PROGRESS',
      diagnosisRemarks: 'Safety circuit tripped due to 4th floor door interlock contact misalignment.',
    },
  });
  console.log(`   ✓ Status advanced: ${inProgressComp.status} (Diagnosis logged)`);

  // 4c. Generate & Sign Service Report
  console.log('\n5. [TECHNICIAN ROLE] Finalizing job & signing Service Report...');
  const reportNumber = `WPS-SR-${Math.floor(10000 + Math.random() * 90000)}`;

  const serviceReport = await prisma.$transaction(async (tx) => {
    const rep = await tx.serviceReport.create({
      data: {
        companyId,
        branchId,
        clientId,
        liftId,
        ticketId: complaint.id,
        reportNumber,
        technicianId: techId,
        serviceStartTime: '10:00 AM',
        serviceEndTime: '10:45 AM',
        serviceType: 'EMERGENCY_CALL',
        initialDiagnosis: 'Interlock microswitch contact gap exceeded threshold',
        rootCause: 'Wear and vibration over normal duty cycles',
        workPerformed: 'Re-aligned door interlock roller, adjusted contact clearance to 2.5mm, safety tested.',
        technicianRecommendations: 'Schedule regular lubrication during upcoming monthly PM.',
        technicianSignature: 'signed_rohan_gaikwad',
        clientSignature: 'signed_society_secretary',
        clientRating: 5,
        pdfUrl: `https://app.wepsun.com/reports/${reportNumber}.pdf`,
      },
    });

    await tx.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'RESOLVED',
        closedAt: new Date(),
        actionTaken: 'Interlock contact adjusted and calibrated. Unit tested operational.',
      },
    });

    await tx.lift.update({
      where: { id: liftId },
      data: { currentStatus: 'OPERATIONAL' },
    });

    return rep;
  }, { timeout: 25000, maxWait: 10000 });

  console.log(`   ✓ Service Report created: ${serviceReport.reportNumber} (ID: ${serviceReport.id})`);
  console.log(`   ✓ Linked Ticket: ${serviceReport.ticketId}`);
  console.log(`   ✓ Linked Technician: ${serviceReport.technicianId}`);

  // 5. Client Action: View Report & Provide 5★ Feedback
  console.log('\n6. [CLIENT ROLE] Client inspects resolved status and submits 5★ rating...');
  const clientReviewComp = await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      clientRating: 5,
      clientFeedback: 'Technician Rohan arrived in 18 minutes! Passengers safely escorted out. Outstanding service.',
    },
  });
  console.log(`   ✓ Client Feedback Recorded: ${clientReviewComp.clientRating}★ - "${clientReviewComp.clientFeedback}"`);

  // 6. Admin Verification: Control Room Overview
  console.log('\n7. [ADMIN ROLE] Admin Control Room audit verification...');
  const adminAudit = await prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: {
      lift: true,
      assignedTechnician: true,
      serviceReport: true,
    },
  });
  console.log(`   ✓ Complaint Ticket: ${adminAudit?.ticketNumber}`);
  console.log(`   ✓ Lift: ${adminAudit?.lift?.brand} (${adminAudit?.lift?.permanentLiftId})`);
  console.log(`   ✓ Technician: ${adminAudit?.assignedTechnician?.name}`);
  console.log(`   ✓ Service Report Attached: ${adminAudit?.serviceReport ? adminAudit.serviceReport.reportNumber : 'None'}`);
  console.log(`   ✓ Final Status: ${adminAudit?.status}`);
  console.log(`   ✓ Customer Rating: ${adminAudit?.clientRating}★`);

  console.log('\n======================================================');
  console.log('🎉 LIVE POSTGRESQL 3-ROLE SYNC COMPLETED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runLiveSyncTest()
  .catch((err) => {
    console.error('❌ Live test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
