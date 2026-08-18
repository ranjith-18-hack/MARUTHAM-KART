import { createFileRoute } from "@tanstack/react-router";
import OfficeLayout from "@/components/office/OfficeLayout";
import { financeAuditLogs } from "@/data/financeData";
import { ShieldCheck, User, Clock, Search, Filter, History } from "lucide-react";

export const Route = createFileRoute("/office/compliance")({
  component: CompliancePage,
});

function CompliancePage() {
  return (
    <OfficeLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Compliance & Audit</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Immutable Activity Logs & Forensic Records</p>
          </div>
          <div className="flex gap-3">
             <button className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Search
             </button>
             <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Export Logs
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Integrity</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">100% Verified</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <User className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Auditors</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">4 Officers</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Audit Check</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">12 Mins Ago</h3>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter">Forensic Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Performer</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Hash ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {financeAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black">
                          MK
                        </div>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{log.performedBy}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-black text-[#16803A] bg-green-50 px-2 py-1 rounded-full uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold text-slate-900 uppercase">{log.targetId}</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.department}</p>
                    </td>
                    <td className="p-4 text-[10px] font-bold text-slate-500 max-w-xs truncate">{log.reason}</td>
                    <td className="p-4 font-mono text-[9px] text-slate-300">
                      {log.id.slice(0, 8)}...
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
