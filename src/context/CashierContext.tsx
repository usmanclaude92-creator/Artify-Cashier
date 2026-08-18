import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ScreenType, 
  CashierProfile, 
  Project, 
  Transaction, 
  FundRequestBatch, 
  FundReceipt, 
  PettyCashClosure,
  CreateReceiptBatchParams,
  GroupedReceiptSummary,
  FundRequestItem,
  ReimbursementWorkflowStatus,
  WorkflowActor,
  ApprovalWorkflowTransition,
  ApprovalDecisionParams,
  RejectionDecisionParams,
  BatchStatusHistoryEntry,
  ThemeMode
} from '../types';
import { 
  INITIAL_CASHIER, 
  INITIAL_PROJECTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_FUND_RECEIPTS, 
  INITIAL_FUND_BATCHES 
} from '../data/mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'pdf_download';
  title: string;
  message: string;
  meta?: {
    fileName?: string;
    fileSize?: string;
    grossAmount?: number;
    vatAmount?: number;
    entriesCount?: number;
    voucherRef?: string;
    projectCode?: string;
    periodRange?: string;
    pagesCount?: number;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface CashierContextType {
  // Navigation & Screen
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  historyStack: ScreenType[];
  navigateTo: (screen: ScreenType) => void;
  goBack: () => void;

  // Profile & Projects
  cashier: CashierProfile;
  updateCashier: (updates: Partial<CashierProfile>) => void;
  linkManager: (managerId: string, managerName: string, managerEmail: string, role: string) => void;
  unlinkManager: () => void;
  
  projects: Project[];
  activeProject: Project;
  setActiveProjectId: (id: string) => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'billRef' | 'createdAt' | 'syncStatus' | 'reviewStatus' | 'closureId'>) => Transaction;
  openTransactionsForActiveProject: Transaction[];
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  
  // Fund Receipts
  fundReceipts: FundReceipt[];
  addFundReceipt: (receipt: Omit<FundReceipt, 'id' | 'receiptNumber' | 'createdAt'>) => FundReceipt;

  // Fund Batch Requests Module
  fundRequests: FundRequestBatch[];
  addFundRequestBatch: (batch: Omit<FundRequestBatch, 'id' | 'batchNumber' | 'requestedAt' | 'status'>) => { success: boolean; error?: string; batch?: FundRequestBatch };
  createReceiptReimbursementBatch: (params: CreateReceiptBatchParams) => { success: boolean; error?: string; batch?: FundRequestBatch };
  selectedFundBatch: FundRequestBatch | null;
  setSelectedFundBatch: (batch: FundRequestBatch | null) => void;
  reimburseFundBatch: (batchId: string) => { success: boolean; error?: string };
  cancelFundBatch: (batchId: string) => { success: boolean; error?: string };
  getEligibleReceiptsForBatch: (projectId?: string) => Transaction[];

  // ==========================================
  // APPROVAL WORKFLOW MODULE (STATE MACHINE)
  // ==========================================
  transitionBatchState: (
    batchId: string, 
    toStatus: ReimbursementWorkflowStatus, 
    options?: {
      actor?: WorkflowActor;
      notes?: string;
      approvedAmount?: number;
      rejectionReason?: string;
    }
  ) => { success: boolean; error?: string; batch?: FundRequestBatch };
  
  startManagerReview: (batchId: string, reviewerName?: string) => { success: boolean; error?: string };
  approveReimbursementRequest: (params: ApprovalDecisionParams) => { success: boolean; error?: string };
  rejectReimbursementRequest: (params: RejectionDecisionParams) => { success: boolean; error?: string };
  getApprovalWorkflowEvents: (batchId: string) => ApprovalWorkflowTransition[];

  // Closures
  closures: PettyCashClosure[];
  activeClosureForPdf: PettyCashClosure | null;
  setActiveClosureForPdf: (closure: PettyCashClosure | null) => void;
  createAndSubmitClosure: (
    projectId: string, 
    selectedTxIds: string[], 
    isSelfApproved: boolean
  ) => { success: boolean; closure?: PettyCashClosure; error?: string };
  selfApproveClosure: (closureId: string) => void;
  
  // Manager Simulator (for interactive testing)
  simulateManagerApproveClosure: (closureId: string) => void;
  simulateManagerRejectClosure: (closureId: string, reason: string) => void;
  simulateManagerStartReviewBatch: (batchId: string) => void;
  simulateManagerApproveBatch: (batchId: string, notes?: string, approvedAmount?: number) => void;
  simulateManagerRejectBatch: (batchId: string, reason: string) => void;

  // Network & Sync
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  syncNow: () => void;
  isSyncing: boolean;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Reset demo data
  resetAllData: () => void;

  // Device framing
  showPhoneFrame: boolean;
  setShowPhoneFrame: (show: boolean) => void;

  // Theme Mode
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Receipt Gallery Modal State & Helpers
  isReceiptGalleryOpen: boolean;
  receiptGalleryIndex: number;
  receiptGalleryProjectId: string;
  openReceiptGallery: (initialIndexOrTxId?: number | string, projectId?: string) => void;
  closeReceiptGallery: () => void;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

const STORAGE_KEY = 'artify_cashier_state_v3';

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state or defaults
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }
    return null;
  };

  const savedState = loadSavedState();

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(savedState?.currentScreen || 'dashboard');
  const [historyStack, setHistoryStack] = useState<ScreenType[]>(savedState?.historyStack || ['dashboard']);

  // Cashier & Projects
  const [cashier, setCashier] = useState<CashierProfile>(savedState?.cashier || INITIAL_CASHIER);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects || INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectIdState] = useState<string>(
    savedState?.activeProjectId || cashier.activeProjectId || 'PRJ-SITA'
  );

  // Financial Data
  const [transactions, setTransactions] = useState<Transaction[]>(savedState?.transactions || INITIAL_TRANSACTIONS);
  const [fundReceipts, setFundReceipts] = useState<FundReceipt[]>(savedState?.fundReceipts || INITIAL_FUND_RECEIPTS);
  const [fundRequests, setFundRequests] = useState<FundRequestBatch[]>(savedState?.fundRequests || INITIAL_FUND_BATCHES);
  const [closures, setClosures] = useState<PettyCashClosure[]>(savedState?.closures || []);

  // UI Selection States
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedFundBatch, setSelectedFundBatch] = useState<FundRequestBatch | null>(null);
  const [activeClosureForPdf, setActiveClosureForPdf] = useState<PettyCashClosure | null>(null);

  // Connectivity & Sync Simulation
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showPhoneFrame, setShowPhoneFrame] = useState<boolean>(true);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (savedState?.theme) return savedState.theme;
    const stored = localStorage.getItem('artify_cashier_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
  });

  // Receipt Gallery Modal State
  const [isReceiptGalleryOpen, setIsReceiptGalleryOpen] = useState<boolean>(false);
  const [receiptGalleryIndex, setReceiptGalleryIndex] = useState<number>(0);
  const [receiptGalleryProjectId, setReceiptGalleryProjectId] = useState<string>('all');

  const openReceiptGallery = (initialIndexOrTxId?: number | string, projectId?: string) => {
    if (projectId) {
      setReceiptGalleryProjectId(projectId);
    } else {
      setReceiptGalleryProjectId('all');
    }

    if (typeof initialIndexOrTxId === 'number') {
      setReceiptGalleryIndex(initialIndexOrTxId);
    } else if (typeof initialIndexOrTxId === 'string') {
      const idx = transactions.findIndex((t) => t.id === initialIndexOrTxId || t.billRef === initialIndexOrTxId);
      setReceiptGalleryIndex(idx !== -1 ? idx : 0);
    } else {
      setReceiptGalleryIndex(0);
    }

    setIsReceiptGalleryOpen(true);
  };

  const closeReceiptGallery = () => {
    setIsReceiptGalleryOpen(false);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('artify_cashier_theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  // Active Project helper
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  const setActiveProjectId = (id: string) => {
    setActiveProjectIdState(id);
    setCashier((prev) => ({ ...prev, activeProjectId: id }));
  };

  // Persist state changes
  useEffect(() => {
    try {
      const stateToSave = {
        currentScreen,
        historyStack,
        cashier,
        projects,
        activeProjectId,
        transactions,
        fundReceipts,
        fundRequests,
        closures,
        theme,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to persist state to localStorage', e);
    }
  }, [currentScreen, historyStack, cashier, projects, activeProjectId, transactions, fundReceipts, fundRequests, closures, theme]);

  // Toast manager
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Screen Navigation helpers
  const navigateTo = (screen: ScreenType) => {
    setHistoryStack((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop();
      const prevScreen = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('dashboard');
    }
  };

  // Cashier Profile Operations
  const updateCashier = (updates: Partial<CashierProfile>) => {
    setCashier((prev) => ({ ...prev, ...updates }));
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Cashier settings and profile saved successfully.',
    });
  };

  const linkManager = (managerId: string, managerName: string, managerEmail: string, role: string) => {
    setCashier((prev) => ({
      ...prev,
      isSelfApproving: false,
      linkedManager: {
        id: managerId,
        name: managerName,
        email: managerEmail,
        role,
      },
    }));
    addToast({
      type: 'info',
      title: 'Manager Linked',
      message: `Account linked to ${managerName} (${role}). Approval requests will be routed to their console.`,
    });
  };

  const unlinkManager = () => {
    setCashier((prev) => ({
      ...prev,
      isSelfApproving: true,
      linkedManager: null,
    }));
    addToast({
      type: 'warning',
      title: 'Manager Unlinked',
      message: 'Self-approval mode enabled. You can approve and generate closure reports directly.',
    });
  };

  // Open transactions for active project
  const openTransactionsForActiveProject = transactions.filter(
    (t) => t.projectId === activeProject.id && t.reviewStatus === 'open'
  );

  // Add a new transaction (OCR or manual entry)
  const addTransaction = (
    txData: Omit<Transaction, 'id' | 'billRef' | 'createdAt' | 'syncStatus' | 'reviewStatus' | 'closureId'>
  ) => {
    const prj = projects.find((p) => p.id === txData.projectId) || activeProject;
    
    // Generate Bill Reference format: YYXXXZZZZ (e.g. 26SITA0005)
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const projectCode = prj.code.toUpperCase().padEnd(4, 'X').slice(0, 4);
    const txCountForProject = transactions.filter((t) => t.projectId === prj.id).length + 1;
    const serialStr = txCountForProject.toString().padStart(4, '0');
    const billRef = `${currentYearShort}${projectCode}${serialStr}`;

    const newTx: Transaction = {
      ...txData,
      id: `TX-${Date.now()}`,
      billRef,
      createdAt: new Date().toISOString(),
      syncStatus: isOnline ? 'synced' : 'pending_sync',
      reviewStatus: 'open',
      closureId: null,
      srNo: txCountForProject,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Deduct Project Balance
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === prj.id) {
          const newBal = p.currentBalance - newTx.amountInclVat;
          const newSpent = p.totalSpent + newTx.amountInclVat;
          return {
            ...p,
            currentBalance: newBal,
            totalSpent: newSpent,
          };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: 'Transaction Saved',
      message: `Bill Ref #${billRef} for ${prj.currency} ${newTx.amountInclVat.toLocaleString()} recorded. Float balance updated.`,
    });

    return newTx;
  };

  // Fund Receipts (Float Inflow)
  const addFundReceipt = (
    receiptData: Omit<FundReceipt, 'id' | 'receiptNumber' | 'createdAt'>
  ) => {
    const prj = projects.find((p) => p.id === receiptData.projectId) || activeProject;
    const recCount = fundReceipts.length + 1;
    const receiptNumber = `FR-2026-${recCount.toString().padStart(3, '0')}`;

    const newReceipt: FundReceipt = {
      ...receiptData,
      id: `REC-${Date.now()}`,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    setFundReceipts((prev) => [newReceipt, ...prev]);

    // Update project balance
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === prj.id) {
          const newBal = p.currentBalance + newReceipt.amountReceived;
          const newRec = p.totalReceived + newReceipt.amountReceived;
          return {
            ...p,
            currentBalance: newBal,
            totalReceived: newRec,
          };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: 'Fund Receipt Saved',
      message: `Received ${prj.currency} ${newReceipt.amountReceived.toLocaleString()} from ${newReceipt.receivedFrom}. Float replenished.`,
    });

    return newReceipt;
  };

  // ==========================================
  // APPROVAL WORKFLOW MODULE (STATE TRANSITIONS)
  // ==========================================

  // Returns all workflow events/transitions for a batch
  const getApprovalWorkflowEvents = (batchId: string): ApprovalWorkflowTransition[] => {
    const batch = fundRequests.find((b) => b.id === batchId);
    return batch?.workflowTransitions || [];
  };

  // Core state transition engine with validation and audit logging
  const transitionBatchState = (
    batchId: string,
    toStatus: ReimbursementWorkflowStatus,
    options?: {
      actor?: WorkflowActor;
      notes?: string;
      approvedAmount?: number;
      rejectionReason?: string;
    }
  ) => {
    const batch = fundRequests.find((b) => b.id === batchId);
    if (!batch) {
      return { success: false, error: 'Batch not found' };
    }

    const fromStatus = batch.status;
    const now = new Date().toISOString();
    const actor: WorkflowActor = options?.actor || {
      name: cashier.linkedManager?.name || 'Tariq Mehmood (M0087)',
      role: 'manager',
      id: cashier.linkedManager?.id || 'M0087',
    };

    // Transition Validation Rules
    // e.g. Cannot fulfill an unapproved batch
    if (toStatus === 'fulfilled' && fromStatus !== 'approved') {
      return { success: false, error: 'Only approved batches can be disbursed & fulfilled.' };
    }

    const transitionEvent: ApprovalWorkflowTransition = {
      id: `WF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fromStatus,
      toStatus,
      timestamp: now,
      actor,
      notes: options?.notes,
      approvedAmount: options?.approvedAmount,
      rejectionReason: options?.rejectionReason,
    };

    const historyEntry: BatchStatusHistoryEntry = {
      status: toStatus,
      timestamp: now,
      note: options?.notes || options?.rejectionReason || `Status changed from ${fromStatus} to ${toStatus}`,
      updatedBy: actor.name,
      actorRole: actor.role,
    };

    let updatedBatch: FundRequestBatch | null = null;

    setFundRequests((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const transitions = b.workflowTransitions || [];
          const histories = b.statusHistory || [];

          updatedBatch = {
            ...b,
            status: toStatus,
            underReviewAt: toStatus === 'manager_review' ? now : b.underReviewAt,
            approvedAt: toStatus === 'approved' ? now : b.approvedAt,
            approvedAmount: options?.approvedAmount !== undefined ? options.approvedAmount : (toStatus === 'approved' ? b.totalAmount : b.approvedAmount),
            reviewedBy: actor.name,
            managerNotes: options?.notes || b.managerNotes,
            rejectionReason: options?.rejectionReason || b.rejectionReason,
            workflowTransitions: [...transitions, transitionEvent],
            statusHistory: [...histories, historyEntry],
            items: b.items.map((it) => ({
              ...it,
              status: toStatus === 'approved' ? 'approved' : toStatus === 'rejected' ? 'rejected' : toStatus === 'manager_review' ? 'manager_review' : it.status,
              rejectionReason: options?.rejectionReason,
            })),
          };
          return updatedBatch;
        }
        return b;
      })
    );

    return { success: true, batch: updatedBatch || undefined };
  };

  // State Transition 1: 'Pending' -> 'Manager Review'
  const startManagerReview = (batchId: string, reviewerName?: string) => {
    const reviewer = reviewerName || cashier.linkedManager?.name || 'Tariq Mehmood (M0087)';
    const res = transitionBatchState(batchId, 'manager_review', {
      actor: { name: reviewer, role: 'manager', id: cashier.linkedManager?.id || 'M0087' },
      notes: `Review initiated by ${reviewer}. Verifying scanned receipt bills & VAT compliance.`,
    });

    if (res.success) {
      addToast({
        type: 'info',
        title: 'Manager Review In Progress',
        message: `Batch #${batchId} has moved to Manager Review state.`,
      });
    }
    return res;
  };

  // State Transition 2: 'Manager Review' / 'Pending' -> 'Approved'
  const approveReimbursementRequest = (params: ApprovalDecisionParams) => {
    const reviewer = params.reviewerName || cashier.linkedManager?.name || 'Tariq Mehmood (M0087)';
    const res = transitionBatchState(params.batchId, 'approved', {
      actor: { name: reviewer, role: 'manager', id: params.reviewerId || 'M0087' },
      notes: params.notes || 'All invoices and receipts verified. Reimbursement approved for disbursement.',
      approvedAmount: params.approvedAmount,
    });

    if (res.success) {
      addToast({
        type: 'success',
        title: '🔔 Reimbursement Approved',
        message: `${reviewer} approved reimbursement. Cash ready for float replenishment.`,
        duration: 7000,
      });
    }
    return res;
  };

  // State Transition 3: 'Manager Review' / 'Pending' -> 'Rejected'
  const rejectReimbursementRequest = (params: RejectionDecisionParams) => {
    const reviewer = params.reviewerName || cashier.linkedManager?.name || 'Tariq Mehmood (M0087)';
    const res = transitionBatchState(params.batchId, 'rejected', {
      actor: { name: reviewer, role: 'manager', id: params.reviewerId || 'M0087' },
      rejectionReason: params.reason,
      notes: `Declined by manager: ${params.reason}`,
    });

    if (res.success) {
      addToast({
        type: 'error',
        title: '🔔 Reimbursement Rejected',
        message: `${reviewer} declined request: "${params.reason}"`,
        duration: 7000,
      });
    }
    return res;
  };

  // Helper: Return transactions eligible for reimbursement
  const getEligibleReceiptsForBatch = (projectId?: string): Transaction[] => {
    const targetPrjId = projectId || activeProject.id;
    return transactions.filter((t) => {
      if (t.projectId !== targetPrjId) return false;
      if (t.reviewStatus === 'approved') return false;
      const isInActiveBatch = fundRequests.some(
        (b) => (b.status === 'pending' || b.status === 'manager_review') && b.transactionIds?.includes(t.id)
      );
      return !isInActiveBatch;
    });
  };

  // Create a batch grouping multiple scanned receipts into a single reimbursement request
  const createReceiptReimbursementBatch = (params: CreateReceiptBatchParams) => {
    if (!isOnline) {
      addToast({
        type: 'error',
        title: 'Connection Required',
        message: 'Live internet connection is required to submit reimbursement batches.',
      });
      return { success: false, error: 'Live internet connection is required to submit reimbursement batches.' };
    }

    const prj = projects.find((p) => p.id === params.projectId) || activeProject;
    const selectedTxs = transactions.filter((t) => params.transactionIds.includes(t.id));

    if (selectedTxs.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Receipts Selected',
        message: 'Please select at least one scanned receipt to group into a reimbursement batch.',
      });
      return { success: false, error: 'Please select at least one receipt.' };
    }

    const totalInclVat = selectedTxs.reduce((sum, t) => sum + t.amountInclVat, 0);
    const totalExclVat = selectedTxs.reduce((sum, t) => sum + t.amountExclVat, 0);
    const totalVat = selectedTxs.reduce((sum, t) => sum + t.vatAmount, 0);

    const dates = selectedTxs.map((t) => new Date(t.date).getTime());
    const minDate = params.coveragePeriodStart || new Date(Math.min(...dates)).toISOString().split('T')[0];
    const maxDate = params.coveragePeriodEnd || new Date(Math.max(...dates)).toISOString().split('T')[0];

    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const rmbCount = fundRequests.filter((b) => b.batchType === 'receipt_reimbursement').length + 1;
    const batchNumber = `RMB-${currentYearShort}-${prj.code}-${rmbCount.toString().padStart(2, '0')}`;
    const batchId = `REQ-RMB-${Date.now()}`;
    const now = new Date().toISOString();

    const groupedReceipts: GroupedReceiptSummary[] = selectedTxs.map((t) => ({
      transactionId: t.id,
      billRef: t.billRef,
      paidTo: t.paidTo,
      expenseNature: t.expenseNature,
      amountExclVat: t.amountExclVat,
      vatAmount: t.vatAmount,
      amountInclVat: t.amountInclVat,
      date: t.date,
      attachmentUrl: t.attachmentUrl,
      vendorVatRegNo: t.vendorVatRegNo,
    }));

    const items: FundRequestItem[] = selectedTxs.map((t, idx) => ({
      id: `item-rmb-${batchId}-${idx}`,
      expenseNature: t.expenseNature,
      quantity: 1,
      uom: 'Bill',
      rate: t.amountInclVat,
      amount: t.amountInclVat,
      vendorName: t.paidTo,
      notes: `Bill #${t.billRef} • VAT: ${prj.currency} ${t.vatAmount.toLocaleString()} • ${t.remarks || 'Receipt scanned'}`,
      billRef: t.billRef,
      transactionId: t.id,
      vatAmount: t.vatAmount,
      attachmentUrl: t.attachmentUrl,
      status: 'pending',
    }));

    const newBatch: FundRequestBatch = {
      id: batchId,
      batchNumber,
      batchType: 'receipt_reimbursement',
      projectId: prj.id,
      projectName: prj.name,
      coveragePeriodStart: minDate,
      coveragePeriodEnd: maxDate,
      items,
      transactionIds: params.transactionIds,
      groupedReceipts,
      receiptsCount: selectedTxs.length,
      totalAmount: totalInclVat,
      totalExclVat,
      totalVat,
      status: 'pending',
      requestedAt: now,
      cashierId: cashier.id,
      cashierName: cashier.name,
      submissionNotes: params.submissionNotes || `Reimbursement claim for ${selectedTxs.length} scanned receipts.`,
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: `Submitted by ${cashier.name} for manager review (${prj.currency} ${totalInclVat.toLocaleString()})`,
          updatedBy: cashier.name,
          actorRole: 'cashier',
        },
      ],
      workflowTransitions: [
        {
          id: `WF-${Date.now()}-1`,
          fromStatus: 'draft',
          toStatus: 'pending',
          timestamp: now,
          actor: { id: cashier.id, name: cashier.name, role: 'cashier' },
          notes: `Created reimbursement batch #${batchNumber} with ${selectedTxs.length} bills`,
        }
      ]
    };

    setTransactions((prev) =>
      prev.map((t) => (params.transactionIds.includes(t.id) ? { ...t, batchRequestId: batchId } : t))
    );

    setFundRequests((prev) => [newBatch, ...prev]);

    addToast({
      type: 'success',
      title: 'Reimbursement Batch Created',
      message: `Batch #${batchNumber} with ${selectedTxs.length} receipts submitted to manager.`,
      duration: 6000,
    });

    return { success: true, batch: newBatch };
  };

  // Add advance forecast fund request batch
  const addFundRequestBatch = (
    batchData: Omit<FundRequestBatch, 'id' | 'batchNumber' | 'requestedAt' | 'status'>
  ) => {
    if (!isOnline) {
      addToast({
        type: 'error',
        title: 'Connection Required',
        message: 'Live internet connection is required to send fund requests.',
      });
      return { success: false, error: 'Live internet connection is required to send fund requests.' };
    }

    const prj = projects.find((p) => p.id === batchData.projectId) || activeProject;
    const batchCount = fundRequests.length + 1;
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const prefix = batchData.batchType === 'receipt_reimbursement' ? 'RMB' : 'REQ';
    const batchNumber = `${prefix}-${currentYearShort}-${prj.code}-${batchCount.toString().padStart(2, '0')}`;
    const batchId = `REQ-${Date.now()}`;
    const now = new Date().toISOString();

    const newBatch: FundRequestBatch = {
      ...batchData,
      id: batchId,
      batchNumber,
      batchType: batchData.batchType || 'advance_forecast',
      requestedAt: now,
      status: 'pending',
      cashierId: cashier.id,
      cashierName: cashier.name,
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: `Submitted by ${cashier.name} (${prj.currency} ${batchData.totalAmount.toLocaleString()})`,
          updatedBy: cashier.name,
          actorRole: 'cashier',
        },
      ],
      workflowTransitions: [
        {
          id: `WF-${Date.now()}-1`,
          fromStatus: 'draft',
          toStatus: 'pending',
          timestamp: now,
          actor: { id: cashier.id, name: cashier.name, role: 'cashier' },
          notes: `Advance forecast submitted`,
        }
      ]
    };

    setFundRequests((prev) => [newBatch, ...prev]);

    addToast({
      type: 'success',
      title: 'Fund Batch Submitted',
      message: `Batch #${batchNumber} with ${batchData.items.length} items (${prj.currency} ${batchData.totalAmount.toLocaleString()}) sent.`,
    });

    return { success: true, batch: newBatch };
  };

  // State Transition 4: 'Approved' -> 'Fulfilled' (Disburse cash & replenish project float)
  const reimburseFundBatch = (batchId: string) => {
    const batch = fundRequests.find((b) => b.id === batchId);
    if (!batch) {
      return { success: false, error: 'Batch not found' };
    }

    if (batch.status !== 'approved') {
      return { success: false, error: 'Only approved batches can be reimbursed.' };
    }

    const prj = projects.find((p) => p.id === batch.projectId) || activeProject;
    const now = new Date().toISOString();
    const amountToDisburse = batch.approvedAmount || batch.totalAmount;

    // Transition workflow state to 'fulfilled'
    transitionBatchState(batchId, 'fulfilled', {
      actor: { id: cashier.id, name: cashier.name, role: 'cashier' },
      notes: `Reimbursement disbursed to ${prj.name} petty cash float.`,
    });

    // Record Fund Receipt
    const recCount = fundReceipts.length + 1;
    const receiptNumber = `FR-2026-${recCount.toString().padStart(3, '0')}`;
    const newReceipt: FundReceipt = {
      id: `REC-RMB-${Date.now()}`,
      receiptNumber,
      projectId: prj.id,
      projectName: prj.name,
      amountReceived: amountToDisburse,
      receivedDate: now.split('T')[0],
      receivedFrom: `Treasury Reimbursement (Batch #${batch.batchNumber})`,
      remarks: `Reimbursement disbursement for ${batch.batchType === 'receipt_reimbursement' ? `${batch.receiptsCount || batch.items.length} scanned receipts` : 'approved budget forecast'} (${batch.coveragePeriodStart} to ${batch.coveragePeriodEnd})`,
      batchId: batch.id,
      createdAt: now,
    };

    setFundReceipts((prev) => [newReceipt, ...prev]);

    // Replenish project balance
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === prj.id) {
          return {
            ...p,
            currentBalance: p.currentBalance + amountToDisburse,
            totalReceived: p.totalReceived + amountToDisburse,
          };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: 'Float Replenished!',
      message: `Received ${prj.currency} ${amountToDisburse.toLocaleString()} from Batch #${batch.batchNumber}.`,
      duration: 6000,
    });

    return { success: true };
  };

  // Cancel / Withdraw a batch request
  const cancelFundBatch = (batchId: string) => {
    const batch = fundRequests.find((b) => b.id === batchId);
    if (!batch) return { success: false, error: 'Batch not found' };

    if (batch.transactionIds && batch.transactionIds.length > 0) {
      setTransactions((prev) =>
        prev.map((t) => (batch.transactionIds?.includes(t.id) ? { ...t, batchRequestId: null } : t))
      );
    }

    setFundRequests((prev) => prev.filter((b) => b.id !== batchId));

    addToast({
      type: 'info',
      title: 'Batch Withdrawn',
      message: `Batch #${batch.batchNumber} has been withdrawn and receipts released back to pool.`,
    });

    return { success: true };
  };

  // ==========================================
  // MANAGER SIMULATOR ACTIONS (WORKFLOW TESTING)
  // ==========================================
  const simulateManagerStartReviewBatch = (batchId: string) => {
    startManagerReview(batchId);
  };

  const simulateManagerApproveBatch = (batchId: string, notes?: string, approvedAmount?: number) => {
    approveReimbursementRequest({
      batchId,
      notes,
      approvedAmount,
      reviewerName: cashier.linkedManager?.name || 'Tariq Mehmood (M0087)',
    });
  };

  const simulateManagerRejectBatch = (batchId: string, reason: string) => {
    rejectReimbursementRequest({
      batchId,
      reason,
      reviewerName: cashier.linkedManager?.name || 'Tariq Mehmood (M0087)',
    });
  };

  // ==========================================
  // PETTY CASH CLOSURES
  // ==========================================
  const createAndSubmitClosure = (
    projectId: string,
    selectedTxIds: string[],
    isSelfApproved: boolean
  ) => {
    if (!isOnline) {
      addToast({
        type: 'error',
        title: 'Connection Required',
        message: 'Connect to internet to close petty cash.',
      });
      return { success: false, error: 'Live connectivity is required to close petty cash.' };
    }

    const prj = projects.find((p) => p.id === projectId) || activeProject;
    const txsToClose = transactions.filter((t) => selectedTxIds.includes(t.id));

    if (txsToClose.length === 0) {
      return { success: false, error: 'No transactions selected to close.' };
    }

    const currentYear = new Date().getFullYear();
    const closureCount = closures.length + 1;
    const closureNumber = `PC-${prj.code}-${currentYear}-${closureCount.toString().padStart(2, '0')}`;

    const totalExclVat = txsToClose.reduce((sum, t) => sum + t.amountExclVat, 0);
    const totalVat = txsToClose.reduce((sum, t) => sum + t.vatAmount, 0);
    const totalInclVat = txsToClose.reduce((sum, t) => sum + t.amountInclVat, 0);

    const dates = txsToClose.map((t) => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];

    const closureId = `CLS-${Date.now()}`;
    const initialStatus = isSelfApproved ? 'approved' : 'pending_manager';

    const newClosure: PettyCashClosure = {
      id: closureId,
      closureNumber,
      projectId: prj.id,
      projectName: prj.name,
      cashierId: cashier.id,
      cashierName: cashier.name,
      periodStart: minDate,
      periodEnd: maxDate,
      transactionIds: selectedTxIds,
      transactions: txsToClose,
      totalExclVat,
      totalVat,
      totalInclVat,
      entryCount: txsToClose.length,
      status: initialStatus,
      submittedAt: new Date().toISOString(),
      approvedAt: isSelfApproved ? new Date().toISOString() : undefined,
      approvedBy: isSelfApproved ? `${cashier.name} (Self-Approved)` : undefined,
      isSelfApproved,
    };

    setClosures((prev) => [newClosure, ...prev]);

    setTransactions((prev) =>
      prev.map((t) => {
        if (selectedTxIds.includes(t.id)) {
          return {
            ...t,
            reviewStatus: isSelfApproved ? 'approved' : 'pending_closure',
            closureId,
          };
        }
        return t;
      })
    );

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === prj.id) {
          return {
            ...p,
            pendingClosureId: isSelfApproved ? null : closureId,
            approvedClosureId: isSelfApproved ? closureId : null,
          };
        }
        return p;
      })
    );

    if (isSelfApproved) {
      addToast({
        type: 'success',
        title: 'Closure Self-Approved',
        message: `Closure #${closureNumber} approved. Formal PDF Report unlocked!`,
      });
    } else {
      addToast({
        type: 'info',
        title: 'Closure Sent to Manager',
        message: `Closure #${closureNumber} submitted for manager review.`,
      });
    }

    return { success: true, closure: newClosure };
  };

  const selfApproveClosure = (closureId: string) => {
    setClosures((prev) =>
      prev.map((c) => {
        if (c.id === closureId) {
          return {
            ...c,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: `${cashier.name} (Self-Approved)`,
          };
        }
        return c;
      })
    );

    setTransactions((prev) =>
      prev.map((t) => (t.closureId === closureId ? { ...t, reviewStatus: 'approved' } : t))
    );

    setProjects((prev) =>
      prev.map((p) => {
        if (p.pendingClosureId === closureId) {
          return { ...p, pendingClosureId: null, approvedClosureId: closureId };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: 'Closure Approved',
      message: 'You self-approved this closure. Ready to generate formal PDF.',
    });
  };

  const simulateManagerApproveClosure = (closureId: string) => {
    const managerName = cashier.linkedManager?.name || 'Tariq Mehmood (M0087)';
    setClosures((prev) =>
      prev.map((c) => {
        if (c.id === closureId) {
          return {
            ...c,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: managerName,
            managerRemarks: 'All receipts verified against VAT records. Approved in full.',
          };
        }
        return c;
      })
    );

    setTransactions((prev) =>
      prev.map((t) => (t.closureId === closureId ? { ...t, reviewStatus: 'approved' } : t))
    );

    setProjects((prev) =>
      prev.map((p) => {
        if (p.pendingClosureId === closureId) {
          return { ...p, pendingClosureId: null, approvedClosureId: closureId };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: '🔔 Push Notification: Closure Approved',
      message: `${managerName} approved Closure #${closureId}. Tap to Generate PDF!`,
      duration: 7000,
    });
  };

  const simulateManagerRejectClosure = (closureId: string, reason: string) => {
    const managerName = cashier.linkedManager?.name || 'Tariq Mehmood (M0087)';
    const closure = closures.find((c) => c.id === closureId);
    
    setClosures((prev) =>
      prev.map((c) => {
        if (c.id === closureId) {
          return {
            ...c,
            status: 'rejected',
            managerRemarks: reason,
          };
        }
        return c;
      })
    );

    if (closure) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (closure.transactionIds.includes(t.id)) {
            return {
              ...t,
              reviewStatus: 'open',
              closureId: null,
              rejectionReason: reason,
            };
          }
          return t;
        })
      );
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.pendingClosureId === closureId) {
          return { ...p, pendingClosureId: null };
        }
        return p;
      })
    );

    addToast({
      type: 'error',
      title: '🔔 Closure Rejected by Manager',
      message: `${managerName} returned closure: "${reason}". Entries restored to open list.`,
      duration: 8000,
    });
  };

  const syncNow = () => {
    if (!isOnline) {
      addToast({
        type: 'warning',
        title: 'Offline',
        message: 'Cannot sync while offline. Please turn on internet connection.',
      });
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((t) => (t.syncStatus === 'pending_sync' ? { ...t, syncStatus: 'synced' } : t))
      );
      setCashier((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      setIsSyncing(false);
      addToast({
        type: 'success',
        title: 'All Synced',
        message: 'All local petty cash records & batches are up to date with Core.',
      });
    }, 1200);
  };

  const resetAllData = () => {
    setCashier(INITIAL_CASHIER);
    setProjects(INITIAL_PROJECTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setFundReceipts(INITIAL_FUND_RECEIPTS);
    setFundRequests(INITIAL_FUND_BATCHES);
    setClosures([]);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentScreen('dashboard');
    addToast({
      type: 'info',
      title: 'Reset Complete',
      message: 'Demo dataset restored with Site-A, Site-B and initial receipts & batches.',
    });
  };

  return (
    <CashierContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        historyStack,
        navigateTo,
        goBack,
        cashier,
        updateCashier,
        linkManager,
        unlinkManager,
        projects,
        activeProject,
        setActiveProjectId,
        transactions,
        addTransaction,
        openTransactionsForActiveProject,
        selectedTransaction,
        setSelectedTransaction,
        fundReceipts,
        addFundReceipt,
        fundRequests,
        addFundRequestBatch,
        createReceiptReimbursementBatch,
        reimburseFundBatch,
        cancelFundBatch,
        getEligibleReceiptsForBatch,
        transitionBatchState,
        startManagerReview,
        approveReimbursementRequest,
        rejectReimbursementRequest,
        getApprovalWorkflowEvents,
        selectedFundBatch,
        setSelectedFundBatch,
        closures,
        activeClosureForPdf,
        setActiveClosureForPdf,
        createAndSubmitClosure,
        selfApproveClosure,
        simulateManagerApproveClosure,
        simulateManagerRejectClosure,
        simulateManagerStartReviewBatch,
        simulateManagerApproveBatch,
        simulateManagerRejectBatch,
        isOnline,
        setIsOnline,
        syncNow,
        isSyncing,
        toasts,
        addToast,
        removeToast,
        resetAllData,
        showPhoneFrame,
        setShowPhoneFrame,
        theme,
        setTheme,
        toggleTheme,
        isReceiptGalleryOpen,
        receiptGalleryIndex,
        receiptGalleryProjectId,
        openReceiptGallery,
        closeReceiptGallery,
      }}
    >
      {children}
    </CashierContext.Provider>
  );
};

export const useCashier = () => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }
  return context;
};
