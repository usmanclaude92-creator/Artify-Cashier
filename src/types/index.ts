export type ScreenType = 
  | 'registration'
  | 'dashboard'
  | 'add_transaction'
  | 'fund_receipt'
  | 'request_funds'
  | 'history'
  | 'close_petty_cash'
  | 'requests'
  | 'profile'
  | 'closure_pdf';

export interface CashierProfile {
  id: string; // e.g. "U1023"
  name: string;
  phone: string;
  email: string;
  isSelfApproving: boolean;
  linkedManager: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  assignedProjectIds: string[];
  activeProjectId: string;
  lastSyncedAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  currentBalance: number;
  lowBalanceThreshold: number;
  currency: string;
  totalReceived: number;
  totalSpent: number;
  pendingClosureId: string | null;
  approvedClosureId: string | null;
}

export interface Transaction {
  id: string;
  billRef: string; // YYXXXZZZZ e.g. "26SITA0012"
  projectId: string;
  projectName: string;
  date: string;
  paidTo: string; // Vendor name
  expenseNature: string; // Category from master
  amountExclVat: number;
  vatAmount: number;
  amountInclVat: number;
  vendorVatRegNo: string;
  remarks: string;
  attachmentUrl: string;
  ocrExtracted: boolean;
  isOcrConfirmed: boolean;
  syncStatus: 'synced' | 'pending_sync' | 'error';
  reviewStatus: 'open' | 'pending_closure' | 'approved' | 'rejected';
  closureId: string | null;
  batchRequestId?: string | null;
  rejectionReason?: string;
  createdAt: string;
  srNo?: number;
}

export interface FundRequestItem {
  id: string;
  expenseNature: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  vendorName: string;
  notes: string;
  status: 'pending' | 'manager_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  transactionId?: string;
  billRef?: string;
  vatAmount?: number;
  attachmentUrl?: string;
}

export type ReimbursementWorkflowStatus = 
  | 'pending'           // Submitted by cashier, awaiting manager pickup
  | 'manager_review'    // In active verification by manager/auditor
  | 'approved'          // Approved for reimbursement & float disbursement
  | 'rejected'          // Rejected by manager with remarks
  | 'fulfilled'         // Disbursed & float replenished in project
  | 'partially_approved';

export interface WorkflowActor {
  id?: string;
  name: string;
  role: 'cashier' | 'manager' | 'auditor' | 'system';
}

export interface ApprovalWorkflowTransition {
  id: string;
  fromStatus: ReimbursementWorkflowStatus | 'draft' | 'none';
  toStatus: ReimbursementWorkflowStatus;
  timestamp: string;
  actor: WorkflowActor;
  notes?: string;
  approvedAmount?: number;
  rejectionReason?: string;
}

export interface BatchStatusHistoryEntry {
  status: ReimbursementWorkflowStatus | 'draft' | 'under_review';
  timestamp: string;
  note?: string;
  updatedBy?: string;
  actorRole?: 'cashier' | 'manager' | 'auditor' | 'system';
}

export interface GroupedReceiptSummary {
  transactionId: string;
  billRef: string;
  paidTo: string;
  expenseNature: string;
  amountExclVat: number;
  vatAmount: number;
  amountInclVat: number;
  date: string;
  attachmentUrl: string;
  vendorVatRegNo?: string;
}

export interface FundRequestBatch {
  id: string;
  batchNumber: string; // e.g. "REQ-26-SITA-01" or "RMB-26-SITA-01"
  batchType: 'receipt_reimbursement' | 'advance_forecast';
  projectId: string;
  projectName: string;
  coveragePeriodStart: string;
  coveragePeriodEnd: string;
  items: FundRequestItem[];
  transactionIds?: string[];
  groupedReceipts?: GroupedReceiptSummary[];
  receiptsCount?: number;
  totalAmount: number;
  totalExclVat?: number;
  totalVat?: number;
  approvedAmount?: number;
  status: ReimbursementWorkflowStatus;
  requestedAt: string;
  underReviewAt?: string;
  approvedAt?: string;
  reviewedBy?: string;
  managerNotes?: string;
  rejectionReason?: string;
  reimbursedAt?: string;
  cashierId?: string;
  cashierName?: string;
  submissionNotes?: string;
  statusHistory?: BatchStatusHistoryEntry[];
  workflowTransitions?: ApprovalWorkflowTransition[];
}

export interface CreateReceiptBatchParams {
  projectId: string;
  transactionIds: string[];
  submissionNotes?: string;
  coveragePeriodStart?: string;
  coveragePeriodEnd?: string;
}

export interface ApprovalDecisionParams {
  batchId: string;
  approvedAmount?: number;
  notes?: string;
  reviewerName?: string;
  reviewerId?: string;
}

export interface RejectionDecisionParams {
  batchId: string;
  reason: string;
  reviewerName?: string;
  reviewerId?: string;
}

export interface PettyCashClosure {
  id: string;
  closureNumber: string; // e.g. "PC-SITA-2026-01"
  projectId: string;
  projectName: string;
  cashierId: string;
  cashierName: string;
  periodStart: string;
  periodEnd: string;
  transactionIds: string[];
  transactions: Transaction[];
  totalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  entryCount: number;
  status: 'draft' | 'pending_manager' | 'approved' | 'rejected' | 'partially_approved';
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  managerRemarks?: string;
  pdfGeneratedUrl?: string;
  isSelfApproved: boolean;
}

export interface FundReceipt {
  id: string;
  receiptNumber: string;
  projectId: string;
  projectName: string;
  amountReceived: number;
  receivedDate: string;
  receivedFrom: string;
  remarks: string;
  batchId?: string;
  createdAt: string;
}

export interface CategoryMaster {
  id: string;
  name: string;
  icon: string;
  defaultVatRate: number; // e.g. 0.05 or 0.15
}

export type ThemeMode = 'dark' | 'light';
