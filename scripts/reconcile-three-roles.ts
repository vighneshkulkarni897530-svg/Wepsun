import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  console.log('🚀 Starting Three-Role Reconciliation for WEPSUN Engineering Solution...');

  // 1. Ensure comp-1 company exists
  const comp1 = await prisma.company.upsert({
    where: { id: 'comp-1' },
    create: {
      id: 'comp-1',
      name: 'WEPSUN Engineering Solution Pvt. Ltd.',
      code: 'WEP',
      registrationNumber: 'U29100MH2018PTC318920',
      contactEmail: 'service@wepsun.com',
      contactPhone: '+91 85959 40077',
      address: 'Unit 402, Quantum Towers, SV Road, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstNumber: '27AABCW1234F1Z8',
      isActive: true,
    },
    update: {
      name: 'WEPSUN Engineering Solution Pvt. Ltd.',
      isActive: true,
    },
  });
  console.log(`✅ Company verified: ${comp1.name} (${comp1.id})`);

  // 2. Ensure branches exist
  const branchMum = await prisma.branch.upsert({
    where: { id: 'br-mum-1' },
    create: {
      id: 'br-mum-1',
      companyId: 'comp-1',
      name: 'Mumbai Central & Western Branch',
      code: 'MUM-01',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Andheri East, Metro Station Complex, Mumbai 400069',
      contactPerson: 'Sanjay Deshmukh',
      contactPhone: '+91 98202 88765',
      contactEmail: 'mumbai.service@wepsun.com',
      isActive: true,
    },
    update: {
      companyId: 'comp-1',
      isActive: true,
    },
  });
  console.log(`✅ Branch verified: ${branchMum.name} (${branchMum.id})`);

  const branchThn = await prisma.branch.upsert({
    where: { id: 'br-thn-1' },
    create: {
      id: 'br-thn-1',
      companyId: 'comp-1',
      name: 'Thane & Navi Mumbai Branch',
      code: 'THN-01',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      address: 'Sector 19, Vashi, Navi Mumbai 400703',
      contactPerson: 'Prakash Kadam',
      contactPhone: '+91 98205 33441',
      contactEmail: 'vashi.service@wepsun.com',
      isActive: true,
    },
    update: {
      companyId: 'comp-1',
      isActive: true,
    },
  });
  console.log(`✅ Branch verified: ${branchThn.name} (${branchThn.id})`);

  // 3. Ensure canonical client 'client-1' exists
  const client1 = await prisma.client.upsert({
    where: { id: 'client-1' },
    create: {
      id: 'client-1',
      companyId: 'comp-1',
      name: 'Greenwood Heights Co-op Housing Society Ltd.',
      contactPerson: 'Society Secretary',
      email: 'client@wepsun.com',
      phone: '+91 98210 99881',
      billingAddress: 'Palm Beach Road, Sector 19, Vashi, Navi Mumbai',
    },
    update: {
      companyId: 'comp-1',
    },
  });
  console.log(`✅ Canonical Client verified: ${client1.name} (${client1.id})`);

  // 4. Ensure canonical building 'bld-1' exists
  const bld1 = await prisma.building.upsert({
    where: { id: 'bld-1' },
    create: {
      id: 'bld-1',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      clientId: 'client-1',
      name: 'Greenwood Heights CHS',
      address: 'Palm Beach Road, Sector 19, Vashi',
      city: 'Navi Mumbai',
      pinCode: '400703',
      contactPerson: 'Society Manager',
      contactPhone: '+91 98200 12345',
      totalLifts: 4,
    },
    update: {
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      clientId: 'client-1',
    },
  });
  console.log(`✅ Canonical Building verified: ${bld1.name} (${bld1.id})`);

  // 5. Ensure canonical Technicians exist in PostgreSQL
  const canonicalTechs = [
    {
      id: 'tech-rohan',
      name: 'Rohan Gaikwad',
      employeeCode: 'TECH-WPS-012',
      phone: '+91 98203 44556',
      email: 'rohan.tech@wepsun.com',
      zone: 'Mumbai Suburban / Navi Mumbai',
      accountStatus: 'APPROVED' as const,
      companyId: 'comp-1',
      branchId: 'br-mum-1',
    },
    {
      id: 'tech-1',
      name: 'Rajesh Sharma',
      employeeCode: 'TECH-001',
      phone: '+91 98201 11222',
      email: 'rajesh.tech@wepsun.com',
      zone: 'Mumbai Western Suburbs',
      accountStatus: 'APPROVED' as const,
      companyId: 'comp-1',
      branchId: 'br-mum-1',
    },
    {
      id: 'tech-2',
      name: 'Amit Patel',
      employeeCode: 'TECH-002',
      phone: '+91 98202 33444',
      email: 'amit.tech@wepsun.com',
      zone: 'Navi Mumbai Central',
      accountStatus: 'APPROVED' as const,
      companyId: 'comp-1',
      branchId: 'br-thn-1',
    },
  ];

  for (const t of canonicalTechs) {
    const tech = await prisma.technician.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        name: t.name,
        employeeCode: t.employeeCode,
        phone: t.phone,
        email: t.email,
        zone: t.zone,
        accountStatus: t.accountStatus,
        companyId: t.companyId,
        branchId: t.branchId,
      },
      update: {
        name: t.name,
        employeeCode: t.employeeCode,
        phone: t.phone,
        email: t.email,
        accountStatus: t.accountStatus,
        companyId: t.companyId,
        branchId: t.branchId,
      },
    });
    console.log(`✅ Technician verified: ${tech.name} (${tech.id}, ${tech.employeeCode})`);
  }

  // 6. Ensure Technician Users exist in PostgreSQL
  const hashedPassword = await bcrypt.hash('password123', 10);
  const techUsers = [
    {
      id: 'usr-tech-rohan',
      email: 'rohan.tech@wepsun.com',
      name: 'Rohan Gaikwad (Field Technician)',
      phone: '+91 98203 44556',
      role: 'TECHNICIAN' as const,
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      technicianId: 'tech-rohan',
    },
    {
      id: 'usr-tech-1',
      email: 'tech1@wepsun.com',
      name: 'Rajesh Sharma (Lead Technician)',
      phone: '+91 98201 11222',
      role: 'TECHNICIAN' as const,
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      technicianId: 'tech-1',
    },
  ];

  for (const tu of techUsers) {
    const user = await prisma.user.upsert({
      where: { email: tu.email },
      create: {
        id: tu.id,
        email: tu.email,
        passwordHash: hashedPassword,
        name: tu.name,
        phone: tu.phone,
        role: tu.role,
        companyId: tu.companyId,
        branchId: tu.branchId,
        technicianId: tu.technicianId,
        isActive: true,
      },
      update: {
        name: tu.name,
        role: tu.role,
        companyId: tu.companyId,
        branchId: tu.branchId,
        technicianId: tu.technicianId,
        isActive: true,
      },
    });
    console.log(`✅ Technician User verified: ${user.name} (${user.email}) -> techId: ${user.technicianId}`);
  }

  // 7. Ensure standard lifts exist in PostgreSQL
  const standardLifts = [
    {
      id: 'lift-traction',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      buildingId: 'bld-1',
      clientId: 'client-1',
      permanentLiftId: 'LIFT-TRAC-01',
      brand: 'WEPSUN Gearless PMSM',
      model: 'AeroGlide-V3',
      type: 'PASSENGER' as const,
      capacityPersons: 10,
      capacityKg: 680,
      speedMps: 1.5,
      floors: 'G + 14 Floors',
      stops: 15,
      controllerBrand: 'Monarch NICE 3000+',
      doorOperator: 'Fermator VVVF4+',
      installationDate: new Date('2024-01-15T00:00:00.000Z'),
      currentStatus: 'OPERATIONAL' as const,
      locationDetails: 'Traction Lift - Wing A',
    },
    {
      id: 'lift-machine-room',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      buildingId: 'bld-1',
      clientId: 'client-1',
      permanentLiftId: 'LIFT-MR-01',
      brand: 'WEPSUN Geared Traction',
      model: 'SkyHigh-Pro',
      type: 'PASSENGER' as const,
      capacityPersons: 8,
      capacityKg: 544,
      speedMps: 1.0,
      floors: 'G + 12 Floors',
      stops: 13,
      controllerBrand: 'Step F5021',
      doorOperator: 'Wittur Hydra',
      installationDate: new Date('2023-06-10T00:00:00.000Z'),
      currentStatus: 'OPERATIONAL' as const,
      locationDetails: 'Machine Room Lift - Wing B',
    },
    {
      id: 'lift-machine-roomless',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      buildingId: 'bld-1',
      clientId: 'client-1',
      permanentLiftId: 'LIFT-MRL-01',
      brand: 'WEPSUN EcoSilent MRL',
      model: 'EcoGlide-200',
      type: 'PASSENGER' as const,
      capacityPersons: 8,
      capacityKg: 544,
      speedMps: 1.0,
      floors: 'G + 10 Floors',
      stops: 11,
      controllerBrand: 'Monarch NICE 1000+',
      doorOperator: 'Fermator VVVF4+',
      installationDate: new Date('2024-03-22T00:00:00.000Z'),
      currentStatus: 'OPERATIONAL' as const,
      locationDetails: 'Machine Roomless - Wing C',
    },
    {
      id: 'lift-goods',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      buildingId: 'bld-1',
      clientId: 'client-1',
      permanentLiftId: 'LIFT-GOODS-01',
      brand: 'WEPSUN Heavy Duty Freight',
      model: 'CargoMaster-Pro',
      type: 'FREIGHT_GOODS' as const,
      capacityPersons: 15,
      capacityKg: 1020,
      speedMps: 0.75,
      floors: 'B + G + 14 Floors',
      stops: 16,
      controllerBrand: 'Step F5021',
      doorOperator: 'Wittur Hydra Heavy',
      installationDate: new Date('2023-11-05T00:00:00.000Z'),
      currentStatus: 'OPERATIONAL' as const,
      locationDetails: 'Goods Lift - Service Core',
    },
  ];

  for (const sl of standardLifts) {
    const l = await prisma.lift.upsert({
      where: { id: sl.id },
      create: sl,
      update: {
        companyId: sl.companyId,
        branchId: sl.branchId,
        buildingId: sl.buildingId,
        clientId: sl.clientId,
        permanentLiftId: sl.permanentLiftId,
        brand: sl.brand,
        model: sl.model,
        type: sl.type,
      },
    });
    console.log(`✅ Standard Lift verified: ${l.permanentLiftId} (${l.id})`);
  }

  // 8. Reconcile stranded records: Migrate comp-self-* to comp-1
  console.log('🔄 Reconciling all stranded comp-self-* records to comp-1...');

  const userMigration = await prisma.user.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Migrated ${userMigration.count} users to comp-1`);

  const clientMigration = await prisma.client.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1' },
  });
  console.log(`  -> Migrated ${clientMigration.count} clients to comp-1`);

  const buildingMigration = await prisma.building.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Migrated ${buildingMigration.count} buildings to comp-1`);

  const liftMigration = await prisma.lift.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Migrated ${liftMigration.count} lifts to comp-1`);

  const complaintMigration = await prisma.complaint.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Migrated ${complaintMigration.count} complaints to comp-1`);

  const workOrderMigration = await prisma.workOrder.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Migrated ${workOrderMigration.count} work orders to comp-1`);

  const serviceReportMigration = await prisma.serviceReport.updateMany({
    where: { companyId: { startsWith: 'comp-self' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Migrated ${serviceReportMigration.count} service reports to comp-1`);

  // Also reconcile all existing technicians to comp-1
  const techMigration = await prisma.technician.updateMany({
    where: { companyId: { not: 'comp-1' } },
    data: { companyId: 'comp-1', branchId: 'br-mum-1' },
  });
  console.log(`  -> Reconciled ${techMigration.count} non-comp-1 technicians to comp-1`);

  // 9. Fix any orphan assignedTechnicianId on complaints
  const allTechs = await prisma.technician.findMany({ select: { id: true } });
  const validTechIds = new Set(allTechs.map((t) => t.id));

  const complaintsWithTech = await prisma.complaint.findMany({
    where: { assignedTechnicianId: { not: null } },
    select: { id: true, assignedTechnicianId: true },
  });

  let fixedFkCount = 0;
  for (const c of complaintsWithTech) {
    if (c.assignedTechnicianId && !validTechIds.has(c.assignedTechnicianId)) {
      await prisma.complaint.update({
        where: { id: c.id },
        data: { assignedTechnicianId: 'tech-rohan', assignedTechnicianName: 'Rohan Gaikwad' },
      });
      fixedFkCount++;
    }
  }
  console.log(`  -> Fixed ${fixedFkCount} complaints with invalid assignedTechnicianId to tech-rohan`);

  console.log('🎉 Three-Role Database Reconciliation completed successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Reconciliation failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
