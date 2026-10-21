import { prisma } from '../backend/src/lib/prisma.js';

async function main() {
  console.log('🧹 Cleaning demo technician accounts from PostgreSQL database...');

  // 1. Unlink references in complaints, work orders, inventory movements
  const demoTechIds = ['tech-1', 'tech-2'];

  for (const techId of demoTechIds) {
    const compUpdated = await prisma.complaint.updateMany({
      where: { assignedTechnicianId: techId },
      data: { assignedTechnicianId: null, technicianEta: null },
    });
    console.log(`Unlinked ${compUpdated.count} complaints from ${techId}`);

    const woUpdated = await prisma.workOrder.updateMany({
      where: { technicianId: techId },
      data: { technicianId: null },
    });
    console.log(`Unlinked ${woUpdated.count} work orders from ${techId}`);

    const movUpdated = await prisma.inventoryMovement.updateMany({
      where: { technicianId: techId },
      data: { technicianId: null },
    });
    console.log(`Unlinked ${movUpdated.count} inventory movements from ${techId}`);

    const srUpdated = await prisma.serviceRecord.updateMany({
      where: { technicianId: techId },
      data: { technicianId: null },
    });
    console.log(`Unlinked ${srUpdated.count} service records from ${techId}`);

    // Delete demo/test service reports attached to demo tech
    const repDeleted = await prisma.serviceReport.deleteMany({
      where: { technicianId: techId },
    });
    console.log(`Deleted ${repDeleted.count} demo service reports for ${techId}`);

    // Delete GPS checkins if any
    try {
      const gpsDeleted = await prisma.gPSCheckIn.deleteMany({
        where: { technicianId: techId },
      });
      console.log(`Deleted ${gpsDeleted.count} GPS check-ins for ${techId}`);
    } catch {}

    // Delete PM executions if any
    try {
      const pmDeleted = await prisma.pMExecution.deleteMany({
        where: { technicianId: techId },
      });
      console.log(`Deleted ${pmDeleted.count} PM executions for ${techId}`);
    } catch {}

    // Delete user sessions for linked users
    const usersWithTech = await prisma.user.findMany({
      where: { technicianId: techId },
    });
    for (const u of usersWithTech) {
      await prisma.userSession.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`Deleted user ${u.email} (${u.id}) linked to ${techId}`);
    }

    // Finally delete the demo technician record
    const deletedTech = await prisma.technician.deleteMany({
      where: { id: techId },
    });
    console.log(`Deleted technician record ${techId}: count = ${deletedTech.count}`);
  }

  // Also remove any demo technician users not linked to a technician ID (e.g. inactive@wepsun.com)
  const otherDemoUsers = ['tech1@wepsun.com', 'inactive@wepsun.com', 'rajesh.sharma@wepsun.com', 'amit.patel@wepsun.com'];
  for (const email of otherDemoUsers) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.userSession.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
      console.log(`Deleted demo user ${email}`);
    }
  }

  // Check remaining technicians and users
  const remainingTechs = await prisma.technician.findMany({
    select: { id: true, name: true, email: true, employeeCode: true, permanentId: true, accountStatus: true },
  });
  console.log('\n✅ Remaining Technicians in DB:');
  console.log(JSON.stringify(remainingTechs, null, 2));

  const remainingTechUsers = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: { id: true, name: true, email: true, technicianId: true, isActive: true },
  });
  console.log('\n✅ Remaining Technician Users in DB:');
  console.log(JSON.stringify(remainingTechUsers, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
