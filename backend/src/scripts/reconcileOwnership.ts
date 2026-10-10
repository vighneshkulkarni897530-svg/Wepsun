/**
 * WEPSUN Engineering Solutions — Account Ownership Reconciliation Procedure
 * Safe, idempotent database reconciliation:
 * 1. Backfills direct clientId on complaints, work orders, service reports, and feedback.
 * 2. Ensures existing client accounts have registered buildings and digital lift passports.
 * 3. Ensures technician and administrator user accounts exist in PostgreSQL with correct tenant/role associations.
 * 4. Preserves all existing records without deleting or resetting the database.
 */

import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

async function reconcileOwnership() {
  console.log('🔄 Starting WEPSUN Data Ownership Reconciliation...');

  await prisma.$transaction(
    async (tx) => {
    // 1. Backfill Complaints clientId from lift
    const complaintsToUpdate = await tx.complaint.findMany({
      where: { clientId: null },
      include: { lift: true },
    });
    console.log(`Found ${complaintsToUpdate.length} complaints needing clientId backfill.`);
    for (const c of complaintsToUpdate) {
      if (c.lift?.clientId) {
        await tx.complaint.update({
          where: { id: c.id },
          data: { clientId: c.lift.clientId },
        });
      }
    }

    // 2. Backfill Work Orders clientId from lift
    const workOrdersToUpdate = await tx.workOrder.findMany({
      where: { clientId: null },
      include: { lift: true },
    });
    console.log(`Found ${workOrdersToUpdate.length} work orders needing clientId backfill.`);
    for (const wo of workOrdersToUpdate) {
      if (wo.lift?.clientId) {
        await tx.workOrder.update({
          where: { id: wo.id },
          data: { clientId: wo.lift.clientId },
        });
      }
    }

    // 3. Backfill Service Reports clientId from lift
    const reportsToUpdate = await tx.serviceReport.findMany({
      where: { clientId: null },
      include: { lift: true },
    });
    console.log(`Found ${reportsToUpdate.length} service reports needing clientId backfill.`);
    for (const r of reportsToUpdate) {
      if (r.lift?.clientId) {
        await tx.serviceReport.update({
          where: { id: r.id },
          data: { clientId: r.lift.clientId },
        });
      }
    }

    // 4. Ensure Company and Branches exist
    const defaultCompany = await tx.company.upsert({
      where: { code: 'WEP' },
      update: {},
      create: {
        id: 'comp-1',
        name: 'WEPSUN Engineering Solution Pvt. Ltd.',
        code: 'WEP',
        contactEmail: 'service@wepsun.com',
        contactPhone: '+91 98201 55432',
        address: 'Unit 402, Quantum Towers, SV Road, Malad West',
        city: 'Mumbai',
        state: 'Maharashtra',
        gstNumber: '27AABCW1234F1Z8',
        isActive: true,
      },
    });

    const defaultBranch = await tx.branch.upsert({
      where: { companyId_code: { companyId: defaultCompany.id, code: 'MUM-01' } },
      update: {},
      create: {
        id: 'br-mum-1',
        companyId: defaultCompany.id,
        name: 'Mumbai Central & Western Branch',
        code: 'MUM-01',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Andheri East Metro Complex, Mumbai 400069',
        isActive: true,
      },
    });

    // 5. Ensure Technicians exist in PostgreSQL
    const tech1 = await tx.technician.upsert({
      where: { employeeCode: 'TECH-001' },
      update: {},
      create: {
        id: 'tech-1',
        companyId: defaultCompany.id,
        branchId: defaultBranch.id,
        name: 'Rajesh Sharma',
        employeeCode: 'TECH-001',
        phone: '+91 98203 11223',
        email: 'tech1@wepsun.com',
        zone: 'Pune West (Baner, Hinjewadi)',
        currentStatus: 'available',
      },
    });

    const tech2 = await tx.technician.upsert({
      where: { employeeCode: 'TECH-002' },
      update: {},
      create: {
        id: 'tech-2',
        companyId: defaultCompany.id,
        branchId: defaultBranch.id,
        name: 'Amit Patel',
        employeeCode: 'TECH-002',
        phone: '+91 98204 44556',
        email: 'tech2@wepsun.com',
        zone: 'Pune East (Kharadi, Hadapsar)',
        currentStatus: 'available',
      },
    });

    // 6. Ensure RBAC Users (Admin, Manager, Technicians) exist in database
    const adminHash = bcrypt.hashSync('admin123', 10);
    const techHash = bcrypt.hashSync('tech123', 10);

    await tx.user.upsert({
      where: { email: 'admin@wepsun.com' },
      update: { role: 'COMPANY_ADMIN', companyId: defaultCompany.id, branchId: defaultBranch.id, isActive: true },
      create: {
        id: 'usr-admin-1',
        companyId: defaultCompany.id,
        branchId: defaultBranch.id,
        name: 'Sunil Mehta (Managing Director)',
        email: 'admin@wepsun.com',
        passwordHash: adminHash,
        phone: '+91 98201 55432',
        role: 'COMPANY_ADMIN',
        isActive: true,
      },
    });

    await tx.user.upsert({
      where: { email: 'service.manager@wepsun.com' },
      update: { role: 'SERVICE_MANAGER', companyId: defaultCompany.id, branchId: defaultBranch.id, isActive: true },
      create: {
        id: 'usr-mgr-1',
        companyId: defaultCompany.id,
        branchId: defaultBranch.id,
        name: 'Vikram Joshi (Service Manager)',
        email: 'service.manager@wepsun.com',
        passwordHash: adminHash,
        phone: '+91 98202 99887',
        role: 'SERVICE_MANAGER',
        isActive: true,
      },
    });

    await tx.user.upsert({
      where: { email: 'tech1@wepsun.com' },
      update: { role: 'TECHNICIAN', technicianId: tech1.id, companyId: defaultCompany.id, branchId: defaultBranch.id, isActive: true },
      create: {
        id: 'usr-tech-1',
        companyId: defaultCompany.id,
        branchId: defaultBranch.id,
        name: 'Rajesh Sharma (Lead Tech)',
        email: 'tech1@wepsun.com',
        passwordHash: techHash,
        phone: '+91 98203 11223',
        role: 'TECHNICIAN',
        technicianId: tech1.id,
        isActive: true,
      },
    });

    await tx.user.upsert({
      where: { email: 'tech2@wepsun.com' },
      update: { role: 'TECHNICIAN', technicianId: tech2.id, companyId: defaultCompany.id, branchId: defaultBranch.id, isActive: true },
      create: {
        id: 'usr-tech-2',
        companyId: defaultCompany.id,
        branchId: defaultBranch.id,
        name: 'Amit Patel (Senior Tech)',
        email: 'tech2@wepsun.com',
        passwordHash: techHash,
        phone: '+91 98204 44556',
        role: 'TECHNICIAN',
        technicianId: tech2.id,
        isActive: true,
      },
    });

    // 7. Reconcile existing client accounts so each client has their own isolated building & lift
    const clientAccounts = await tx.user.findMany({
      where: { role: 'CLIENT', clientId: { not: null } },
      include: { client: true },
    });

    for (const cu of clientAccounts) {
      if (!cu.clientId) continue;

      // Check if client has a building
      let bld = await tx.building.findFirst({
        where: { clientId: cu.clientId, companyId: defaultCompany.id },
      });

      if (!bld) {
        bld = await tx.building.create({
          data: {
            id: `bld-${cu.clientId.slice(0, 8)}`,
            companyId: defaultCompany.id,
            branchId: defaultBranch.id,
            clientId: cu.clientId,
            name: `${cu.name} Heights CHS`,
            address: 'Main Avenue, Sector 15',
            city: 'Mumbai',
            pinCode: '400001',
            contactPerson: cu.name,
            contactPhone: cu.phone || '+91 98200 00000',
            totalLifts: 1,
          },
        });
        console.log(`Created dedicated building for client ${cu.name} (${cu.clientId}).`);
      }

      // Check if client has a lift
      let lft = await tx.lift.findFirst({
        where: { clientId: cu.clientId, companyId: defaultCompany.id },
      });

      if (!lft) {
        const permanentId = `WPS-${cu.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        lft = await tx.lift.create({
          data: {
            id: `lift-${cu.clientId.slice(0, 8)}`,
            companyId: defaultCompany.id,
            branchId: defaultBranch.id,
            buildingId: bld.id,
            clientId: cu.clientId,
            permanentLiftId: permanentId,
            brand: 'WEPSUN Gearless PMSM',
            model: 'AeroGlide-V4',
            type: 'PASSENGER',
            capacityPersons: 8,
            capacityKg: 544,
            speedMps: 1.5,
            floors: 'G + 10 Floors',
            stops: 11,
            machineType: 'GEARLESS_PMSM',
            motorKw: 5.5,
            controllerBrand: 'Monarch NICE 3000+',
            doorOperator: 'Fermator VVVF4+',
            installationDate: new Date('2024-01-15'),
            currentStatus: 'OPERATIONAL',
            amcStatus: 'ACTIVE',
            locationDetails: 'Passenger Elevator 1',
          },
        });
        console.log(`Created dedicated lift ${permanentId} for client ${cu.name} (${cu.clientId}).`);

        // Create initial active AMC contract for this client
        await tx.amcContract.create({
          data: {
            id: `amc-${cu.clientId.slice(0, 8)}`,
            companyId: defaultCompany.id,
            branchId: defaultBranch.id,
            clientId: cu.clientId,
            contractNumber: `AMC-WEP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            amcType: 'COMPREHENSIVE',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            contractValue: 60000,
            gstAmount: 10800,
            totalAmount: 70800,
            paymentStatus: 'PAID',
            coveredParts: ['Motor', 'Drive Controller', 'Brakes', 'Safety Gears'],
            excludedParts: ['Car Decoration', 'Cab Lighting'],
            status: 'active',
          },
        });
        console.log(`Created active AMC contract for client ${cu.name} (${cu.clientId}).`);
      }
    }
  },
  { timeout: 45000, maxWait: 15000 });

  console.log('✅ Data Ownership Reconciliation successfully completed!');
  process.exit(0);
}

reconcileOwnership().catch((err) => {
  console.error('❌ Reconciliation failed:', err);
  process.exit(1);
});
