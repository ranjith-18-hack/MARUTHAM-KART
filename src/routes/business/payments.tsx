import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { CreditCard, ArrowUpRight, Clock, ShieldCheck, Search } from "lucide-react";

export const Route = createFileRoute("/business/payments")({
  head: () => ({
    meta: [{ title: "Payments & Ledger | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessPayments,
});

function BusinessPayments() {
  const history = [
    { id: 'TXN-4421', desc: 'Order B-ORD-6985', date: 'Aug 09, 2026', amount: '₹28,600', status: 'Success' },
    { id: 'TXN-4380', desc: 'Order B-ORD-6950', date: 'Aug 01, 2026', amount: '₹15,200', status: 'Success' },
  ];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter text-left">Payments & Settlement</h1>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outstanding</p>
            <p className="text-3xl font-black text-red-500 tracking-tighter">₹1,25,000</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid (This Month)</p>
            <p className="text-3xl font-black text-[#16803A] tracking-tighter">₹43,800</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Cycle</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">15 Days</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Transactions</h3>
            <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline">Download Statement</button>
          </div>
          <div className="divide-y divide-slate-50">
            {history.map((tx, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#16803A] border border-slate-100">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">{tx.desc}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tx.id} • {tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{tx.amount}</p>
                  <p className="text-[8px] font-black text-[#16803A] uppercase tracking-widest">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}
