import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  ChevronRight, 
  ShoppingBag, 
  Utensils, 
  Car, 
  Wrench, 
  FileText, 
  Sparkles,
  Filter
} from 'lucide-react';
import { useCashier } from '../context/CashierContext';
import { Transaction } from '../types';

// Distinct colors for category slices
const CATEGORY_COLORS: Record<string, string> = {
  'Supplies': '#10b981', // emerald-500
  'Office Supplies': '#10b981',
  'Site Supplies': '#059669',
  'Meals': '#f59e0b', // amber-500
  'Food & Meals': '#f59e0b',
  'Travel': '#3b82f6', // blue-500
  'Travel & Transport': '#3b82f6',
  'Transport': '#06b6d4', // cyan-500
  'Utilities': '#8b5cf6', // violet-500
  'Maintenance': '#ec4899', // pink-500
  'Repair & Maintenance': '#ec4899',
  'Tools & Equipment': '#6366f1', // indigo-500
  'Site Services': '#14b8a6', // teal-500
  'Courier & Postal': '#a855f7',
  'Emergency Site Expense': '#f43f5e', // rose-500
  'Miscellaneous': '#94a3b8', // slate-400
};

const DEFAULT_COLOR_PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#94a3b8', // slate
];

const getCategoryColor = (category: string, index: number): string => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  // Match substrings
  const catLower = category.toLowerCase();
  if (catLower.includes('meal') || catLower.includes('food')) return '#f59e0b';
  if (catLower.includes('travel') || catLower.includes('fuel') || catLower.includes('transport')) return '#3b82f6';
  if (catLower.includes('suppl') || catLower.includes('station')) return '#10b981';
  if (catLower.includes('repair') || catLower.includes('maint')) return '#ec4899';
  if (catLower.includes('util') || catLower.includes('elect')) return '#8b5cf6';
  return DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length];
};

interface CategoryData {
  name: string;
  value: number;
  vatValue: number;
  count: number;
  percentage: number;
  color: string;
}

export const CategorySpendingCard: React.FC = () => {
  const { transactions, activeProject, navigateTo, setSelectedTransaction } = useCashier();

  // Filter scope: 'active_site' | 'all_sites'
  const [scope, setScope] = useState<'active_site' | 'all_sites'>('active_site');
  // Transaction type scope: 'all' | 'open_only'
  const [periodFilter, setPeriodFilter] = useState<'all' | 'open_only'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Compute category spending data
  const { chartData, totalSpending, totalVat, transactionCount } = useMemo(() => {
    const filteredTx = transactions.filter((tx) => {
      if (scope === 'active_site' && tx.projectId !== activeProject.id) return false;
      if (periodFilter === 'open_only' && tx.status !== 'open') return false;
      return true;
    });

    const categoryMap: Record<string, { total: number; vat: number; count: number }> = {};
    let sumTotal = 0;
    let sumVat = 0;

    filteredTx.forEach((tx) => {
      const cat = tx.expenseNature || 'Miscellaneous';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, vat: 0, count: 0 };
      }
      categoryMap[cat].total += tx.amountInclVat;
      categoryMap[cat].vat += tx.vatAmount;
      categoryMap[cat].count += 1;
      sumTotal += tx.amountInclVat;
      sumVat += tx.vatAmount;
    });

    const data: CategoryData[] = Object.entries(categoryMap)
      .map(([name, stats], idx) => ({
        name,
        value: stats.total,
        vatValue: stats.vat,
        count: stats.count,
        percentage: sumTotal > 0 ? (stats.total / sumTotal) * 100 : 0,
        color: getCategoryColor(name, idx),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      chartData: data,
      totalSpending: sumTotal,
      totalVat: sumVat,
      transactionCount: filteredTx.length,
    };
  }, [transactions, activeProject.id, scope, periodFilter]);

  // Custom tooltip for Recharts Pie
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CategoryData = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs font-sans z-50">
          <div className="flex items-center gap-2 font-bold text-white mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="space-y-0.5 text-slate-300 font-mono text-[11px]">
            <div>Total: <span className="font-bold text-emerald-400">Rs {data.value.toLocaleString()}</span></div>
            <div>VAT Component: <span className="text-amber-400">Rs {data.vatValue.toLocaleString()}</span></div>
            <div className="text-slate-400 text-[10px]">
              {data.count} bills • {data.percentage.toFixed(1)}% of spending
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Spending by Category
            </h3>
            <p className="text-[11px] text-slate-400">
              Petty cash allocation & expense distribution
            </p>
          </div>
        </div>

        {/* Scope & Period Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => setScope('active_site')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              scope === 'active_site'
                ? 'bg-slate-800 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeProject.code}
          </button>
          <button
            onClick={() => setScope('all_sites')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              scope === 'all_sites'
                ? 'bg-slate-800 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sites
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 text-slate-400 space-y-2">
          <PieChartIcon className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs font-semibold text-slate-300">No expense records found</p>
          <p className="text-[11px] text-slate-500">
            Record cash vouchers to visualize category allocation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Visual: Donut Chart + Center Total */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            {/* Recharts Pie Donut */}
            <div className="sm:col-span-6 relative flex items-center justify-center min-h-[190px]">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) =>
                      setSelectedCategory(selectedCategory === entry.name ? null : entry.name)
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={selectedCategory === entry.name ? 3 : 1.5}
                        className="cursor-pointer transition-transform hover:opacity-90"
                        style={{
                          transform: selectedCategory === entry.name ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total Label inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Spent
                </span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400">
                  Rs {totalSpending.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {transactionCount} Vouchers
                </span>
              </div>
            </div>

            {/* Quick Summary Highlights */}
            <div className="sm:col-span-6 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>Top Allocation</span>
                <span className="font-mono text-slate-200">
                  {chartData[0]?.name} ({chartData[0]?.percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>Total VAT Paid</span>
                <span className="font-mono font-semibold text-amber-400">
                  Rs {totalVat.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>Categories Count</span>
                <span className="font-mono text-slate-200">{chartData.length} distinct categories</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Avg. Bill Size</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Rs {transactionCount > 0 ? Math.round(totalSpending / transactionCount).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Categorical Breakdown Bar List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span>Category Breakdown</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {selectedCategory ? `Filtered: ${selectedCategory} (tap to clear)` : 'Tap row to highlight'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {chartData.map((item) => {
                const isSelected = selectedCategory === item.name;
                return (
                  <div
                    key={item.name}
                    onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-slate-200 truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({item.count} {item.count === 1 ? 'bill' : 'bills'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-extrabold text-slate-100">
                          Rs {item.value.toLocaleString()}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Representation */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
