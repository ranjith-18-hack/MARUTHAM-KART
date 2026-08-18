import { 
  ActivityRecord, 
  ActivityRecord as Activity,
  FinancialTransaction, 
  AuditLog, 
  activityLedger, 
  financialLedger, 
  financeAuditLogs,
  Department,
  TransactionType,
  ReconciliationRecord,
  reconciliationLedger
} from "@/data/financeData";
import { managedAccounts } from "@/data/mockData";

export class LedgerService {
  static logActivity(params: Omit<Activity, 'id' | 'date' | 'status' | 'approvalStatus' | 'createdBy'>) {
    const employee = managedAccounts.find(acc => acc.id === params.employeeId);
    
    const record: ActivityRecord = {
      ...params,
      id: `ACT-${params.department.substring(0, 2).toUpperCase()}-${Date.now()}`,
      date: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      approvalStatus: 'Auto-Approved',
      createdBy: params.employeeId,
      employeeName: employee?.name || 'Unknown'
    };

    activityLedger.push(record);
    console.log(`[Ledger] Activity Logged: ${record.id} - ${record.activityType}`);
    return record;
  }

  static logTransaction(params: Omit<FinancialTransaction, 'id' | 'total' | 'approvalStatus'>) {
    const total = params.amount + params.tax;
    
    const record: FinancialTransaction = {
      ...params,
      id: `TRX-${params.department.substring(0, 2).toUpperCase()}-${Date.now()}`,
      total,
      approvalStatus: 'Pending'
    };

    financialLedger.push(record);
    
    this.audit({
      action: 'TRANSACTION_CREATED',
      department: params.department,
      targetId: record.id,
      performedBy: params.employeeId,
      newValue: record,
      reason: 'Standard operational logging'
    });

    return record;
  }

  static reconcile(params: Omit<ReconciliationRecord, 'id' | 'date' | 'status' | 'difference'>) {
    const difference = Math.abs(params.expectedValues.delivered - params.actualValues.delivered);
    const status = difference === 0 ? 'Matched' : 'Mismatch';

    const record: ReconciliationRecord = {
      ...params,
      id: `REC-MK-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      difference,
      status
    };

    reconciliationLedger.push(record);
    
    if (status === 'Mismatch') {
      this.audit({
        action: 'RECONCILIATION_MISMATCH',
        department: params.department,
        targetId: record.id,
        performedBy: 'SYSTEM',
        newValue: record,
        reason: 'Automatic mismatch detection'
      });
    }

    return record;
  }

  static audit(params: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...params,
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    financeAuditLogs.push(log);
    return log;
  }

  static getDepartmentStats(dept: Department) {
    const activities = activityLedger.filter(a => a.department === dept);
    const transactions = financialLedger.filter(t => t.department === dept);
    
    const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.total, 0);
    const expense = transactions.filter(t => t.type === 'Expense' || t.type === 'Purchase').reduce((sum, t) => sum + t.total, 0);
    
    return {
      activityCount: activities.length,
      income,
      expense,
      net: income - expense,
      pendingApprovals: transactions.filter(t => t.approvalStatus === 'Pending').length
    };
  }
}
