import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { stockMovements } from "@/data/mockData";
import { History, Search, Filter, Download, User, Calendar, Tag } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/godown/products/history")({
  component: StockHistoryPage,
});

function StockHistoryPage() {
  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Stock History</h1>
            <p className="text-sm text-secondary-text font-bold">Audit log of all manual stock movements and adjustments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-[#DCE8DF] text-primary-text rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">
              <Download className="w-4 h-4" />
              <span>Export Logs</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#DCE8DF] rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
            <input 
              type="text" 
              placeholder="Search by product, ID, or user..." 
              className="w-full pl-10 pr-4 py-2 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-xs focus:ring-1 focus:ring-[#16803A] outline-none"
            />
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#DCE8DF] rounded-xl text-[10px] font-black uppercase">
              <Filter className="w-3 h-3 text-secondary-text" />
              <span className="text-secondary-text">All Types</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#DCE8DF] rounded-xl text-[10px] font-black uppercase">
              <Calendar className="w-3 h-3 text-secondary-text" />
              <span className="text-secondary-text">Last 30 Days</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {stockMovements.map((movement, i) => (
            <motion.div
              key={movement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-[#16803A]/30 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  movement.type === 'Addition' ? 'bg-green-50 text-green-600' :
                  movement.type === 'Removal' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <History className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-widest">{movement.id}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                      movement.type === 'Addition' ? 'bg-green-100 text-green-700' :
                      movement.type === 'Removal' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {movement.type}
                    </span>
                    <span className="text-[10px] font-bold text-secondary-text ml-auto">{movement.date}</span>
                  </div>
                  <h3 className="text-base font-black text-primary-text mb-1">{movement.productName}</h3>
                  <div className="flex items-center space-x-4 text-xs font-bold text-secondary-text">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{movement.user}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>ID: {movement.productId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8 px-8 border-l border-slate-100 hidden lg:flex">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Before</p>
                    <p className="text-sm font-black text-slate-600">{movement.prevQty} Units</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-black ${movement.changedQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.changedQty > 0 ? '+' : ''}{movement.changedQty}
                    </span>
                    <div className="h-px w-8 bg-slate-200 my-1"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-[#16803A] uppercase mb-1">After</p>
                    <p className="text-sm font-black text-primary-text">{movement.newQty} Units</p>
                  </div>
                </div>

                <div className="bg-[#F5FBF7] p-4 rounded-2xl border border-[#DCE8DF] md:w-64 shrink-0">
                  <p className="text-[10px] font-black text-secondary-text uppercase mb-1 tracking-widest">Reason / Notes</p>
                  <p className="text-[11px] font-bold text-primary-text leading-relaxed">"{movement.reason}"</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </GodownLayout>
  );
}
