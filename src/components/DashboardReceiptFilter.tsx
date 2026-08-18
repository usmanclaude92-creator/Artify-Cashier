import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Calendar, 
  Tag, 
  Filter, 
  Building2, 
  Receipt, 
  ChevronRight, 
  SlidersHorizontal,
  ArrowRight,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useCashier } from '../context/CashierContext';
import { CATEGORIES } from '../data/mockData';
import { Transaction } from '../types';

interface DashboardReceiptFilterProps {
  onSelectTransaction?: (tx: Transaction) => void;
}

export const DashboardReceiptFilter: React.FC<DashboardReceiptFilterProps> = ({ onSelectTransaction }) => {
  const { 
    transactions, 
    activeProject, 
    projects, 
    navigateTo, 
    setSelectedTransaction 
  } = useCashier();

  // Search & Filter States
  const [searchMerchant, setSearchMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [siteScope, setSiteScope] = useState<'current' | 'all'>('current');
  const [isExpanded, setIsExpanded] = useState(false);

  // Available unique categories extracted from transactions & predefined mock
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    CATEGORIES.forEach((c) => set.add(c.name));
    transactions.forEach((t) => {
      if (t.expenseNature) set.add(t.expenseNature);
    });
    return Array.from(set);
  }, [transactions]);

  // Filter calculations
  const filteredReceipts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return transactions.filter((tx) => {
      // Site scope
      if (siteScope === 'current' && tx.projectId !== activeProject.id) {
        return false;
      }

      // Merchant / PaidTo / Ref / Remarks search
      if (searchMerchant.trim()) {
        const q = searchMerchant.toLowerCase().trim();
        const matchMerchant = tx.paidTo.toLowerCase().includes(q);
        const matchRef = tx.billRef.toLowerCase().includes(q);
        const matchRemarks = tx.remarks.toLowerCase().includes(q);
        const matchVatReg = tx.vendorVatRegNo.toLowerCase().includes(q);
        if (!matchMerchant && !matchRef && !matchRemarks && !matchVatReg) {
          return false;
        }
      }

      // Category Tag filter
      if (selectedCategory !== 'all' && tx.expenseNature !== selectedCategory) {
        return false;
      }

      // Date Range filter
      if (datePreset === 'today' && tx.date !== todayStr) {
        return false;
      }
      if (datePreset === '7days' && tx.date < sevenDaysAgo) {
        return false;
      }
      if (datePreset === '30days' && tx.date < thirtyDaysAgo) {
        return false;
      }
      if (datePreset === 'custom') {
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      return true;
    });
  }, [transactions, activeProject.id, siteScope, searchMerchant, selectedCategory, datePreset, startDate, endDate]);

  const totalFilteredAmount = useMemo(() => {
    return filteredReceipts.reduce((sum, tx) => sum + tx.amountInclVat, 0);
  }, [filteredReceipts]);

  const hasActiveFilters = 
    Boolean(searchMerchant.trim()) || 
    selectedCategory !== 'all' || 
    datePreset !== 'all' || 
    siteScope !== 'current';

  const clearAllFilters = () => {
    setSearchMerchant('');
    setSelectedCategory('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSiteScope('current');
  };

  const handleReceiptClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    if (onSelectTransaction) {
      onSelectTransaction(tx);
    } else {
      navigateTo('history');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">
              Receipt & Expense Finder
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Search by merchant, category tag, or date range
            </p>
          </div>
        </div>

        {/* Filter Toggle & Clear Button */}
        <div className="flex items-center gap-1.5">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              isExpanded || hasActiveFilters
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Detailed Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Filters</span>
          </button>
        </div>
      </div>

      {/* Primary Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchMerchant}
          onChange={(e) => setSearchMerchant(e.target.value)}
          placeholder="Search merchant name (e.g., Shell, Apex), bill ref #, or remarks..."
          className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
        />
        {searchMerchant && (
          <button
            onClick={() => setSearchMerchant('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Tag Pills Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
          Category:
        </span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold border transition-all ${
            selectedCategory === 'all'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Categories
        </button>
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
            className={`px-2.5 py-1 rounded-xl whitespace-nowrap font-medium border transition-all flex items-center gap-1.5 ${
              selectedCategory === cat
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500/30'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Tag className="w-3 h-3 text-slate-500" />
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Collapsible Advanced Filters: Date Range & Site Scope */}
      {(isExpanded || datePreset !== 'all' || siteScope !== 'current') && (
        <div className="p-3 bg-slate-950/90 border border-slate-800/90 rounded-2xl space-y-2.5 text-xs animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Date Preset
              </label>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: '7 Days' },
                  { id: '30days', label: '30 Days' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setDatePreset(preset.id as any);
                      if (preset.id !== 'custom') {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                    className={`py-1 rounded-lg border font-semibold text-center transition-colors ${
                      datePreset === preset.id
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Site Scope */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" /> Project Scope
              </label>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <button
                  onClick={() => setSiteScope('current')}
                  className={`py-1 px-2 rounded-lg border font-semibold text-center truncate transition-colors ${
                    siteScope === 'current'
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeProject.code} ({activeProject.name.slice(0, 10)}...)
                </button>
                <button
                  onClick={() => setSiteScope('all')}
                  className={`py-1 px-2 rounded-lg border font-semibold text-center truncate transition-colors ${
                    siteScope === 'all'
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Assigned Sites
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker Inputs */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">From Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">To Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary & Matching Results Count */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-200">
            {filteredReceipts.length} {filteredReceipts.length === 1 ? 'receipt' : 'receipts'} found
          </span>
          {hasActiveFilters && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Rs {totalFilteredAmount.toLocaleString()}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => navigateTo('history')}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            View in History <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Results Mini-Feed (when filtering or searching) */}
      {hasActiveFilters && (
        <div className="space-y-2 pt-1 border-t border-slate-800">
          {filteredReceipts.length === 0 ? (
            <div className="p-4 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 space-y-1">
              <Receipt className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No matching receipts</p>
              <p className="text-[11px] text-slate-500">
                Try adjusting the merchant name, date range, or category filter.
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredReceipts.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => handleReceiptClick(tx)}
                  className="p-2.5 bg-slate-950/80 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-200 truncate group-hover:text-emerald-300">
                          {tx.paidTo}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {tx.billRef}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                        <span className="text-emerald-400/90 font-medium">{tx.expenseNature}</span>
                        <span>•</span>
                        <span className="font-mono">{tx.date}</span>
                        {tx.vendorVatRegNo && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-500 text-[9px]">VAT Reg: {tx.vendorVatRegNo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-extrabold text-xs text-emerald-300">
                      Rs {tx.amountInclVat.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      VAT: Rs {tx.vatAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
