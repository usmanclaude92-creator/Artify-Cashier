import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCashier } from '../context/CashierContext';
import { Transaction } from '../types';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Tag, 
  FileText, 
  Cloud, 
  HardDrive, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Info, 
  Layers, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptGalleryModalProps {
  isOpen?: boolean;
  initialIndex?: number;
  initialTransactionId?: string;
  projectId?: string;
  onClose?: () => void;
}

export const ReceiptGalleryModal: React.FC<ReceiptGalleryModalProps> = ({
  isOpen: propIsOpen,
  initialIndex: propInitialIndex,
  initialTransactionId,
  projectId: propProjectId,
  onClose: propOnClose,
}) => {
  const {
    transactions,
    projects,
    activeProject,
    isReceiptGalleryOpen,
    receiptGalleryIndex,
    receiptGalleryProjectId,
    closeReceiptGallery,
    addToast
  } = useCashier();

  // Control visibility from props or context
  const isOpen = propIsOpen !== undefined ? propIsOpen : isReceiptGalleryOpen;
  const handleClose = propOnClose || closeReceiptGallery;

  // Filter state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    propProjectId || receiptGalleryProjectId || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom & transform state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Thumbnail strip ref for auto-scrolling
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Filter receipts
  const receiptsList: Transaction[] = useMemo(() => {
    return transactions.filter((tx) => {
      // Must have attachment
      if (!tx.attachmentUrl) return false;

      // Project filter
      if (selectedProjectId !== 'all' && tx.projectId !== selectedProjectId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchVendor = tx.paidTo.toLowerCase().includes(q);
        const matchBillRef = tx.billRef.toLowerCase().includes(q);
        const matchCategory = tx.expenseNature.toLowerCase().includes(q);
        const matchRemarks = (tx.remarks || '').toLowerCase().includes(q);
        if (!matchVendor && !matchBillRef && !matchCategory && !matchRemarks) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedProjectId, searchQuery]);

  // Current active index
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Sync initial index or initial transaction ID when opened
  useEffect(() => {
    if (!isOpen) return;

    // Reset zoom and rotation
    setZoomLevel(1);
    setRotationAngle(0);

    if (initialTransactionId) {
      const idx = receiptsList.findIndex((t) => t.id === initialTransactionId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        return;
      }
    }

    const initIdx = propInitialIndex !== undefined 
      ? propInitialIndex 
      : (receiptGalleryIndex !== undefined ? receiptGalleryIndex : 0);

    if (initIdx >= 0 && initIdx < receiptsList.length) {
      setCurrentIndex(initIdx);
    } else {
      setCurrentIndex(0);
    }
  }, [isOpen, propInitialIndex, initialTransactionId, receiptGalleryIndex, receiptsList.length]);

  // Auto scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailStripRef.current) return;
    const activeThumb = thumbnailStripRef.current.querySelector(`[data-thumb-index="${currentIndex}"]`);
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  const currentReceipt = receiptsList[currentIndex];

  const handleNext = useCallback(() => {
    if (receiptsList.length <= 1) return;
    setSlideDirection('right');
    setZoomLevel(1);
    setRotationAngle(0);
    setCurrentIndex((prev) => (prev + 1) % receiptsList.length);
  }, [receiptsList.length]);

  const handlePrev = useCallback(() => {
    if (receiptsList.length <= 1) return;
    setSlideDirection('left');
    setZoomLevel(1);
    setRotationAngle(0);
    setCurrentIndex((prev) => (prev - 1 + receiptsList.length) % receiptsList.length);
  }, [receiptsList.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoomLevel((z) => Math.min(3, z + 0.25));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setZoomLevel((z) => Math.max(0.5, z - 0.25));
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setRotationAngle((r) => (r + 90) % 360);
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setIsInfoExpanded((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isSwipe = Math.abs(distance) > 50;

    if (isSwipe) {
      if (distance > 0) {
        handleNext(); // swipe left -> next
      } else {
        handlePrev(); // swipe right -> prev
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.5, z - 0.25));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotationAngle(0);
  };
  const handleRotate = () => setRotationAngle((r) => (r + 90) % 360);

  // Download receipt
  const handleDownload = () => {
    if (!currentReceipt?.attachmentUrl) return;
    const a = document.createElement('a');
    a.href = currentReceipt.attachmentUrl;
    a.download = `receipt-${currentReceipt.billRef || 'scanned'}-${currentReceipt.paidTo.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast({
      type: 'success',
      title: 'Receipt Downloaded',
      message: `Saved high-resolution bill for ${currentReceipt.paidTo}`,
    });
  };

  // Print receipt
  const handlePrint = () => {
    if (!currentReceipt?.attachmentUrl) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt ${currentReceipt.billRef} - ${currentReceipt.paidTo}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; background: white; color: black; }
              img { max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 8px; }
              .meta { margin-top: 15px; font-size: 14px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6; }
              .ref { font-family: monospace; font-weight: bold; font-size: 16px; }
            </style>
          </head>
          <body>
            <h2>Petty Cash Expense Receipt</h2>
            <img src="${currentReceipt.attachmentUrl}" alt="Receipt" />
            <div class="meta">
              <p class="ref">Bill Ref: #${currentReceipt.billRef}</p>
              <p><strong>Paid To:</strong> ${currentReceipt.paidTo}</p>
              <p><strong>Project:</strong> ${currentReceipt.projectName}</p>
              <p><strong>Category:</strong> ${currentReceipt.expenseNature}</p>
              <p><strong>Bill Date:</strong> ${currentReceipt.date}</p>
              <p><strong>Amount Excl. VAT:</strong> Rs ${currentReceipt.amountExclVat.toLocaleString()}</p>
              <p><strong>VAT Amount:</strong> Rs ${currentReceipt.vatAmount.toLocaleString()} (${currentReceipt.vendorVatRegNo || 'No VAT Reg'})</p>
              <p><strong>Total Cash Paid:</strong> Rs ${currentReceipt.amountInclVat.toLocaleString()}</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        ref={containerRef}
        className={`fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl text-slate-100 transition-all ${
          isFullscreen ? 'p-0' : 'p-2 sm:p-4'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className={`flex flex-col flex-1 w-full max-w-6xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${
            isFullscreen ? 'rounded-none border-none h-full' : 'max-h-[96vh]'
          }`}
        >
          {/* =========================================================================
              TOP GALLERY TOOLBAR
             ========================================================================= */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Title & Index Counter */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-100">Receipt Gallery</h3>
                  {receiptsList.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-emerald-400">
                      {currentIndex + 1} of {receiptsList.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Swipe, zoom, and inspect verified bill attachments
                </p>
              </div>
            </div>

            {/* Middle Filters: Project Picker & Search Input */}
            <div className="flex items-center gap-2 flex-1 max-w-md justify-end sm:justify-center">
              {/* Project Filter */}
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setCurrentIndex(0);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none max-w-[140px] truncate"
              >
                <option value="all">All Projects ({transactions.length})</option>
                {projects.map((p) => {
                  const count = transactions.filter((t) => t.projectId === p.id && t.attachmentUrl).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Quick Search */}
              <div className="relative hidden md:block w-36 lg:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentIndex(0);
                  }}
                  placeholder="Search vendor..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-2.5 py-1.5 focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                disabled={zoomLevel <= 0.5}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom Indicator / Reset */}
              <button
                onClick={handleResetZoom}
                title="Reset Zoom (1x)"
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono font-bold transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                title="Zoom In (+)"
                disabled={zoomLevel >= 3}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Rotate */}
              <button
                onClick={handleRotate}
                title="Rotate 90° (R)"
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors hidden sm:block"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Info Drawer Toggle */}
              <button
                onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                title="Toggle Bill Details (I)"
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
                  isInfoExpanded
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                title="Download Receipt"
                disabled={!currentReceipt}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                title="Close Gallery (Esc)"
                className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              MAIN VIEWER CANVAS & METADATA OVERLAY
             ========================================================================= */}
          <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950/70 min-h-0">
            {/* Center / Main Image Canvas */}
            <div 
              className="relative flex-1 flex items-center justify-center p-4 overflow-auto select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {receiptsList.length === 0 ? (
                <div className="text-center p-8 space-y-3 max-w-sm">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <Search className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">No Scanned Receipts Found</h4>
                  <p className="text-xs text-slate-400">
                    No attachments matched your active filter or search query.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProjectId('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : currentReceipt ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Slide Container with Animation */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={currentReceipt.id}
                      initial={{ 
                        opacity: 0, 
                        x: slideDirection === 'right' ? 80 : -80, 
                        scale: 0.95 
                      }}
                      animate={{ 
                        opacity: 1, 
                        x: 0, 
                        scale: 1 
                      }}
                      exit={{ 
                        opacity: 0, 
                        x: slideDirection === 'right' ? -80 : 80, 
                        scale: 0.95 
                      }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="flex items-center justify-center max-w-full max-h-full transition-transform duration-200"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <img
                        src={currentReceipt.attachmentUrl}
                        alt={`Receipt #${currentReceipt.billRef} from ${currentReceipt.paidTo}`}
                        className="max-h-[52vh] sm:max-h-[62vh] max-w-[90vw] md:max-w-[45vw] object-contain rounded-2xl shadow-2xl border border-slate-700/80 bg-white/5"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Left Arrow Navigation Overlay */}
                  <button
                    onClick={handlePrev}
                    disabled={receiptsList.length <= 1}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none group z-20"
                    title="Previous Receipt (Left Arrow)"
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                  </button>

                  {/* Right Arrow Navigation Overlay */}
                  <button
                    onClick={handleNext}
                    disabled={receiptsList.length <= 1}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none group z-20"
                    title="Next Receipt (Right Arrow)"
                  >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Quick Pill on Top Canvas */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/85 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono font-bold text-slate-300 shadow flex items-center gap-2 pointer-events-none z-10">
                    <span className="text-emerald-400">#{currentReceipt.billRef}</span>
                    <span>•</span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px] text-white">
                      {currentReceipt.paidTo}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* =========================================================================
                RIGHT SIDE METADATA INSPECTOR DRAWER
               ========================================================================= */}
            <AnimatePresence>
              {isInfoExpanded && currentReceipt && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full md:w-80 lg:w-96 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto max-h-[38vh] md:max-h-full"
                >
                  <div className="p-4 space-y-4 text-xs">
                    {/* Header: Vendor & Ref */}
                    <div className="space-y-1 border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          #{currentReceipt.billRef}
                        </span>
                        {/* Status Badges */}
                        <div className="flex items-center gap-1.5">
                          {currentReceipt.syncStatus === 'synced' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Cloud className="w-3 h-3 text-emerald-400" /> Synced
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-amber-400" /> Local
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            currentReceipt.reviewStatus === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : currentReceipt.reviewStatus === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : currentReceipt.reviewStatus === 'pending_closure'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {currentReceipt.reviewStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-100 pt-1">
                        {currentReceipt.paidTo}
                      </h4>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Financial Verification
                      </span>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Net (Excl. VAT):</span>
                        <span className="font-mono font-bold">
                          Rs {currentReceipt.amountExclVat.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">VAT (Tax Amount):</span>
                        <span className="font-mono font-bold text-amber-300">
                          Rs {currentReceipt.vatAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-white">
                        <span className="font-bold">Total Cash Paid:</span>
                        <span className="font-mono font-black text-sm text-emerald-400">
                          Rs {currentReceipt.amountInclVat.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Meta Specifications */}
                    <div className="space-y-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-800 text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Project:
                        </span>
                        <span className="font-bold text-slate-200">{currentReceipt.projectName}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Category:
                        </span>
                        <span className="font-bold text-slate-200">{currentReceipt.expenseNature}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Bill Date:
                        </span>
                        <span className="font-mono font-bold text-slate-200">{currentReceipt.date}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Vendor VAT Reg:
                        </span>
                        <span className="font-mono font-bold text-slate-300">
                          {currentReceipt.vendorVatRegNo || 'Unregistered'}
                        </span>
                      </div>
                    </div>

                    {/* OCR Extraction Notice */}
                    {currentReceipt.ocrExtracted && (
                      <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 flex items-center gap-2 text-[11px]">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>AI Vision OCR parsed and validated against petty cash rules.</span>
                      </div>
                    )}

                    {/* Remarks snippet */}
                    {currentReceipt.remarks && (
                      <div>
                        <span className="text-slate-400 block mb-1 font-semibold text-[11px]">
                          Remarks / Purpose:
                        </span>
                        <p className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed text-[11px]">
                          {currentReceipt.remarks}
                        </p>
                      </div>
                    )}

                    {/* Quick Print & Export button row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={handlePrint}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Bill
                      </button>

                      <button
                        onClick={handleDownload}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* =========================================================================
              BOTTOM THUMBNAIL SCRUBBER CAROUSEL
             ========================================================================= */}
          {receiptsList.length > 0 && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
              <div 
                ref={thumbnailStripRef}
                className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700"
              >
                {receiptsList.map((tx, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={tx.id}
                      data-thumb-index={idx}
                      onClick={() => {
                        setSlideDirection(idx > currentIndex ? 'right' : 'left');
                        setZoomLevel(1);
                        setRotationAngle(0);
                        setCurrentIndex(idx);
                      }}
                      className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all p-0.5 text-left group ${
                        isActive
                          ? 'border-emerald-400 ring-2 ring-emerald-500/40 scale-105 shadow-xl bg-emerald-950/40'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-1">
                        <img
                          src={tx.attachmentUrl}
                          alt={tx.paidTo}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="p-1 bg-slate-900/90 text-[9px] font-mono font-bold text-center truncate max-w-[70px] sm:max-w-[84px] text-slate-300">
                        #{tx.billRef.slice(-4)}
                      </div>
                      {isActive && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
