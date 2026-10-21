import { prisma } from '../backend/src/lib/prisma.js';

async function main() {
  const reports = await prisma.serviceReport.findMany({
    select: { id: true, reportNumber: true, technicianSignature: true, technicianId: true, createdAt: true }
  });
  console.log('Service reports count:', reports.length);
  console.log('Service reports:', reports);
}

main().finally(() => prisma.$disconnect());
