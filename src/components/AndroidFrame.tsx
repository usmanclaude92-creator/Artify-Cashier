import React, { useState, useEffect } from 'react';
import { useCashier } from '../context/CashierContext';
import { 
  Wifi, 
  Battery, 
  Signal, 
  ShieldCheck, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
  Cloud,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { FundReceiptScreen } from '../screens/FundReceiptScreen';
import { RequestFundsScreen } from '../screens/RequestFundsScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { ClosePettyCashScreen } from '../screens/ClosePettyCashScreen';
import { RequestsTabScreen } from '../screens/RequestsTabScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { ClosureReportPdfScreen } from '../screens/ClosureReportPdfScreen';
import { BottomNavBar } from './BottomNavBar';
import { NotificationToast } from './NotificationToast';
import { ManagerSimulatorModal } from './ManagerSimulatorModal';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { ReceiptGalleryModal } from './ReceiptGalleryModal';
import { ApkExportModal } from './ApkExportModal';
import { Images, Download } from 'lucide-react';

export const AndroidFrame: React.FC = () => {
  const { 
    currentScreen, 
    showPhoneFrame, 
    setShowPhoneFrame, 
    cashier, 
    theme, 
    toggleTheme, 
    isOnline, 
    isSyncing, 
    transactions,
    openReceiptGallery
  } = useCashier();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('12:45');

  const pendingCount = transactions.filter((t) => t.syncStatus === 'pending_sync').length;

  // Clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Determine if bottom navigation bar should be visible
  const isMainTab = ['dashboard', 'history', 'requests', 'profile'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'registration':
        return <RegistrationScreen />;
      case 'dashboard':
        return <DashboardScreen onOpenManagerSimulator={() => setIsSimulatorOpen(true)} />;
      case 'add_transaction':
        return <AddTransactionScreen />;
      case 'fund_receipt':
        return <FundReceiptScreen />;
      case 'request_funds':
        return <RequestFundsScreen />;
      case 'history':
        return <TransactionHistoryScreen />;
      case 'close_petty_cash':
        return <ClosePettyCashScreen onOpenManagerSimulator={() => setIsSimulatorOpen(true)} />;
      case 'requests':
        return <RequestsTabScreen onOpenManagerSimulator={() => setIsSimulatorOpen(true)} />;
      case 'profile':
        return <ProfileSettingsScreen onOpenManagerSimulator={() => setIsSimulatorOpen(true)} />;
      case 'closure_pdf':
        return <ClosureReportPdfScreen />;
      default:
        return <DashboardScreen onOpenManagerSimulator={() => setIsSimulatorOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 selection:bg-emerald-500 selection:text-slate-950">
      <NotificationToast />
      <ManagerSimulatorModal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
      <ReceiptGalleryModal />
      <ApkExportModal isOpen={isApkModalOpen} onClose={() => setIsApkModalOpen(false)} />

      {/* Floating Top Controls (Testing & Device view switches) */}
      <div className="no-print w-full max-w-md mb-2 px-3 py-1.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Artify Cashier • Android</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Visual Sync Status Indicator */}
          <SyncStatusIndicator variant="compact" />

          {/* Android APK Direct Download & Hub Trigger */}
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold flex items-center gap-1 transition-all text-[11px] shadow-sm shadow-emerald-950 cursor-pointer active:scale-95"
            title="Download .APK file to your system"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .APK</span>
          </button>

          {/* Receipt Gallery Quick Trigger */}
          <button
            onClick={() => openReceiptGallery()}
            className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 transition-all text-[11px]"
            title="Open Receipt Gallery (Swipe through scanned bills)"
          >
            <Images className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold flex items-center gap-1.5 transition-all text-[11px]"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Manager Simulator Quick Trigger */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold flex items-center gap-1 transition-all"
            title="Open Manager Simulator to test approvals"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Manager Tester</span>
          </button>

          {/* Toggle Device Chassis Frame */}
          <button
            onClick={() => setShowPhoneFrame(!showPhoneFrame)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            title={showPhoneFrame ? 'Switch to Full Screen View' : 'Switch to Android Phone Mockup'}
          >
            {showPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Android Device Chassis or Full Screen Container */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-slate-950 ${
          showPhoneFrame
            ? 'max-w-[420px] h-[92vh] max-h-[890px] rounded-[42px] border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.08)] overflow-hidden'
            : 'max-w-2xl min-h-screen rounded-none border-none shadow-none'
        }`}
      >
        {/* Android Status Bar */}
        <div className="no-print sticky top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md px-6 pt-3 pb-1 flex items-center justify-between text-xs text-slate-300 font-mono select-none">
          <span className="font-bold text-[11px] tracking-tight">{currentTime}</span>

          {/* Center Punch Hole Camera Notch */}
          {showPhoneFrame && (
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-300">
            {/* Live Sync Status Icon in Status Bar */}
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" title="Syncing with Cloud..." />
            ) : !isOnline || pendingCount > 0 ? (
              <span className="flex items-center gap-0.5 text-[9px] text-amber-400 font-bold" title={`${pendingCount} item(s) saved locally on device`}>
                <HardDrive className="w-3 h-3 text-amber-400" />
                {pendingCount > 0 && <span>{pendingCount}</span>}
              </span>
            ) : (
              <Cloud className="w-3 h-3 text-emerald-400" title="Cloud Synced" />
            )}

            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-bold text-emerald-400">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span className="text-[10px] font-bold">98%</span>
            </div>
          </div>
        </div>

        {/* Scrollable Screen Content Canvas */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {renderScreen()}
        </div>

        {/* Bottom Navigation Bar (if in main tabs) */}
        {isMainTab && <BottomNavBar />}

        {/* Android Navigation Gesture Bar */}
        {showPhoneFrame && (
          <div className="no-print bg-slate-950 py-1.5 flex justify-center items-center">
            <div className="w-28 h-1 bg-slate-700/80 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
