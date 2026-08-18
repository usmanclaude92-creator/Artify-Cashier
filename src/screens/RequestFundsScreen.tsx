import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  ArrowLeft, 
  Send, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Building2, 
  DollarSign, 
  Layers, 
  WifiOff, 
  AlertCircle, 
  Check, 
  X,
  PackageCheck,
  Receipt,
  CheckSquare,
  Square,
  Sparkles,
  Search,
  ZoomIn,
  FileCheck2,
  TrendingUp,
  Tag,
  Clock
} from 'lucide-react';
import { CATEGORIES, UOM_OPTIONS } from '../data/mockData';
import { FundRequestItem, Transaction } from '../types';
import { ImageModal } from '../components/ImageModal';
import { motion, AnimatePresence } from 'motion/react';

export const RequestFundsScreen: React.FC = () => {
  const { 
    activeProject, 
    projects, 
    addFundRequestBatch, 
    createReceiptReimbursementBatch, 
    getEligibleReceiptsForBatch, 
    goBack, 
    navigateTo, 
    isOnline,
    addToast
  } = useCashier();

  // Mode Selection: 'receipts' (Group Scanned Receipts) or 'forecast' (Advance Forecast)
  const [requestMode, setRequestMode] = useState<'receipts' | 'forecast'>('receipts');

  // Batch Header
  const [projectId, setProjectId] = useState(activeProject.id);
  const selectedProject = projects.find((p) => p.id === projectId) || activeProject;

  // Date calculation: today to 7 days from now
  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysDate = new Date();
  next7DaysDate.setDate(next7DaysDate.getDate() + 7);
  const next7DaysStr = next7DaysDate.toISOString().split('T')[0];

  const [periodStart, setPeriodStart] = useState(todayStr);
  const [periodEnd, setPeriodEnd] = useState(next7DaysStr);
  const [submissionNotes, setSubmissionNotes] = useState('');

  // ----------------------------------------------------
  // MODE 1: Group Scanned Receipts (Reimbursement Claim)
  // ----------------------------------------------------
  const eligibleReceipts = getEligibleReceiptsForBatch(projectId);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>(
    eligibleReceipts.slice(0, 3).map((r) => r.id)
  );
  const [receiptSearch, setReceiptSearch] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState('');

  // Filtered receipts by search
  const filteredReceipts = eligibleReceipts.filter(
    (r) =>
      r.paidTo.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.billRef.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.expenseNature.toLowerCase().includes(receiptSearch.toLowerCase())
  );

  // Selected receipts list & calculations
  const selectedReceipts = eligibleReceipts.filter((r) => selectedReceiptIds.includes(r.id));
  const totalReimbursementAmount = selectedReceipts.reduce((sum, r) => sum + r.amountInclVat, 0);
  const totalReimbursementVat = selectedReceipts.reduce((sum, r) => sum + r.vatAmount, 0);
  const totalReimbursementExcl = selectedReceipts.reduce((sum, r) => sum + r.amountExclVat, 0);

  const toggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllReceipts = () => {
    if (selectedReceiptIds.length === filteredReceipts.length) {
      setSelectedReceiptIds([]);
    } else {
      setSelectedReceiptIds(filteredReceipts.map((r) => r.id));
    }
  };

  const handleSubmitReceiptBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReceiptIds.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Receipts Selected',
        message: 'Please select at least 1 scanned receipt to create a reimbursement batch.',
      });
      return;
    }

    const res = createReceiptReimbursementBatch({
      projectId,
      transactionIds: selectedReceiptIds,
      submissionNotes: submissionNotes.trim() || `Reimbursement batch for ${selectedReceiptIds.length} scanned receipts.`,
      coveragePeriodStart: periodStart,
      coveragePeriodEnd: periodEnd,
    });

    if (res.success) {
      navigateTo('requests');
    }
  };

  // ----------------------------------------------------
  // MODE 2: Itemized Requirement Forecast (Advance Requisition)
  // ----------------------------------------------------
  const [items, setItems] = useState<FundRequestItem[]>([
    {
      id: 'item-init-1',
      expenseNature: 'Materials & Hardware',
      quantity: 5,
      uom: 'Bags',
      rate: 700,
      amount: 3500,
      vendorName: 'Falcon Cement Supplies',
      notes: 'Urgent tile grouting bags for level 2 corridor',
      status: 'pending',
    }
  ]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [itemExpenseNature, setItemExpenseNature] = useState(CATEGORIES[0].name);
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUom, setItemUom] = useState(UOM_OPTIONS[0]);
  const [itemRate, setItemRate] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemVendor, setItemVendor] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const handleQtyRateChange = (qStr: string, rStr: string) => {
    setItemQuantity(qStr);
    setItemRate(rStr);
    const q = parseFloat(qStr) || 0;
    const r = parseFloat(rStr) || 0;
    if (q > 0 && r > 0) {
      setItemAmount((q * r).toString());
    }
  };

  const openAddItemModal = () => {
    setEditingItemId(null);
    setItemExpenseNature(CATEGORIES[0].name);
    setItemQuantity('1');
    setItemUom(UOM_OPTIONS[0]);
    setItemRate('');
    setItemAmount('');
    setItemVendor('');
    setItemNotes('');
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (it: FundRequestItem) => {
    setEditingItemId(it.id);
    setItemExpenseNature(it.expenseNature);
    setItemQuantity(it.quantity.toString());
    setItemUom(it.uom);
    setItemRate(it.rate.toString());
    setItemAmount(it.amount.toString());
    setItemVendor(it.vendorName);
    setItemNotes(it.notes);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(itemQuantity) || 1;
    const rate = parseFloat(itemRate) || 0;
    const amount = parseFloat(itemAmount) || (qty * rate);

    if (!itemVendor.trim() || amount <= 0) return;

    if (editingItemId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItemId
            ? {
                ...it,
                expenseNature: itemExpenseNature,
                quantity: qty,
                uom: itemUom,
                rate,
                amount,
                vendorName: itemVendor.trim(),
                notes: itemNotes.trim(),
              }
            : it
        )
      );
    } else {
      const newItem: FundRequestItem = {
        id: 'item-' + Date.now(),
        expenseNature: itemExpenseNature,
        quantity: qty,
        uom: itemUom,
        rate,
        amount,
        vendorName: itemVendor.trim(),
        notes: itemNotes.trim(),
        status: 'pending',
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const forecastBatchTotal = items.reduce((sum, it) => sum + it.amount, 0);

  const handleSubmitForecastBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const prj = projects.find((p) => p.id === projectId) || activeProject;

    const res = addFundRequestBatch({
      projectId: prj.id,
      projectName: prj.name,
      batchType: 'advance_forecast',
      coveragePeriodStart: periodStart,
      coveragePeriodEnd: periodEnd,
      items,
      totalAmount: forecastBatchTotal,
      totalExclVat: forecastBatchTotal,
      totalVat: 0,
      receiptsCount: 0,
      submissionNotes: submissionNotes.trim() || 'Advance petty cash forecast requisition.',
    });

    if (res.success) {
      navigateTo('requests');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-100">Fund Batch Requests</h2>
          <p className="text-[10px] text-slate-400 font-mono">Reimbursement & Advance Replenishment</p>
        </div>
        <button
          onClick={() => navigateTo('requests')}
          className="text-xs text-blue-400 font-semibold hover:underline"
        >
          Track All
        </button>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-500 rounded-2xl flex items-start gap-3 shadow-xl">
          <WifiOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-200">Device Offline</h4>
            <p className="text-rose-300/80 mt-0.5 leading-relaxed">
              Live connectivity is required to dispatch batch requests to management.
            </p>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setRequestMode('receipts')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            requestMode === 'receipts'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Group Receipts ({eligibleReceipts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setRequestMode('forecast')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            requestMode === 'forecast'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Advance Forecast</span>
        </button>
      </div>

      {/* Target Project Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Target Project & Coverage</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            Float: Rs {selectedProject.currentBalance.toLocaleString()}
          </span>
        </div>

        {/* Project Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Select Project / Site *</label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setSelectedReceiptIds([]);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.currency} {p.currentBalance.toLocaleString()} current float)
              </option>
            ))}
          </select>
        </div>

        {/* Coverage Period Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Period Start *
            </label>
            <input
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Period End *
            </label>
            <input
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submission Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Reimbursement Justification / Notes
          </label>
          <input
            type="text"
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            placeholder={
              requestMode === 'receipts'
                ? 'e.g. Scanned receipts for emergency plumbing and generator diesel refill'
                : 'e.g. Estimated site maintenance and stationery requirements for week 34'
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODE 1: GROUP SCANNED RECEIPTS CONTENT */}
      {/* ==================================================== */}
      {requestMode === 'receipts' && (
        <div className="space-y-3">
          {/* Header Controls for Selection */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Available Scanned Receipts ({eligibleReceipts.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select physical bills to combine into single reimbursement request
                </p>
              </div>

              {eligibleReceipts.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllReceipts}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {selectedReceiptIds.length === filteredReceipts.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" /> Select All ({filteredReceipts.length})
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quick Search */}
            {eligibleReceipts.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  placeholder="Filter by vendor, category, or bill ref..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Receipts List */}
          {eligibleReceipts.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 space-y-3">
              <Receipt className="w-10 h-10 mx-auto text-slate-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">No Open Scanned Receipts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All transactions for this project have already been bundled or no bills exist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('add_transaction')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-950"
              >
                <Plus className="w-3.5 h-3.5" /> Scan New Receipt with OCR
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReceipts.map((receipt) => {
                const isSelected = selectedReceiptIds.includes(receipt.id);
                return (
                  <div
                    key={receipt.id}
                    onClick={() => toggleSelectReceipt(receipt.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-emerald-950/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Checkbox & Receipt Thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 text-emerald-400">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-950" />
                        )}
                      </div>

                      {/* Attached Bill Image Thumbnail */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImageUrl(receipt.attachmentUrl);
                          setPreviewImageTitle(`${receipt.paidTo} • Ref: #${receipt.billRef}`);
                        }}
                        className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative group hover:border-emerald-400"
                        title="Click to zoom receipt"
                      >
                        <img
                          src={receipt.attachmentUrl}
                          alt={receipt.paidTo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            #{receipt.billRef}
                          </span>
                          <span className="font-bold text-xs text-slate-100 truncate">
                            {receipt.paidTo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{receipt.expenseNature}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{receipt.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & VAT */}
                    <div className="text-right shrink-0">
                      <div className="font-mono font-extrabold text-xs text-emerald-400">
                        Rs {receipt.amountInclVat.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        VAT: Rs {receipt.vatAmount}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grouped Cumulative Stats Summary */}
          {selectedReceipts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-2xl space-y-2 shadow-2xl"
            >
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold border-b border-emerald-500/20 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Grouped Reimbursement Batch Summary
                </span>
                <span className="font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                  {selectedReceipts.length} Bills Bundled
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Subtotal</span>
                  <span className="text-xs font-bold text-slate-200">Rs {totalReimbursementExcl.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Total VAT</span>
                  <span className="text-xs font-bold text-amber-300">Rs {totalReimbursementVat.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/40">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-300 block">Grand Total</span>
                  <span className="text-xs font-bold text-emerald-400">Rs {totalReimbursementAmount.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Reimbursement Button */}
          <button
            type="button"
            onClick={handleSubmitReceiptBatch}
            disabled={selectedReceiptIds.length === 0 || !isOnline}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>
              Submit Reimbursement Batch ({selectedReceiptIds.length} Bills • Rs {totalReimbursementAmount.toLocaleString()})
            </span>
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 2: ITEMIZE REQUIREMENT FORECAST (ADVANCE) */}
      {/* ==================================================== */}
      {requestMode === 'forecast' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Requirement Line Items ({items.length})
              </h3>
              <p className="text-[11px] text-slate-400">Add materials, labour, or vendor requisitions</p>
            </div>

            <button
              type="button"
              onClick={openAddItemModal}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-950 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <PackageCheck className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-medium text-slate-300">No items added to this forecast yet</p>
              <button
                onClick={openAddItemModal}
                className="text-xs text-blue-400 hover:underline font-bold"
              >
                + Click to add first line item
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start justify-between gap-3 shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-200">{it.vendorName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {it.expenseNature}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-mono mt-1">
                      {it.quantity} {it.uom} × Rs {it.rate.toLocaleString()} ={' '}
                      <strong className="text-emerald-400 font-bold">Rs {it.amount.toLocaleString()}</strong>
                    </div>

                    {it.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                        "{it.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditItemModal(it)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(it.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Running Batch Total Footer */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Forecast Total Amount
              </span>
              <span className="text-2xl font-mono font-extrabold text-white">
                Rs {forecastBatchTotal.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">{items.length} Line Items</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {periodStart} to {periodEnd}
              </span>
            </div>
          </div>

          {/* Submit Forecast Button */}
          <button
            onClick={handleSubmitForecastBatch}
            disabled={items.length === 0 || !isOnline}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-950 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Submit Advance Forecast to Manager</span>
          </button>
        </div>
      )}

      {/* Add / Edit Line Item Modal for Forecast Mode */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100">
                  {editingItemId ? 'Edit Requirement Item' : 'Add Line Item to Forecast'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-3">
                {/* Expense Nature */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expense Nature *
                  </label>
                  <select
                    value={itemExpenseNature}
                    onChange={(e) => setItemExpenseNature(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Vendor / Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemVendor}
                    onChange={(e) => setItemVendor(e.target.value)}
                    placeholder="e.g. Falcon Cement Supplies"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Qty, UOM, Rate */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={itemQuantity}
                      onChange={(e) => handleQtyRateChange(e.target.value, itemRate)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      UOM *
                    </label>
                    <select
                      value={itemUom}
                      onChange={(e) => setItemUom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                    >
                      {UOM_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Unit Rate (Rs) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={itemRate}
                      onChange={(e) => handleQtyRateChange(itemQuantity, e.target.value)}
                      placeholder="700"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Calculated Line Total (Rs) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={itemAmount}
                    onChange={(e) => setItemAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes / Justification
                  </label>
                  <textarea
                    rows={2}
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Specific site requirements, urgent replacement, etc."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    {editingItemId ? 'Update Item' : 'Add to Forecast'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox for Scanned Receipt zoom */}
      <ImageModal
        imageUrl={previewImageUrl || ''}
        title={previewImageTitle || 'Scanned Receipt Preview'}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
};
