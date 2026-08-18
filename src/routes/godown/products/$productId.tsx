import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { inventoryItems, farmers, categories } from "@/data/mockData";
import { ArrowLeft, Save, Trash2, ArrowRightLeft, PackageCheck, AlertCircle, History, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


export const Route = createFileRoute("/godown/products/$productId")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = useParams({ from: "/godown/products/$productId" });
  const navigate = useNavigate();
  const product = inventoryItems.find(p => p.id === productId || p.productId === productId);
  
  const [showStockModal, setShowStockModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'Addition' | 'Removal' | 'Adjustment'>('Addition');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  if (!product) {
    return (
      <GodownLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-black text-red-600">Product Not Found</h2>
          <button onClick={() => navigate({ to: "/godown/products" })} className="mt-4 text-[#16803A] font-bold">Back to Products</button>
        </div>
      </GodownLayout>
    );
  }

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate({ to: "/godown/products" })}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-secondary-text" />
            </button>
            <div className="flex items-center space-x-4">
              <img src={product.image} alt={product.productName} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">{product.productName}</h1>
                <p className="text-sm text-secondary-text font-bold uppercase">{product.category} • ID: {product.productId}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-2 bg-[#16803A] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#16803A]/20">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-black text-secondary-text uppercase mb-2">Current Stock</p>
                <h3 className="text-2xl font-black text-primary-text">{product.totalStock} <span className="text-sm text-slate-400">{product.unit}</span></h3>
              </div>
              <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-black text-secondary-text uppercase mb-2">Selling Price</p>
                <h3 className="text-2xl font-black text-[#16803A]">₹{product.sellingPrice}</h3>
              </div>
              <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-black text-secondary-text uppercase mb-2">Total Sales</p>
                <h3 className="text-2xl font-black text-primary-text">₹1.2L</h3>
              </div>
            </div>

            {/* Main Form Section */}
            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-primary-text uppercase tracking-tight border-b border-slate-100 pb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Product Name</label>
                  <input 
                    type="text" 
                    defaultValue={product.productName} 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Category</label>
                  <select defaultValue={product.category} className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none">
                    {categories.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Unit</label>
                  <input 
                    type="text" 
                    defaultValue={product.unit} 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Purchase Price (₹)</label>
                  <input 
                    type="number" 
                    defaultValue={product.purchasePrice} 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    defaultValue={product.sellingPrice} 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Farmer / Supplier</label>
                  <select defaultValue={product.supplier} className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none">
                    {farmers.map(f => <option key={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Quick Actions / Stock Control */}
            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-base font-black text-primary-text uppercase tracking-tight">Stock Management</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => { setAdjustmentType('Addition'); setShowStockModal(true); }}
                  className="w-full flex items-center justify-between p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl group hover:bg-[#16803A] hover:border-[#16803A] transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center group-hover:bg-[#16803A] transition-colors border border-slate-100 group-hover:border-white/20">
                      <PackageCheck className="w-4 h-4 text-[#16803A] group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-text group-hover:text-white">Add Stock</span>
                  </div>
                  <Save className="w-4 h-4 text-slate-300 group-hover:text-white/50" />
                </button>

                <button 
                  onClick={() => { setAdjustmentType('Removal'); setShowStockModal(true); }}
                  className="w-full flex items-center justify-between p-4 bg-red-50/30 border border-red-100 rounded-2xl group hover:bg-red-600 hover:border-red-600 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-white/20">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-text group-hover:text-white">Remove Stock</span>
                  </div>
                  <Save className="w-4 h-4 text-slate-300 group-hover:text-white/50" />
                </button>

                <button 
                  onClick={() => { setAdjustmentType('Adjustment'); setShowStockModal(true); }}
                  className="w-full flex items-center justify-between p-4 bg-blue-50/30 border border-blue-100 rounded-2xl group hover:bg-blue-600 hover:border-blue-600 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-white/20">
                      <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-text group-hover:text-white">Adjust Base Stock</span>
                  </div>
                  <Save className="w-4 h-4 text-slate-300 group-hover:text-white/50" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Low Stock Alert</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${product.totalStock <= product.minThreshold ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                    {product.totalStock <= product.minThreshold ? 'TRIGGERED' : 'HEALTHY'}
                  </span>
                </div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Threshold Quantity</label>
                <input 
                  type="number" 
                  defaultValue={product.minThreshold} 
                  className="w-full px-4 py-2 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-sm outline-none"
                />
              </div>
            </div>

            {/* Recent History Mini View */}
            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-primary-text uppercase tracking-tight">Recent Activity</h3>
                <button 
                  onClick={() => navigate({ to: "/godown/products/history" })}
                  className="text-[10px] font-black text-[#16803A] uppercase hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-auto bg-slate-100 rounded-full"></div>
                    <div>
                      <p className="text-[11px] font-black text-primary-text">Stock {i % 2 === 0 ? 'Added' : 'Adjusted'} (+50 {product.unit})</p>
                      <p className="text-[9px] font-bold text-secondary-text uppercase">Aug 1{i}, 2026 • Prakash Raj</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        <AnimatePresence>
          {showStockModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowStockModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      adjustmentType === 'Addition' ? 'bg-green-50 text-green-600' :
                      adjustmentType === 'Removal' ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {adjustmentType === 'Addition' ? <PackageCheck className="w-5 h-5" /> : 
                       adjustmentType === 'Removal' ? <Trash2 className="w-5 h-5" /> : 
                       <ArrowRightLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-primary-text uppercase tracking-tight">{adjustmentType} Stock</h3>
                      <p className="text-[10px] text-secondary-text font-bold uppercase">{product.productName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Quantity ({product.unit})</label>
                    <input 
                      type="number" 
                      placeholder="Enter amount..."
                      className="w-full px-4 py-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-lg font-black focus:ring-1 focus:ring-[#16803A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Reason for Adjustment</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe why this change is being made (e.g., Re-stocking from farmer, damaged goods, inventory count fix)..."
                      className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-xs focus:ring-1 focus:ring-[#16803A] outline-none resize-none"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed italic">
                      "Every manual stock adjustment is recorded in the permanent audit logs with your Employee ID."
                    </p>
                  </div>

                  <button className="w-full py-4 bg-[#16803A] text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all">
                    Confirm Adjustment
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
