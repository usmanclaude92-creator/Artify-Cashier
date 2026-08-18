import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  ArrowLeft, 
  FileCheck2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Undo2, 
  ShieldCheck, 
  Layers, 
  FileText,
  RotateCcw,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { Transaction, PettyCashClosure } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export const ClosePettyCashScreen: React.FC<{ onOpenManagerSimulator: () => void }> = ({ onOpenManagerSimulator }) => {
  const {
    cashier,
    activeProject,
    openTransactionsForActiveProject,
    createAndSubmitClosure,
    selfApproveClosure,
    setActiveClosureForPdf,
    navigateTo,
    goBack,
    addToast,
  } = useCashier();

  // Selected transactions to include in this closure
  const [includedTxIds, setIncludedTxIds] = useState<string[]>(
    openTransactionsForActiveProject.map((t) => t.id)
  );

  // Undo removal history
  const [removedTxList, setRemovedTxList] = useState<Transaction[]>([]);

  // Confirmation Dialog
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Post send state
  const [submittedClosure, setSubmittedClosure] = useState<PettyCashClosure | null>(null);

  // Included transactions objects
  const includedTransactions = openTransactionsForActiveProject.filter((t) =>
    includedTxIds.includes(t.id)
  );

  // Totals
  const totalInclVat = includedTransactions.reduce((s, t) => s + t.amountInclVat, 0);
  const totalExclVat = includedTransactions.reduce((s, t) => s + t.amountExclVat, 0);
  const totalVat = includedTransactions.reduce((s, t) => s + t.vatAmount, 0);

  // Remove from this closure
  const handleRemoveFromClosure = (tx: Transaction) => {
    setIncludedTxIds((prev) => prev.filter((id) => id !== tx.id));
    setRemovedTxList((prev) => [tx, ...prev]);

    addToast({
      type: 'info',
      title: 'Entry Removed from Batch',
      message: `Removed ${tx.paidTo} (Rs ${tx.amountInclVat.toLocaleString()}) from this closure. It remains open.`,
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => handleUndoRemove(tx.id),
      },
    });
  };

  const handleUndoRemove = (id: string) => {
    setIncludedTxIds((prev) => [...prev, id]);
    setRemovedTxList((prev) => prev.filter((t) => t.id !== id));
  };

  const handleConfirmAndSend = () => {
    if (includedTxIds.length === 0) return;
    setIsConfirmModalOpen(false);

    const isSelfApproving = cashier.isSelfApproving;
    const res = createAndSubmitClosure(activeProject.id, includedTxIds, isSelfApproving);

    if (res.success && res.closure) {
      setSubmittedClosure(res.closure);
      if (isSelfApproving) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore
        }
      }
    }
  };

  const handleApproveSelfReview = () => {
    if (!submittedClosure) return;
    selfApproveClosure(submittedClosure.id);
    setActiveClosureForPdf({ ...submittedClosure, status: 'approved' });
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    navigateTo('closure_pdf');
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-sm font-bold text-slate-100">Close Petty Cash (Final Review)</h2>
        <div className="w-10" />
      </div>

      {/* Screen 6c: Post-Send State */}
      {submittedClosure ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {submittedClosure.isSelfApproved ? (
            /* Self-Approving Cashier Result */
            <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                  Self-Approved
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Closure #{submittedClosure.closureNumber} Approved!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {submittedClosure.entryCount} entries totaling Rs {submittedClosure.totalInclVat.toLocaleString()} successfully closed.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl text-xs space-y-2 border border-slate-800 text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Project:</span>
                  <span>{submittedClosure.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Period:</span>
                  <span>{submittedClosure.periodStart} to {submittedClosure.periodEnd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total VAT:</span>
                  <span className="text-emerald-400 font-bold">Rs {submittedClosure.totalVat.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    setActiveClosureForPdf(submittedClosure);
                    navigateTo('closure_pdf');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Formal VAT PDF Report</span>
                </button>

                <button
                  onClick={() => navigateTo('dashboard')}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Sent to Manager Result */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded">
                  Pending Review
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Sent to Manager: {cashier.linkedManager?.name || 'Assigned Supervisor'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Closure #{submittedClosure.closureNumber} is submitted. You will be notified as soon as your manager approves.
                </p>
              </div>

              {/* Manager Simulation Helper */}
              <div className="p-3.5 bg-blue-950/40 border border-blue-600/30 rounded-2xl text-xs text-left space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Test Manager Flow:</span>
                </div>
                <p className="text-[11px] text-blue-200/80">
                  Open the Manager Simulator to approve this closure now and unlock the PDF report.
                </p>
                <button
                  onClick={onOpenManagerSimulator}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow transition-colors"
                >
                  Open Manager Simulator & Approve
                </button>
              </div>

              <button
                onClick={() => navigateTo('dashboard')}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        /* Screen 6b: Final Review List */
        <div className="space-y-4">
          {/* Header Summary Banner */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                {activeProject.name}
              </span>
              <h3 className="text-base font-extrabold text-white">
                {includedTransactions.length} Open Transactions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total VAT: <span className="font-mono text-slate-200">Rs {totalVat.toLocaleString()}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Total</span>
              <span className="text-xl font-mono font-black text-emerald-400">
                Rs {totalInclVat.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Mode Indicator Banner */}
          <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs border ${
            cashier.isSelfApproving 
              ? 'bg-blue-950/40 border-blue-500/40 text-blue-200' 
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div>
              {cashier.isSelfApproving ? (
                <span>
                  <strong>Self-Approval Mode:</strong> Submitting will immediately approve this closure and generate your PDF statement.
                </span>
              ) : (
                <span>
                  <strong>Manager Linkage Active:</strong> Submitting will lock entries and dispatch to {cashier.linkedManager?.name}.
                </span>
              )}
            </div>
          </div>

          {/* List of Open Transactions to Close */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Entries in this Closure ({includedTransactions.length})
              </span>
              {removedTxList.length > 0 && (
                <button
                  onClick={() => handleUndoRemove(removedTxList[0].id)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Restore ({removedTxList.length})
                </button>
              )}
            </div>

            {includedTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                <FileCheck2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-300">All entries removed from this closure</p>
                <p className="text-[11px] text-slate-500">
                  Restore entries or add new transactions to continue.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {includedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                          #{tx.billRef}
                        </span>
                        <h4 className="font-bold text-xs text-slate-200 truncate">{tx.paidTo}</h4>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                        <span>{tx.expenseNature}</span>
                        <span>•</span>
                        <span className="font-mono">{tx.date}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">VAT: Rs {tx.vatAmount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-extrabold text-xs text-emerald-400">
                        Rs {tx.amountInclVat.toLocaleString()}
                      </span>
                      {/* Delete from closure action */}
                      <button
                        onClick={() => handleRemoveFromClosure(tx)}
                        title="Remove from this closure (stays open)"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-700/60 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={includedTransactions.length === 0}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <FileCheck2 className="w-5 h-5" />
            <span>Confirm & Send Closure ({includedTransactions.length} Entries)</span>
          </button>
        </div>
      )}

      {/* 6a Modal: Confirmation Dialog (One-way action lock) */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-sm w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-white">Confirm Petty Cash Closure?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  This will close <strong>{includedTransactions.length} entries</strong> totaling{' '}
                  <strong className="text-emerald-400">Rs {totalInclVat.toLocaleString()}</strong>.
                  You can't add more entries to this closure once sent.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono space-y-1 border border-slate-800">
                <div className="flex justify-between">
                  <span>Project:</span>
                  <span>{activeProject.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span className="text-emerald-400 font-bold">Rs {totalInclVat.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSend}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-colors"
                >
                  Yes, Close Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
