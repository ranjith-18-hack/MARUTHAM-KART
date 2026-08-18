import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { MessageSquare, Calendar, Clock, ArrowUpRight, Search, Filter } from "lucide-react";
import { quotes } from "@/data/mockData";

export const Route = createFileRoute("/business/quotes")({
  head: () => ({
    meta: [{ title: "Procurement Quotes | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessQuotes,
});

function BusinessQuotes() {
  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Quotes & Requests</h1>
          <button className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all">
            Request Custom Quote
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Search quotes..." className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none text-xs font-medium" />
          </div>
          <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Filter Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {quotes.map((q, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-slate-50 text-[#16803A] rounded-[1.25rem] flex items-center justify-center border border-slate-200">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.id}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${q.status === 'Quote Ready' ? 'bg-very-light-green text-[#16803A] border-[#16803A]/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {q.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{q.product}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      <span>{q.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>Qty: {q.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-900 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-100">Details</button>
                {q.status === 'Quote Ready' && (
                  <button className="flex-1 md:flex-none px-6 py-3 bg-[#16803A] text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#0B5428] flex items-center space-x-2">
                    <span>Accept Quote</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </BusinessLayout>
  );
}
