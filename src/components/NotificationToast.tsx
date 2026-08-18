import React from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  Check, 
  Layers, 
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationToast: React.FC = () => {
  const { toasts, removeToast } = useCashier();

  return (
    <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-md px-3.5 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => {
          const isPdfDownload = toast.type === 'pdf_download' || !!toast.meta?.fileName;
          const duration = toast.duration || 6000;

          if (isPdfDownload) {
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -25, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="pointer-events-auto rounded-2xl p-4 bg-slate-900/95 border border-emerald-500/50 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl text-slate-100 overflow-hidden relative group"
              >
                {/* Ambient Top Glow Line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

                <div className="flex items-start gap-3.5">
                  {/* PDF Document Icon Badge */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-950">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>

                  {/* Toast Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                          PDF READY
                        </span>
                        <h4 className="text-xs font-bold text-white truncate tracking-tight">
                          {toast.title || 'Closure PDF Generated & Downloaded'}
                        </h4>
                      </div>

                      <button
                        onClick={() => removeToast(toast.id)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0 -mr-1 -mt-1"
                        aria-label="Close notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-normal">
                      {toast.message}
                    </p>

                    {/* File Attachment Chip */}
                    {toast.meta?.fileName && (
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">
                            PDF
                          </div>
                          <span className="text-[11px] font-mono text-slate-200 truncate font-semibold">
                            {toast.meta.fileName}
                          </span>
                        </div>
                        {toast.meta.fileSize && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {toast.meta.fileSize}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Financial Metrics Summary Strip */}
                    {toast.meta && (toast.meta.grossAmount !== undefined || toast.meta.entriesCount !== undefined) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-mono">
                        {toast.meta.grossAmount !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-bold">
                            Gross: Rs {toast.meta.grossAmount.toLocaleString()}
                          </span>
                        )}
                        {toast.meta.vatAmount !== undefined && toast.meta.vatAmount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300">
                            VAT: Rs {toast.meta.vatAmount.toLocaleString()}
                          </span>
                        )}
                        {toast.meta.entriesCount !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-800/60 text-blue-300">
                            {toast.meta.entriesCount} Receipts Audited
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(toast.action || toast.secondaryAction) && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
                        {toast.action && (
                          <button
                            onClick={() => {
                              toast.action?.onClick();
                              removeToast(toast.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{toast.action.label}</span>
                          </button>
                        )}
                        {toast.secondaryAction && (
                          <button
                            onClick={() => {
                              toast.secondaryAction?.onClick();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{toast.secondaryAction.label}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-Dismiss Animated Progress Bar */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500/60"
                />
              </motion.div>
            );
          }

          // Standard Toast Types
          let bgClass = 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/60';
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
          let barColor = 'bg-blue-500/60';

          if (toast.type === 'success') {
            bgClass = 'bg-slate-900 border-emerald-600/60 text-emerald-100 shadow-emerald-950/50';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            barColor = 'bg-emerald-500/60';
          } else if (toast.type === 'error') {
            bgClass = 'bg-slate-900 border-rose-600/60 text-rose-100 shadow-rose-950/50';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            barColor = 'bg-rose-500/60';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-slate-900 border-amber-600/60 text-amber-100 shadow-amber-950/50';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
            barColor = 'bg-amber-500/60';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-2xl p-3.5 border shadow-xl backdrop-blur-md flex items-start gap-3 relative overflow-hidden ${bgClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold tracking-wide uppercase opacity-90">{toast.title}</h4>
                <p className="text-xs mt-0.5 leading-relaxed break-words font-medium text-slate-300">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="mt-2 text-xs font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded text-white transition-colors"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/60 hover:text-white p-1 rounded-md transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={`absolute bottom-0 inset-x-0 h-0.5 ${barColor}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
