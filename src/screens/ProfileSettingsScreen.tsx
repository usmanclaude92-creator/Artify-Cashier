import React, { useState } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  User, 
  ShieldCheck, 
  Building2, 
  Copy, 
  Check, 
  Link2, 
  Unlink, 
  RefreshCw, 
  RotateCcw, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  CheckCircle, 
  X, 
  Sun, 
  Moon, 
  Palette,
  Download,
  Terminal,
  Sparkles
} from 'lucide-react';
import { SAMPLE_MANAGERS } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';
import { ApkExportModal } from '../components/ApkExportModal';
import { generateAndDownloadApk } from '../utils/apkPackageGenerator';

export const ProfileSettingsScreen: React.FC<{ onOpenManagerSimulator: () => void }> = ({ onOpenManagerSimulator }) => {
  const {
    cashier,
    updateCashier,
    linkManager,
    unlinkManager,
    projects,
    isOnline,
    setIsOnline,
    syncNow,
    isSyncing,
    resetAllData,
    addToast,
    showPhoneFrame,
    setShowPhoneFrame,
    theme,
    setTheme,
  } = useCashier();

  const [isCopied, setIsCopied] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [customManagerId, setCustomManagerId] = useState('');

  const handleCopyId = () => {
    navigator.clipboard?.writeText(cashier.id);
    setIsCopied(true);
    addToast({
      type: 'info',
      title: 'ID Copied',
      message: `Cashier Unique ID ${cashier.id} copied. Share with your manager.`,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLinkSubmit = (managerId: string, name: string, email: string, role: string) => {
    linkManager(managerId, name, email, role);
    setIsLinkModalOpen(false);
  };

  const handleCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customManagerId.trim()) return;
    const found = SAMPLE_MANAGERS.find(
      (m) => m.id.toLowerCase() === customManagerId.trim().toLowerCase()
    );
    if (found) {
      handleLinkSubmit(found.id, found.name, found.email, found.role);
    } else {
      handleLinkSubmit(
        customManagerId.toUpperCase(),
        'Supervisor ' + customManagerId.toUpperCase(),
        'manager@artifygroup.com',
        'Senior Site Supervisor'
      );
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-slate-100">Cashier Profile & Settings</h2>
        <p className="text-xs text-slate-400">Account identity, manager hierarchy & project links</p>
      </div>

      {/* Cashier Identity Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-emerald-400">
              {cashier.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white truncate">{cashier.name}</h3>
            <p className="text-xs text-slate-400 truncate">{cashier.email}</p>
            <p className="text-xs font-mono text-slate-500">{cashier.phone}</p>
          </div>
        </div>

        {/* Unique ID Highlight */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Unique Cashier ID (Permanent)
            </span>
            <span className="text-base font-mono font-extrabold text-emerald-400">
              {cashier.id}
            </span>
          </div>

          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>
      </div>

      {/* Manager Linkage Card per Screen 8 Spec */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Manager Linkage & Approvals
          </h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {cashier.isSelfApproving ? 'Self-Approving' : 'Linked'}
          </span>
        </div>

        {cashier.isSelfApproving || !cashier.linkedManager ? (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-slate-200">Self-Approving Mode</h5>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  No manager linked. You can close petty cash batches with instant self-approval and immediate PDF generation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Link2 className="w-4 h-4" /> Link a Manager by Unique ID
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-950/80 border border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Reporting To Supervisor
                </span>
                <h5 className="text-sm font-bold text-white mt-0.5">{cashier.linkedManager.name}</h5>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  ID: {cashier.linkedManager.id} • {cashier.linkedManager.email}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{cashier.linkedManager.role}</p>
              </div>

              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Change Manager
              </button>
              <button
                onClick={unlinkManager}
                className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" /> Unlink
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assigned Projects */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Assigned Site Projects ({projects.length})
        </h4>

        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">
                    {p.code}
                  </span>
                  <span className="font-bold text-slate-200">{p.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-emerald-400">
                  {p.currency} {p.currentBalance.toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-500">Available Float</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync & Connectivity Settings */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-slate-400" />
          Cloud Synchronization & Storage
        </h4>
        <SyncStatusIndicator variant="full" />
      </div>

      {/* Display & Lighting Theme Mode */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-100">Display Theme & Readability</h4>
            <p className="text-[11px] text-slate-400">Optimize visual contrast for indoor or direct sunlight</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
              theme === 'dark'
                ? 'bg-slate-950 border-emerald-500 text-slate-100 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-slate-900 text-indigo-400">
                <Moon className="w-4 h-4" />
              </div>
              {theme === 'dark' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <div>
              <span className="font-bold text-xs block text-slate-200">Dark Mode</span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                Deep slate palette for battery saving & low light
              </span>
            </div>
          </button>

          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
              theme === 'light'
                ? 'bg-white border-emerald-500 text-slate-900 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              {theme === 'light' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <div>
              <span className="font-bold text-xs block text-slate-200">Light Mode</span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                High-contrast white for bright outdoor site conditions
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Android APK & Standalone Native App Installation */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Android .APK & App Package</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Package: com.artify.cashier • Android WebAPK & Gradle</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Install as a native WebAPK on your Android device with 1-tap, or export full Capacitor Gradle project to build a standalone <strong>app-debug.apk</strong>.
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Install on Mobile</span>
          </button>

          <button
            onClick={() => setIsApkModalOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>APK Hub & Fix</span>
          </button>
        </div>
      </div>

      {/* UI Frame Toggle & Reset */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-200 block">Android Device Mockup Frame</span>
            <span className="text-[11px] text-slate-400">Toggle mobile chassis container frame</span>
          </div>
          <button
            onClick={() => setShowPhoneFrame(!showPhoneFrame)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              showPhoneFrame
                ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showPhoneFrame ? 'Phone View' : 'Full Screen'}
          </button>
        </div>

        <button
          onClick={resetAllData}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Demo Data</span>
        </button>
      </div>

      {/* APK Export & Install Modal */}
      <ApkExportModal isOpen={isApkModalOpen} onClose={() => setIsApkModalOpen(false)} />

      {/* Link Manager Modal */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  Link Approving Manager
                </h3>
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Manager Directory */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Select from Company Manager Directory:
                </span>
                {SAMPLE_MANAGERS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleLinkSubmit(m.id, m.name, m.email, m.role)}
                    className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">{m.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{m.role}</div>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 font-mono font-bold text-[10px] rounded">
                      {m.id}
                    </span>
                  </button>
                ))}
              </div>

              {/* Or Manual Enter */}
              <form onSubmit={handleCustomLink} className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">
                  Or Enter Manager ID Manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={customManagerId}
                    onChange={(e) => setCustomManagerId(e.target.value)}
                    placeholder="e.g. M0087"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Link ID
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
