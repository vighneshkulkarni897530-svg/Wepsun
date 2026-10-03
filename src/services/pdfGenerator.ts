import { jsPDF } from 'jspdf';
import { AmcContract, ServiceReport, Invoice, Quotation, Lift, Company } from '../types';

const DEFAULT_COMPANY: Partial<Company> = {
  name: 'WEPSUN Engineering Solution Pvt. Ltd.',
  address: 'Unit 402, Quantum Towers, SV Road, Malad West, Mumbai 400064',
  contactPhone: '+91 98201 55432 / +91 98202 88765',
  contactEmail: 'service@wepsun.com',
  gstNumber: '27AABCW1234F1Z8',
};

// Helper: Add Standard Branded Header
function addBrandedHeader(doc: jsPDF, title: string, docNumber: string, company: Partial<Company> = DEFAULT_COMPANY) {
  // Navy Top Bar
  doc.setFillColor(18, 59, 93); // #123B5D
  doc.rect(0, 0, 210, 24, 'F');

  // Accent Line
  doc.setFillColor(25, 118, 210); // #1976D2
  doc.rect(0, 24, 210, 2, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(company.name || 'WEPSUN ENGINEERING SOLUTION', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Reliable Lifts | Safer Tomorrow • ISO 9001:2015 Certified OEM & Service Provider', 14, 18);

  // Document Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 196, 12, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref: ${docNumber}`, 196, 18, { align: 'right' });

  // Reset text color
  doc.setTextColor(38, 50, 56);
}

// Helper: Add Standard Footer
function addBrandedFooter(doc: jsPDF, pageNumber = 1, totalPages = 1) {
  const pageHeight = 297;
  doc.setFillColor(245, 248, 250);
  doc.rect(0, pageHeight - 16, 210, 16, 'F');

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 16, 196, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Head Office: Mumbai | 24x7 Control Room: +91 98201 55432 | Email: support@wepsun.com | Web: www.wepsun.com',
    14,
    pageHeight - 9
  );
  doc.text(`Page ${pageNumber} of ${totalPages}`, 196, pageHeight - 9, { align: 'right' });
}

// 1. Download AMC Agreement PDF
export function downloadAmcAgreementPdf(contract: AmcContract, company: Partial<Company> = DEFAULT_COMPANY) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addBrandedHeader(doc, 'Annual Maintenance Contract', contract.contractNumber, company);

  let y = 36;

  // Title box
  doc.setFillColor(240, 247, 255);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'F');
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 59, 93);
  doc.text(`${contract.amcType.toUpperCase()} ELEVATOR MAINTENANCE AGREEMENT`, 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contract Period: ${contract.startDate} to ${contract.endDate} • Status: ${contract.status.toUpperCase()}`, 20, y + 14);

  y += 28;

  // Parties info table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 93);
  doc.text('1. PARTIES & SITE JURISDICTION', 14, y);

  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 88, 32, 2, 2, 'FD');
  doc.roundedRect(108, y, 88, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('SERVICE PROVIDER (FIRST PARTY):', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(company.name || 'WEPSUN Engineering Solution Pvt. Ltd.', 18, y + 11);
  doc.text(company.address || 'Quantum Towers, SV Road, Malad West, Mumbai', 18, y + 16);
  doc.text(`GSTIN: ${company.gstNumber || '27AABCW1234F1Z8'}`, 18, y + 21);
  doc.text(`Emergency Helpline: ${company.contactPhone || '+91 98201 55432'}`, 18, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT / SOCIETY (SECOND PARTY):', 112, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(contract.clientName, 112, y + 11);
  doc.text(`Site: ${contract.buildingName}`, 112, y + 16);
  doc.text(`Covered Units: ${contract.liftIds.length} Elevator(s)`, 112, y + 21);
  doc.text(`PM Frequency: ${contract.pmFrequency}`, 112, y + 26);

  y += 40;

  // Commercials & Scope
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 93);
  doc.text('2. COMMERCIAL TERMS & PAYMENT SCHEDULE', 14, y);

  y += 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 22);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Basic Annual Contract Value:`, 18, y + 6);
  doc.text(`₹ ${contract.contractValue.toLocaleString('en-IN')}`, 90, y + 6);
  doc.text(`Applicable GST Rate (18%):`, 18, y + 12);
  doc.text(`₹ ${contract.gstAmount.toLocaleString('en-IN')}`, 90, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Agreed Amount (Including GST):`, 18, y + 18);
  doc.text(`₹ ${contract.totalAmount.toLocaleString('en-IN')}`, 90, y + 18);

  doc.text(`Payment Status: ${contract.paymentStatus.toUpperCase()}`, 130, y + 12);
  doc.text(`Visits: ${contract.pmVisitsDone} of ${contract.pmVisitsTotal} Completed`, 130, y + 18);

  y += 30;

  // Scope of Work
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 93);
  doc.text('3. SCOPE OF SERVICES & COVERED COMPONENTS', 14, y);

  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 125, 50);
  doc.text('✓ Included Services & Parts:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  contract.coveredParts.forEach((part, idx) => {
    doc.text(`• ${part}`, 18, y + 5 + idx * 4.5);
  });

  const excludedStartY = y + 5 + contract.coveredParts.length * 4.5 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('✕ Excluded Components & Billable Repairs:', 14, excludedStartY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  contract.excludedParts.forEach((part, idx) => {
    doc.text(`• ${part}`, 18, excludedStartY + 5 + idx * 4.5);
  });

  // Signatures at bottom
  const sigY = 240;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 80, sigY);
  doc.line(130, sigY, 196, sigY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 59, 93);
  doc.text('For WEPSUN Engineering Solution', 14, sigY + 5);
  doc.text('For Society / Authorized Client', 130, sigY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Authorized Signatory & Stamp', 14, sigY + 10);
  doc.text('Secretary / Chairman / Facility Head', 130, sigY + 10);

  addBrandedFooter(doc, 1, 1);
  doc.save(`AMC-Agreement-${contract.contractNumber}.pdf`);
}

// 2. Download Service Report PDF
export function downloadServiceReportPdf(report: ServiceReport, company: Partial<Company> = DEFAULT_COMPANY) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addBrandedHeader(doc, 'Field Service Report', report.reportNumber, company);

  let y = 36;

  // Status Banner
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.text(`SERVICE REPORT: ${report.serviceType.toUpperCase()}`, 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Date: ${report.serviceDate} • Time: ${report.serviceStartTime || '10:00 AM'} to ${report.serviceEndTime || '11:30 AM'} • Status: ${report.liftOperatingStatusAfterWork}`,
    20,
    y + 12
  );

  y += 22;

  // Equipment & Technician Table
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 88, 30, 2, 2, 'FD');
  doc.roundedRect(108, y, 88, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 59, 93);
  doc.text('EQUIPMENT & SITE DETAILS:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Lift Number: ${report.liftNumber}`, 18, y + 11);
  doc.text(`Model: ${report.liftBrand || 'WEPSUN'} ${report.liftModel || 'PMSM Gearless'}`, 18, y + 16);
  doc.text(`Building: ${report.buildingName}`, 18, y + 21);
  doc.text(`Client: ${report.clientName}`, 18, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 59, 93);
  doc.text('FIELD ENGINEER / TECHNICIAN:', 112, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Engineer Name: ${report.technicianName}`, 112, y + 11);
  doc.text(`Contact: ${report.technicianPhone || '+91 98203 11223'}`, 112, y + 16);
  doc.text(`Ticket Reference: ${report.ticketNumber || 'SCHEDULED-PM'}`, 112, y + 21);
  doc.text(`Client Signoff: ${report.clientOtpVerified ? 'OTP Verified' : 'Digitally Signed'}`, 112, y + 26);

  y += 36;

  // Diagnosis & Work Done
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(18, 59, 93);
  doc.text('DIAGNOSIS & ACTIONS PERFORMED', 14, y);

  y += 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Initial Observation / Issue Reported:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(report.initialDiagnosis || 'Routine periodic maintenance inspection', 18, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Root Cause Analysis:', 18, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(report.rootCause || 'Scheduled wear-and-tear inspection and lubrication check', 18, y + 23);

  doc.setFont('helvetica', 'bold');
  doc.text('Corrective & Preventive Actions Carried Out:', 18, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(report.workPerformed || 'All safety circuits tested, door sensor aligned, brake clearance calibrated.', 18, y + 35);

  y += 42;

  // Replaced Parts Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(18, 59, 93);
  doc.text('PARTS CONSUMED / REPLACED', 14, y);

  y += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Part Description', 18, y + 5);
  doc.text('Part Number', 90, y + 5);
  doc.text('Quantity', 140, y + 5);
  doc.text('Total (₹)', 180, y + 5, { align: 'right' });

  y += 7;
  if (!report.partsReplaced || report.partsReplaced.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('No spare parts replaced during this maintenance visit (Labor & Checkup only).', 18, y + 6);
    y += 12;
  } else {
    report.partsReplaced.forEach((p) => {
      doc.setFont('helvetica', 'normal');
      doc.text(p.partName, 18, y + 5);
      doc.text(p.partNumber || 'OEM-STD', 90, y + 5);
      doc.text(p.quantity.toString(), 140, y + 5);
      doc.text(`₹ ${p.totalPrice.toLocaleString('en-IN')}`, 180, y + 5, { align: 'right' });
      y += 7;
    });
  }

  y += 4;
  // Recommendations
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('ENGINEER RECOMMENDATIONS FOR FACILITY TEAM:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(report.technicianRecommendations || 'Maintain machine room temperature below 32°C. Keep pit dry.', 18, y + 11);

  // Signatures
  const sigY = 245;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 80, sigY);
  doc.line(130, sigY, 196, sigY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 59, 93);
  doc.text(`Technician: ${report.technicianName}`, 14, sigY + 5);
  doc.text(`Client Representative: ${report.clientName}`, 130, sigY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Service Engineer Verified', 14, sigY + 10);
  doc.text(report.clientOtpVerified ? 'Verified via 4-Digit Secure OTP' : 'Acknowledged & Signed', 130, sigY + 10);

  addBrandedFooter(doc, 1, 1);
  doc.save(`Service-Report-${report.reportNumber}.pdf`);
}

// 3. Download Tax Invoice PDF
export function downloadInvoicePdf(invoice: Invoice, company: Partial<Company> = DEFAULT_COMPANY) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addBrandedHeader(doc, 'Tax Invoice', invoice.invoiceNumber, company);

  let y = 36;

  // Invoice Meta Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(18, 59, 93);
  doc.text(`INVOICE TO:`, 18, y + 6);
  doc.text(`INVOICE DETAILS:`, 110, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(invoice.clientName, 18, y + 11);
  doc.text(`Site: ${invoice.buildingName}`, 18, y + 16);

  doc.text(`Invoice Date: ${invoice.invoiceDate}`, 110, y + 11);
  doc.text(`Due Date: ${invoice.dueDate || invoice.dateDue || 'Immediate'}`, 110, y + 16);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 160, y + 16);

  y += 28;

  // Items table
  doc.setFillColor(18, 59, 93);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Item Description / Service Category', 18, y + 5.5);
  doc.text('HSN / SAC', 110, y + 5.5);
  doc.text('Taxable Value (₹)', 150, y + 5.5);
  doc.text('Total (₹)', 190, y + 5.5, { align: 'right' });

  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 14, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${invoice.type} — ${invoice.buildingName}`, 18, y + 8);
  doc.text('998717', 110, y + 8);
  doc.text(`₹ ${invoice.subtotal.toLocaleString('en-IN')}`, 150, y + 8);
  doc.text(`₹ ${invoice.grandTotal.toLocaleString('en-IN')}`, 190, y + 8, { align: 'right' });

  y += 20;

  // Calculation Block
  doc.setFontSize(8.5);
  doc.text('Subtotal:', 130, y + 5);
  doc.text(`₹ ${invoice.subtotal.toLocaleString('en-IN')}`, 190, y + 5, { align: 'right' });

  doc.text('CGST (9%):', 130, y + 11);
  doc.text(`₹ ${(invoice.gstAmount / 2).toLocaleString('en-IN')}`, 190, y + 11, { align: 'right' });

  doc.text('SGST (9%):', 130, y + 17);
  doc.text(`₹ ${(invoice.gstAmount / 2).toLocaleString('en-IN')}`, 190, y + 17, { align: 'right' });

  doc.setFillColor(240, 247, 255);
  doc.rect(125, y + 21, 71, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 93);
  doc.text('Grand Total:', 130, y + 27.5);
  doc.text(`₹ ${invoice.grandTotal.toLocaleString('en-IN')}`, 190, y + 27.5, { align: 'right' });

  // Bank Account & Payment Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 59, 93);
  doc.text('BANK TRANSFER / UPI DETAILS:', 14, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Account Name: WEPSUN Engineering Solution Pvt Ltd', 14, y + 11);
  doc.text('Bank: HDFC Bank Ltd, Malad West Branch', 14, y + 16);
  doc.text('A/C Number: 50200034981120', 14, y + 21);
  doc.text('IFSC Code: HDFC0000452', 14, y + 26);
  doc.text('UPI ID: wepsun.service@hdfcbank', 14, y + 31);

  if (invoice.status === 'paid') {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(134, 239, 172);
    doc.roundedRect(14, y + 38, 182, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text(`✓ PAYMENT RECEIVED IN FULL — Txn ID: ${invoice.transactionId || 'VERIFIED-UPI-IMPS'}`, 20, y + 46);
  }

  addBrandedFooter(doc, 1, 1);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

// 4. Download Quotation PDF
export function downloadQuotationPdf(quotation: Quotation, company: Partial<Company> = DEFAULT_COMPANY) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addBrandedHeader(doc, 'Commercial Estimate', quotation.quoteNumber, company);

  let y = 36;

  // Header Summary
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(146, 64, 14);
  doc.text(quotation.subject.toUpperCase(), 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Equipment: ${quotation.liftNumber} • Site: ${quotation.buildingName} • Valid Until: ${quotation.validUntil} • Status: ${quotation.status.toUpperCase()}`,
    20,
    y + 13
  );

  y += 24;

  // Items Table
  doc.setFillColor(18, 59, 93);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Item Description / Component Scope', 18, y + 5);
  doc.text('HSN Code', 105, y + 5);
  doc.text('Qty', 130, y + 5);
  doc.text('Unit Rate (₹)', 150, y + 5);
  doc.text('Amount (₹)', 190, y + 5, { align: 'right' });

  y += 7;
  quotation.items.forEach((item) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(item.description, 18, y + 5);
    doc.text(item.hsnCode || '84313100', 105, y + 5);
    doc.text(item.quantity.toString(), 130, y + 5);
    doc.text(`₹ ${item.unitRate.toLocaleString('en-IN')}`, 150, y + 5);
    doc.text(`₹ ${item.amount.toLocaleString('en-IN')}`, 190, y + 5, { align: 'right' });

    y += 8;
  });

  y += 6;

  // Calculation Block
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal Amount:', 130, y + 5);
  doc.text(`₹ ${quotation.subtotal.toLocaleString('en-IN')}`, 190, y + 5, { align: 'right' });

  doc.text('GST (18%):', 130, y + 11);
  doc.text(`₹ ${quotation.gstAmount.toLocaleString('en-IN')}`, 190, y + 11, { align: 'right' });

  doc.setFillColor(240, 247, 255);
  doc.rect(125, y + 15, 71, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(18, 59, 93);
  doc.text('Grand Total:', 130, y + 21);
  doc.text(`₹ ${quotation.grandTotal.toLocaleString('en-IN')}`, 190, y + 21, { align: 'right' });

  // Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 59, 93);
  doc.text('TERMS & CONDITIONS:', 14, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  quotation.terms.forEach((t, idx) => {
    doc.text(`• ${t}`, 14, y + 11 + idx * 4.5);
  });

  // Approval Signature
  const sigY = 245;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 80, sigY);
  doc.line(130, sigY, 196, sigY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 59, 93);
  doc.text('Prepared by: WEPSUN Sales & Operations', 14, sigY + 5);
  doc.text('Approved / Accepted by Client', 130, sigY + 5);

  addBrandedFooter(doc, 1, 1);
  doc.save(`Quotation-${quotation.quoteNumber}.pdf`);
}

// 5. Download Lift Passport PDF
export function downloadLiftPassportPdf(lift: Lift, company: Partial<Company> = DEFAULT_COMPANY) {
  const doc = new jsPDF('p', 'mm', 'a4');
  addBrandedHeader(doc, 'Digital Lift Passport', lift.liftNumber, company);

  let y = 36;

  // Banner
  doc.setFillColor(240, 247, 255);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(18, 59, 93);
  doc.text(`ELEVATOR SPECIFICATION CERTIFICATE & PASSPORT`, 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Site: ${lift.buildingName} • Location: ${lift.locationDetails} • Operational Status: ${lift.currentStatus.toUpperCase()}`, 20, y + 12);

  y += 22;

  // Technical Specs Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(18, 59, 93);
  doc.text('TECHNICAL & MACHINE SPECIFICATIONS', 14, y);

  y += 5;
  const specs = [
    ['Manufacturer / Brand', lift.brand],
    ['Model Designation', lift.model],
    ['Lift Type', lift.type],
    ['Machine Technology', lift.machineType],
    ['Rated Capacity', `${lift.capacityPersons} Persons / ${lift.capacityKg} kg`],
    ['Operating Speed', `${lift.speedMps} m/s`],
    ['Floors / Stops', `${lift.floors} (${lift.stops} Stops)`],
    ['Main Controller', lift.controllerBrand],
    ['Door Operator', lift.doorOperator],
    ['Rescue System (ARD)', lift.ardSystem],
    ['Installation Date', lift.installationDate],
    ['Warranty Expiry', lift.warrantyExpiry],
    ['Safety Certificate No.', lift.safetyCertificateNumber || 'MH-EI-LIFT-2025-88412'],
    ['Certificate Validity', lift.safetyCertificateExpiry || '2027-03-31'],
    ['Last Maintenance Date', lift.lastPmDate],
    ['Next Scheduled PM', lift.nextPmDate],
    ['AMC Status', lift.amcStatus.toUpperCase()],
  ];

  specs.forEach(([k, v], idx) => {
    const rowY = y + Math.floor(idx / 2) * 8;
    const colX = idx % 2 === 0 ? 14 : 108;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(colX, rowY, 88, 7, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${k}:`, colX + 3, rowY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(v || 'N/A', colX + 45, rowY + 4.5);
  });

  addBrandedFooter(doc, 1, 1);
  doc.save(`Lift-Passport-${lift.liftNumber}.pdf`);
}
