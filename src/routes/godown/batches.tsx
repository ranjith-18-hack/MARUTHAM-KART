import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { batches } from "@/data/mockData";
import { Layers, Filter, Search, MoreVertical, BadgeCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/godown/batches")({
  head: () => ({
    meta: [
      { title: "Batch Management | MARUTHAM KART" },
      { name: "description", content: "Track and manage product batches, quality, and storage." },
    ],
  }),
  component: BatchesPage,
});

function BatchesPage() {
  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Batch Management</h1>
            <p className="text-sm text-secondary-text font-bold">Comprehensive tracking for every product batch</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input 
                type="text" 
                placeholder="Search Batch ID..." 
                className="pl-10 pr-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-xs w-64 focus:ring-1 focus:ring-[#16803A] outline-none"
              />
            </div>
            <button className="p-2 border border-[#DCE8DF] rounded-xl bg-white hover:bg-slate-50">
              <Filter className="w-4 h-4 text-secondary-text" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#DCE8DF] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5FBF7] border-b border-[#DCE8DF]">
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Batch ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Farmer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Quantity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Received Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Expiry Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-[#16803A]">{batch.id}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary-text">{batch.productName}</td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{batch.farmerName}</td>
                    <td className="px-6 py-4 text-xs font-black text-primary-text">{batch.quantity} kg</td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{batch.receivedDate}</td>
                    <td className="px-6 py-4 text-xs font-bold text-red-500">{batch.expiryDate}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                        batch.status === 'Active' ? 'bg-green-50 border-green-100 text-green-600' :
                        batch.status === 'Expiring Soon' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                        'bg-red-50 border-red-100 text-red-600'
                      } uppercase tracking-tight`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
