import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  User, 
  RotateCcw,
  Sparkles,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Loader2,
  Check
} from 'lucide-react';
import { PettyCashClosure, FundRequestBatch } from '../types';
import { downloadReimbursementAuditPdf, generateReimbursementAuditPdf } from '../utils/pdfGenerator';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export const ClosureReportPdfScreen: React.FC = () => {
  const { 
    closures, 
    activeClosureForPdf, 
    fundRequests,
    activeProject,
    projects, 
    cashier, 
    goBack, 
    navigateTo, 
    addToast 
  } = useCashier();

  // Mode: 'single_closure' | 'all_approved_batches'
  const [reportScope, setReportScope] = useState<'single_closure' | 'all_approved_batches'>('all_approved_batches');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lastDownloadedFile, setLastDownloadedFile] = useState<string | null>(null);

  const approvedClosures = closures.filter((c) => c.status === 'approved');
  const approvedBatches = fundRequests.filter(
    (b) => b.projectId === activeProject.id && (b.status === 'approved' || b.status === 'fulfilled')
  );

  const [selectedClosureId, setSelectedClosureId] = useState<string>(
    activeClosureForPdf?.id || approvedClosures[0]?.id || ''
  );

  const closure = closures.find((c) => c.id === selectedClosureId) || activeClosureForPdf || approvedClosures[0];

  // Determine batches and transactions to compile
  const targetBatches = reportScope === 'all_approved_batches' 
    ? (approvedBatches.length > 0 ? approvedBatches : fundRequests.filter(b => b.projectId === activeProject.id))
    : (closure ? [{
        id: closure.id,
        batchNumber: closure.closureNumber,
        batchType: 'receipt_reimbursement' as const,
        projectId: closure.projectId,
        projectName: closure.projectName,
        coveragePeriodStart: closure.periodStart,
        coveragePeriodEnd: closure.periodEnd,
        items: closure.transactions.map((t, idx) => ({
          id: `item-${idx}`,
          expenseNature: t.expenseNature,
          quantity: 1,
          uom: 'Bill',
          rate: t.amountInclVat,
          amount: t.amountInclVat,
          vendorName: t.paidTo,
          notes: t.remarks,
          billRef: t.billRef,
          vatAmount: t.vatAmount,
          status: 'approved' as const,
          attachmentUrl: t.attachmentUrl,
        })),
        groupedReceipts: closure.transactions.map((t) => ({
          transactionId: t.id,
          billRef: t.billRef,
          paidTo: t.paidTo,
          expenseNature: t.expenseNature,
          amountExclVat: t.amountExclVat,
          vatAmount: t.vatAmount,
          amountInclVat: t.amountInclVat,
          date: t.date,
          attachmentUrl: t.attachmentUrl,
          vendorVatRegNo: t.vendorVatRegNo,
        })),
        receiptsCount: closure.entryCount,
        totalAmount: closure.totalInclVat,
        totalExclVat: closure.totalExclVat,
        totalVat: closure.totalVat,
        status: 'approved' as const,
        requestedAt: closure.submittedAt,
        approvedAt: closure.approvedAt,
        reviewedBy: closure.approvedBy,
        cashierId: closure.cashierId,
        cashierName: closure.cashierName,
      }] : []);

  // Aggregated totals
  const totalGross = targetBatches.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalVat = targetBatches.reduce((sum, b) => sum + (b.totalVat || 0), 0);
  const totalExclVat = targetBatches.reduce((sum, b) => sum + (b.totalExclVat || (b.totalAmount - (b.totalVat || 0))), 0);
  const totalReceipts = targetBatches.reduce((sum, b) => sum + (b.receiptsCount || b.items.length), 0);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    
    setTimeout(() => {
      try {
        const result = downloadReimbursementAuditPdf({
          project: activeProject,
          cashier,
          approvedBatches: targetBatches,
          periodStart: targetBatches[0]?.coveragePeriodStart || '2026-08-01',
          periodEnd: targetBatches[targetBatches.length - 1]?.coveragePeriodEnd || '2026-08-18',
          auditorName: cashier.linkedManager?.name || 'Tariq Mehmood (M0087)',
        });

        setLastDownloadedFile(result.fileName);

        // Visual celebration
        try {
          confetti({
            particleCount: 50,
            spread: 55,
            origin: { y: 0.2, x: 0.5 },
          });
        } catch {
          // ignore
        }

        // Trigger rich feedback toast
        addToast({
          type: 'pdf_download',
          title: 'Closure PDF Downloaded Successfully',
          message: `Reimbursement audit statement and ${totalReceipts} line-item vouchers compiled into standard PDF.`,
          meta: {
            fileName: result.fileName,
            fileSize: result.fileSizeFormatted,
            grossAmount: totalGross,
            vatAmount: totalVat,
            entriesCount: totalReceipts,
            voucherRef: result.voucherRef,
            projectCode: activeProject.code,
            pagesCount: result.pagesCount,
          },
          action: {
            label: 'Print View',
            onClick: () => window.print(),
          },
          secondaryAction: {
            label: 'Re-download',
            onClick: () => handleDownloadPdf(),
          },
          duration: 7500,
        });
      } catch (e) {
        console.error(e);
        addToast({
          type: 'error',
          title: 'PDF Generation Error',
          message: 'Could not compile PDF. Opening system print preview instead.',
        });
        window.print();
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 450);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Audit Reimbursement Report - ${activeProject.name}`,
        text: `Formal Petty Cash & Reimbursement Statement for ${activeProject.name} (Rs ${totalGross.toLocaleString()})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      addToast({
        type: 'info',
        title: 'Report Link Copied',
        message: 'Shareable report link copied to clipboard.',
      });
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <button
          onClick={goBack}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            title="Share Statement"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download Audit PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scope Selector & Metadata Card */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                ✓ Financial Audit Report Generator
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-mono text-[10px]">
                jsPDF Engine
              </span>
            </div>
            <h2 className="text-base font-black text-white mt-1.5">
              {activeProject.name} — Audited Closure Statement
            </h2>
            <p className="text-xs text-slate-400">
              Compiles approved reimbursement batches & verified VAT vouchers into print-ready documentation.
            </p>
          </div>

          {/* Scope Toggle */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setReportScope('all_approved_batches')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                reportScope === 'all_approved_batches'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Approved Batches ({approvedBatches.length})
            </button>
            <button
              onClick={() => setReportScope('single_closure')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                reportScope === 'single_closure'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Closure Voucher
            </button>
          </div>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Gross Expenditure</span>
            <span className="text-lg font-mono font-extrabold text-emerald-400">
              Rs {totalGross.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Net Excl. VAT</span>
            <span className="text-lg font-mono font-extrabold text-slate-200">
              Rs {totalExclVat.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total VAT Claimed</span>
            <span className="text-lg font-mono font-extrabold text-amber-300">
              Rs {totalVat.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Compiled Batches</span>
            <span className="text-lg font-mono font-extrabold text-blue-300">
              {targetBatches.length} ({totalReceipts} Bills)
            </span>
          </div>
        </div>
      </div>

      {/* Formal Printable Document Canvas (Formatted for Financial Auditing) */}
      <div
        id="printable-report"
        className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0"
      >
        {/* Formal Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 font-extrabold text-sm flex items-center justify-center">
                AC
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  ARTIFY FINANCIAL AUDIT & REIMBURSEMENT STATEMENT
                </h1>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                  Audited Petty Cash Batch Reconciliation & VAT Expenditure Voucher
                </p>
              </div>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <div className="font-mono font-bold text-sm text-slate-900">
              VOUCHER: AUD-RMB-{activeProject.code}-2026-01
            </div>
            <div className="text-slate-600">Generated: {new Date().toLocaleDateString()}</div>
            <div className="font-bold text-emerald-800 text-[11px]">AUDIT STATUS: APPROVED & CERTIFIED</div>
          </div>
        </div>

        {/* Voucher Meta Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-300 text-xs">
          <div>
            <span className="text-slate-500 font-bold uppercase text-[9px] block">Project / Site</span>
            <span className="font-bold text-slate-900">{activeProject.name} ({activeProject.code})</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase text-[9px] block">Disbursing Cashier</span>
            <span className="font-semibold text-slate-900">{cashier.name} ({cashier.id})</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase text-[9px] block">Period Covered</span>
            <span className="font-mono text-slate-900">
              {targetBatches[0]?.coveragePeriodStart || '2026-08-01'} — {targetBatches[targetBatches.length - 1]?.coveragePeriodEnd || '2026-08-18'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase text-[9px] block">Authorized Reviewer</span>
            <span className="font-semibold text-emerald-800">
              {cashier.linkedManager?.name || 'Tariq Mehmood (Senior Finance Manager)'}
            </span>
          </div>
        </div>

        {/* Table 1: Compiled Approved Batches Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
            <span>Compiled Approved Reimbursement Batches ({targetBatches.length})</span>
            <span className="text-[10px] font-mono text-slate-500">Summary Ledger</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-900 text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-center">
                  <th className="border border-slate-900 p-2">Batch No.</th>
                  <th className="border border-slate-900 p-2">Type</th>
                  <th className="border border-slate-900 p-2">Coverage Period</th>
                  <th className="border border-slate-900 p-2">Receipts</th>
                  <th className="border border-slate-900 p-2 text-right">Excl. VAT</th>
                  <th className="border border-slate-900 p-2 text-right">VAT Amount</th>
                  <th className="border border-slate-900 p-2 text-right">Total Approved</th>
                  <th className="border border-slate-900 p-2 text-left">Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                {targetBatches.map((b, idx) => (
                  <tr key={b.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="border border-slate-400 p-2 font-mono font-bold">{b.batchNumber}</td>
                    <td className="border border-slate-400 p-2 font-medium">
                      {b.batchType === 'receipt_reimbursement' ? 'Receipt Reimbursement' : 'Advance Forecast'}
                    </td>
                    <td className="border border-slate-400 p-2 font-mono text-center">
                      {b.coveragePeriodStart} → {b.coveragePeriodEnd}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-bold">
                      {b.receiptsCount || b.items.length} Bills
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono">
                      Rs {(b.totalExclVat || (b.totalAmount - (b.totalVat || 0))).toLocaleString()}
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono text-amber-800">
                      Rs {(b.totalVat || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono font-bold text-emerald-800">
                      Rs {b.totalAmount.toLocaleString()}
                    </td>
                    <td className="border border-slate-400 p-2 text-[10px] text-slate-600 italic">
                      {b.managerNotes || 'Verified & approved by finance manager'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={4} className="border border-slate-900 p-2 text-right font-black uppercase">
                    Compiled Grand Totals:
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono font-extrabold">
                    Rs {totalExclVat.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono font-extrabold text-amber-800">
                    Rs {totalVat.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono font-black text-slate-950 text-xs">
                    Rs {totalGross.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 p-2 text-[10px] text-slate-600 font-normal">
                    Disbursed from Float
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Table 2: Detailed Line-Item Audit Ledger */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Itemized VAT & Receipt Scrutiny Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-900 text-[10px]">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-center">
                  <th className="border border-slate-800 p-1.5 w-7">Sr.</th>
                  <th className="border border-slate-800 p-1.5">Batch Ref</th>
                  <th className="border border-slate-800 p-1.5">Bill Ref (YYXXXZZZZ)</th>
                  <th className="border border-slate-800 p-1.5">Date</th>
                  <th className="border border-slate-800 p-1.5">Expense Nature</th>
                  <th className="border border-slate-800 p-1.5">Vendor / Merchant</th>
                  <th className="border border-slate-800 p-1.5">Vendor VAT Reg.</th>
                  <th className="border border-slate-800 p-1.5 text-right">Excl. VAT</th>
                  <th className="border border-slate-800 p-1.5 text-right">VAT</th>
                  <th className="border border-slate-800 p-1.5 text-right">Total Incl. VAT</th>
                </tr>
              </thead>
              <tbody>
                {targetBatches.flatMap((batch) =>
                  batch.groupedReceipts && batch.groupedReceipts.length > 0
                    ? batch.groupedReceipts.map((r, rIdx) => ({
                        batchNumber: batch.batchNumber,
                        billRef: r.billRef,
                        date: r.date,
                        expenseNature: r.expenseNature,
                        vendorName: r.paidTo,
                        vendorVatRegNo: r.vendorVatRegNo,
                        amountExclVat: r.amountExclVat,
                        vatAmount: r.vatAmount,
                        amountInclVat: r.amountInclVat,
                      }))
                    : batch.items.map((it) => ({
                        batchNumber: batch.batchNumber,
                        billRef: it.billRef || `REQ-${it.id.slice(-4)}`,
                        date: batch.requestedAt.split('T')[0],
                        expenseNature: it.expenseNature,
                        vendorName: it.vendorName,
                        vendorVatRegNo: 'N/A',
                        amountExclVat: it.amount - (it.vatAmount || 0),
                        vatAmount: it.vatAmount || 0,
                        amountInclVat: it.amount,
                      }))
                ).map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="border border-slate-400 p-1.5 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="border border-slate-400 p-1.5 font-mono">{item.batchNumber}</td>
                    <td className="border border-slate-400 p-1.5 font-mono font-bold whitespace-nowrap">{item.billRef}</td>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">{item.date}</td>
                    <td className="border border-slate-400 p-1.5">{item.expenseNature}</td>
                    <td className="border border-slate-400 p-1.5 font-semibold">{item.vendorName}</td>
                    <td className="border border-slate-400 p-1.5 font-mono text-[9px]">{item.vendorVatRegNo || 'N/A'}</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">
                      Rs {item.amountExclVat.toLocaleString()}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono text-amber-800">
                      Rs {item.vatAmount.toLocaleString()}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-900">
                      Rs {item.amountInclVat.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures & Certification Block */}
        <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-300 text-xs">
          <div className="text-center space-y-8">
            <div className="border-b border-slate-400 pb-1 font-semibold text-slate-800">
              {cashier.name}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Prepared by (Cashier)</span>
          </div>

          <div className="text-center space-y-8">
            <div className="border-b border-slate-400 pb-1 font-semibold text-slate-800">
              {cashier.linkedManager?.name || 'Tariq Mehmood (M0087)'}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Verified & Approved (Manager)</span>
          </div>

          <div className="text-center space-y-8">
            <div className="border-b border-slate-400 pb-1 font-mono text-slate-800">
              {new Date().toISOString().split('T')[0]}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Audit Posting Date</span>
          </div>
        </div>
      </div>
    </div>
  );
};
