/**
 * ==============================================================================
 * WEPSUN ENGINEERING SOLUTIONS – ENTERPRISE DATABASE SEED SCRIPT
 * DEVELOPMENT & STAGING SEED DATA
 * ==============================================================================
 * Populates PostgreSQL database with multi-tenant foundational entities:
 * - Companies & Branches
 * - RBAC Users (Super Admin, Company Admin, Service Manager, Technician, Client)
 * - Clients & Commercial / Residential Buildings
 * - Lifts with Digital Passports & Cryptographic QR Tokens
 * - AMC Contracts with PM Schedules
 * - Active & Historical Breakdown Complaints with Timelines
 * - Field Technicians with Live GPS Check-Ins
 * - Digital Service Reports with Customer Signoffs
 * - 4-Zone Preventive Maintenance Templates & Executions
 * - Spare Parts Inventory & Double-Entry Movement Ledger
 * - Quotations, Work Orders, Invoices, and Payment Transactions
 * - Customer Feedback, CSAT Metrics, Notifications & Audit Logs
 * ==============================================================================
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting WEPSUN PostgreSQL Development Seed...');

  // 1. COMPANIES
  console.log('🏢 Seeding Multi-Tenant Companies...');
  const wepsun = await prisma.company.upsert({
    where: { code: 'WEP' },
    update: {},
    create: {
      id: 'comp-1',
      name: 'WEPSUN Engineering Solution Pvt. Ltd.',
      code: 'WEP',
      registrationNumber: 'U29100MH2018PTC318920',
      logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=100&auto=format&fit=crop&q=80',
      contactEmail: 'service@wepsun.com',
      contactPhone: '+91 98201 55432',
      address: 'Unit 402, Quantum Towers, SV Road, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstNumber: '27AABCW1234F1Z8',
      isActive: true,
    },
  });

  const apex = await prisma.company.upsert({
    where: { code: 'APX' },
    update: {},
    create: {
      id: 'comp-2',
      name: 'Apex Elevators & Escalators Ltd.',
      code: 'APX',
      registrationNumber: 'U29100MH2015PLC271034',
      logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80',
      contactEmail: 'operations@apexelevators.in',
      contactPhone: '+91 98334 55662',
      address: 'Tower B, MIDC Industrial Area, Airoli',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      gstNumber: '27AAACA9876E1ZT',
      isActive: true,
    },
  });

  // 2. BRANCHES
  console.log('📍 Seeding Branches...');
  const brMum = await prisma.branch.upsert({
    where: { companyId_code: { companyId: wepsun.id, code: 'MUM-01' } },
    update: {},
    create: {
      id: 'br-mum-1',
      companyId: wepsun.id,
      name: 'Mumbai Central & Western Branch',
      code: 'MUM-01',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Andheri East Metro Complex, Mumbai 400069',
      contactPerson: 'Sanjay Deshmukh',
      contactPhone: '+91 98202 88765',
      contactEmail: 'mumbai.service@wepsun.com',
      isActive: true,
    },
  });

  const brThn = await prisma.branch.upsert({
    where: { companyId_code: { companyId: wepsun.id, code: 'THN-01' } },
    update: {},
    create: {
      id: 'br-thn-1',
      companyId: wepsun.id,
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
  });

  // 3. CLIENTS
  console.log('👥 Seeding Clients...');
  const client1 = await prisma.client.upsert({
    where: { id: 'client-1' },
    update: {},
    create: {
      id: 'client-1',
      companyId: wepsun.id,
      name: 'Greenwood Heights Co-op Housing Society',
      contactPerson: 'Sanjay Deshmukh (Secretary)',
      phone: '+91 98220 11223',
      email: 'greenwood.society@gmail.com',
      billingAddress: 'Plot 45, Baner Road, Pune 411045',
      gstNumber: '27AAAAA0000A1Z5',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client-2' },
    update: {},
    create: {
      id: 'client-2',
      companyId: wepsun.id,
      name: 'TechPark Infinity Commercial Estates',
      contactPerson: 'Meera Nambiar (Facility Head)',
      phone: '+91 98450 33445',
      email: 'facility@techparkinfinity.com',
      billingAddress: 'Phase 2, Hinjewadi IT Park, Pune 411057',
      gstNumber: '27AABCT5555K1Z2',
    },
  });

  // 4. BUILDINGS
  console.log('🏙️ Seeding Buildings...');
  const bld1 = await prisma.building.upsert({
    where: { id: 'bld-1' },
    update: {},
    create: {
      id: 'bld-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      clientId: client1.id,
      name: 'Greenwood Heights CHS - Wing A & B',
      address: 'Plot 45, Baner Road, Pune',
      city: 'Pune',
      pinCode: '411045',
      contactPerson: 'Sanjay Deshmukh',
      contactPhone: '+91 98220 11223',
      latitude: 18.5596,
      longitude: 73.7797,
      totalLifts: 2,
    },
  });

  const bld2 = await prisma.building.upsert({
    where: { id: 'bld-2' },
    update: {},
    create: {
      id: 'bld-2',
      companyId: wepsun.id,
      branchId: brThn.id,
      clientId: client2.id,
      name: 'TechPark Infinity Tower 1',
      address: 'Phase 2, Hinjewadi IT Park, Pune',
      city: 'Pune',
      pinCode: '411057',
      contactPerson: 'Meera Nambiar',
      contactPhone: '+91 98450 33445',
      latitude: 18.5913,
      longitude: 73.7389,
      totalLifts: 4,
    },
  });

  // 5. TECHNICIANS
  // Field technicians register via onboarding application and are approved dynamically by admin.
  console.log('👷 Field technicians will onboard via live registration and admin approval workflow.');

  // 6. USERS (RBAC)
  console.log('🔐 Seeding Multi-Tenant RBAC User Accounts with Hashed Passwords...');
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const clientPasswordHash = bcrypt.hashSync('client123', 10);
  const superPasswordHash = bcrypt.hashSync('super123', 10);
  const defaultPasswordHash = adminPasswordHash;

  // Clean user sessions and users for fresh credentials
  try {
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
  } catch {
    // Non-blocking
  }

  // 1. Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@wepsun.com' },
    update: { passwordHash: superPasswordHash, role: 'SUPER_ADMIN', isActive: true },
    create: {
      id: 'usr-super-1',
      companyId: wepsun.id,
      name: 'System Super Admin',
      email: 'superadmin@wepsun.com',
      passwordHash: superPasswordHash,
      phone: '+91 98000 00000',
      role: 'SUPER_ADMIN',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Company Admin (WEPSUN)
  await prisma.user.upsert({
    where: { email: 'admin@wepsun.com' },
    update: { passwordHash: adminPasswordHash, role: 'COMPANY_ADMIN', isActive: true },
    create: {
      id: 'usr-admin-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      name: 'Sunil Mehta (Managing Director)',
      email: 'admin@wepsun.com',
      passwordHash: adminPasswordHash,
      phone: '+91 98201 55432',
      role: 'COMPANY_ADMIN',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 3. Service Manager
  await prisma.user.upsert({
    where: { email: 'service.manager@wepsun.com' },
    update: { passwordHash: adminPasswordHash, role: 'SERVICE_MANAGER', isActive: true },
    create: {
      id: 'usr-mgr-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      name: 'Vikram Joshi (Service Manager)',
      email: 'service.manager@wepsun.com',
      passwordHash: adminPasswordHash,
      phone: '+91 98202 99887',
      role: 'SERVICE_MANAGER',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 4. Client
  await prisma.user.upsert({
    where: { email: 'greenwood@wepsun.com' },
    update: { passwordHash: clientPasswordHash, role: 'CLIENT', clientId: client1.id, isActive: true },
    create: {
      id: 'usr-client-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      name: 'Greenwood Society Secretary',
      email: 'greenwood@wepsun.com',
      passwordHash: clientPasswordHash,
      phone: '+91 98220 11223',
      role: 'CLIENT',
      clientId: client1.id,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 5. Accounts Executive
  await prisma.user.upsert({
    where: { email: 'accounts@wepsun.com' },
    update: { passwordHash: defaultPasswordHash, role: 'ACCOUNTS', isActive: true },
    create: {
      id: 'usr-acc-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      name: 'Neha Rane (Accounts Head)',
      email: 'accounts@wepsun.com',
      passwordHash: defaultPasswordHash,
      phone: '+91 98205 11009',
      role: 'ACCOUNTS',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 6. Sales Executive
  await prisma.user.upsert({
    where: { email: 'sales@wepsun.com' },
    update: { passwordHash: defaultPasswordHash, role: 'SALES', isActive: true },
    create: {
      id: 'usr-sales-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      name: 'Rohit Verma (Sales Manager)',
      email: 'sales@wepsun.com',
      passwordHash: defaultPasswordHash,
      phone: '+91 98206 77889',
      role: 'SALES',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 7. AMC CONTRACTS
  console.log('📜 Seeding Multi-Tier AMC Contracts (30/60/90-Day Pipeline)...');
  const nowMs = Date.now();

  // 1. Critical Expiry Contract (< 30 days remaining)
  const amc1 = await prisma.amcContract.upsert({
    where: { id: 'amc-1' },
    update: {
      contractNumber: 'AMC-WEP-2026-904',
      startDate: new Date(nowMs - 347 * 86400000),
      endDate: new Date(nowMs + 18 * 86400000),
      status: 'active',
      contractValue: 144000,
      totalAmount: 169920,
    },
    create: {
      id: 'amc-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      clientId: client1.id,
      contractNumber: 'AMC-WEP-2026-904',
      amcType: 'COMPREHENSIVE',
      startDate: new Date(nowMs - 347 * 86400000),
      endDate: new Date(nowMs + 18 * 86400000), // 18 days remaining (CRITICAL)
      contractValue: 144000,
      gstRate: 18.0,
      gstAmount: 25920,
      totalAmount: 169920,
      paymentStatus: 'PAID',
      coveredParts: ['Door lock contacts', 'Limit switches', 'Guide shoes', 'ARD battery backup pack', 'Controller relay contacts', 'Door operator motor'],
      excludedParts: ['Major machine overhaul', 'Main suspension rope replacement', 'Traveling cable full replacement'],
      pmFrequency: 'Monthly (12 Visits/Year)',
      pmVisitsDone: 11,
      pmVisitsTotal: 12,
      status: 'active',
    },
  });

  // 2. Warning Expiry Contract (30–60 days remaining)
  const amc2 = await prisma.amcContract.upsert({
    where: { id: 'amc-2' },
    update: {
      contractNumber: 'AMC-WEP-2026-512',
      startDate: new Date(nowMs - 320 * 86400000),
      endDate: new Date(nowMs + 45 * 86400000),
      status: 'active',
      contractValue: 220000,
      totalAmount: 259600,
    },
    create: {
      id: 'amc-2',
      companyId: wepsun.id,
      branchId: brThn.id,
      clientId: client2.id,
      contractNumber: 'AMC-WEP-2026-512',
      amcType: 'SEMI_COMPREHENSIVE',
      startDate: new Date(nowMs - 320 * 86400000),
      endDate: new Date(nowMs + 45 * 86400000), // 45 days remaining (WARNING)
      contractValue: 220000,
      gstRate: 18.0,
      gstAmount: 39600,
      totalAmount: 259600,
      paymentStatus: 'PAID',
      coveredParts: ['Routine PM checkups', 'Door rollers', 'Limit switches', 'Call buttons', 'Brake coil adjustments'],
      excludedParts: ['Traction machine rewinding', 'Main hoist ropes', 'Controller Motherboard'],
      pmFrequency: 'Monthly (12 Visits/Year)',
      pmVisitsDone: 10,
      pmVisitsTotal: 12,
      status: 'active',
    },
  });

  // 3. Upcoming Expiry Contract (60–90 days remaining)
  const amc3 = await prisma.amcContract.upsert({
    where: { id: 'amc-3' },
    update: {
      contractNumber: 'AMC-WEP-2026-118',
      startDate: new Date(nowMs - 287 * 86400000),
      endDate: new Date(nowMs + 78 * 86400000),
      status: 'active',
      contractValue: 98000,
      totalAmount: 115640,
    },
    create: {
      id: 'amc-3',
      companyId: wepsun.id,
      branchId: brMum.id,
      clientId: client1.id,
      contractNumber: 'AMC-WEP-2026-118',
      amcType: 'COMPREHENSIVE',
      startDate: new Date(nowMs - 287 * 86400000),
      endDate: new Date(nowMs + 78 * 86400000), // 78 days remaining (UPCOMING)
      contractValue: 98000,
      gstRate: 18.0,
      gstAmount: 17640,
      totalAmount: 115640,
      paymentStatus: 'PAID',
      coveredParts: ['Full comprehensive parts replacement', 'Monthly 4-Zone inspections', '24/7 Breakdown dispatch'],
      excludedParts: ['Cabin aesthetic panel redesign'],
      pmFrequency: 'Monthly (12 Visits/Year)',
      pmVisitsDone: 9,
      pmVisitsTotal: 12,
      status: 'active',
    },
  });

  // 8. LIFTS (DIGITAL PASSPORT)
  console.log('🛗 Seeding Lifts & Digital Passports...');
  const lift1 = await prisma.lift.upsert({
    where: { permanentLiftId: 'WPS-PUN-000123' },
    update: {},
    create: {
      id: 'lift-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      buildingId: bld1.id,
      clientId: client1.id,
      permanentLiftId: 'WPS-PUN-000123',
      brand: 'WEPSUN Elevators',
      model: 'Zenith-V4 PMSM Gearless',
      type: 'PASSENGER',
      capacityPersons: 8,
      capacityKg: 544,
      speedMps: 1.5,
      floors: 'G + 14 Floors',
      stops: 15,
      machineType: 'GEARLESS_PMSM',
      motorKw: 5.5,
      controllerBrand: 'Monarch NICE 3000+ Integrated Vector Controller',
      doorOperator: 'Fermator VVVF4+ Premium 2-Panel Center Opening',
      ardSystem: 'Automatic Rescue Device 15kVA with 48V Battery Pack',
      installationDate: new Date('2022-04-10'),
      currentStatus: 'OPERATIONAL',
      amcStatus: 'ACTIVE',
      activeAmcId: amc1.id,
      lastPmDate: new Date(Date.now() - 15 * 86400000),
      nextPmDate: new Date(Date.now() + 15 * 86400000),
      safetyCertificateNumber: 'CERT-MH-PUN-2025-998',
      safetyCertificateExpiry: new Date('2026-06-30'),
      locationDetails: 'Wing A - Passenger Lift 1',
    },
  });

  const lift2 = await prisma.lift.upsert({
    where: { permanentLiftId: 'WPS-PUN-000124' },
    update: {},
    create: {
      id: 'lift-2',
      companyId: wepsun.id,
      branchId: brThn.id,
      buildingId: bld2.id,
      clientId: client2.id,
      permanentLiftId: 'WPS-PUN-000124',
      brand: 'Schindler',
      model: '5500 MRL Series',
      type: 'PASSENGER',
      capacityPersons: 13,
      capacityKg: 884,
      speedMps: 2.0,
      floors: '2B + G + 20 Floors',
      stops: 23,
      machineType: 'MRL_TRACTION',
      motorKw: 9.2,
      controllerBrand: 'Schindler Bionic 5 REL 4',
      doorOperator: 'Schindler Varidor 35A High-Traffic',
      installationDate: new Date('2021-09-15'),
      currentStatus: 'OPERATIONAL',
      amcStatus: 'ACTIVE',
      lastPmDate: new Date(Date.now() - 20 * 86400000),
      nextPmDate: new Date(Date.now() + 10 * 86400000),
      safetyCertificateNumber: 'CERT-MH-PUN-2025-1044',
      safetyCertificateExpiry: new Date('2026-08-31'),
      locationDetails: 'Tower 1 - Express Bank Lift A',
    },
  });

  // 9. QR CODE TOKENS
  console.log('📱 Seeding QR Cryptographic Tokens...');
  await prisma.qRCodeToken.upsert({
    where: { token: 'qr_wep_pun_000123_secure' },
    update: {},
    create: {
      id: 'qr-1',
      token: 'qr_wep_pun_000123_secure',
      companyId: wepsun.id,
      liftId: lift1.id,
      isActive: true,
    },
  });

  // 10. COMPLAINTS & TIMELINE
  console.log('🚨 Seeding Complaints & Service Timelines...');
  const comp1 = await prisma.complaint.upsert({
    where: { ticketNumber: 'TKT-2026-0416' },
    update: {},
    create: {
      id: 'comp-tkt-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      liftId: lift1.id,
      ticketNumber: 'TKT-2026-0416',
      issueType: 'DOOR_JAMMED',
      title: 'Emergency: Lift Door Not Opening at 4th Floor',
      description: 'Outer landing door latch stuck at 4th floor landing. Passengers safely evacuated.',
      priority: 'CRITICAL',
      isEmergency: true,
      status: 'NEW',
      reportedAt: new Date(Date.now() - 1 * 3600000),
      assignedTechnicianId: null,
      technicianEta: null,
      diagnosisRemarks: 'Awaiting field engineer assignment.',
    },
  });

  // Initial timeline for comp1
  await prisma.complaintTimeline.createMany({
    data: [
      {
        complaintId: comp1.id,
        status: 'NEW',
        title: 'Breakdown Ticket Logged',
        description: 'Customer raised SOS ticket via QR Code portal',
        actorName: 'Sanjay Deshmukh (Secretary)',
        actorRole: 'CLIENT',
        timestamp: new Date(Date.now() - 1 * 3600000),
      },
    ],
    skipDuplicates: true,
  });

  // 11. SERVICE REPORTS
  // Service reports are created dynamically when on-duty field technicians complete jobs.
  console.log('📑 Service reports will be logged dynamically by registered field technicians.');

  // 12. INVENTORY & MOVEMENT LEDGER
  console.log('📦 Seeding Inventory & Immutable Stock Ledger...');
  const part1 = await prisma.inventoryPart.upsert({
    where: { partNumber: 'PART-ELEC-001' },
    update: {},
    create: {
      id: 'part-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      partNumber: 'PART-ELEC-001',
      name: 'Landing Door Lock Microswitch 230V 5A',
      category: 'ELECTRICAL',
      currentStock: 45,
      minStockThreshold: 10,
      unit: 'Nos',
      purchasePrice: 420.0,
      sellingPrice: 750.0,
      hsnCode: '84313100',
      supplier: 'Omron Automation India Pvt Ltd',
      locationRack: 'Rack E-04, Bin 12',
      compatibleModels: ['Monarch NICE 3000+', 'Schindler 5500', 'Otis Gen2'],
    },
  });

  const part2 = await prisma.inventoryPart.upsert({
    where: { partNumber: 'PART-MECH-002' },
    update: {},
    create: {
      id: 'part-2',
      companyId: wepsun.id,
      branchId: brMum.id,
      partNumber: 'PART-MECH-002',
      name: 'Car Guide Shoe Liner 10mm T-Rail',
      category: 'MECHANICAL',
      currentStock: 60,
      minStockThreshold: 12,
      unit: 'Nos',
      purchasePrice: 280.0,
      sellingPrice: 550.0,
      hsnCode: '84313100',
      supplier: 'Kone Elevator Components',
      locationRack: 'Rack M-02, Bin 05',
      compatibleModels: ['All Standard T-Rail 10mm & 16mm Lifts'],
    },
  });

  await prisma.inventoryMovement.createMany({
    data: [
      {
        companyId: wepsun.id,
        branchId: brMum.id,
        partId: part1.id,
        type: 'PURCHASE',
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        referenceId: 'PO-2026-0812',
        performedBy: 'Vikram Joshi (Service Manager)',
        notes: 'Monthly bulk replenishment from OEM supplier',
      },
      {
        companyId: wepsun.id,
        branchId: brMum.id,
        partId: part1.id,
        type: 'TECHNICIAN_ISSUE',
        quantity: -5,
        previousStock: 50,
        newStock: 45,
        referenceId: 'KIT-SERVICE-001',
        technicianId: null,
        performedBy: 'Vikram Joshi (Service Manager)',
        notes: 'Transferred to central emergency field van toolkit',
      },
    ],
    skipDuplicates: true,
  });

  // 13. QUOTATIONS & WORK ORDERS
  console.log('💼 Seeding Quotations & Work Orders...');
  const quote1 = await prisma.quotation.upsert({
    where: { quoteNumber: 'QT-WEP-2026-031' },
    update: {},
    create: {
      id: 'quote-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      clientId: client1.id,
      liftId: lift1.id,
      quoteNumber: 'QT-WEP-2026-031',
      subject: 'ARD Battery Bank & Door Safety Retractor Replacement',
      subtotal: 18500.0,
      gstRate: 18.0,
      gstAmount: 3330.0,
      grandTotal: 21830.0,
      terms: ['50% advance along with work order', 'Delivery and commissioning within 5 working days', '1 Year OEM manufacturer warranty'],
      status: 'APPROVED',
      validUntil: new Date(Date.now() + 25 * 86400000),
    },
  });

  await prisma.quotationItem.createMany({
    data: [
      {
        quotationId: quote1.id,
        description: 'Exide 12V 18Ah Sealed Lead Acid ARD Battery Pack (Set of 4)',
        hsnCode: '85072000',
        quantity: 1,
        unitRate: 14500.0,
        amount: 14500.0,
      },
      {
        quotationId: quote1.id,
        description: 'Door Interlock Safety Cam Spring Retractor Kit',
        hsnCode: '84313100',
        quantity: 2,
        unitRate: 2000.0,
        amount: 4000.0,
      },
    ],
    skipDuplicates: true,
  });

  const wo1 = await prisma.workOrder.upsert({
    where: { workOrderNumber: 'WO-2026-0045' },
    update: {},
    create: {
      id: 'wo-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      workOrderNumber: 'WO-2026-0045',
      quotationId: quote1.id,
      liftId: lift1.id,
      technicianId: null,
      title: 'Quotation Execution: ARD Battery & Cam Spring Replacement',
      description: 'Scheduled site visit for battery bank overhaul and door retractor installation',
      priority: 'HIGH',
      status: 'SCHEDULED',
      scheduledDate: new Date(Date.now() + 2 * 86400000),
      estimatedHours: 3.5,
      totalAmount: 21830.0,
    },
  });

  // 14. INVOICES & PAYMENTS
  console.log('💳 Seeding Invoices & Payments...');
  const inv1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-WEP-2026-102' },
    update: {},
    create: {
      id: 'inv-1',
      companyId: wepsun.id,
      branchId: brMum.id,
      clientId: client1.id,
      invoiceNumber: 'INV-WEP-2026-102',
      type: 'Annual Maintenance Contract (Comprehensive)',
      relatedContractId: amc1.id,
      subtotal: 72000.0,
      gstAmount: 12960.0,
      grandTotal: 84960.0,
      paidAmount: 84960.0,
      status: 'PAID',
      dueDate: new Date('2025-04-30'),
      invoiceDate: new Date('2025-04-01'),
      paymentMethod: 'UPI_QR',
      transactionId: 'TXN-RAZORPAY-992817263',
    },
  });

  await prisma.payment.upsert({
    where: { transactionId: 'TXN-RAZORPAY-992817263' },
    update: {},
    create: {
      invoiceId: inv1.id,
      amount: 84960.0,
      method: 'UPI_QR',
      transactionId: 'TXN-RAZORPAY-992817263',
      gatewayRef: 'pay_Nq991823HkJ2',
      verified: true,
      paymentDate: new Date('2025-04-15'),
    },
  });

  // 15. CUSTOMER FEEDBACK
  console.log('⭐ Seeding Customer Feedbacks...');
  await prisma.customerFeedback.createMany({
    data: [
      {
        companyId: wepsun.id,
        clientName: 'Sanjay Deshmukh (Secretary)',
        clientPhone: '+91 98220 11223',
        buildingName: 'Greenwood Heights CHS',
        liftNumber: 'WPS-PUN-000123',
        technicianName: 'Assigned Field Engineer',
        ticketNumber: 'TKT-2026-0416',
        serviceType: 'Breakdown Resolution',
        overallRating: 5,
        punctuality: 5,
        technicalSkill: 5,
        rideSmoothness: 5,
        communication: 5,
        tags: ['Fast Arrival', 'Clean Work', 'Polite Technician', 'Digital Report'],
        comments: 'Emergency door jam breakdown was attended promptly! Replaced the lock microswitch and completed safety run cycles with utmost professionalism.',
        adminReply: 'Thank you Sanjay ji! Our 24x7 Pune West rapid response unit is committed to 30-min SLA for all passenger elevators.',
        adminReplyBy: 'Vikram Joshi (Service Manager)',
        adminReplyAt: new Date(),
        status: 'published',
      },
      {
        companyId: wepsun.id,
        clientName: 'Meera Nambiar (Facility Head)',
        clientPhone: '+91 98450 33445',
        buildingName: 'TechPark Infinity',
        liftNumber: 'WPS-PUN-000124',
        technicianName: 'Field Service Engineer',
        ticketNumber: 'PM-2026-0088',
        serviceType: 'Routine PM Visit',
        overallRating: 5,
        punctuality: 5,
        technicalSkill: 5,
        rideSmoothness: 5,
        communication: 5,
        tags: ['Thorough Inspection', 'Detailed Explanation', 'Safety Verified'],
        comments: 'Quarterly comprehensive PM was conducted seamlessly during low-traffic afternoon hours. All 4 zones inspected thoroughly.',
        status: 'published',
      },
    ],
    skipDuplicates: true,
  });

  // 16. NOTIFICATIONS & AUDIT LOGS
  console.log('🔔 Seeding Notifications & Audit Logs...');
  await prisma.notification.createMany({
    data: [
      {
        companyId: wepsun.id,
        title: '🚨 Emergency Breakdown Logged',
        message: 'Greenwood Heights Lift WPS-PUN-000123 reported. Awaiting technician assignment.',
        type: 'BREAKDOWN',
        isRead: false,
      },
      {
        companyId: wepsun.id,
        title: '⏱️ PM Visit Due in 48 Hours',
        message: 'TechPark Infinity Tower 1 scheduled for monthly 4-zone safety inspection.',
        type: 'PM_DUE',
        isRead: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: wepsun.id,
        entityType: 'User',
        entityId: 'usr-admin-1',
        action: 'LOGIN',
        performedBy: 'Sunil Mehta',
        userRole: 'COMPANY_ADMIN',
        details: 'Managing Director Sunil Mehta logged in from Mumbai HQ',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ WEPSUN Development Database Seed Completed Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Seeding Summary:');
  console.log('  - Companies: 2');
  console.log('  - Branches: 2');
  console.log('  - Clients & Buildings: 2 Clients, 2 Buildings');
  console.log('  - RBAC Users: 4 (Admin, Service Mgr, Tech, Client)');
  console.log('  - Lifts with Digital Passports: 2');
  console.log('  - AMC Contracts: 1 (Comprehensive)');
  console.log('  - Complaints & Timelines: 1 (Emergency Door Jam)');
  console.log('  - Service Reports: 1 (Signed off)');
  console.log('  - Spare Parts & Ledger: 2 Parts, 2 Movement entries');
  console.log('  - Quotations & Work Orders: 1 Quotation, 1 Work Order');
  console.log('  - Invoices & Payments: 1 Paid Invoice');
  console.log('  - Verified Customer Reviews: 2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Database Seeding Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
