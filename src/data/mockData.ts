import { CashierProfile, Project, Transaction, FundRequestBatch, FundReceipt, CategoryMaster } from '../types';

export const CATEGORIES: CategoryMaster[] = [
  { id: 'cat-1', name: 'Materials & Hardware', icon: 'Wrench', defaultVatRate: 0.15 },
  { id: 'cat-2', name: 'Printing & Stationery', icon: 'Printer', defaultVatRate: 0.15 },
  { id: 'cat-3', name: 'Food & Refreshments', icon: 'Coffee', defaultVatRate: 0.05 },
  { id: 'cat-4', name: 'Travel & Fuel', icon: 'Fuel', defaultVatRate: 0.15 },
  { id: 'cat-5', name: 'Repairs & Maintenance', icon: 'Hammer', defaultVatRate: 0.15 },
  { id: 'cat-6', name: 'Utilities & Telecom', icon: 'Zap', defaultVatRate: 0.05 },
  { id: 'cat-7', name: 'Labour & Porterage', icon: 'Users', defaultVatRate: 0.0 },
  { id: 'cat-8', name: 'Office Consumables', icon: 'Package', defaultVatRate: 0.15 },
];

export const UOM_OPTIONS = ['Nos', 'Pcs', 'Kgs', 'Ltrs', 'Days', 'Trips', 'Units', 'Boxes', 'Hours'];

// SVG receipt generator helper for realistic demo receipts
export function generateReceiptSvg(vendor: string, amount: number, vat: number, date: string, ref: string, vatNo: string, items: { name: string; cost: number }[]) {
  const total = amount + vat;
  const itemsSvg = items.map((it, idx) => `
    <g transform="translate(20, ${170 + idx * 24})">
      <text x="0" y="0" font-family="monospace" font-size="12" fill="#1e293b">${it.name}</text>
      <text x="320" y="0" font-family="monospace" font-size="12" text-anchor="end" fill="#0f172a">Rs ${it.cost.toLocaleString()}</text>
    </g>
  `).join('');

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="360" height="480">
    <defs>
      <filter id="paper-shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.15" />
      </filter>
    </defs>
    <rect width="360" height="480" fill="#f8fafc" rx="8" />
    <rect x="10" y="10" width="340" height="460" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="1.5" filter="url(#paper-shadow)" />
    
    <!-- Top Pattern/Perforation -->
    <line x1="20" y1="20" x2="340" y2="20" stroke="#cbd5e1" stroke-dasharray="4,4" stroke-width="1.5" />
    
    <!-- Header -->
    <text x="180" y="52" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle" fill="#0f172a">${vendor.toUpperCase()}</text>
    <text x="180" y="70" font-family="monospace" font-size="10" text-anchor="middle" fill="#64748b">TAX INVOICE / CASH BILL</text>
    <text x="180" y="85" font-family="monospace" font-size="10" text-anchor="middle" fill="#64748b">VAT Reg: ${vatNo || 'UNREGISTERED'}</text>
    <text x="180" y="100" font-family="monospace" font-size="10" text-anchor="middle" fill="#64748b">Ref: ${ref} | Date: ${date}</text>
    
    <line x1="20" y1="115" x2="340" y2="115" stroke="#0f172a" stroke-width="1.5" />
    <text x="20" y="132" font-family="sans-serif" font-weight="600" font-size="11" fill="#475569">ITEM DESCRIPTION</text>
    <text x="340" y="132" font-family="sans-serif" font-weight="600" font-size="11" text-anchor="end" fill="#475569">AMOUNT</text>
    <line x1="20" y1="142" x2="340" y2="142" stroke="#e2e8f0" stroke-width="1" />
    
    <!-- Items -->
    ${itemsSvg}
    
    <line x1="20" y1="290" x2="340" y2="290" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3" />
    
    <!-- Calculation totals -->
    <text x="20" y="312" font-family="monospace" font-size="12" fill="#475569">SUBTOTAL (Excl. VAT):</text>
    <text x="340" y="312" font-family="monospace" font-size="12" text-anchor="end" fill="#0f172a">Rs ${amount.toLocaleString()}</text>
    
    <text x="20" y="332" font-family="monospace" font-size="12" fill="#475569">VAT (15%):</text>
    <text x="340" y="332" font-family="monospace" font-size="12" text-anchor="end" fill="#0f172a">Rs ${vat.toLocaleString()}</text>
    
    <line x1="20" y1="345" x2="340" y2="345" stroke="#0f172a" stroke-width="1.5" />
    
    <text x="20" y="370" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0f172a">TOTAL (PAID CASH):</text>
    <text x="340" y="370" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="end" fill="#16a34a">Rs ${total.toLocaleString()}</text>
    
    <!-- Barcode / Footer -->
    <rect x="70" y="405" width="220" height="25" fill="#e2e8f0" rx="3" />
    <text x="180" y="422" font-family="monospace" font-size="11" text-anchor="middle" letter-spacing="3" fill="#1e293b">||| | |||| || |||| | |||</text>
    <text x="180" y="445" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#94a3b8">THANK YOU FOR YOUR BUSINESS • ARTIFY CASHIER OCR READY</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const SAMPLE_RECEIPTS_DATA = [
  {
    vendor: 'Al-Madina Hardware Supplies',
    category: 'Materials & Hardware',
    amountExclVat: 2400,
    vatAmount: 360,
    vatNo: 'VAT-99214-PK',
    date: '2026-08-16',
    remarks: 'Cement bonding sealant, PVC elbow joints, and brass screws for floor repair',
    items: [
      { name: 'PVC Elbow 2-inch (x4)', cost: 600 },
      { name: 'Screws & Wall Plugs Pack', cost: 450 },
      { name: 'Bonding Adhesive 1L', cost: 1350 }
    ]
  },
  {
    vendor: 'Crown Express Printing',
    category: 'Printing & Stationery',
    amountExclVat: 850,
    vatAmount: 127.5,
    vatNo: 'VAT-81142-PK',
    date: '2026-08-17',
    remarks: 'A3 architectural drawings blue-print lamination for site supervisors',
    items: [
      { name: 'A3 Blueprints (x10 sheets)', cost: 500 },
      { name: 'Plastic Folder Bindings (x5)', cost: 350 }
    ]
  },
  {
    vendor: 'Shell Fuel Station - Bypass',
    category: 'Travel & Fuel',
    amountExclVat: 1800,
    vatAmount: 270,
    vatNo: 'VAT-10023-PK',
    date: '2026-08-18',
    remarks: 'Diesel refill for site generator during power outage',
    items: [
      { name: 'High-Octane Diesel 6.5L', cost: 1800 }
    ]
  },
  {
    vendor: 'Tasty Bites Tea & Refreshments',
    category: 'Food & Refreshments',
    amountExclVat: 450,
    vatAmount: 22.5,
    vatNo: 'VAT-55291-PK',
    date: '2026-08-18',
    remarks: 'Evening tea and bakery snacks for subcontractor coordination meeting',
    items: [
      { name: 'Special Milk Karak Tea (x6)', cost: 240 },
      { name: 'Puff Pastries & Biscuits', cost: 210 }
    ]
  },
  {
    vendor: 'Master Electricals & Tools',
    category: 'Repairs & Maintenance',
    amountExclVat: 1200,
    vatAmount: 180,
    vatNo: 'VAT-77301-PK',
    date: '2026-08-15',
    remarks: 'Replacement circuit breaker 32A and insulated test multimeter cable',
    items: [
      { name: 'Circuit Breaker MCB 32A', cost: 750 },
      { name: 'Insulated Cable 10m', cost: 450 }
    ]
  }
];

export const INITIAL_CASHIER: CashierProfile = {
  id: 'U1023',
  name: 'Farhan Tariq',
  phone: '+92 300 8923411',
  email: 'farhan.cashier@artifygroup.com',
  isSelfApproving: true, // starts in self-approval mode per spec
  linkedManager: null,
  assignedProjectIds: ['PRJ-SITA', 'PRJ-SITB', 'PRJ-ARTS'],
  activeProjectId: 'PRJ-SITA',
  lastSyncedAt: new Date().toISOString()
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-SITA',
    code: 'SITA',
    name: 'Site-A Commercial Plaza',
    description: '14-Floor Commercial Tower Construction & Finishing',
    currentBalance: 14850,
    lowBalanceThreshold: 4000,
    currency: 'Rs',
    totalReceived: 45000,
    totalSpent: 30150,
    pendingClosureId: null,
    approvedClosureId: null
  },
  {
    id: 'PRJ-SITB',
    code: 'SITB',
    name: 'Site-B Residential Heights',
    description: 'Luxury Apartment Complex Phase 2',
    currentBalance: 2450, // Low balance alert triggered (< 3000)
    lowBalanceThreshold: 3000,
    currency: 'Rs',
    totalReceived: 30000,
    totalSpent: 27550,
    pendingClosureId: null,
    approvedClosureId: null
  },
  {
    id: 'PRJ-ARTS',
    code: 'ARTS',
    name: 'Artify Studio & HQ Lab',
    description: 'Corporate Office Fitout & Design Studio',
    currentBalance: 21500,
    lowBalanceThreshold: 5000,
    currency: 'Rs',
    totalReceived: 50000,
    totalSpent: 28500,
    pendingClosureId: null,
    approvedClosureId: null
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    billRef: '26SITA0001',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    date: '2026-08-16',
    paidTo: 'Al-Madina Hardware Supplies',
    expenseNature: 'Materials & Hardware',
    amountExclVat: 2400,
    vatAmount: 360,
    amountInclVat: 2760,
    vendorVatRegNo: 'VAT-99214-PK',
    remarks: 'Cement bonding sealant, PVC elbow joints, and brass screws for floor repair',
    attachmentUrl: generateReceiptSvg(
      'Al-Madina Hardware Supplies',
      2400,
      360,
      '2026-08-16',
      '26SITA0001',
      'VAT-99214-PK',
      [
        { name: 'PVC Elbow 2-inch (x4)', cost: 600 },
        { name: 'Screws & Wall Plugs Pack', cost: 450 },
        { name: 'Bonding Adhesive 1L', cost: 1350 }
      ]
    ),
    ocrExtracted: true,
    isOcrConfirmed: true,
    syncStatus: 'synced',
    reviewStatus: 'open',
    closureId: null,
    createdAt: '2026-08-16T10:15:00Z',
    srNo: 1
  },
  {
    id: 'TX-002',
    billRef: '26SITA0002',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    date: '2026-08-17',
    paidTo: 'Crown Express Printing',
    expenseNature: 'Printing & Stationery',
    amountExclVat: 850,
    vatAmount: 127.5,
    amountInclVat: 977.5,
    vendorVatRegNo: 'VAT-81142-PK',
    remarks: 'A3 architectural drawings blue-print lamination for site supervisors',
    attachmentUrl: generateReceiptSvg(
      'Crown Express Printing',
      850,
      127.5,
      '2026-08-17',
      '26SITA0002',
      'VAT-81142-PK',
      [
        { name: 'A3 Blueprints (x10 sheets)', cost: 500 },
        { name: 'Plastic Folder Bindings (x5)', cost: 350 }
      ]
    ),
    ocrExtracted: true,
    isOcrConfirmed: true,
    syncStatus: 'synced',
    reviewStatus: 'open',
    closureId: null,
    createdAt: '2026-08-17T11:45:00Z',
    srNo: 2
  },
  {
    id: 'TX-003',
    billRef: '26SITA0003',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    date: '2026-08-17',
    paidTo: 'Shell Fuel Station - Bypass',
    expenseNature: 'Travel & Fuel',
    amountExclVat: 1800,
    vatAmount: 270,
    amountInclVat: 2070,
    vendorVatRegNo: 'VAT-10023-PK',
    remarks: 'Diesel refill for backup emergency site generator',
    attachmentUrl: generateReceiptSvg(
      'Shell Fuel Station - Bypass',
      1800,
      270,
      '2026-08-17',
      '26SITA0003',
      'VAT-10023-PK',
      [
        { name: 'High-Octane Diesel 6.5L', cost: 1800 }
      ]
    ),
    ocrExtracted: true,
    isOcrConfirmed: true,
    syncStatus: 'synced',
    reviewStatus: 'open',
    closureId: null,
    createdAt: '2026-08-17T15:20:00Z',
    srNo: 3
  },
  {
    id: 'TX-004',
    billRef: '26SITA0004',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    date: '2026-08-18',
    paidTo: 'Tasty Bites Tea & Refreshments',
    expenseNature: 'Food & Refreshments',
    amountExclVat: 450,
    vatAmount: 22.5,
    amountInclVat: 472.5,
    vendorVatRegNo: 'VAT-55291-PK',
    remarks: 'Tea and mineral water for structural inspection team',
    attachmentUrl: generateReceiptSvg(
      'Tasty Bites Tea & Refreshments',
      450,
      22.5,
      '2026-08-18',
      '26SITA0004',
      'VAT-55291-PK',
      [
        { name: 'Special Milk Karak Tea (x6)', cost: 240 },
        { name: 'Puff Pastries & Biscuits', cost: 210 }
      ]
    ),
    ocrExtracted: true,
    isOcrConfirmed: true,
    syncStatus: 'synced',
    reviewStatus: 'open',
    closureId: null,
    createdAt: '2026-08-18T09:30:00Z',
    srNo: 4
  },
  {
    id: 'TX-005',
    billRef: '26SITB0001',
    projectId: 'PRJ-SITB',
    projectName: 'Site-B Residential Heights',
    date: '2026-08-15',
    paidTo: 'Master Electricals & Tools',
    expenseNature: 'Repairs & Maintenance',
    amountExclVat: 1200,
    vatAmount: 180,
    amountInclVat: 1380,
    vendorVatRegNo: 'VAT-77301-PK',
    remarks: 'Replacement circuit breaker 32A and heavy duty cabling',
    attachmentUrl: generateReceiptSvg(
      'Master Electricals & Tools',
      1200,
      180,
      '2026-08-15',
      '26SITB0001',
      'VAT-77301-PK',
      [
        { name: 'Circuit Breaker MCB 32A', cost: 750 },
        { name: 'Insulated Cable 10m', cost: 450 }
      ]
    ),
    ocrExtracted: true,
    isOcrConfirmed: true,
    syncStatus: 'synced',
    reviewStatus: 'open',
    closureId: null,
    createdAt: '2026-08-15T14:10:00Z',
    srNo: 1
  }
];

export const INITIAL_FUND_RECEIPTS: FundReceipt[] = [
  {
    id: 'REC-001',
    receiptNumber: 'FR-2026-081',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    amountReceived: 20000,
    receivedDate: '2026-08-10',
    receivedFrom: 'Main Treasury - Head Office',
    remarks: 'Weekly petty cash replenishment per approved Batch #REQ-2026-001',
    createdAt: '2026-08-10T09:00:00Z'
  },
  {
    id: 'REC-002',
    receiptNumber: 'FR-2026-092',
    projectId: 'PRJ-SITB',
    projectName: 'Site-B Residential Heights',
    amountReceived: 15000,
    receivedDate: '2026-08-12',
    receivedFrom: 'Project Manager Cash Advance',
    remarks: 'Emergency cash float for safety equipment and permits',
    createdAt: '2026-08-12T14:30:00Z'
  }
];

export const INITIAL_FUND_BATCHES: FundRequestBatch[] = [
  {
    id: 'REQ-2026-RMB-01',
    batchNumber: 'RMB-26-SITA-01',
    batchType: 'receipt_reimbursement',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    coveragePeriodStart: '2026-08-16',
    coveragePeriodEnd: '2026-08-17',
    totalAmount: 5807.5,
    totalExclVat: 5050,
    totalVat: 757.5,
    receiptsCount: 3,
    transactionIds: ['TX-001', 'TX-002', 'TX-003'],
    cashierId: 'U1023',
    cashierName: 'Farhan Tariq',
    submissionNotes: 'Scanned receipts for emergency plumbing fittings, architectural blueprint printing, and generator fuel.',
    status: 'pending',
    requestedAt: '2026-08-17T17:30:00Z',
    statusHistory: [
      {
        status: 'draft',
        timestamp: '2026-08-17T17:15:00Z',
        note: '3 scanned receipts grouped by cashier Farhan Tariq'
      },
      {
        status: 'pending',
        timestamp: '2026-08-17T17:30:00Z',
        note: 'Submitted to Manager Tariq Mehmood for petty cash replenishment'
      }
    ],
    groupedReceipts: [
      {
        transactionId: 'TX-001',
        billRef: '26SITA0001',
        paidTo: 'Al-Madina Hardware Supplies',
        expenseNature: 'Materials & Hardware',
        amountExclVat: 2400,
        vatAmount: 360,
        amountInclVat: 2760,
        date: '2026-08-16',
        vendorVatRegNo: 'VAT-99214-PK',
        attachmentUrl: generateReceiptSvg('Al-Madina Hardware Supplies', 2400, 360, '2026-08-16', '26SITA0001', 'VAT-99214-PK', [{ name: 'PVC Elbow 2-inch (x4)', cost: 600 }, { name: 'Bonding Adhesive 1L', cost: 1350 }])
      },
      {
        transactionId: 'TX-002',
        billRef: '26SITA0002',
        paidTo: 'Crown Express Printing',
        expenseNature: 'Printing & Stationery',
        amountExclVat: 850,
        vatAmount: 127.5,
        amountInclVat: 977.5,
        date: '2026-08-17',
        vendorVatRegNo: 'VAT-81142-PK',
        attachmentUrl: generateReceiptSvg('Crown Express Printing', 850, 127.5, '2026-08-17', '26SITA0002', 'VAT-81142-PK', [{ name: 'A3 Blueprints (x10 sheets)', cost: 500 }])
      },
      {
        transactionId: 'TX-003',
        billRef: '26SITA0003',
        paidTo: 'Shell Fuel Station - Bypass',
        expenseNature: 'Travel & Fuel',
        amountExclVat: 1800,
        vatAmount: 270,
        amountInclVat: 2070,
        date: '2026-08-17',
        vendorVatRegNo: 'VAT-10023-PK',
        attachmentUrl: generateReceiptSvg('Shell Fuel Station - Bypass', 1800, 270, '2026-08-17', '26SITA0003', 'VAT-10023-PK', [{ name: 'High-Octane Diesel 6.5L', cost: 1800 }])
      }
    ],
    workflowTransitions: [
      {
        id: 'WF-TX-01',
        fromStatus: 'draft',
        toStatus: 'pending',
        timestamp: '2026-08-17T17:30:00Z',
        actor: { id: 'U1023', name: 'Farhan Tariq', role: 'cashier' },
        notes: 'Submitted reimbursement claim with 3 receipts attached.'
      }
    ],
    items: [
      {
        id: 'item-rmb-1',
        expenseNature: 'Materials & Hardware',
        quantity: 1,
        uom: 'Bill',
        rate: 2760,
        amount: 2760,
        vendorName: 'Al-Madina Hardware Supplies',
        notes: 'Ref: #26SITA0001 • VAT: Rs 360',
        billRef: '26SITA0001',
        transactionId: 'TX-001',
        vatAmount: 360,
        status: 'pending'
      },
      {
        id: 'item-rmb-2',
        expenseNature: 'Printing & Stationery',
        quantity: 1,
        uom: 'Bill',
        rate: 977.5,
        amount: 977.5,
        vendorName: 'Crown Express Printing',
        notes: 'Ref: #26SITA0002 • VAT: Rs 127.5',
        billRef: '26SITA0002',
        transactionId: 'TX-002',
        vatAmount: 127.5,
        status: 'pending'
      },
      {
        id: 'item-rmb-3',
        expenseNature: 'Travel & Fuel',
        quantity: 1,
        uom: 'Bill',
        rate: 2070,
        amount: 2070,
        vendorName: 'Shell Fuel Station - Bypass',
        notes: 'Ref: #26SITA0003 • VAT: Rs 270',
        billRef: '26SITA0003',
        transactionId: 'TX-003',
        vatAmount: 270,
        status: 'pending'
      }
    ]
  },
  {
    id: 'REQ-2026-RMB-02',
    batchNumber: 'RMB-26-SITA-02',
    batchType: 'receipt_reimbursement',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    coveragePeriodStart: '2026-08-18',
    coveragePeriodEnd: '2026-08-18',
    totalAmount: 4600,
    totalExclVat: 4000,
    totalVat: 600,
    receiptsCount: 2,
    transactionIds: ['TX-004'],
    cashierId: 'U1023',
    cashierName: 'Farhan Tariq',
    submissionNotes: 'Urgent plumbing emergency repair and solvent weld fittings.',
    status: 'manager_review',
    requestedAt: '2026-08-18T09:10:00Z',
    underReviewAt: '2026-08-18T09:40:00Z',
    reviewedBy: 'Tariq Mehmood (M0087)',
    managerNotes: 'Comparing vendor tax invoice number against FBR online portal.',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-08-18T09:10:00Z',
        note: 'Submitted by Farhan Tariq'
      },
      {
        status: 'manager_review',
        timestamp: '2026-08-18T09:40:00Z',
        note: 'Tariq Mehmood opened file for audit verification',
        updatedBy: 'Tariq Mehmood',
        actorRole: 'manager'
      }
    ],
    workflowTransitions: [
      {
        id: 'WF-TX-02A',
        fromStatus: 'draft',
        toStatus: 'pending',
        timestamp: '2026-08-18T09:10:00Z',
        actor: { id: 'U1023', name: 'Farhan Tariq', role: 'cashier' },
        notes: 'Submitted for manager review'
      },
      {
        id: 'WF-TX-02B',
        fromStatus: 'pending',
        toStatus: 'manager_review',
        timestamp: '2026-08-18T09:40:00Z',
        actor: { id: 'M0087', name: 'Tariq Mehmood', role: 'manager' },
        notes: 'Started line-item audit and VAT tax number verification.'
      }
    ],
    groupedReceipts: [
      {
        transactionId: 'TX-004',
        billRef: '26SITA0004',
        paidTo: 'Apex Engineering Tools',
        expenseNature: 'Materials & Hardware',
        amountExclVat: 4000,
        vatAmount: 600,
        amountInclVat: 4600,
        date: '2026-08-18',
        vendorVatRegNo: 'VAT-44910-PK',
        attachmentUrl: generateReceiptSvg('Apex Engineering Tools', 4000, 600, '2026-08-18', '26SITA0004', 'VAT-44910-PK', [{ name: 'Industrial Drill Bits & Solvent (x2)', cost: 4000 }])
      }
    ],
    items: [
      {
        id: 'item-rmb-4',
        expenseNature: 'Materials & Hardware',
        quantity: 1,
        uom: 'Bill',
        rate: 4600,
        amount: 4600,
        vendorName: 'Apex Engineering Tools',
        notes: 'Ref: #26SITA0004 • VAT: Rs 600',
        billRef: '26SITA0004',
        transactionId: 'TX-004',
        vatAmount: 600,
        status: 'manager_review'
      }
    ]
  },
  {
    id: 'REQ-2026-001',
    batchNumber: 'REQ-26-SITA-01',
    batchType: 'advance_forecast',
    projectId: 'PRJ-SITA',
    projectName: 'Site-A Commercial Plaza',
    coveragePeriodStart: '2026-08-20',
    coveragePeriodEnd: '2026-08-27',
    totalAmount: 9400,
    totalExclVat: 9400,
    totalVat: 0,
    receiptsCount: 0,
    status: 'pending',
    requestedAt: '2026-08-18T07:45:00Z',
    submissionNotes: 'Advance forecast for week 34 site maintenance and canteen safety rations.',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-08-18T07:45:00Z',
        note: 'Submitted advance budget requirement'
      }
    ],
    workflowTransitions: [
      {
        id: 'WF-TX-03',
        fromStatus: 'draft',
        toStatus: 'pending',
        timestamp: '2026-08-18T07:45:00Z',
        actor: { id: 'U1023', name: 'Farhan Tariq', role: 'cashier' },
        notes: 'Submitted advance forecast requirement'
      }
    ],
    items: [
      {
        id: 'item-1',
        expenseNature: 'Materials & Hardware',
        quantity: 10,
        uom: 'Bags',
        rate: 650,
        amount: 6500,
        vendorName: 'Falcon Cement Supplies',
        notes: 'Urgent tile grouting bags for 3rd floor bathroom tiling',
        status: 'pending'
      },
      {
        id: 'item-2',
        expenseNature: 'Food & Refreshments',
        quantity: 6,
        uom: 'Days',
        rate: 350,
        amount: 2100,
        vendorName: 'Site Corner Canteen',
        notes: 'Daily tea and snacks for site security team (6 days)',
        status: 'pending'
      },
      {
        id: 'item-3',
        expenseNature: 'Printing & Stationery',
        quantity: 4,
        uom: 'Pcs',
        rate: 200,
        amount: 800,
        vendorName: 'Crown Express Printing',
        notes: 'Hazard warning notices and laminated safety charts',
        status: 'pending'
      }
    ]
  },
  {
    id: 'REQ-2026-002',
    batchNumber: 'REQ-26-SITB-01',
    batchType: 'advance_forecast',
    projectId: 'PRJ-SITB',
    projectName: 'Site-B Residential Heights',
    coveragePeriodStart: '2026-08-15',
    coveragePeriodEnd: '2026-08-22',
    totalAmount: 5400,
    totalExclVat: 5400,
    totalVat: 0,
    receiptsCount: 0,
    status: 'approved',
    requestedAt: '2026-08-14T11:20:00Z',
    approvedAt: '2026-08-14T16:40:00Z',
    reviewedBy: 'Tariq Mehmood (M0087)',
    managerNotes: 'Approved in full. Collect cash from HO cashier counter.',
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-08-14T11:20:00Z',
        note: 'Submitted request'
      },
      {
        status: 'approved',
        timestamp: '2026-08-14T16:40:00Z',
        note: 'Approved in full by Tariq Mehmood (M0087)',
        updatedBy: 'Tariq Mehmood'
      }
    ],
    items: [
      {
        id: 'item-201',
        expenseNature: 'Repairs & Maintenance',
        quantity: 2,
        uom: 'Units',
        rate: 1800,
        amount: 3600,
        vendorName: 'Atlas Water Pump Services',
        notes: 'Impeller repair and gasket replacement for basement sump pump',
        status: 'approved'
      },
      {
        id: 'item-202',
        expenseNature: 'Travel & Fuel',
        quantity: 3,
        uom: 'Trips',
        rate: 600,
        amount: 1800,
        vendorName: 'Site Pickup Van Fuel',
        notes: 'Materials transport trips between warehouse and Site-B',
        status: 'approved'
      }
    ]
  }
];

export const SAMPLE_MANAGERS = [
  { id: 'M0087', name: 'Tariq Mehmood', email: 'tariq.manager@artifygroup.com', role: 'Senior Finance & Operations Manager' },
  { id: 'M0092', name: 'Sarah Al-Khatib', email: 'sarah.audit@artifygroup.com', role: 'Internal Audit & Petty Cash Head' },
  { id: 'M0104', name: 'Kamran Siddiqui', email: 'kamran.pm@artifygroup.com', role: 'Project Director (Site-A & Site-B)' }
];
