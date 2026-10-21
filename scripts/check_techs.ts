import { prisma } from '../backend/src/lib/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      technicianId: true,
      isActive: true,
      createdAt: true,
    },
  });
  console.log('=== TECHNICIAN USERS in DB ===');
  console.log(JSON.stringify(users, null, 2));

  const techs = await prisma.technician.findMany({
    select: {
      id: true,
      name: true,
      employeeCode: true,
      permanentId: true,
      accountStatus: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });
  console.log('=== TECHNICIANS in DB ===');
  console.log(JSON.stringify(techs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
