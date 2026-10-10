import { prisma } from '../lib/prisma.js';

async function main() {
  console.log('--- DB INTEGRITY AUDIT ---');
  const [users, clients, techs, buildings, lifts, complaints, amcs, quotes, workOrders, invoices, reports] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, clientId: true, technicianId: true, companyId: true } }),
    prisma.client.findMany({ select: { id: true, name: true, email: true, companyId: true } }),
    prisma.technician.findMany({ select: { id: true, name: true, employeeCode: true, email: true, companyId: true } }),
    prisma.building.findMany({ select: { id: true, name: true, clientId: true, companyId: true } }),
    prisma.lift.findMany({ select: { id: true, permanentLiftId: true, clientId: true, buildingId: true, companyId: true } }),
    prisma.complaint.findMany({ select: { id: true, ticketNumber: true, liftId: true, assignedTechnicianId: true, companyId: true } }),
    prisma.amcContract.findMany({ select: { id: true, contractNumber: true, clientId: true, companyId: true } }),
    prisma.quotation.findMany({ select: { id: true, quoteNumber: true, clientId: true, liftId: true, companyId: true } }),
    prisma.workOrder.findMany({ select: { id: true, workOrderNumber: true, liftId: true, technicianId: true, companyId: true } }),
    prisma.invoice.findMany({ select: { id: true, invoiceNumber: true, clientId: true, companyId: true } }),
    prisma.serviceReport.findMany({ select: { id: true, reportNumber: true, liftId: true, technicianId: true, companyId: true } }),
  ]);

  console.log(`Users: ${users.length}`);
  for (const u of users) {
    const hasClient = u.clientId ? clients.some(c => c.id === u.clientId) : false;
    const hasTech = u.technicianId ? techs.some(t => t.id === u.technicianId) : false;
    console.log(`  User: ${u.email} (${u.role}) -> clientId: ${u.clientId} (valid: ${hasClient}), techId: ${u.technicianId} (valid: ${hasTech})`);
  }

  console.log(`\nClients: ${clients.length}`);
  for (const c of clients) {
    const clientLifts = lifts.filter(l => l.clientId === c.id);
    const clientComplaints = complaints.filter(cmp => clientLifts.some(l => l.id === cmp.liftId));
    console.log(`  Client: ${c.id} (${c.name}) -> lifts: ${clientLifts.length}, complaints: ${clientComplaints.length}`);
  }

  console.log(`\nTechnicians: ${techs.length}`);
  for (const t of techs) {
    const assignedComplaints = complaints.filter(cmp => cmp.assignedTechnicianId === t.id);
    console.log(`  Tech: ${t.id} (${t.name}) -> assignedComplaints: ${assignedComplaints.length}`);
  }

  console.log(`\nLifts: ${lifts.length}`);
  console.log(`Complaints: ${complaints.length}`);
  console.log(`AMC Contracts: ${amcs.length}`);
  console.log(`Quotations: ${quotes.length}`);
  console.log(`Work Orders: ${workOrders.length}`);
  console.log(`Invoices: ${invoices.length}`);
  console.log(`Service Reports: ${reports.length}`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
