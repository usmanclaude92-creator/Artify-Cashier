import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { ArrowLeft, ArrowDownLeft, Building2, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const FundReceiptScreen: React.FC = () => {
  const { activeProject, projects, addFundReceipt, goBack, navigateTo } = useCashier();

  const [projectId, setProjectId] = useState(activeProject.id);
  const [amountReceived, setAmountReceived] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedFrom, setReceivedFrom] = useState('');
  const [remarks, setRemarks] = useState('');

  const numAmount = parseFloat(amountReceived) || 0;
  const isValid = projectId && numAmount > 0 && receivedDate && receivedFrom.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const prj = projects.find((p) => p.id === projectId) || activeProject;

    addFundReceipt({
      projectId: prj.id,
      projectName: prj.name,
      amountReceived: numAmount,
      receivedDate,
      receivedFrom: receivedFrom.trim(),
      remarks: remarks.trim(),
    });

    navigateTo('dashboard');
  };

  const presetSources = [
    'Main Treasury - Head Office',
    'Project Manager Cash Advance',
    'Emergency Site Imprest',
    'Regional Operations HQ',
  ];

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
        <h2 className="text-sm font-bold text-slate-100">Record Fund Receipt</h2>
        <div className="w-10" />
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="p-4 bg-gradient-to-r from-teal-950/60 to-slate-900 border border-teal-500/30 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-teal-200">Float Replenishment</h3>
            <p className="text-[11px] text-teal-300/80">
              Record cash infusions received from Head Office or project advances.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
          {/* Project */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Receiving Project / Site *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.currency} {p.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Amount Received *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-teal-400">Rs</span>
              <input
                type="number"
                step="any"
                required
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="10,000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono font-extrabold text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Received Date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Received Date *
            </label>
            <input
              type="date"
              required
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Received From */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Received From (Source / Person) *
            </label>
            <input
              type="text"
              required
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="e.g. Main Treasury - Head Office"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-teal-500 focus:outline-none"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetSources.map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setReceivedFrom(source)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Remarks / Cheque / Slip Ref
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved Batch #REQ-2026-001 Cash Voucher #9182"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-teal-950 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Receipt & Credit Float</span>
        </button>
      </motion.form>
    </div>
  );
};
