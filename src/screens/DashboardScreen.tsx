import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  Plus, 
  ArrowDownLeft, 
  Send, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Receipt, 
  Wallet, 
  FileText, 
  ExternalLink,
  RefreshCw,
  Sun,
  Moon,
  HardDrive,
  Cloud,
  Images
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategorySpendingCard } from '../components/CategorySpendingCard';
import { DashboardReceiptFilter } from '../components/DashboardReceiptFilter';
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';

export const DashboardScreen: React.FC<{ onOpenManagerSimulator: () => void }> = ({ onOpenManagerSimulator }) => {
  const {
    cashier,
    projects,
    activeProject,
    setActiveProjectId,
    transactions,
    closures,
    navigateTo,
    setSelectedTransaction,
    setActiveClosureForPdf,
    isOnline,
    setIsOnline,
    syncNow,
    isSyncing,
    openTransactionsForActiveProject,
    theme,
    toggleTheme,
    openReceiptGallery,
  } = useCashier();

  // Total balance across all cashier's assigned projects
  const totalAllProjectsBalance = projects
    .filter((p) => cashier.assignedProjectIds.includes(p.id))
    .reduce((sum, p) => sum + p.currentBalance, 0);

  // Check if current project or any project is low balance
  const isCurrentProjectLow = activeProject.currentBalance < activeProject.lowBalanceThreshold;
  const anyLowBalanceProject = projects.find(
    (p) => cashier.assignedProjectIds.includes(p.id) && p.currentBalance < p.lowBalanceThreshold
  );

  // Project closure statuses
  const pendingClosure = closures.find(
    (c) => c.projectId === activeProject.id && c.status === 'pending_manager'
  );
  const approvedClosure = closures.find(
    (c) => c.projectId === activeProject.id && c.status === 'approved'
  );

  // Open transactions for active project
  const recentTransactions = transactions
    .filter((t) => t.projectId === activeProject.id)
    .slice(0, 5);

  const { fundRequests } = useCashier();
  const pendingFundBatch = fundRequests.find(
    (b) => b.projectId === activeProject.id && b.status === 'pending'
  );
  const approvedFundBatch = fundRequests.find(
    (b) => b.projectId === activeProject.id && b.status === 'approved'
  );

  return (
    <div className="space-y-4 pb-20 p-4">
      {/* Top Cashier Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-extrabold text-sm text-emerald-400">
              {cashier.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-100">{cashier.name}</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                {cashier.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              Total Float: <span className="font-mono font-bold text-slate-200">Rs {totalAllProjectsBalance.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Theme & Sync Status Indicator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Prominent Visual Sync Status Indicator */}
          <SyncStatusIndicator variant="compact" />
        </div>
      </div>

      {/* Persistent Offline / Saved Locally Alert Banner */}
      <SyncStatusIndicator variant="banner" />

      {/* Auto Prompt Banner: Low balance trigger */}
      {anyLowBalanceProject && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-amber-950/30"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-amber-200 truncate">
                {anyLowBalanceProject.name} balance is low!
              </h4>
              <p className="text-[11px] text-amber-300/80 font-mono">
                Current: Rs {anyLowBalanceProject.currentBalance.toLocaleString()} (Min: Rs {anyLowBalanceProject.lowBalanceThreshold.toLocaleString()})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveProjectId(anyLowBalanceProject.id);
              navigateTo('request_funds');
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow transition-transform active:scale-95"
          >
            Request Funds
          </button>
        </motion.div>
      )}

      {/* Project Switcher Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned Projects</span>
          <span>{projects.length} Active Sites</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {projects.map((prj) => {
            const isSelected = prj.id === activeProject.id;
            const isLow = prj.currentBalance < prj.lowBalanceThreshold;
            return (
              <button
                key={prj.id}
                onClick={() => setActiveProjectId(prj.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-800 text-slate-100 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                <span>{prj.name}</span>
                <span className="font-mono text-[11px] opacity-75">
                  ({prj.currency} {prj.currentBalance.toLocaleString()})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Project Card */}
      <motion.div
        key={activeProject.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 shadow-2xl space-y-4"
      >
        {/* Top subtle glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header & Status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/20">
                {activeProject.code}
              </span>
              <h3 className="text-base font-bold text-slate-100">{activeProject.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeProject.description}</p>
          </div>

          <div className="flex items-center gap-1.5">
            {isCurrentProjectLow ? (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Low Balance
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Healthy Float
              </span>
            )}
          </div>
        </div>

        {/* Prominent Current Balance */}
        <div className="pt-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
            Current Petty Balance
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              {activeProject.currency} {activeProject.currentBalance.toLocaleString()}
            </span>
          </div>

          {/* Received / Spent subtext */}
          <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-500">Received:</span>{' '}
              <span className="text-emerald-400 font-semibold">
                Rs {activeProject.totalReceived.toLocaleString()}
              </span>
            </div>
            <div className="text-slate-700">•</div>
            <div>
              <span className="text-slate-500">Spent:</span>{' '}
              <span className="text-rose-400 font-semibold">
                Rs {activeProject.totalSpent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Open transactions count badge */}
        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">
              <strong className="text-white font-bold">{openTransactionsForActiveProject.length} open</strong> transactions since last close
            </span>
          </div>
          <button
            onClick={() => navigateTo('history')}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pending Closure or Approved Badge per spec */}
        {pendingClosure && (
          <div
            onClick={onOpenManagerSimulator}
            className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-950/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <div>
                <span className="font-bold">⏳ Closure pending review ({pendingClosure.closureNumber})</span>
                <p className="text-[10px] text-amber-300/80">Sent to manager • Tap to test approval in simulator</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </div>
        )}

        {approvedClosure && (
          <div
            onClick={() => {
              setActiveClosureForPdf(approvedClosure);
              navigateTo('closure_pdf');
            }}
            className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/80 transition-colors shadow-lg shadow-emerald-950"
          >
            <div className="flex items-center gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold">✓ Approved — Generate PDF</span>
                <p className="text-[10px] text-emerald-300/80">
                  {approvedClosure.closureNumber} approved ({approvedClosure.approvedBy})
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow">
              Open PDF
            </span>
          </div>
        )}

        {/* Pending / Approved Fund Batch Badges */}
        {pendingFundBatch && (
          <div
            onClick={() => navigateTo('requests')}
            className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-950/60 transition-colors shadow-md"
          >
            <div className="flex items-center gap-2.5 text-xs text-blue-200">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <div>
                <span className="font-bold">Fund Batch #{pendingFundBatch.batchNumber} Pending</span>
                <p className="text-[10px] text-blue-300/80">
                  {pendingFundBatch.batchType === 'receipt_reimbursement' ? `${pendingFundBatch.receiptsCount || pendingFundBatch.items.length} receipts bundled` : 'Advance budget request'} • Rs {pendingFundBatch.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-1 rounded-lg">
              Track
            </span>
          </div>
        )}

        {approvedFundBatch && (
          <div
            onClick={() => navigateTo('requests')}
            className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/80 transition-colors shadow-lg shadow-emerald-950"
          >
            <div className="flex items-center gap-2.5 text-xs text-emerald-200">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold">✓ Batch #{approvedFundBatch.batchNumber} Approved!</span>
                <p className="text-[10px] text-emerald-300/80">
                  Tap to claim Rs {approvedFundBatch.totalAmount.toLocaleString()} & replenish float
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow">
              Claim Cash
            </span>
          </div>
        )}

        {/* Quick Action Grid (Add Transaction is Prominent FAB) */}
        <div className="pt-2 space-y-2">
          {/* Primary Action Button (Add Transaction) */}
          <button
            onClick={() => navigateTo('add_transaction')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-emerald-400/30"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>+ Add Transaction (Scan Bill)</span>
          </button>

          {/* Secondary Action Grid (Includes Receipt Gallery) */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => navigateTo('fund_receipt')}
              className="py-2.5 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
            >
              <ArrowDownLeft className="w-4 h-4 text-teal-400" />
              <span className="text-[9px] sm:text-[10px] font-semibold">+ Receipt</span>
            </button>

            <button
              onClick={() => navigateTo('request_funds')}
              className="py-2.5 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
            >
              <Send className="w-4 h-4 text-blue-400" />
              <span className="text-[9px] sm:text-[10px] font-semibold">Batches</span>
            </button>

            <button
              onClick={() => openReceiptGallery(0, activeProject.id)}
              className="py-2.5 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center shadow"
              title="Swipe through all scanned receipts in gallery"
            >
              <Images className="w-4 h-4 text-emerald-400" />
              <span className="text-[9px] sm:text-[10px] font-bold">Gallery</span>
            </button>

            <button
              onClick={() => navigateTo('close_petty_cash')}
              disabled={openTransactionsForActiveProject.length === 0}
              className="py-2.5 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 disabled:opacity-40 disabled:hover:bg-slate-800/80 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span className="text-[9px] sm:text-[10px] font-semibold">Close</span>
            </button>

            <button
              onClick={() => navigateTo('closure_pdf')}
              className="py-2.5 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
              title="Audit PDF Report"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-[9px] sm:text-[10px] font-semibold">Audit PDF</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Receipt Search & Filter Bar (Merchant, Date Range, Category Tag) */}
      <DashboardReceiptFilter />

      {/* Spending Breakdown by Category (Recharts Donut / Pie Chart) */}
      <CategorySpendingCard />

      {/* Recent Open Transactions Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Open Transactions ({openTransactionsForActiveProject.length})
          </h4>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openReceiptGallery(0, activeProject.id)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => navigateTo('history')}
              className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
            >
              History
            </button>
          </div>
        </div>

        {openTransactionsForActiveProject.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-medium text-slate-300">No open transactions for this site</p>
            <p className="text-[11px] text-slate-500">
              Tap "+ Add Transaction" to scan or record your first cash bill.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {openTransactionsForActiveProject.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                onClick={() => {
                  setSelectedTransaction(tx);
                  navigateTo('history');
                }}
                className="p-3 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Interactive Thumbnail that directly opens Receipt Gallery */}
                  {tx.attachmentUrl ? (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        openReceiptGallery(tx.id, activeProject.id);
                      }}
                      className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center relative group shrink-0 hover:border-emerald-400 transition-colors"
                      title="Tap to open in Receipt Gallery"
                    >
                      <img
                        src={tx.attachmentUrl}
                        alt="Receipt"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Images className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-200 truncate">{tx.paidTo}</span>
                      {tx.ocrExtracted && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                          OCR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{tx.expenseNature}</span>
                      <span>•</span>
                      <span className="font-mono">{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <div className="font-mono font-extrabold text-xs text-emerald-300">
                    Rs {tx.amountInclVat.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      VAT: Rs {tx.vatAmount.toLocaleString()}
                    </span>
                    {tx.syncStatus === 'synced' ? (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full flex items-center gap-0.5" title="Synced to Cloud">
                        <Cloud className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Synced</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5 animate-pulse" title="Saved locally on device (pending cloud sync)">
                        <HardDrive className="w-2.5 h-2.5 text-amber-400" />
                        <span>Local</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manager App Simulation Banner Helper */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Testing approvals? Open Manager Simulator:</span>
        </div>
        <button
          onClick={onOpenManagerSimulator}
          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg font-bold text-xs transition-colors"
        >
          Open Tester
        </button>
      </div>
    </div>
  );
};
