import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Repeat, Calendar, Trash2, Plus, Clock, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/business/recurring")({
  head: () => ({
    meta: [{ title: "Recurring Bulk Orders | MARUTHAM KART BUSINESS" }],
  }),
  component: RecurringOrders,
});

function RecurringOrders() {
  const recurring = [
    { name: 'Premium Ponni Rice', qty: '500 kg', freq: 'Every Monday', next: 'Aug 17', status: 'Active' },
    { name: 'Farm Fresh Milk', qty: '100 litres', freq: 'Every Day', next: 'Tomorrow', status: 'Active' },
    { name: 'Seasonal Vegetables', qty: '200 kg', freq: 'Every Wednesday', next: 'Aug 19', status: 'Paused' },
  ];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter text-left">Recurring Orders</h1>
          <button className="bg-[#16803A] text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-[#0B5428] transition-all flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create New Schedule</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recurring.map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${item.status === 'Active' ? 'bg-very-light-green text-[#16803A] border-[#16803A]/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{item.status}</span>
              </div>
              
              <div className="w-12 h-12 bg-[#F5FBF7] text-[#16803A] rounded-2xl flex items-center justify-center border border-[#16803A]/10">
                <ShoppingBag className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{item.name}</h3>
                <p className="text-[10px] font-black text-[#16803A] uppercase tracking-widest mt-1">Procurement Level: {item.qty}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-3">
                  <Repeat className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.freq}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next: {item.next}</span>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-3">
                <button className="flex-1 py-3 bg-slate-50 text-slate-900 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-100 transition-all">Edit Schedule</button>
                <button className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </BusinessLayout>
  );
}
