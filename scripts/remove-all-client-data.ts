import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Permanent administrative emails that must NEVER be touched
const PROTECTED_ADMIN_EMAILS = [
  'superadmin@wepsun.com',
  'admin@wepsun.com',
  'service.manager@wepsun.com',
  'accounts@wepsun.com',
  'sales@wepsun.com',
  'gauravsaini0004@gmail.com',
  'jaiswalsumit2812@gmail.com',
];

async function removeAllClientAccountData() {
  console.log('🧹 ============================================================');
  console.log('🧹 REMOVING ALL EXISTING CLIENT ACCOUNTS & RESTARTING DATA');
  console.log('🧹 ============================================================\n');

  // 1. Find all Client Users
  const clientUsers = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      email: { notIn: PROTECTED_ADMIN_EMAILS },
    },
    select: { id: true, email: true, name: true, clientId: true },
  });

  console.log(`1. Found ${clientUsers.length} Client User account(s)`);
  for (const u of clientUsers) {
    console.log(`   - User: ${u.email} (${u.name}) [id: ${u.id}]`);
  }

  // 2. Find all Clients in client table
  const allClients = await prisma.client.findMany({
    select: { id: true, name: true, email: true, phone: true },
  });

  console.log(`\n2. Found ${allClients.length} Client record(s) in database:`);
  for (const c of allClients) {
    console.log(`   - Client: "${c.name}" | Email: ${c.email || 'N/A'} | Phone: ${c.phone} [id: ${c.id}]`);
  }

  const clientIds = allClients.map((c) => c.id);
  const clientUserIds = clientUsers.map((u) => u.id);

  // 3. Delete user sessions, tokens, feedbacks for client users
  if (clientUserIds.length > 0) {
    const delSessions = await prisma.userSession.deleteMany({
      where: { userId: { in: clientUserIds } },
    });
    console.log(`\n✓ Deleted ${delSessions.count} UserSession(s) for client users`);

    const delTokens = await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: clientUserIds } },
    });
    console.log(`✓ Deleted ${delTokens.count} PasswordResetToken(s) for client users`);

    const delFeedbacks = await prisma.customerFeedback.deleteMany({
      where: { userId: { in: clientUserIds } },
    });
    console.log(`✓ Deleted ${delFeedbacks.count} CustomerFeedback(s) by client users`);
  }

  // 4. Delete client complaints, work orders, service reports, invoices, quotations
  if (clientIds.length > 0 || clientUserIds.length > 0) {
    const compFilter = {
      OR: [
        ...(clientIds.length > 0 ? [{ clientId: { in: clientIds } }] : []),
        ...(clientUserIds.length > 0 ? [{ createdById: { in: clientUserIds } }] : []),
      ],
    };

    const delComplaints = await prisma.complaint.deleteMany({
      where: compFilter,
    });
    console.log(`✓ Deleted ${delComplaints.count} Complaint(s)`);

    const delWorkOrders = await prisma.workOrder.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delWorkOrders.count} WorkOrder(s)`);

    const delServiceReports = await prisma.serviceReport.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delServiceReports.count} ServiceReport(s)`);

    const delQuotations = await prisma.quotation.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delQuotations.count} Quotation(s)`);

    const delInvoices = await prisma.invoice.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delInvoices.count} Invoice(s)`);

    const delFeedbacks = await prisma.customerFeedback.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delFeedbacks.count} CustomerFeedback(s) for clients`);

    const delAmc = await prisma.amcContract.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delAmc.count} AMC Contract(s)`);
  }

  // 5. Delete Lifts belonging to clients
  // Find all lifts belonging to these clients or buildings
  const liftsToDelete = await prisma.lift.findMany({
    where: { clientId: { in: clientIds } },
    select: { id: true, permanentLiftId: true },
  });
  const liftIds = liftsToDelete.map((l) => l.id);

  if (liftIds.length > 0) {
    const delTokens = await prisma.qRCodeToken.deleteMany({
      where: { liftId: { in: liftIds } },
    });
    console.log(`✓ Deleted ${delTokens.count} QRCodeToken(s)`);

    const delRecs = await prisma.serviceRecord.deleteMany({
      where: { liftId: { in: liftIds } },
    });
    console.log(`✓ Deleted ${delRecs.count} ServiceRecord(s)`);

    const delPm = await prisma.pMExecution.deleteMany({
      where: { liftId: { in: liftIds } },
    });
    console.log(`✓ Deleted ${delPm.count} PMExecution(s)`);

    const delLifts = await prisma.lift.deleteMany({
      where: { id: { in: liftIds } },
    });
    console.log(`✓ Deleted ${delLifts.count} Lift record(s) (${liftsToDelete.map(l => l.permanentLiftId).join(', ')})`);
  }

  // 6. Delete Buildings belonging to clients
  if (clientIds.length > 0) {
    const delBuildings = await prisma.building.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delBuildings.count} Building(s)`);
  }

  // 7. Delete Client Users
  if (clientUserIds.length > 0) {
    const delUsers = await prisma.user.deleteMany({
      where: { id: { in: clientUserIds } },
    });
    console.log(`✓ Deleted ${delUsers.count} Client User(s)`);
  }

  // 8. Delete all Client records
  if (clientIds.length > 0) {
    const delClients = await prisma.client.deleteMany({
      where: { id: { in: clientIds } },
    });
    console.log(`✓ Deleted ${delClients.count} Client record(s)`);
  }

  // 9. Verify current database status
  console.log('\n============================================================');
  console.log('📊 DATABASE STATUS POST-CLEANUP');
  console.log('============================================================');

  const remainingClients = await prisma.client.count();
  const remainingBuildings = await prisma.building.count();
  const remainingLifts = await prisma.lift.count();
  const remainingClientUsers = await prisma.user.count({ where: { role: 'CLIENT' } });
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`Clients in DB:        ${remainingClients}`);
  console.log(`Buildings in DB:      ${remainingBuildings}`);
  console.log(`Lifts in DB:          ${remainingLifts}`);
  console.log(`Client Users in DB:   ${remainingClientUsers}`);
  console.log(`Administrative Users: ${remainingUsers.length}`);
  for (const u of remainingUsers) {
    console.log(`  - [${u.role}] ${u.email} (${u.name})`);
  }

  console.log('\n✅ All existing client account data has been completely removed!');
  console.log('Client registration can now be restarted cleanly without any conflicts.\n');

  await prisma.$disconnect();
}

removeAllClientAccountData().catch(async (err) => {
  console.error('❌ Error executing client data cleanup:', err);
  await prisma.$disconnect();
  process.exit(1);
});
