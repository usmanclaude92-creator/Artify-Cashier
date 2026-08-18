import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { ShieldCheck, User, Phone, Mail, ArrowRight, Sparkles, Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';

export const RegistrationScreen: React.FC = () => {
  const { cashier, updateCashier, navigateTo, addToast } = useCashier();

  const [name, setName] = useState(cashier.name || 'Farhan Tariq');
  const [phone, setPhone] = useState(cashier.phone || '+92 300 8923411');
  const [email, setEmail] = useState(cashier.email || 'farhan.cashier@artifygroup.com');
  const [generatedId, setGeneratedId] = useState('U' + Math.floor(1000 + Math.random() * 9000));
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(generatedId);
    setIsCopied(true);
    addToast({
      type: 'info',
      title: 'ID Copied',
      message: `Cashier ID ${generatedId} copied to clipboard.`,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateCashier({
      id: generatedId,
      name,
      phone,
      email,
      isSelfApproving: true,
      linkedManager: null,
    });

    addToast({
      type: 'success',
      title: 'Registration Successful',
      message: `Welcome ${name}! You are registered in Self-Approval mode.`,
    });

    navigateTo('dashboard');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* Header Visual */}
      <div className="pt-6 pb-2 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 mb-4 flex items-center justify-center"
        >
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400 font-extrabold text-2xl tracking-tighter">
            AC
          </div>
        </motion.div>
        <h1 className="text-2xl font-black tracking-tight text-white">Artify Cashier</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Petty Cash Management & VAT OCR Scanning for Construction, Studios & Sites
        </p>
      </div>

      {/* Main Registration Card */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleComplete}
        className="space-y-4 my-auto bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md"
      >
        {/* Unique ID Highlight Box */}
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Auto-Generated Cashier ID
            </span>
            <span className="text-lg font-mono font-extrabold text-emerald-300">{generatedId}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Copied' : 'Copy ID'}
          </button>
        </div>

        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Farhan Tariq"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cashier@artifygroup.com"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Confirmation Banner */}
        <div className="p-3 bg-blue-950/40 border border-blue-600/30 rounded-xl flex items-start gap-2.5 text-xs text-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-300">Self-Approval Mode Enabled</p>
            <p className="text-[11px] text-blue-200/80 mt-0.5 leading-relaxed">
              You're set up in <strong>self-approval mode</strong>. You can link a supervisor/manager anytime from Profile & Settings.
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.form>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 py-3">
        Artify Cashier v2.4 • Site & Project Expense System
      </div>
    </div>
  );
};
