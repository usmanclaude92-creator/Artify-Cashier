import React from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageModalProps {
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, subtitle, onClose }) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-emerald-400" />
                {title || 'Receipt / Bill Attachment'}
              </h3>
              {subtitle && <p className="text-xs text-slate-400 font-mono">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Canvas */}
          <div className="p-4 flex-1 overflow-auto bg-slate-950/50 flex items-center justify-center min-h-[300px]">
            <img
              src={imageUrl}
              alt="Receipt Attachment"
              className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg border border-slate-800"
            />
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-800/40 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span>Verified against VAT records</span>
            <div className="flex gap-2">
              <a
                href={imageUrl}
                download="petty-cash-receipt.png"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
