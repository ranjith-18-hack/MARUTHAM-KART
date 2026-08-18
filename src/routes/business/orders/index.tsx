import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { ClipboardList, Calendar, CheckCircle2, Clock, Search, Filter } from "lucide-react";
import { businessOrders } from "@/data/mockData";

export const Route = createFileRoute("/business/orders/")({
  head: () => ({
    meta: [{ title: "My Bulk Orders | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessOrders,
});

function BusinessOrders() {
  const tabs = ['Active Orders', 'Scheduled Orders', 'Completed Orders', 'Cancelled Orders'];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter">Order Management</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab, i) => (
              <button key={i} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === 0 ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'bg-white text-slate-400 border border-slate-200 hover:border-[#16803A] hover:text-[#16803A]'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Search orders..." className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none text-xs font-medium" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {businessOrders.map((order, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="bg-slate-100 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{order.id}</span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      order.status === 'Delivered' ? 'bg-very-light-green text-[#16803A] border-[#16803A]/20' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase leading-none">{order.products}</h3>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{order.quantity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ordered: {order.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#16803A]">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Delivery: {order.deliveryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 lg:text-right">
                  <div className="w-full md:w-auto md:pr-8 md:border-r border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bulk Order Total</p>
                    <p className="text-2xl font-black text-slate-900">{order.total}</p>
                  </div>
                  <button className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all">
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </BusinessLayout>
  );
}
