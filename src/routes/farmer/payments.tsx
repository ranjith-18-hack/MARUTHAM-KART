import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { Bell, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/farmer/payments")({
  head: () => ({
    meta: [{ title: "Payment History | Farmer Portal" }],
  }),
  component: FarmerPayments,
});

function FarmerPayments() {
  const history = [
    { id: 'TXN-9001', orderId: 'ORD-1002', amount: '₹12,400', date: 'Aug 14, 2026', status: 'Paid' },
    { id: 'TXN-9002', orderId: 'ORD-1001', amount: '₹8,200', date: 'Aug 10, 2026', status: 'Processing' },
    { id: 'TXN-9003', orderId: 'ORD-0998', amount: '₹15,000', date: 'Aug 05, 2026', status: 'Paid' },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Payment History</h1>
          <button className="p-2 bg-[#F5FBF7] text-[#16803A] rounded-xl relative">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
            <input type="text" placeholder="Search transaction ID..." className="w-full bg-white border border-border-color p-3 pl-10 rounded-xl outline-none text-sm font-medium" />
          </div>
          <button className="flex items-center justify-center space-x-2 bg-white border border-border-color px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-text">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-border-color overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[#F5FBF7] border-b border-border-color">
              <tr>
                {['Transaction ID', 'Order ID', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} className="p-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {history.map((tx, i) => (
                <tr key={i} className="hover:bg-[#F5FBF7] transition-colors">
                  <td className="p-4 text-xs font-black text-primary-text">{tx.id}</td>
                  <td className="p-4 text-xs font-bold text-secondary-text">{tx.orderId}</td>
                  <td className="p-4 text-xs font-black text-primary-green">{tx.amount}</td>
                  <td className="p-4 text-xs font-bold text-secondary-text">{tx.date}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest border ${
                      tx.status === 'Paid' ? 'bg-very-light-green text-primary-green border border-primary-green/20' : 'bg-orange-50 text-orange-600 border border-orange-200'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </FarmerLayout>
  );
}
