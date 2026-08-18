import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Sparkles, 
  Receipt, 
  TrendingUp, 
  Eye, 
  FileCheck2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManagerSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagerSimulatorModal: React.FC<ManagerSimulatorModalProps> = ({ isOpen, onClose }) => {
  const {
    cashier,
    closures,
    fundRequests,
    simulateManagerApproveClosure,
    simulateManagerRejectClosure,
    startManagerReview,
    simulateManagerApproveBatch,
    simulateManagerRejectBatch,
  } = useCashier();

  const [rejectReason, setRejectReason] = useState('Missing vendor tax invoice copy or unclear receipt image');
  const [batchApprovalNote, setBatchApprovalNote] = useState('All attached receipts & VAT numbers verified against project budget. Approved.');
  const [activeTab, setActiveTab] = useState<'requests' | 'closures'>('requests');

  if (!isOpen) return null;

  const pendingClosures = closures.filter((c) => c.status === 'pending_manager');
  const activeBatches = fundRequests.filter((r) => r.status === 'pending' || r.status === 'manager_review');

  const managerName = cashier.linkedManager ? cashier.linkedManager.name : 'Tariq Mehmood (M0087)';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-950/80 to-slate-900 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Manager Review Console
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold">Workflow Engine</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Acting as <strong className="text-blue-300">{managerName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'requests'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reimbursement Batches ({activeBatches.length})
            </button>
            <button
              onClick={() => setActiveTab('closures')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'closures'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Closures Review ({pendingClosures.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {activeTab === 'requests' ? (
              activeBatches.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                  <p className="font-semibold text-slate-300">No active batches requiring review</p>
                  <p className="text-[11px] text-slate-500">
                    Submit a reimbursement batch or advance request from the Cashier app to test workflow transitions.
                  </p>
                </div>
              ) : (
                activeBatches.map((req) => {
                  const isRmb = req.batchType === 'receipt_reimbursement';
                  const isUnderReview = req.status === 'manager_review';

                  return (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isRmb ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {isRmb ? <Receipt className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200 font-mono">#{req.batchNumber}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isUnderReview ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {isUnderReview ? 'In Review' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px]">{req.projectName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">Rs {req.totalAmount.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {isRmb ? `${req.receiptsCount || req.items.length} Scanned Receipts` : `${req.items.length} Forecast Items`}
                          </div>
                        </div>
                      </div>

                      {req.submissionNotes && (
                        <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg italic border-l-2 border-blue-400">
                          "{req.submissionNotes}"
                        </p>
                      )}

                      <div className="bg-slate-900/80 p-2 rounded-lg text-[11px] text-slate-300 font-mono flex items-center justify-between">
                        <span>Period: {req.coveragePeriodStart} to {req.coveragePeriodEnd}</span>
                        {req.totalVat && req.totalVat > 0 ? (
                          <span className="text-amber-300">VAT: Rs {req.totalVat}</span>
                        ) : null}
                      </div>

                      {/* Multi-Stage Workflow Controls */}
                      <div className="pt-1 space-y-2">
                        {/* If in pending state, allow moving to 'manager_review' */}
                        {req.status === 'pending' && (
                          <button
                            onClick={() => startManagerReview(req.id, managerName)}
                            className="w-full py-2 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            1. Start Audit Review (Move to 'Manager Review')
                          </button>
                        )}

                        {/* Approval / Rejection Decision Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              simulateManagerApproveBatch(req.id, batchApprovalNote);
                              onClose();
                            }}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve Reimbursement
                          </button>
                          <button
                            onClick={() => {
                              simulateManagerRejectBatch(req.id, rejectReason);
                              onClose();
                            }}
                            className="py-2 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 font-bold border border-rose-700/50 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : pendingClosures.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-slate-300">No pending closures</p>
                <p className="text-[11px] text-slate-500">
                  Submit a closure from the Dashboard ("Close Petty Cash") while linked to a manager to test closure review.
                </p>
              </div>
            ) : (
              pendingClosures.map((closure) => (
                <div
                  key={closure.id}
                  className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-200">{closure.closureNumber}</div>
                      <div className="text-slate-400 text-[11px]">{closure.projectName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">Rs {closure.totalInclVat.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{closure.entryCount} entries</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg text-[11px] text-slate-300 space-y-1 font-mono">
                    <div>Cashier: {closure.cashierName} ({closure.cashierId})</div>
                    <div>Period: {closure.periodStart} to {closure.periodEnd}</div>
                    <div>VAT Total: Rs {closure.totalVat.toLocaleString()}</div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => {
                        simulateManagerApproveClosure(closure.id);
                        onClose();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve & Unlock PDF
                    </button>
                    <button
                      onClick={() => {
                        simulateManagerRejectClosure(closure.id, rejectReason);
                        onClose();
                      }}
                      className="py-2 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 font-bold border border-rose-700/50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Note */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                The Approval Workflow transitions each request through formal states: <strong>Pending → Manager Review → Approved/Rejected → Float Disbursed</strong>.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
