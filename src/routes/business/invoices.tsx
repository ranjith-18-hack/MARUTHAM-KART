import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { FileText, Download, Eye, Search, Filter } from "lucide-react";
import { invoices } from "@/data/mockData";

export const Route = createFileRoute("/business/invoices")({
  head: () => ({
    meta: [{ title: "Business Invoices | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessInvoices,
});

function BusinessInvoices() {
  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter">Invoices & Billing</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Search invoices..." className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none text-xs font-medium" />
          </div>
          <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Invoice ID', 'Order ID', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-900 uppercase">{inv.id}</span>
                    </div>
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-500 uppercase">{inv.orderId}</td>
                  <td className="p-6 text-xs font-bold text-slate-500 uppercase">{inv.date}</td>
                  <td className="p-6 text-xs font-black text-slate-900">{inv.amount}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest border ${
                      inv.status === 'Paid' ? 'bg-very-light-green text-[#16803A] border-[#16803A]/20' : 'bg-red-50 text-red-500 border-red-100'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-slate-400 hover:text-slate-900 transition-all"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-[#16803A] transition-all"><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </BusinessLayout>
  );
}
