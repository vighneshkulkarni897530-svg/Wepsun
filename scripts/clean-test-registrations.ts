import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of permanent administrative emails that MUST NEVER be deleted
const PROTECTED_ADMIN_EMAILS = [
  'superadmin@wepsun.com',
  'admin@wepsun.com',
  'service.manager@wepsun.com',
  'accounts@wepsun.com',
  'sales@wepsun.com',
  'gauravsaini0004@gmail.com',
  'jaiswalsumit2812@gmail.com',
];

async function cleanTestRegistrations() {
  console.log('🧹 Starting cleanup of Client & Technician test registration accounts...\n');

  // 1. Find all Client users to remove (all users with role === 'CLIENT', protecting system admins)
  const clientUsers = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      email: { notIn: PROTECTED_ADMIN_EMAILS },
    },
    select: { id: true, email: true, name: true, clientId: true },
  });

  console.log(`Found ${clientUsers.length} Client account(s) to remove:`);
  for (const cu of clientUsers) {
    console.log(`  - [CLIENT] ${cu.email} (${cu.name}) id=${cu.id}`);
  }

  // 2. Find all Technician users to remove
  const techUsers = await prisma.user.findMany({
    where: {
      role: 'TECHNICIAN',
      email: { notIn: PROTECTED_ADMIN_EMAILS },
    },
    select: { id: true, email: true, name: true, technicianId: true },
  });

  console.log(`\nFound ${techUsers.length} Technician user account(s) to remove:`);
  for (const tu of techUsers) {
    console.log(`  - [TECH USER] ${tu.email} (${tu.name}) id=${tu.id}`);
  }

  // 3. Find all Technicians in the technician table to remove (all test/pending technicians)
  const technicians = await prisma.technician.findMany({
    where: {
      email: { notIn: PROTECTED_ADMIN_EMAILS },
    },
    select: { id: true, email: true, name: true, accountStatus: true },
  });

  console.log(`\nFound ${technicians.length} Technician record(s) to remove:`);
  for (const t of technicians) {
    console.log(`  - [TECHNICIAN] ${t.email} (${t.name}) status=${t.accountStatus}`);
  }

  const userIdsToDelete = [...clientUsers.map((u) => u.id), ...techUsers.map((u) => u.id)];
  const techIdsToDelete = technicians.map((t) => t.id);
  const clientRecordIds = clientUsers.map((u) => u.clientId).filter(Boolean) as string[];

  // Step A: Delete UserSessions for these users
  if (userIdsToDelete.length > 0) {
    const deletedSessions = await prisma.userSession.deleteMany({
      where: { userId: { in: userIdsToDelete } },
    });
    console.log(`\n✓ Deleted ${deletedSessions.count} UserSession(s)`);

    // Step B: Delete PasswordResetTokens
    const deletedResetTokens = await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: userIdsToDelete } },
    });
    console.log(`✓ Deleted ${deletedResetTokens.count} PasswordResetToken(s)`);

    // Step C: Delete CustomerFeedback created by these users
    const deletedFeedbacks = await prisma.customerFeedback.deleteMany({
      where: { userId: { in: userIdsToDelete } },
    });
    console.log(`✓ Deleted ${deletedFeedbacks.count} CustomerFeedback(s)`);

    // Step D: Delete or nullify Complaints created by these users
    // First, delete complaints without child service reports, or delete child service reports
    const userComplaints = await prisma.complaint.findMany({
      where: { createdById: { in: userIdsToDelete } },
      select: { id: true },
    });
    const complaintIds = userComplaints.map((c) => c.id);

    if (complaintIds.length > 0) {
      await prisma.complaint.deleteMany({
        where: { id: { in: complaintIds } },
      });
      console.log(`✓ Cleared ${complaintIds.length} Complaint(s) created by test clients`);
    }

    // Step E: Unassign any complaints or work orders assigned to these technicians
    if (techIdsToDelete.length > 0) {
      await prisma.complaint.updateMany({
        where: { assignedTechnicianId: { in: techIdsToDelete } },
        data: { assignedTechnicianId: null, status: 'NEW' },
      });
      await prisma.workOrder.updateMany({
        where: { technicianId: { in: techIdsToDelete } },
        data: { technicianId: null },
      });
      console.log(`✓ Unassigned test technicians from complaints & work orders`);
    }

    // Step F: Delete the User records
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIdsToDelete } },
    });
    console.log(`✓ Deleted ${deletedUsers.count} User record(s)`);
  }

  // Step G: Delete the Technician records
  if (techIdsToDelete.length > 0) {
    const deletedTechs = await prisma.technician.deleteMany({
      where: { id: { in: techIdsToDelete } },
    });
    console.log(`✓ Deleted ${deletedTechs.count} Technician record(s)`);
  }

  // Step H: Delete dynamic self-registered Client records and test equipment
  const allTestClients = await prisma.client.findMany({
    where: { id: { notIn: ['client-1', 'client-2'] } },
    select: { id: true, name: true, email: true },
  });

  if (allTestClients.length > 0) {
    const tIds = allTestClients.map(c => c.id);
    await prisma.qRCodeToken.deleteMany({ where: { lift: { clientId: { in: tIds } } } });
    await prisma.serviceRecord.deleteMany({ where: { lift: { clientId: { in: tIds } } } });
    await prisma.pMExecution.deleteMany({ where: { lift: { clientId: { in: tIds } } } });
    await prisma.lift.deleteMany({ where: { clientId: { in: tIds } } });
    await prisma.building.deleteMany({ where: { clientId: { in: tIds } } });
    const delClients = await prisma.client.deleteMany({ where: { id: { in: tIds } } });
    console.log(`✓ Deleted ${delClients.count} test Client record(s) and their associated equipment`);
  }

  console.log('\n============================================================');
  console.log('✅ ALL TEST CLIENT & TECHNICIAN ACCOUNTS SUCCESSFULLY REMOVED');
  console.log('============================================================');

  // Print remaining active accounts
  const remaining = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(`\nRemaining Administrative Accounts (${remaining.length}):`);
  for (const r of remaining) {
    console.log(`  - [${r.role}] ${r.email} (${r.name})`);
  }

  await prisma.$disconnect();
}

cleanTestRegistrations().catch(async (e) => {
  console.error('Error during cleanup:', e);
  await prisma.$disconnect();
  process.exit(1);
});
