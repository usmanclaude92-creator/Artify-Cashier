import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  HardDrive, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Database, 
  ArrowUpRight, 
  Clock, 
  X, 
  ShieldCheck, 
  AlertCircle,
  Receipt,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SyncStatusIndicatorProps {
  variant?: 'compact' | 'full' | 'banner';
  showDetailsModalOnClick?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  variant = 'compact',
  showDetailsModalOnClick = true,
}) => {
  const { 
    isOnline, 
    setIsOnline, 
    isSyncing, 
    syncNow, 
    transactions, 
    cashier,
    fundRequests,
    fundReceipts
  } = useCashier();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute pending vs synced counts
  const pendingTransactions = transactions.filter((t) => t.syncStatus === 'pending_sync');
  const syncedTransactions = transactions.filter((t) => t.syncStatus === 'synced');
  const pendingCount = pendingTransactions.length;
  const totalCount = transactions.length;

  // Format last synced timestamp
  const formatLastSync = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const handleSyncClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOnline && !isSyncing) {
      syncNow();
    }
  };

  // Determine primary state
  const isAllSynced = isOnline && pendingCount === 0 && !isSyncing;
  const isPendingLocal = pendingCount > 0;

  // Compact Variant (Top Bar / Header Pill)
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => showDetailsModalOnClick && setIsModalOpen(true)}
          className={`group px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            isSyncing
              ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
              : !isOnline
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : isPendingLocal
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
          }`}
          title={
            isSyncing
              ? 'Syncing local data with cloud...'
              : !isOnline
              ? 'Offline mode: all changes saved to device storage'
              : isPendingLocal
              ? `${pendingCount} item(s) saved locally pending cloud sync`
              : 'All data saved and synced with cloud'
          }
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : !isOnline ? (
            <>
              <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="flex items-center gap-1">
                Saved Locally
                {pendingCount > 0 && (
                  <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono text-[9px]">
                    {pendingCount}
                  </span>
                )}
              </span>
            </>
          ) : isPendingLocal ? (
            <>
              <div className="relative flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <span>Saved Locally ({pendingCount})</span>
              <span
                onClick={handleSyncClick}
                className="ml-0.5 p-0.5 rounded hover:bg-amber-500/30 text-amber-200 transition-colors"
                title="Sync now to cloud"
              >
                <RefreshCw className="w-3 h-3" />
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>Cloud Synced</span>
            </>
          )}
        </button>

        {/* Modal Inspector */}
        <SyncDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pendingTransactions={pendingTransactions}
          syncedTransactions={syncedTransactions}
          lastSyncedAt={cashier.lastSyncedAt}
          formatLastSync={formatLastSync}
        />
      </>
    );
  }

  // Full Banner Variant (for alerts / dashboard banner when offline or pending)
  if (variant === 'banner') {
    if (isAllSynced) return null;

    return (
      <div
        onClick={() => showDetailsModalOnClick && setIsModalOpen(true)}
        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all shadow-md ${
          !isOnline
            ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
            : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold truncate">
                {!isOnline ? 'Offline Mode Active' : 'Data Saved Locally on Device'}
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded-full">
                {pendingCount} Pending Sync
              </span>
            </div>
            <p className="text-[11px] text-amber-300/80 truncate">
              {!isOnline
                ? 'Receipts & expenses stored securely on device storage.'
                : 'All local changes will be uploaded to Core Cloud.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOnline ? (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOnline(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-500/30 text-xs font-bold"
            >
              Go Online
            </button>
          )}
        </div>

        <SyncDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pendingTransactions={pendingTransactions}
          syncedTransactions={syncedTransactions}
          lastSyncedAt={cashier.lastSyncedAt}
          formatLastSync={formatLastSync}
        />
      </div>
    );
  }

  // Full Standalone Card Variant
  return (
    <>
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isAllSynced
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : isSyncing
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isAllSynced ? (
                <Cloud className="w-4 h-4" />
              ) : (
                <HardDrive className="w-4 h-4" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                {isSyncing
                  ? 'Syncing with Cloud...'
                  : isAllSynced
                  ? 'Cloud Synced & Verified'
                  : !isOnline
                  ? 'Offline (Saved to Local Device)'
                  : `${pendingCount} Record(s) Stored Locally`}
              </h4>
              <p className="text-[10px] text-slate-400">
                Last sync: {formatLastSync(cashier.lastSyncedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                isOnline
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </button>
            <button
              onClick={handleSyncClick}
              disabled={isSyncing || !isOnline}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Sync Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Synced to Cloud:
            </span>
            <span className="font-mono font-bold text-slate-200">{syncedTransactions.length}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-amber-400" /> Saved Locally:
            </span>
            <span className="font-mono font-bold text-amber-300">{pendingTransactions.length}</span>
          </div>
        </div>
      </div>

      <SyncDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pendingTransactions={pendingTransactions}
        syncedTransactions={syncedTransactions}
        lastSyncedAt={cashier.lastSyncedAt}
        formatLastSync={formatLastSync}
      />
    </>
  );
};

/* =========================================================================
   DETAILED SYNC & STORAGE INSPECTOR MODAL
   ========================================================================= */
interface SyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTransactions: any[];
  syncedTransactions: any[];
  lastSyncedAt?: string;
  formatLastSync: (iso?: string) => string;
}

const SyncDetailsModal: React.FC<SyncDetailsModalProps> = ({
  isOpen,
  onClose,
  pendingTransactions,
  syncedTransactions,
  lastSyncedAt,
  formatLastSync,
}) => {
  const { isOnline, setIsOnline, isSyncing, syncNow } = useCashier();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Data Sync & Local Storage</h3>
                <p className="text-[11px] text-slate-400">Field offline caching & cloud status</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
            {/* Status Overview Card */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Connectivity:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                    {isOnline ? 'Online (Core Connected)' : 'Offline (Local Only)'}
                  </span>
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
                  >
                    Toggle
                  </button>
                </div>
              </div>

              <div className="flex items-between justify-between text-slate-400">
                <span>Last Cloud Sync:</span>
                <span className="font-mono text-slate-200 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {formatLastSync(lastSyncedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Local Storage Engine:</span>
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-teal-400" /> Device Cache (Encrypted)
                </span>
              </div>
            </div>

            {/* Storage Counts Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Cloud Synced Card */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300">Cloud Synced</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold font-mono text-slate-100">
                  {syncedTransactions.length}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Verified with financial backend
                </p>
              </div>

              {/* Saved Locally Card */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300">Saved Locally</span>
                  <HardDrive className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-extrabold font-mono text-amber-300">
                  {pendingTransactions.length}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Stored on device, awaiting upload
                </p>
              </div>
            </div>

            {/* Pending Records List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200 text-xs">
                  Locally Saved Items ({pendingTransactions.length})
                </h4>
                {pendingTransactions.length > 0 && isOnline && (
                  <button
                    onClick={() => syncNow()}
                    disabled={isSyncing}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync All
                  </button>
                )}
              </div>

              {pendingTransactions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="font-bold text-slate-200 text-xs">All records are synchronized</p>
                  <p className="text-[11px] text-slate-500">
                    No pending items in your local device queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendingTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-950 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-300 text-[10px]">
                            #{tx.billRef}
                          </span>
                          <span className="font-bold text-slate-200 truncate">{tx.paidTo}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {tx.expenseNature} • {tx.date}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-amber-300 text-xs">
                          Rs {tx.amountInclVat.toLocaleString()}
                        </div>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                          Local only
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Info Notice */}
            <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-2.5 text-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Offline-First Resilience:</strong> Cashier operations never stop on remote construction sites. Bills scanned offline remain protected in high-durability device cache and auto-reconcile when connection returns.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-slate-800/60 border-t border-slate-700/60 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Dismiss
            </button>

            <button
              onClick={() => {
                if (!isOnline) {
                  setIsOnline(true);
                }
                syncNow();
              }}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud Now'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
