import { createFileRoute, Link } from "@tanstack/react-router";
import OfficeLayout from "@/components/office/OfficeLayout";
import { reconciliationLedger } from "@/data/financeData";
import { AlertTriangle, CheckCircle2, Search, Filter, ArrowRight, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/office/reconciliation")({
  component: ReconciliationPage,
});

function ReconciliationPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = reconciliationLedger.filter(r => 
    r.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mismatchCount = reconciliationLedger.filter(r => r.status === 'Mismatch').length;

  return (
    <OfficeLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Reconciliation Hub</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Department Operational Matching</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Ref ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#16803A]/20 transition-all"
                />
             </div>
             <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4 text-slate-400" />
             </button>
          </div>
        </div>

        {/* Mismatch Alert Banner */}
        {mismatchCount > 0 && (
          <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm border border-red-50">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Attention Required</h4>
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{mismatchCount} Active Mismatches Found in Operational Data</p>
              </div>
            </div>
            <button className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">Audit All</button>
          </div>
        )}

        {/* Reconciliation List */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6">Reference & Department</th>
                  <th className="p-6">Expected (Order)</th>
                  <th className="p-6">Actual (Delivered)</th>
                  <th className="p-6">Difference</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          record.status === 'Matched' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {record.status === 'Matched' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{record.referenceId}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{record.department}</span>
                            <span className="text-[9px] font-bold text-slate-300">{record.date}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-black text-slate-900">{record.expectedValues.ordered} units</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Order Quantity</p>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-black text-slate-900">{record.actualValues.delivered} units</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Confirmation Status</p>
                    </td>
                    <td className="p-6">
                      <span className={`text-sm font-black ${record.difference === 0 ? 'text-slate-300' : 'text-red-600'}`}>
                        {record.difference === 0 ? '0' : `-${record.difference}`}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-2.5 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${
                        record.status === 'Matched' ? 'bg-green-50 text-green-700 border-green-100' : 
                        record.status === 'Mismatch' ? 'bg-red-50 text-red-700 border-red-100' : 
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <Link 
                        to="/office/compliance" 
                        className="p-2 text-slate-400 hover:text-[#16803A] hover:bg-green-50 rounded-lg transition-all flex items-center justify-center"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}
