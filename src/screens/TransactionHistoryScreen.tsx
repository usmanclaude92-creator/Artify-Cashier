import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Receipt, 
  Calendar, 
  Building2, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Download, 
  ZoomIn, 
  FileText,
  FileCheck2,
  FolderOpen,
  Cloud,
  HardDrive,
  RefreshCw,
  Database,
  Images
} from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { Transaction } from '../types';
import { ImageModal } from '../components/ImageModal';
import { motion, AnimatePresence } from 'motion/react';

export const TransactionHistoryScreen: React.FC = () => {
  const { 
    transactions, 
    projects, 
    activeProject, 
    goBack, 
    selectedTransaction, 
    setSelectedTransaction,
    isOnline,
    isSyncing,
    syncNow,
    openReceiptGallery
  } = useCashier();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>('all');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Detail Modal & Image Lightbox
  const [activeDetailTx, setActiveDetailTx] = useState<Transaction | null>(selectedTransaction);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    // Project
    if (selectedProjectId !== 'all' && tx.projectId !== selectedProjectId) return false;
    // Category
    if (selectedCategory !== 'all' && tx.expenseNature !== selectedCategory) return false;
    // Status
    if (selectedStatus !== 'all' && tx.reviewStatus !== selectedStatus) return false;
    // Sync Status
    if (selectedSyncStatus !== 'all' && tx.syncStatus !== selectedSyncStatus) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVendor = tx.paidTo.toLowerCase().includes(q);
      const matchRef = tx.billRef.toLowerCase().includes(q);
      const matchRemarks = tx.remarks.toLowerCase().includes(q);
      const matchVat = tx.vendorVatRegNo.toLowerCase().includes(q);
      if (!matchVendor && !matchRef && !matchRemarks && !matchVat) return false;
    }
    return true;
  });

  // Calculate totals for filtered transactions
  const totalFilteredInclVat = filteredTransactions.reduce((s, t) => s + t.amountInclVat, 0);
  const totalFilteredVat = filteredTransactions.reduce((s, t) => s + t.vatAmount, 0);

  const getStatusBadge = (status: Transaction['reviewStatus']) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
            <FolderOpen className="w-3 h-3 text-blue-400" /> Open
          </span>
        );
      case 'pending_closure':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" /> Rejected / Reversed
          </span>
        );
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-sm font-bold text-slate-100">Transaction History</h2>
        
        <div className="flex items-center gap-2">
          {/* Open Gallery Trigger */}
          <button
            onClick={() => openReceiptGallery(0, selectedProjectId)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 text-xs font-bold transition-colors"
            title="Open Receipt Gallery (Swipe view)"
          >
            <Images className="w-4 h-4" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              selectedProjectId !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedSyncStatus !== 'all'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by vendor, bill ref (YYXXXZZZZ), VAT No..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">Filter Transactions</span>
              <button
                onClick={() => {
                  setSelectedProjectId('all');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSelectedSyncStatus('all');
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-400 font-semibold"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Project */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Review Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open (Active Float)</option>
                  <option value="pending_closure">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected / Reversed</option>
                </select>
              </div>

              {/* Sync Status Filter */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sync Location</label>
                <select
                  value={selectedSyncStatus}
                  onChange={(e) => setSelectedSyncStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-medium"
                >
                  <option value="all">All Storage (Cloud & Local)</option>
                  <option value="synced">🟢 Synced with Cloud</option>
                  <option value="pending_sync">🟡 Saved Locally (Pending Sync)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Filter Pill */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong>{filteredTransactions.length}</strong> transactions
        </span>
        <span className="font-mono text-emerald-400 font-bold">
          Total: Rs {totalFilteredInclVat.toLocaleString()} (VAT: Rs {totalFilteredVat.toLocaleString()})
        </span>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <Receipt className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs font-semibold text-slate-300">No transactions match your search</p>
          <p className="text-[11px] text-slate-500">Try adjusting your filters or keyword query.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isRejected = tx.reviewStatus === 'rejected';

            return (
              <div
                key={tx.id}
                onClick={() => setActiveDetailTx(tx)}
                className={`p-3.5 bg-slate-900 border rounded-2xl cursor-pointer transition-all hover:bg-slate-800/80 shadow-md ${
                  isRejected
                    ? 'border-l-4 border-l-rose-500 border-slate-800 bg-rose-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Interactive Receipt Thumbnail */}
                    {tx.attachmentUrl ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openReceiptGallery(tx.id, tx.projectId);
                        }}
                        className="w-11 h-11 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center relative group shrink-0 hover:border-emerald-400 transition-colors shadow-sm"
                        title="Click to open full Receipt Gallery"
                      >
                        <img
                          src={tx.attachmentUrl}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Images className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                        <Receipt className="w-5 h-5 text-slate-500" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          #{tx.billRef}
                        </span>
                        <h4 className="font-bold text-xs text-slate-200 truncate">{tx.paidTo}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{tx.expenseNature}</span>
                        <span>•</span>
                        <span>{tx.projectName}</span>
                        <span>•</span>
                        <span className="font-mono">{tx.date}</span>
                      </div>

                      {/* Remarks snippet */}
                      {tx.remarks && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">"{tx.remarks}"</p>
                      )}

                      {/* Rejected alert */}
                      {isRejected && tx.rejectionReason && (
                        <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-800/50 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Rejection Note: {tx.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <div className="font-mono font-extrabold text-sm text-emerald-400">
                      Rs {tx.amountInclVat.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      VAT: Rs {tx.vatAmount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Sync Status Badge */}
                      {tx.syncStatus === 'synced' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                          <Cloud className="w-3 h-3 text-emerald-400" />
                          <span>Synced</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                          <HardDrive className="w-3 h-3 text-amber-400" />
                          <span>Saved Locally</span>
                        </span>
                      )}
                      {getStatusBadge(tx.reviewStatus)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {activeDetailTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/20">
                      #{activeDetailTx.billRef}
                    </span>
                    {getStatusBadge(activeDetailTx.reviewStatus)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">{activeDetailTx.paidTo}</h3>
                </div>
                <button
                  onClick={() => setActiveDetailTx(null)}
                  className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
                {/* Financial breakdown */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal (Excl. VAT):</span>
                    <span className="font-mono font-bold text-slate-200">
                      Rs {activeDetailTx.amountExclVat.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>VAT Amount:</span>
                    <span className="font-mono font-bold text-slate-200">
                      Rs {activeDetailTx.vatAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-2 text-sm">
                    <span>Total (Paid Cash):</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      Rs {activeDetailTx.amountInclVat.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Project / Site:</span>
                    <span className="font-semibold">{activeDetailTx.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold">{activeDetailTx.expenseNature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bill Date:</span>
                    <span className="font-mono font-semibold">{activeDetailTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vendor VAT Reg:</span>
                    <span className="font-mono font-semibold">
                      {activeDetailTx.vendorVatRegNo || 'Unregistered'}
                    </span>
                  </div>
                </div>

                {/* Data Sync & Storage Box */}
                <div className={`p-3 rounded-xl border space-y-2 ${
                  activeDetailTx.syncStatus === 'synced'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {activeDetailTx.syncStatus === 'synced' ? (
                        <>
                          <Cloud className="w-4 h-4 text-emerald-400" />
                          <span>Synchronized with Cloud</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-4 h-4 text-amber-400" />
                          <span>Saved Locally on Device</span>
                        </>
                      )}
                    </div>
                    {activeDetailTx.syncStatus === 'pending_sync' && (
                      <button
                        onClick={() => {
                          syncNow();
                          setActiveDetailTx({ ...activeDetailTx, syncStatus: 'synced' });
                        }}
                        disabled={isSyncing}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sync Now</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {activeDetailTx.syncStatus === 'synced'
                      ? 'This receipt is cached locally in device storage and verified on the central Core Financial Server.'
                      : 'Saved safely in encrypted device storage. Ready to be pushed to Core Financial Server.'}
                  </p>
                </div>

                {/* Remarks */}
                {activeDetailTx.remarks && (
                  <div>
                    <span className="text-slate-500 block mb-1 font-semibold">Remarks & Purpose:</span>
                    <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                      {activeDetailTx.remarks}
                    </p>
                  </div>
                )}

                {/* Attachment Visual Thumbnail */}
                {activeDetailTx.attachmentUrl && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 font-semibold text-xs">Scanned Bill Attachment:</span>
                      <span className="text-[10px] text-emerald-400 font-mono">High Resolution OCR</span>
                    </div>
                    
                    <div
                      onClick={() => setIsZoomOpen(true)}
                      className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-48 cursor-pointer relative group flex items-center justify-center p-2"
                    >
                      <img
                        src={activeDetailTx.attachmentUrl}
                        alt="Bill receipt"
                        className="max-h-40 object-contain rounded"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5">
                          <ZoomIn className="w-3.5 h-3.5" /> Full Zoom
                        </span>
                      </div>
                    </div>

                    {/* Gallery & Zoom Quick Action Bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          const txId = activeDetailTx.id;
                          const prjId = activeDetailTx.projectId;
                          setActiveDetailTx(null);
                          openReceiptGallery(txId, prjId);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                      >
                        <Images className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Swipe in Gallery</span>
                      </button>

                      <button
                        onClick={() => setIsZoomOpen(true)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Zoom</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-800/40 border-t border-slate-700/50 flex justify-end">
                <button
                  onClick={() => setActiveDetailTx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom Lightbox */}
      {activeDetailTx && (
        <ImageModal
          imageUrl={isZoomOpen ? activeDetailTx.attachmentUrl : null}
          title={activeDetailTx.paidTo}
          subtitle={`Bill Ref: ${activeDetailTx.billRef} • Date: ${activeDetailTx.date}`}
          onClose={() => setIsZoomOpen(false)}
        />
      )}
    </div>
  );
};
