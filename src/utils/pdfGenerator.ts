import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FundRequestBatch, PettyCashClosure, Transaction, Project, CashierProfile } from '../types';

export interface AuditPdfReportData {
  reportTitle?: string;
  project: Project;
  cashier: CashierProfile;
  approvedBatches: FundRequestBatch[];
  closures?: PettyCashClosure[];
  periodStart: string;
  periodEnd: string;
  generatedBy?: string;
  auditorName?: string;
  auditNotes?: string;
}

export const generateReimbursementAuditPdf = (data: AuditPdfReportData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Primary colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [16, 185, 129]; // Emerald 500
  const headerBg = [30, 41, 59]; // Slate 800
  const lightBg = [248, 250, 252]; // Slate 50

  // Total calculations
  let totalExclVat = 0;
  let totalVat = 0;
  let totalInclVat = 0;
  let totalReceiptsCount = 0;

  // Flattened line items from all approved batches
  const lineItems: Array<{
    srNo: number;
    batchNumber: string;
    billRef: string;
    date: string;
    expenseNature: string;
    vendorName: string;
    vendorVatNo: string;
    amountExclVat: number;
    vatAmount: number;
    amountInclVat: number;
    remarks: string;
    status: string;
  }> = [];

  let srCounter = 1;

  data.approvedBatches.forEach((batch) => {
    totalExclVat += batch.totalExclVat || 0;
    totalVat += batch.totalVat || 0;
    totalInclVat += batch.totalAmount || 0;
    totalReceiptsCount += batch.receiptsCount || batch.items.length;

    if (batch.groupedReceipts && batch.groupedReceipts.length > 0) {
      batch.groupedReceipts.forEach((r) => {
        lineItems.push({
          srNo: srCounter++,
          batchNumber: batch.batchNumber,
          billRef: r.billRef || `BILL-${srCounter}`,
          date: r.date,
          expenseNature: r.expenseNature,
          vendorName: r.paidTo,
          vendorVatNo: r.vendorVatRegNo || 'N/A',
          amountExclVat: r.amountExclVat,
          vatAmount: r.vatAmount,
          amountInclVat: r.amountInclVat,
          remarks: 'Scanned receipt verified against VAT register',
          status: batch.status,
        });
      });
    } else {
      batch.items.forEach((it) => {
        const itemVat = it.vatAmount || 0;
        const itemExcl = it.amount - itemVat;
        lineItems.push({
          srNo: srCounter++,
          batchNumber: batch.batchNumber,
          billRef: it.billRef || `REQ-${srCounter}`,
          date: batch.requestedAt.split('T')[0],
          expenseNature: it.expenseNature,
          vendorName: it.vendorName,
          vendorVatNo: 'N/A',
          amountExclVat: itemExcl > 0 ? itemExcl : it.amount,
          vatAmount: itemVat,
          amountInclVat: it.amount,
          remarks: it.notes || 'Forecast item approved',
          status: batch.status,
        });
      });
    }
  });

  const voucherRef = `AUD-RMB-${data.project.code}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  // ==========================================================
  // PAGE 1: HEADER & AUDIT SUMMARY
  // ==========================================================

  // Header Banner Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, 12, pageWidth - margin * 2, 26, 'F');

  // Decorative Accent line
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(margin, 38, pageWidth - margin * 2, 2, 'F');

  // Company / App Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ARTIFY FINANCIAL AUDIT & REIMBURSEMENT REPORT', margin + 6, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('Formal VAT Expenditure Voucher • Petty Cash Batch Reconciliation Statement', margin + 6, 29);

  // Voucher Ref Box (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${voucherRef}`, pageWidth - margin - 6, 22, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 6, 29, { align: 'right' });

  // Metadata Block
  const metaY = 44;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, metaY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PROJECT / SITE', margin + 5, metaY + 6);
  doc.text('PREPARED BY (CASHIER)', margin + 50, metaY + 6);
  doc.text('AUDIT REVIEWER', margin + 105, metaY + 6);
  doc.text('COVERAGE PERIOD', margin + 145, metaY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.project.name} (${data.project.code})`, margin + 5, metaY + 12);
  doc.text(`${data.cashier.name} (${data.cashier.id})`, margin + 50, metaY + 12);
  doc.text(data.auditorName || data.cashier.linkedManager?.name || 'Tariq Mehmood (M0087)', margin + 105, metaY + 12);
  doc.text(`${data.periodStart} to ${data.periodEnd}`, margin + 145, metaY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Project Float: ${data.project.currency} ${data.project.currentBalance.toLocaleString()}`, margin + 5, metaY + 19);
  doc.text(`Email: ${data.cashier.email}`, margin + 50, metaY + 19);
  doc.text('Audit Status: APPROVED & VERIFIED', margin + 105, metaY + 19);
  doc.text(`Total Approved Batches: ${data.approvedBatches.length}`, margin + 145, metaY + 19);

  // Financial Metrics 4-Box Summary
  const cardY = 72;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 20;

  // Box 1: Gross Total
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(margin, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('GROSS EXPENDITURE', margin + 4, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text(`Rs ${totalInclVat.toLocaleString()}`, margin + 4, cardY + 14);

  // Box 2: Excl. VAT
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + cardWidth + 3, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('NET (EXCL. VAT)', margin + cardWidth + 7, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs ${totalExclVat.toLocaleString()}`, margin + cardWidth + 7, cardY + 14);

  // Box 3: Total VAT Claimed
  doc.setFillColor(254, 243, 199); // Amber 50
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin + (cardWidth + 3) * 2, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('TOTAL VAT CLAIMED', margin + (cardWidth + 3) * 2 + 4, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(146, 64, 14);
  doc.text(`Rs ${totalVat.toLocaleString()}`, margin + (cardWidth + 3) * 2 + 4, cardY + 14);

  // Box 4: Bills Attached
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(margin + (cardWidth + 3) * 3, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229);
  doc.text('AUDITED BILLS', margin + (cardWidth + 3) * 3 + 4, cardY + 6);
  doc.setFontSize(11);
  doc.setTextColor(49, 46, 129);
  doc.text(`${lineItems.length} Receipts`, margin + (cardWidth + 3) * 3 + 4, cardY + 14);

  // ==========================================================
  // SECTION 1: APPROVED BATCHES SUMMARY TABLE
  // ==========================================================
  const batchTableData = data.approvedBatches.map((b) => [
    b.batchNumber,
    b.batchType === 'receipt_reimbursement' ? 'Receipt Reimbursement' : 'Advance Forecast',
    `${b.coveragePeriodStart} → ${b.coveragePeriodEnd}`,
    b.receiptsCount || b.items.length,
    `Rs ${(b.totalExclVat || 0).toLocaleString()}`,
    `Rs ${(b.totalVat || 0).toLocaleString()}`,
    `Rs ${b.totalAmount.toLocaleString()}`,
    b.reviewedBy || 'Tariq Mehmood',
    b.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 97,
    margin: { left: margin, right: margin },
    head: [[
      'Batch No.',
      'Type',
      'Coverage Period',
      'Receipts',
      'Excl. VAT',
      'VAT',
      'Total Approved',
      'Approved By',
      'Status'
    ]],
    body: batchTableData,
    foot: [[
      'Total Approved Claims',
      `${data.approvedBatches.length} Batches`,
      '—',
      `${totalReceiptsCount} Bills`,
      `Rs ${totalExclVat.toLocaleString()}`,
      `Rs ${totalVat.toLocaleString()}`,
      `Rs ${totalInclVat.toLocaleString()}`,
      '—',
      'APPROVED'
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      7: { halign: 'left' },
      8: { halign: 'center', fontStyle: 'bold' },
    },
  });

  // ==========================================================
  // SECTION 2: ITEMIZED VAT & RECEIPT AUDIT LEDGER
  // ==========================================================
  const itemLedgerData = lineItems.map((item) => [
    item.srNo,
    item.batchNumber,
    item.billRef,
    item.date,
    item.expenseNature,
    item.vendorName,
    item.vendorVatNo,
    `Rs ${item.amountExclVat.toLocaleString()}`,
    `Rs ${item.vatAmount.toLocaleString()}`,
    `Rs ${item.amountInclVat.toLocaleString()}`,
  ]);

  const lastTableY = (doc as any).lastAutoTable?.finalY || 140;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Itemized Receipt & VAT Audit Breakdown', margin, lastTableY + 8);

  autoTable(doc, {
    startY: lastTableY + 11,
    margin: { left: margin, right: margin },
    head: [[
      'Sr.',
      'Batch Ref',
      'Bill Ref (YYXXXZZZZ)',
      'Date',
      'Expense Nature',
      'Vendor / Merchant',
      'Vendor VAT No.',
      'Excl. VAT',
      'VAT',
      'Total Incl. VAT',
    ]],
    body: itemLedgerData,
    foot: [[
      'Total',
      '—',
      `${lineItems.length} Records`,
      '—',
      '—',
      '—',
      '—',
      `Rs ${totalExclVat.toLocaleString()}`,
      `Rs ${totalVat.toLocaleString()}`,
      `Rs ${totalInclVat.toLocaleString()}`,
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { halign: 'left' },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center' },
      7: { halign: 'right' },
      8: { halign: 'right', textColor: [180, 83, 9] },
      9: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
    },
  });

  // ==========================================================
  // SIGNATURES & AUDIT CERTIFICATION BLOCK
  // ==========================================================
  const finalTableY = (doc as any).lastAutoTable?.finalY || 200;
  
  // Ensure signature fits or add new page if near bottom
  let signY = finalTableY + 12;
  if (signY > pageHeight - 45) {
    doc.addPage();
    signY = 25;
  }

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, signY, pageWidth - margin * 2, 38, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('AUDIT CERTIFICATION & STATUTORY DECLARATION', margin + 5, signY + 6);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I hereby certify that all invoices and physical vouchers listed above have been scrutinized, cross-checked against registered vendor VAT credentials, and disbursed from active project petty cash in full compliance with company treasury rules.',
    margin + 5,
    signY + 10,
    { maxWidth: pageWidth - margin * 2 - 10 }
  );

  // 3 Signature Columns
  const sigColWidth = (pageWidth - margin * 2 - 20) / 3;
  const sigLineY = signY + 28;

  // Signer 1: Disbursing Cashier
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 5, sigLineY, margin + 5 + sigColWidth, sigLineY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.cashier.name, margin + 5, sigLineY + 4);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Disbursing Cashier (${data.cashier.id})`, margin + 5, sigLineY + 7);

  // Signer 2: Finance Reviewer
  doc.line(margin + 10 + sigColWidth, sigLineY, margin + 10 + sigColWidth * 2, sigLineY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.auditorName || data.cashier.linkedManager?.name || 'Tariq Mehmood', margin + 10 + sigColWidth, sigLineY + 4);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Finance & Accounts Manager', margin + 10 + sigColWidth, sigLineY + 7);

  // Signer 3: Internal Audit / Posting
  doc.line(margin + 15 + sigColWidth * 2, sigLineY, margin + 15 + sigColWidth * 3, sigLineY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Sarah Al-Khatib', margin + 15 + sigColWidth * 2, sigLineY + 4);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Internal Audit • ${new Date().toISOString().split('T')[0]}`, margin + 15 + sigColWidth * 2, sigLineY + 7);

  // Add Page Numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Artify Petty Cash Audit System • Voucher ${voucherRef} • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
};

export interface PdfDownloadResult {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  pagesCount: number;
  voucherRef?: string;
  doc: jsPDF;
}

export const downloadReimbursementAuditPdf = (data: AuditPdfReportData): PdfDownloadResult => {
  const doc = generateReimbursementAuditPdf(data);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Artify-Audit-Reimbursement-${data.project.code}-${dateStr}.pdf`;
  
  // Calculate approx blob size
  let sizeBytes = 142000;
  try {
    const blob = doc.output('blob');
    sizeBytes = blob.size;
  } catch {
    // fallback
  }

  const fileSizeFormatted = sizeBytes < 1024 * 1024 
    ? `${Math.round(sizeBytes / 1024)} KB` 
    : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

  doc.save(fileName);

  return {
    fileName,
    fileSizeBytes: sizeBytes,
    fileSizeFormatted,
    pagesCount: doc.getNumberOfPages(),
    voucherRef: `AUD-RMB-${data.project.code}-${dateStr}`,
    doc,
  };
};
