import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { inboundStocks } from "@/data/mockData";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ClipboardCheck,
  ChevronRight,
  X
} from "lucide-react";

export const Route = createFileRoute("/godown/inbound")({
  head: () => ({
    meta: [
      { title: "Inbound Stock | MARUTHAM KART" },
      { name: "description", content: "Manage incoming farmer stock and quality inspections." },
    ],
  }),
  component: InboundStockPage,
});

function InboundStockPage() {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Incoming Farmer Stock</h1>
            <p className="text-sm text-secondary-text font-bold">Monitor and process arriving products from farmers</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input 
                type="text" 
                placeholder="Search batch or farmer..." 
                className="pl-10 pr-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-xs w-64 focus:ring-1 focus:ring-[#16803A] outline-none"
              />
            </div>
            <button className="p-2 border border-[#DCE8DF] rounded-xl bg-white hover:bg-slate-50 transition-colors">
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
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Farmer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Quantity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Arrival Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Zone</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {inboundStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-[#16803A] bg-[#F5FBF7] px-2 py-1 rounded-lg border border-[#DCE8DF]">{stock.batchId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-primary-text">{stock.farmer}</p>
                      <p className="text-[10px] text-secondary-text font-bold uppercase tracking-tight">Verified Farmer</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary-text">{stock.product}</td>
                    <td className="px-6 py-4 text-xs font-black text-primary-text">{stock.quantity} kg</td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{stock.arrivalDate}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                        stock.inspectionStatus === 'Completed' ? 'bg-green-50 border-green-100 text-green-600' :
                        stock.inspectionStatus === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        'bg-amber-50 border-amber-100 text-amber-600'
                      } uppercase tracking-tight`}>
                        {stock.inspectionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{stock.storageZone}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedStock(stock);
                            setIsInspectionOpen(true);
                          }}
                          className="p-2 text-[#16803A] hover:bg-[#F5FBF7] rounded-lg transition-colors group relative"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[8px] font-black px-2 py-1 rounded whitespace-nowrap uppercase tracking-widest">Inspect Quality</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Inspection Modal */}
        <AnimatePresence>
          {isInspectionOpen && selectedStock && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsInspectionOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="p-6 bg-[#16803A] text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-sm">
                      <ClipboardCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Quality Inspection</h3>
                      <p className="text-[10px] text-white/80 font-black uppercase tracking-widest">Batch: {selectedStock.batchId}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsInspectionOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</p>
                      <p className="text-sm font-black text-primary-text">{selectedStock.product}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Farmer Name</p>
                      <p className="text-sm font-black text-primary-text">{selectedStock.farmer}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received Quantity</p>
                      <p className="text-sm font-black text-primary-text">{selectedStock.quantity} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harvest Date</p>
                      <p className="text-sm font-black text-primary-text">{selectedStock.harvestDate}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-secondary-text uppercase tracking-widest border-b border-slate-100 pb-2">Inspection Checklist</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Product Quality', desc: 'Appearance, color, smell' },
                        { label: 'Packaging Condition', desc: 'Bags intact, no leaks' },
                        { label: 'Moisture Level', desc: 'Within acceptable range' },
                        { label: 'Damage', desc: 'No physical crushing or bruising' },
                        { label: 'Contamination', desc: 'No foreign objects or pests' },
                        { label: 'Weight Verification', desc: 'Weight matches invoice' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-[#DCE8DF] rounded-2xl bg-[#F5FBF7]">
                          <div>
                            <p className="text-xs font-black text-primary-text">{item.label}</p>
                            <p className="text-[10px] text-secondary-text font-bold">{item.desc}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="w-8 h-8 rounded-full border border-[#DCE8DF] bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                              <XCircle className="w-5 h-5" />
                            </button>
                            <button className="w-8 h-8 rounded-full border border-[#DCE8DF] bg-[#16803A] flex items-center justify-center text-white">
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest ml-1">Inspection Notes</label>
                    <textarea 
                      placeholder="Enter detailed observations..."
                      className="w-full h-24 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#16803A] transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Overall Result</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="py-4 border-2 border-green-500 bg-green-50 rounded-2xl flex flex-col items-center justify-center space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Approved</span>
                      </button>
                      <button className="py-4 border border-[#DCE8DF] rounded-2xl flex flex-col items-center justify-center space-y-1 grayscale opacity-50">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Rejected</span>
                      </button>
                      <button className="py-4 border border-[#DCE8DF] rounded-2xl flex flex-col items-center justify-center space-y-1 grayscale opacity-50">
                        <Info className="w-6 h-6 text-amber-600" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Review</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-4">
                  <button 
                    onClick={() => setIsInspectionOpen(false)}
                    className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsInspectionOpen(false)}
                    className="px-8 py-3 bg-[#16803A] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all"
                  >
                    Submit Inspection
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </GodownLayout>
  );
}
