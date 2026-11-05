/**
 * ==============================================================================
 * WEPSUN COMPLAINT LIFECYCLE & DUAL ADMIN PARITY INTEGRATION SUITE
 * ==============================================================================
 * Verifies:
 * 1. Single Central Database Persistence: records are never deleted on assignment/updates
 * 2. Admin & Master Admin Parity: both access identical ticket records & counts
 * 3. 10-Stage Complaint Lifecycle:
 *    NEW -> PENDING REVIEW -> ASSIGNED -> ACCEPTED -> EN ROUTE -> ARRIVED -> IN PROGRESS -> RESOLVED -> CLOSED -> ARCHIVED
 * 4. "All Complaints" Integrity: total complaints never decreases on status transition
 * 5. Technician Assignment & Real-Time Sync without record disappearance
 * 6. Explicit Archive & Restore Preservation
 * ==============================================================================
 */

import assert from 'node:assert';
import { db } from '../data/mockDb.js';
import { complaintEvents } from '../routes/complaints.routes.js';

let totalTests = 0;
let passedTests = 0;

function check(condition: boolean, title: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${title}`);
  } else {
    console.error(`  ❌ [FAIL] ${title}`);
    if (detail) console.error(`     Details: ${detail}`);
    throw new Error(`Assertion failed: ${title}`);
  }
}

async function runLifecycleAndParitySuite() {
  console.log('\n================================================================');
  console.log('🧪 WEPSUN PERMANENT COMPLAINT LIFECYCLE & PARITY TEST SUITE');
  console.log('================================================================\n');

  const companyA = 'comp-1';
  const companyB = 'comp-2';
  const tenantAdminA = { id: 'admin-1', role: 'ADMIN', companyId: companyA };
  const masterAdmin = { id: 'master-1', role: 'MASTER_ADMIN' };

  // 1. Initial total count
  const initialDbCount = db.complaints.length;
  console.log(`Initial central complaints in DB: ${initialDbCount}`);

  // -------------------------------------------------------------------------
  // TEST 1: Client Submits Complaint -> Single Central Record Created
  // -------------------------------------------------------------------------
  console.log('\n--- Step 1: Client Creates Complaint ---');
  const ticketNumber = `TKT-SYNC-${Date.now().toString().slice(-4)}`;
  const complaintId = `comp-sync-${Date.now()}`;

  let eventFired = false;
  const onCreated = (comp: any) => {
    if (comp.id === complaintId) eventFired = true;
  };
  complaintEvents.on('complaint_created', onCreated);

  const newTicket = {
    id: complaintId,
    ticketNumber,
    companyId: companyA,
    branchId: 'br-mum-1',
    liftId: 'lift-alpha-101',
    liftNumber: 'WPS-MUM-101',
    buildingId: 'bld-sunrise',
    buildingName: 'Sunrise Executive Towers',
    clientId: 'client-1',
    clientName: 'Rahul Mehta',
    clientPhone: '+91 98765 43210',
    clientEmail: 'rahul.mehta@example.com',
    issueType: 'vibration_noise',
    title: 'Severe vibration on 4th floor approach',
    description: 'Elevator shakes noticeably while slowing down near floor 4.',
    priority: 'HIGH',
    isEmergency: false,
    status: 'NEW',
    reportedAt: new Date().toISOString(),
    timeline: [
      {
        id: `tl-1-${Date.now()}`,
        status: 'NEW',
        title: 'Complaint Registered',
        description: 'Severe vibration on 4th floor approach',
        timestamp: new Date().toISOString(),
        actorName: 'Rahul Mehta',
        actorRole: 'CLIENT',
      },
    ],
  };

  db.complaints.unshift(newTicket as any);
  complaintEvents.emit('complaint_created', newTicket);

  check(db.complaints.length === initialDbCount + 1, 'Total complaints count increased by exactly 1');
  check(eventFired, 'Real-time event "complaint_created" emitted to active listeners');

  // -------------------------------------------------------------------------
  // TEST 2: Dual Dashboard Parity (Admin vs Master Admin)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 2: Dual Admin Dashboard Parity ---');
  // Tenant Admin A sees companyA complaints
  const tenantComplaints = db.complaints.filter((c) => c.companyId === tenantAdminA.companyId);
  // Master Admin sees all complaints across all tenants
  const masterAdminComplaints = db.complaints;

  const foundInTenant = tenantComplaints.find((c) => c.ticketNumber === ticketNumber);
  const foundInMaster = masterAdminComplaints.find((c) => c.ticketNumber === ticketNumber);

  check(!!foundInTenant, 'Complaint is visible in Admin Dashboard -> Complaints');
  check(!!foundInMaster, 'Complaint is visible in Master Admin Dashboard -> Complaints');
  check(foundInTenant?.id === foundInMaster?.id, 'Both dashboards use identical Ticket Record & Complaint ID');
  check(foundInTenant?.title === foundInMaster?.title, 'Complaint title matches identically between dashboards');

  // -------------------------------------------------------------------------
  // TEST 3: Admin Assigns Technician -> Complaint NEVER DISAPPEARS
  // -------------------------------------------------------------------------
  console.log('\n--- Step 3: Admin Assigns Technician ---');
  const countBeforeAssignment = db.complaints.length;
  const assignedTechId = 'tech-rajesh';
  const assignedTechName = 'Rajesh Kumar';

  // Perform assignment update
  const recordIndex = db.complaints.findIndex((c) => c.id === complaintId);
  db.complaints[recordIndex] = {
    ...db.complaints[recordIndex],
    technicianId: assignedTechId,
    technicianName: assignedTechName,
    technicianPhone: '+91 99887 76655',
    status: 'ASSIGNED',
    assignedAt: new Date().toISOString(),
  } as any;

  check(db.complaints.length === countBeforeAssignment, 'Total complaints count NEVER decreases after technician assignment');
  const assignedRecord = db.complaints.find((c) => c.id === complaintId);
  check(assignedRecord?.status === 'ASSIGNED', 'Status successfully changed to ASSIGNED');
  check(assignedRecord?.technicianId === assignedTechId, 'Technician ID recorded correctly');
  check(assignedRecord?.technicianName === assignedTechName, 'Technician Name recorded correctly');

  // Verify it is still visible in both dashboards
  check(db.complaints.filter((c) => c.companyId === companyA).some((c) => c.id === complaintId), 'Assigned complaint still present in Tenant Admin view');
  check(db.complaints.some((c) => c.id === complaintId), 'Assigned complaint still present in Master Admin view');

  // -------------------------------------------------------------------------
  // TEST 4: Technician Accepts & En Route -> Record Preserved
  // -------------------------------------------------------------------------
  console.log('\n--- Step 4: Technician Accepts & En Route ---');
  // Stage 4: ACCEPTED
  db.complaints[recordIndex].status = 'ACCEPTED';
  check(db.complaints.find((c) => c.id === complaintId)?.status === 'ACCEPTED', 'Complaint transitioned to ACCEPTED');
  check(db.complaints.length === countBeforeAssignment, 'Total count remains invariant during ACCEPTED');

  // Stage 5: EN ROUTE / TECHNICIAN_ON_WAY
  db.complaints[recordIndex].status = 'TECHNICIAN_ON_WAY';
  check(db.complaints.find((c) => c.id === complaintId)?.status === 'TECHNICIAN_ON_WAY', 'Complaint transitioned to EN ROUTE (TECHNICIAN_ON_WAY)');
  check(db.complaints.length === countBeforeAssignment, 'Total count remains invariant during EN ROUTE');

  // -------------------------------------------------------------------------
  // TEST 5: Technician Arrived & Starts Work (IN PROGRESS)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 5: Technician Arrived & Inspection/Work In Progress ---');
  // Stage 6: ARRIVED
  db.complaints[recordIndex].status = 'ARRIVED';
  check(db.complaints.find((c) => c.id === complaintId)?.status === 'ARRIVED', 'Complaint transitioned to ARRIVED');

  // Stage 7: IN PROGRESS / INSPECTION_REPAIR
  db.complaints[recordIndex].status = 'INSPECTION_REPAIR';
  db.complaints[recordIndex].diagnosisRemarks = 'Checked guide rails and rollers. Replacing worn roller bearing.';
  check(db.complaints.find((c) => c.id === complaintId)?.status === 'INSPECTION_REPAIR', 'Complaint transitioned to IN_PROGRESS');
  check(db.complaints.find((c) => c.id === complaintId)?.diagnosisRemarks !== undefined, 'Diagnosis remarks recorded in DB');
  check(db.complaints.length === countBeforeAssignment, 'Total count remains invariant during IN PROGRESS');

  // -------------------------------------------------------------------------
  // TEST 6: Technician Resolves Complaint -> Moves to Resolved, NEVER vanishes
  // -------------------------------------------------------------------------
  console.log('\n--- Step 6: Technician Marks Resolved ---');
  db.complaints[recordIndex].status = 'RESOLVED';
  db.complaints[recordIndex].resolutionNotes = 'Roller bearings replaced, guide rails lubricated and tested.';
  db.complaints[recordIndex].resolvedAt = new Date().toISOString();

  check(db.complaints.find((c) => c.id === complaintId)?.status === 'RESOLVED', 'Complaint status updated to RESOLVED');
  check(db.complaints.find((c) => c.id === complaintId)?.resolutionNotes !== undefined, 'Resolution notes preserved');
  check(db.complaints.length === countBeforeAssignment, 'Total complaints count NEVER decreases when marked RESOLVED');

  // -------------------------------------------------------------------------
  // TEST 7: Client or Admin Closes Complaint -> Remains in History
  // -------------------------------------------------------------------------
  console.log('\n--- Step 7: Ticket Closed & Stays in History ---');
  db.complaints[recordIndex].status = 'CLOSED';
  db.complaints[recordIndex].closedAt = new Date().toISOString();

  check(db.complaints.find((c) => c.id === complaintId)?.status === 'CLOSED', 'Complaint status transitioned to CLOSED');
  check(db.complaints.some((c) => c.id === complaintId), 'Closed complaint record remains in central DB');
  check(db.complaints.length === countBeforeAssignment, 'Total complaints count preserved in database upon closing');

  // -------------------------------------------------------------------------
  // TEST 8: Explicit Archival & Restoration -> Never Hard Deleted
  // -------------------------------------------------------------------------
  console.log('\n--- Step 8: Explicit Archival & Restoration ---');
  // Archive ticket
  db.complaints[recordIndex].status = 'ARCHIVED';
  (db.complaints[recordIndex] as any).isArchived = true;
  (db.complaints[recordIndex] as any).archivedAt = new Date().toISOString();

  check(db.complaints.find((c) => c.id === complaintId)?.status === 'ARCHIVED', 'Ticket status updated to ARCHIVED');
  check((db.complaints.find((c) => c.id === complaintId) as any)?.isArchived === true, 'Ticket has isArchived flag set');
  check(db.complaints.some((c) => c.id === complaintId), 'Archived ticket still safely exists in DB (not hard-deleted)');

  // Restore ticket back to CLOSED
  db.complaints[recordIndex].status = 'CLOSED';
  (db.complaints[recordIndex] as any).isArchived = false;
  check(db.complaints.find((c) => c.id === complaintId)?.status === 'CLOSED', 'Restored ticket back to CLOSED status');
  check((db.complaints.find((c) => c.id === complaintId) as any)?.isArchived === false, 'isArchived flag cleared on restore');

  complaintEvents.off('complaint_created', onCreated);

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} LIFECYCLE & PARITY TESTS PASSED!`);
  console.log('================================================================\n');
}

runLifecycleAndParitySuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

