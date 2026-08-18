import { ManagedAccount } from "./mockData";

export type Department = 
  | 'Godown' 
  | 'Transport' 
  | 'Recruitment' 
  | 'Sales' 
  | 'Accounts' 
  | 'Office' 
  | 'Business';

export interface ActivityRecord {
  id: string;
  department: Department;
  employeeId: string;
  employeeName: string;
  activityType: string;
  details: string;
  relatedId?: string; // Order ID, Product ID, etc.
  date: string;
  location: string;
  quantity?: number;
  amount?: number;
  referenceId: string;
  status: 'Completed' | 'Pending' | 'Flagged' | 'Cancelled';
  createdBy: string;
  approvalStatus: 'Auto-Approved' | 'Pending' | 'Approved' | 'Rejected';
}

export type TransactionType = 'Income' | 'Expense' | 'Purchase' | 'Service' | 'Refund' | 'Adjustment' | 'Other';

export interface FinancialTransaction {
  id: string;
  department: Department;
  type: TransactionType;
  description: string;
  amount: number;
  tax: number;
  total: number;
  date: string;
  relatedOrderId?: string;
  relatedInvoiceId?: string;
  employeeId: string;
  vendorSupplier?: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Processing';
  approvalStatus: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  referenceNumber: string;
  attachmentUrl?: string;
}

export interface ReconciliationRecord {
  id: string;
  department: Department;
  referenceId: string; // Order ID
  type: 'Order-Dispatch-Delivery';
  expectedValues: {
    ordered: number;
    dispatched: number;
    delivered: number;
  };
  actualValues: {
    ordered: number;
    dispatched: number;
    delivered: number;
  };
  difference: number;
  date: string;
  reason?: string;
  status: 'Matched' | 'Mismatch' | 'Under Review' | 'Resolved' | 'Rejected';
  assignedReviewer?: string;
}

export interface MonthlyReport {
  id: string; // MK-GD-CBE-2026-08-001
  department: Department;
  location: string;
  month: string; // "August 2026"
  reportNumber: string;
  generatedDate: string;
  preparedBy: string;
  approvedBy?: string;
  summary: {
    openingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  };
  activitySummary: Record<string, number>;
  status: 'Draft' | 'Department Review' | 'Submitted' | 'Finance Review' | 'Reconciliation' | 'Admin Approval' | 'Finalized' | 'Archived';
  reconciliationStatus: 'Clean' | 'Issues Found' | 'Resolved';
  digitalApprovalStatus: 'Not Signed' | 'Officer Signed' | 'Finance Signed' | 'Admin Signed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  performedBy: string;
  action: string;
  department: Department;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  reason: string;
}

// Mock Data Initial Seed
export const activityLedger: ActivityRecord[] = [
  {
    id: 'ACT-GD-1001',
    department: 'Godown',
    employeeId: 'MK-EMP-104',
    employeeName: 'Prakash Raj',
    activityType: 'Stock Received',
    details: 'Received 500kg Premium Ponni Rice',
    relatedId: 'BATCH-MK-1024',
    date: '14 Aug 2026, 10:00 AM',
    location: 'Chennai Godown',
    quantity: 500,
    referenceId: 'IN-101',
    status: 'Completed',
    createdBy: 'MK-EMP-104',
    approvalStatus: 'Auto-Approved'
  },
  {
    id: 'ACT-TR-2001',
    department: 'Transport',
    employeeId: 'MK-DRI-045',
    employeeName: 'Karthik Raja',
    activityType: 'Delivery Completed',
    details: 'Order MK-ORD-2044 delivered to customer',
    relatedId: 'MK-ORD-2044',
    date: '14 Aug 2026, 10:15 AM',
    location: 'Peelamedu, Coimbatore',
    quantity: 1,
    referenceId: 'DEL-OTP-882',
    status: 'Completed',
    createdBy: 'MK-DRI-045',
    approvalStatus: 'Approved'
  }
];

export const financialLedger: FinancialTransaction[] = [
  {
    id: 'TRX-GD-5001',
    department: 'Godown',
    type: 'Purchase',
    description: 'Procurement of 500kg Ponni Rice from Farmer Muthu',
    amount: 25000,
    tax: 1250,
    total: 26250,
    date: '14 Aug 2026',
    relatedOrderId: 'ORD-1001',
    employeeId: 'MK-EMP-104',
    vendorSupplier: 'Muthu Kumar (Farmer)',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    referenceNumber: 'REF-MK-GD-001'
  },
  {
    id: 'TRX-TR-6001',
    department: 'Transport',
    type: 'Expense',
    description: 'Fuel Refill for Vehicle TN-38-BZ-4452',
    amount: 3500,
    tax: 0,
    total: 3500,
    date: '14 Aug 2026',
    employeeId: 'MK-DRI-045',
    vendorSupplier: 'Shell Coimbatore',
    paymentStatus: 'Paid',
    approvalStatus: 'Approved',
    referenceNumber: 'FUEL-8821'
  }
];

export const reconciliationLedger: ReconciliationRecord[] = [
  {
    id: 'REC-MK-001',
    department: 'Godown',
    referenceId: 'MK-ORD-2044',
    type: 'Order-Dispatch-Delivery',
    expectedValues: { ordered: 500, dispatched: 500, delivered: 500 },
    actualValues: { ordered: 500, dispatched: 500, delivered: 500 },
    difference: 0,
    date: '14 Aug 2026',
    status: 'Matched'
  },
  {
    id: 'REC-MK-002',
    department: 'Transport',
    referenceId: 'MK-ORD-2046',
    type: 'Order-Dispatch-Delivery',
    expectedValues: { ordered: 50, dispatched: 50, delivered: 50 },
    actualValues: { ordered: 50, dispatched: 50, delivered: 45 },
    difference: 5,
    date: '14 Aug 2026',
    reason: 'Packaging damage during transit',
    status: 'Mismatch',
    assignedReviewer: 'MK-T-101'
  }
];

export const monthlyReports: MonthlyReport[] = [
  {
    id: 'MK-GD-CHN-2026-08-001',
    department: 'Godown',
    location: 'Chennai',
    month: 'August 2026',
    reportNumber: 'MK-GD-CHN-2026-08-001',
    generatedDate: '14 Aug 2026',
    preparedBy: 'MK-EMP-104',
    summary: {
      openingBalance: 150000,
      totalIncome: 450000,
      totalExpenses: 280000,
      netAmount: 170000,
      pendingCount: 12,
      approvedCount: 145,
      rejectedCount: 2
    },
    activitySummary: {
      'Stock Received': 45,
      'Stock Dispatched': 120,
      'Stock Adjustment': 5,
      'Damaged Stock': 2
    },
    status: 'Submitted',
    reconciliationStatus: 'Clean',
    digitalApprovalStatus: 'Officer Signed'
  }
];

export const financeAuditLogs: AuditLog[] = [
  {
    id: 'AUD-FIN-001',
    timestamp: '14 Aug 2026, 11:45 AM',
    performedBy: 'MK-EMP-104',
    action: 'SUBMIT_MONTHLY_REPORT',
    department: 'Godown',
    targetId: 'MK-GD-CHN-2026-08-001',
    reason: 'End of period submission'
  }
];
