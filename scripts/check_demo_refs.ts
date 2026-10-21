import { prisma } from '../backend/src/lib/prisma.js';

async function main() {
  console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  const demoIds = ['tech-1', 'tech-2'];
  for (const id of demoIds) {
    const tech = await prisma.technician.findUnique({ where: { id } });
    if (!tech) {
      console.log(`Technician ${id} not found in DB`);
      continue;
    }
    console.log(`Checking relations for ${id} (${tech.name}):`);
    const serviceReports = await prisma.serviceReport.count({ where: { technicianId: id } });
    const complaints = await prisma.complaint.count({ where: { assignedTechnicianId: id } });
    const workOrders = await prisma.workOrder.count({ where: { technicianId: id } });
    const users = await prisma.user.count({ where: { technicianId: id } });
    const movements = await prisma.inventoryMovement.count({ where: { technicianId: id } });
    console.log({
      id,
      serviceReports,
      complaints,
      workOrders,
      users,
      movements,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
