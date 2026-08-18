import { createFileRoute } from "@tanstack/react-router";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { managedAccounts, auditLogs } from "@/data/mockData";
import { useState } from "react";
import { Search, Filter, Shield, MoreVertical, ArrowLeftRight, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getPortalFromDepartment } from "@/lib/auth-mapping";

export const Route = createFileRoute("/recruitment/directory")({
  component: AccountDirectory,
});

function AccountDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [showTransferModal, setShowTransferModal] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState("Transport");

  const filteredAccounts = managedAccounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          acc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || acc.status === statusFilter;
    const matchesDept = deptFilter === "All" || acc.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleTransfer = (id: string) => {
    const accountIndex = managedAccounts.findIndex(a => a.id === id);
    if (accountIndex === -1) return;

    const account = managedAccounts[accountIndex];
    if (!account) return;
    const prevDept = account.department;
    const newPortal = getPortalFromDepartment(selectedDept as any, account.category);

    // Update the account (in-memory mock)
    managedAccounts[accountIndex] = {
      ...account,
      department: selectedDept as any,
      portal: newPortal
    };

    // Record audit log
    auditLogs.push({
      action: 'Department Transfer',
      target: id,
      previousValue: prevDept,
      newValue: selectedDept,
      performedBy: 'MK-REC-03',
      date: new Date().toISOString()
    });

    toast.success(`Account ${id} transferred to ${selectedDept} successfully`);
    setShowTransferModal(null);
  };

  const toggleStatus = (id: string) => {
    const accountIndex = managedAccounts.findIndex(a => a.id === id);
    if (accountIndex === -1) return;

    const account = managedAccounts[accountIndex];
    if (!account) return;
    const newStatus = account.status === 'Active' ? 'Suspended' : 'Active';
    
    managedAccounts[accountIndex] = {
      ...account,
      status: newStatus
    };

    auditLogs.push({
      action: 'Status Change',
      target: id,
      previousValue: account.status,
      newValue: newStatus,
      performedBy: 'MK-REC-03',
      date: new Date().toISOString()
    });

    toast.info(`Account ${id} is now ${newStatus}`);
  };


  return (
    <RecruitmentLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm space-y-4">
           <div className="flex justify-between items-center">
             <h3 className="font-black text-primary-text uppercase tracking-widest text-sm">Organizational Directory</h3>
             <span className="text-[10px] font-black text-secondary-text bg-[#F5FBF7] px-3 py-1 rounded-full border border-[#DCE8DF]">
               {filteredAccounts.length} Total Accounts
             </span>
           </div>
           
           <div className="flex flex-wrap gap-3">
             <div className="flex-1 min-w-[250px] relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by Name or ID..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 border border-[#DCE8DF] rounded-xl text-xs outline-none focus:border-[#16803A] bg-[#F5FBF7]/30 transition-all" 
               />
             </div>
             <select 
               value={deptFilter}
               onChange={(e) => setDeptFilter(e.target.value)}
               className="px-4 py-2.5 border border-[#DCE8DF] rounded-xl text-xs font-bold text-slate-600 bg-white min-w-[140px]"
             >
               <option value="All">All Departments</option>
               <option value="Godown">Godown</option>
               <option value="Transport">Transport</option>
               <option value="Recruitment">Recruitment</option>
               <option value="Business">Business</option>
             </select>
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="px-4 py-2.5 border border-[#DCE8DF] rounded-xl text-xs font-bold text-slate-600 bg-white min-w-[140px]"
             >
               <option value="All">All Statuses</option>
               <option value="Active">Active</option>
               <option value="Suspended">Suspended</option>
               <option value="Pending Approval">Pending Approval</option>
             </select>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE8DF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F5FBF7]">
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-[#DCE8DF]">
                  <th className="p-4">Account ID</th>
                  <th className="p-4">Name & Role</th>
                  <th className="p-4">Dept / Portal</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {filteredAccounts.map(account => (
                  <tr key={account.id} className="hover:bg-[#F5FBF7]/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {account.id.split('-').length > 2 ? account.id.split('-')[2] : account.id.split('-')[1]}
                        </div>
                        <span className="text-xs font-bold text-slate-500">{account.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary-text">{account.name}</span>
                        <span className="text-[10px] font-bold text-secondary-text uppercase tracking-tight">{account.category}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">{account.department}</span>
                        <span className="text-[9px] text-[#16803A] font-black uppercase">{account.portal}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        account.verificationStatus === 'Verified' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        <Shield className="w-2.5 h-2.5" />
                        {account.verificationStatus}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[9px] font-black rounded-full border uppercase ${
                        account.status === 'Active' ? 'bg-green-50 text-[#16803A] border-[#16803A]/20' : 
                        account.status === 'Suspended' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setShowTransferModal(account.id)}
                          className="p-2 text-slate-400 hover:text-[#16803A] hover:bg-green-50 rounded-lg transition-all"
                          title="Transfer Department"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleStatus(account.id)}
                          className={`p-2 rounded-lg transition-all ${
                            account.status === 'Active' ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-green-500 hover:bg-green-50'
                          }`}
                          title={account.status === 'Active' ? "Suspend Account" : "Activate Account"}
                        >
                          {account.status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-primary-text">Department Transfer</h3>
              <p className="text-xs text-secondary-text mt-2 font-bold">
                Transferring <span className="text-[#16803A]">{showTransferModal}</span> to a new department will update portal access and permissions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-secondary-text">Target Department</label>
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-bold bg-[#F5FBF7]/30"
                >
                  <option value="Transport">Transport</option>
                  <option value="Godown">Godown</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Business">Business</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-secondary-text">Transfer Reason</label>
                <textarea className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm min-h-[80px]" placeholder="Explain the reason for this transfer..."></textarea>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => setShowTransferModal(null)} className="flex-1 p-3 border border-[#DCE8DF] text-primary-text font-black rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleTransfer(showTransferModal)} className="flex-1 p-3 bg-[#16803A] text-white rounded-xl font-black hover:bg-[#12662e] shadow-lg shadow-[#16803A]/20">Approve Transfer</button>
            </div>
          </div>
        </div>
      )}
    </RecruitmentLayout>
  );
}


