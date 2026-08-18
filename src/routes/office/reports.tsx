import { createFileRoute } from "@tanstack/react-router";
import OfficeLayout from "@/components/office/OfficeLayout";
import { monthlyReports } from "@/data/financeData";
import { FileText, Download, FileSpreadsheet, Presentation, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/office/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const handleExport = (type: string, reportId: string) => {
    toast.success(`Generating ${type} for ${reportId}...`, {
      description: "This document is being prepared for official company records.",
    });
  };

  return (
    <OfficeLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Department Reports</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Financial & Operational Statements</p>
          </div>
          <div className="flex gap-3">
             <button className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Filter Period</button>
             <button className="px-4 py-2 bg-[#16803A] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#126a30] transition-colors">Archive All</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {monthlyReports.map((report) => (
            <div key={report.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group">
              <div className="p-8">
                <div className="flex flex-col xl:flex-row justify-between gap-8">
                  {/* Report ID & Header */}
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#16803A] group-hover:text-white transition-all duration-500">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-[#16803A] bg-green-50 px-2 py-0.5 rounded uppercase">{report.department}</span>
                        <span className="text-[10px] font-bold text-slate-300">#{report.reportNumber}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{report.month} Statement</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Managed by {report.preparedBy}</p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 xl:px-8 xl:border-x xl:border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Income</p>
                      <p className="text-sm font-black text-slate-900">₹{report.summary.totalIncome.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
                      <p className="text-sm font-black text-slate-900">₹{report.summary.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Total</p>
                      <p className={`text-sm font-black ${report.summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{report.summary.netAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <div className="flex items-center gap-1.5">
                        {report.status === 'Finalized' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : report.status === 'Finance Review' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        <span className="text-[10px] font-black text-slate-900 uppercase">{report.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 h-fit">
                    <button 
                      onClick={() => handleExport('PDF', report.reportNumber)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                    <button 
                      onClick={() => handleExport('EXCEL', report.reportNumber)}
                      className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-green-600" /> EXCEL
                    </button>
                    <button 
                      onClick={() => handleExport('PPT', report.reportNumber)}
                      className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Presentation className="w-3 h-3 text-blue-600" /> PPT
                    </button>
                  </div>
                </div>

                {/* Activity Progress */}
                <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Products Received</span>
                        <span className="text-xs font-black text-slate-900">{report.activitySummary['Stock Received'] || 0} Units</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full">
                        <div className="h-full bg-[#16803A] w-3/4 rounded-full"></div>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Products Dispatched</span>
                        <span className="text-xs font-black text-slate-900">{report.activitySummary['Stock Dispatched'] || 0} Units</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full">
                        <div className="h-full bg-blue-500 w-2/3 rounded-full"></div>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orders Processed</span>
                        <span className="text-xs font-black text-slate-900">{report.activitySummary['Orders Processed'] || 0} Success</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full">
                        <div className="h-full bg-amber-500 w-full rounded-full"></div>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </OfficeLayout>
  );
}
