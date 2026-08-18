import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  Send, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Layers, 
  Calendar, 
  Building2, 
  User, 
  DollarSign, 
  ArrowLeft,
  X,
  FileCheck,
  Sparkles,
  Receipt,
  TrendingUp,
  ShieldCheck,
  ZoomIn,
  Wallet,
  CornerDownRight,
  History,
  Trash2,
  ExternalLink,
  Eye,
  Check,
  ArrowRight,
  FileText
} from 'lucide-react';
import { FundRequestBatch, GroupedReceiptSummary, ReimbursementWorkflowStatus } from '../types';
import { ImageModal } from '../components/ImageModal';
import { motion, AnimatePresence } from 'motion/react';

export const RequestsTabScreen: React.FC<{ onOpenManagerSimulator: () => void }> = ({ onOpenManagerSimulator }) => {
  const { 
    fundRequests, 
    navigateTo, 
    selectedFundBatch, 
    setSelectedFundBatch,
    reimburseFundBatch,
    cancelFundBatch,
    startManagerReview,
    approveReimbursementRequest,
    rejectReimbursementRequest,
    getApprovalWorkflowEvents,
    activeProject,
    goBack 
  } = useCashier();

  const [activeDetailBatch, setActiveDetailBatch] = useState<FundRequestBatch | null>(selectedFundBatch);
  const [filterTab, setFilterTab] = useState<'all' | 'reimbursements' | 'advances' | 'pending' | 'manager_review' | 'approved' | 'rejected'>('all');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState('');

  const filteredBatches = fundRequests.filter((b) => {
    if (filterTab === 'reimbursements') return b.batchType === 'receipt_reimbursement';
    if (filterTab === 'advances') return b.batchType === 'advance_forecast';
    if (filterTab === 'pending') return b.status === 'pending';
    if (filterTab === 'manager_review') return b.status === 'manager_review';
    if (filterTab === 'approved') return b.status === 'approved' || b.status === 'fulfilled';
    if (filterTab === 'rejected') return b.status === 'rejected';
    return true;
  });

  const getStatusChip = (status: ReimbursementWorkflowStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Pending Review
          </span>
        );
      case 'manager_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <Eye className="w-3 h-3 text-blue-400" /> Manager Review
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
          </span>
        );
      case 'fulfilled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-bold flex items-center gap-1">
            <Wallet className="w-3 h-3 text-teal-400" /> Disbursed & Added
          </span>
        );
      case 'partially_approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-400" /> Partially Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleClaimReimbursement = (batch: FundRequestBatch) => {
    const res = reimburseFundBatch(batch.id);
    if (res.success) {
      setActiveDetailBatch((prev) => (prev && prev.id === batch.id ? { ...prev, status: 'fulfilled' } : prev));
    }
  };

  const handleCancelBatch = (batchId: string) => {
    if (confirm('Are you sure you want to withdraw this batch request? Attached receipts will be returned to your open transactions pool.')) {
      cancelFundBatch(batchId);
      setActiveDetailBatch(null);
    }
  };

  // Workflow pipeline step calculation
  const getWorkflowStep = (status: ReimbursementWorkflowStatus): number => {
    switch (status) {
      case 'pending':
        return 1;
      case 'manager_review':
        return 2;
      case 'approved':
      case 'rejected':
        return 3;
      case 'fulfilled':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Fund Requests & Approval Workflow
            </h2>
            <p className="text-[11px] text-slate-400">
              Multi-stage state transitions: Pending → Manager Review → Decision → Float Disbursement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigateTo('closure_pdf')}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
            title="Generate print-ready Audit PDF report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Audit PDF</span>
          </button>

          <button
            onClick={() => navigateTo('request_funds')}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> + New Batch
          </button>
        </div>
      </div>

      {/* Workflow Stage Helper Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-200">Approval Workflow Engine Active</h4>
            <p className="text-[10px] text-slate-400">Simulate manager audit, review states, approvals & rejections</p>
          </div>
        </div>
        <button
          onClick={onOpenManagerSimulator}
          className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-xs font-bold transition-all shrink-0"
        >
          Open Console
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: `All (${fundRequests.length})` },
          { id: 'reimbursements', label: `Reimbursements (${fundRequests.filter(b => b.batchType === 'receipt_reimbursement').length})` },
          { id: 'advances', label: `Advances (${fundRequests.filter(b => b.batchType === 'advance_forecast').length})` },
          { id: 'pending', label: `Pending (${fundRequests.filter(b => b.status === 'pending').length})` },
          { id: 'manager_review', label: `Reviewing (${fundRequests.filter(b => b.status === 'manager_review').length})` },
          { id: 'approved', label: `Approved/Paid (${fundRequests.filter(b => b.status === 'approved' || b.status === 'fulfilled').length})` },
          { id: 'rejected', label: `Rejected (${fundRequests.filter(b => b.status === 'rejected').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-600" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">No Fund Batches in this Status</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Submit a new reimbursement claim or switch filter tabs to view other records.
            </p>
          </div>
          <button
            onClick={() => navigateTo('request_funds')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-950"
          >
            <Receipt className="w-3.5 h-3.5" /> Group Scanned Receipts Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBatches.map((batch) => {
            const isReimbursement = batch.batchType === 'receipt_reimbursement';
            const count = isReimbursement ? (batch.receiptsCount || batch.transactionIds?.length || batch.items.length) : batch.items.length;
            const currentStep = getWorkflowStep(batch.status);

            return (
              <div
                key={batch.id}
                onClick={() => setActiveDetailBatch(batch)}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl shadow-xl transition-all cursor-pointer space-y-3 group"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isReimbursement ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {isReimbursement ? <Receipt className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-white group-hover:text-blue-400 transition-colors">
                          #{batch.batchNumber}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${isReimbursement ? 'bg-emerald-500/10 text-emerald-300' : 'bg-blue-500/10 text-blue-300'}`}>
                          {isReimbursement ? 'Receipt Reimbursement' : 'Advance Requisition'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{batch.projectName}</span>
                      </p>
                    </div>
                  </div>

                  {getStatusChip(batch.status)}
                </div>

                {/* Workflow State Step Progress Bar */}
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      1
                    </span>
                    <span className={currentStep === 1 ? 'font-bold text-blue-300' : ''}>Pending</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-600" />

                  <div className="flex items-center gap-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      2
                    </span>
                    <span className={currentStep === 2 ? 'font-bold text-blue-300' : ''}>Review</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-600" />

                  <div className="flex items-center gap-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                      batch.status === 'rejected' ? 'bg-rose-600 text-white' : (currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500')
                    }`}>
                      3
                    </span>
                    <span className={currentStep === 3 ? (batch.status === 'rejected' ? 'font-bold text-rose-300' : 'font-bold text-emerald-300') : ''}>
                      {batch.status === 'rejected' ? 'Rejected' : 'Approved'}
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-600" />

                  <div className="flex items-center gap-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${currentStep >= 4 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                      4
                    </span>
                    <span className={currentStep === 4 ? 'font-bold text-teal-300' : ''}>Disbursed</span>
                  </div>
                </div>

                {/* Scanned Receipt Thumbnails Preview if Reimbursement */}
                {isReimbursement && batch.groupedReceipts && batch.groupedReceipts.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-2 overflow-hidden">
                      {batch.groupedReceipts.slice(0, 4).map((r, i) => (
                        <div
                          key={i}
                          className="inline-block h-8 w-8 rounded-lg ring-2 ring-slate-900 bg-slate-950 border border-slate-700 overflow-hidden"
                        >
                          <img
                            src={r.attachmentUrl}
                            alt={r.paidTo}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {batch.groupedReceipts.length} Attached Receipts
                    </span>
                    {batch.totalVat && batch.totalVat > 0 && (
                      <span className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-1.5 py-0.2 rounded ml-auto">
                        VAT: Rs {batch.totalVat.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Batch Summary & Amount */}
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {batch.coveragePeriodStart} → {batch.coveragePeriodEnd}
                    </span>
                  </div>

                  <div className="font-mono font-extrabold text-sm text-emerald-400">
                    Rs {batch.totalAmount.toLocaleString()}
                  </div>
                </div>

                {/* Manager Notes / Reviewer Footer */}
                {batch.managerNotes && (
                  <div className="text-[11px] bg-slate-950/40 border-l-2 border-blue-500 pl-2.5 py-1 text-slate-300 italic flex items-center justify-between">
                    <span>"{batch.managerNotes}"</span>
                    {batch.reviewedBy && (
                      <span className="text-[10px] text-slate-500 not-italic ml-2 font-mono shrink-0">
                        — {batch.reviewedBy}
                      </span>
                    )}
                  </div>
                )}

                {batch.rejectionReason && (
                  <div className="text-[11px] bg-rose-950/30 border-l-2 border-rose-500 pl-2.5 py-1 text-rose-300 italic">
                    Reason: {batch.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* DETAILED BATCH MODAL & WORKFLOW TIMELINE */}
      {/* ==================================================== */}
      <AnimatePresence>
        {activeDetailBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">
                      #{activeDetailBatch.batchNumber}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold uppercase">
                      {activeDetailBatch.batchType === 'receipt_reimbursement' ? 'Receipt Reimbursement' : 'Advance Forecast'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeDetailBatch.projectName}</p>
                </div>
                <button
                  onClick={() => setActiveDetailBatch(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Status & Amount Hero */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Reimbursement Total
                    </span>
                    <span className="text-xl font-mono font-extrabold text-emerald-400">
                      Rs {activeDetailBatch.totalAmount.toLocaleString()}
                    </span>
                    {activeDetailBatch.totalVat && activeDetailBatch.totalVat > 0 && (
                      <span className="text-[10px] text-amber-300 block font-mono">
                        Included VAT: Rs {activeDetailBatch.totalVat.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div>{getStatusChip(activeDetailBatch.status)}</div>
                </div>

                {/* Workflow State Stage Tracker */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Approval Workflow Stage
                  </h4>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] pt-1">
                    <div className={`p-2 rounded-lg border ${
                      getWorkflowStep(activeDetailBatch.status) >= 1 ? 'bg-blue-600/20 border-blue-500/40 text-blue-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      1. Pending
                    </div>
                    <div className={`p-2 rounded-lg border ${
                      getWorkflowStep(activeDetailBatch.status) >= 2 ? 'bg-blue-600/20 border-blue-500/40 text-blue-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      2. Review
                    </div>
                    <div className={`p-2 rounded-lg border ${
                      activeDetailBatch.status === 'rejected' ? 'bg-rose-900/30 border-rose-500/40 text-rose-200 font-bold' : (getWorkflowStep(activeDetailBatch.status) >= 3 ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500')
                    }`}>
                      3. Decision
                    </div>
                    <div className={`p-2 rounded-lg border ${
                      getWorkflowStep(activeDetailBatch.status) >= 4 ? 'bg-teal-600/20 border-teal-500/40 text-teal-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      4. Disbursed
                    </div>
                  </div>
                </div>

                {/* Audit Workflow Chronology */}
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    Approval Workflow Event History
                  </h4>

                  <div className="space-y-2.5 pt-1 text-[11px]">
                    {/* Events from workflowTransitions or statusHistory */}
                    {activeDetailBatch.workflowTransitions && activeDetailBatch.workflowTransitions.length > 0 ? (
                      activeDetailBatch.workflowTransitions.map((ev, i) => (
                        <div key={i} className="flex items-start gap-2.5 pb-2 border-b border-slate-800/60 last:border-0 last:pb-0">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                            ev.toStatus === 'approved' ? 'bg-emerald-400 ring-2 ring-emerald-950' : 
                            ev.toStatus === 'rejected' ? 'bg-rose-400 ring-2 ring-rose-950' : 
                            ev.toStatus === 'manager_review' ? 'bg-blue-400 ring-2 ring-blue-950' :
                            ev.toStatus === 'fulfilled' ? 'bg-teal-400 ring-2 ring-teal-950' : 'bg-amber-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200 capitalize">
                                {ev.toStatus.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">
                              By {ev.actor.name} ({ev.actor.role})
                            </p>
                            {ev.notes && (
                              <p className="text-[10px] text-slate-300 mt-0.5 bg-slate-900/60 p-1.5 rounded">
                                {ev.notes}
                              </p>
                            )}
                            {ev.rejectionReason && (
                              <p className="text-[10px] text-rose-300 mt-0.5 bg-rose-950/40 p-1.5 rounded border border-rose-800/50">
                                Declined: {ev.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start gap-2 text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-200">
                            Batch Created & Submitted
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {new Date(activeDetailBatch.requestedAt).toLocaleString()} • by {activeDetailBatch.cashierName || 'Cashier'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grouped Scanned Receipts List */}
                {activeDetailBatch.batchType === 'receipt_reimbursement' && activeDetailBatch.groupedReceipts ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                      <span>Attached Scanned Receipts ({activeDetailBatch.groupedReceipts.length})</span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">Tap image to zoom</span>
                    </h4>

                    <div className="space-y-2">
                      {activeDetailBatch.groupedReceipts.map((rcpt, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Zoomable Thumbnail */}
                            <div
                              onClick={() => {
                                setPreviewImageUrl(rcpt.attachmentUrl);
                                setPreviewImageTitle(`${rcpt.paidTo} • Ref: #${rcpt.billRef}`);
                              }}
                              className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 relative group cursor-pointer"
                              title="Click to zoom receipt"
                            >
                              <img
                                src={rcpt.attachmentUrl}
                                alt={rcpt.paidTo}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-blue-300">
                                  #{rcpt.billRef}
                                </span>
                                <span className="font-bold text-xs text-white truncate">
                                  {rcpt.paidTo}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{rcpt.expenseNature}</span>
                                <span>•</span>
                                <span>{rcpt.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-xs text-emerald-400 block">
                              Rs {rcpt.amountInclVat.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              VAT: Rs {rcpt.vatAmount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Line Items for Advance Forecast */
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Forecast Line Items ({activeDetailBatch.items.length})
                    </h4>
                    <div className="space-y-1.5">
                      {activeDetailBatch.items.map((it, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-200">{it.vendorName}</div>
                            <div className="text-[11px] text-slate-400">
                              {it.quantity} {it.uom} × Rs {it.rate} ({it.expenseNature})
                            </div>
                          </div>
                          <div className="font-mono font-bold text-emerald-400">
                            Rs {it.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
                {/* If approved, allow 1-click float replenishment */}
                {activeDetailBatch.status === 'approved' && (
                  <button
                    onClick={() => handleClaimReimbursement(activeDetailBatch)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Claim Reimbursement & Replenish Project Float</span>
                  </button>
                )}

                {/* If pending or manager_review, allow testing transitions in simulator */}
                {(activeDetailBatch.status === 'pending' || activeDetailBatch.status === 'manager_review') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveDetailBatch(null);
                        onOpenManagerSimulator();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Test Approval in Simulator
                    </button>
                    {activeDetailBatch.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBatch(activeDetailBatch.id)}
                        className="px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-colors"
                        title="Withdraw batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox for Scanned Receipt Image */}
      <ImageModal
        imageUrl={previewImageUrl || ''}
        title={previewImageTitle || 'Scanned Receipt View'}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
};
