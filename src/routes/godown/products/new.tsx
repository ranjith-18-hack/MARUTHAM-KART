import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { inventoryItems, farmers, categories } from "@/data/mockData";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/godown/products/new")({
  component: AddProductPage,
});

function AddProductPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "Rice & Grains",
    unit: "kg",
    purchasePrice: "",
    sellingPrice: "",
    farmer: farmers?.[0]?.name || "",
    initialStock: "0",
    minThreshold: "10",


    status: "Active",
    description: ""
  });

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate({ to: "/godown/products" })}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-secondary-text" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Add New Product</h1>
              <p className="text-sm text-secondary-text font-bold">Register a new agricultural product to the master catalog</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate({ to: "/godown/products" })}
              className="px-6 py-2 border border-[#DCE8DF] text-secondary-text rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50"
            >
              Cancel
            </button>
            <button className="flex items-center space-x-2 px-6 py-2 bg-[#16803A] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428]">
              <Save className="w-4 h-4" />
              <span>Save Product</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-primary-text uppercase tracking-tight border-b border-slate-100 pb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Product Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Organic Brown Rice" 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Category</label>
                    <select className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none appearance-none">
                      {categories.map(c => <option key={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Unit</label>
                    <select className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none appearance-none">
                      <option>kg</option>
                      <option>litre</option>
                      <option>packet</option>
                      <option>piece</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    rows={4} 
                    placeholder="Describe the product details, benefits, and quality marks..." 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-primary-text uppercase tracking-tight border-b border-slate-100 pb-4">Pricing & Supplier</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Purchase Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Farmer / Supplier</label>
                  <select className="w-full px-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none appearance-none">
                    {farmers.map(f => <option key={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-base font-black text-primary-text uppercase tracking-tight">Product Media</h3>
              <div className="aspect-square bg-[#F5FBF7] border-2 border-dashed border-[#DCE8DF] rounded-3xl flex flex-col items-center justify-center p-6 text-center group hover:border-[#16803A] transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-[#16803A]" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload product image</p>
                <p className="text-[8px] text-slate-400 mt-2 uppercase">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-base font-black text-primary-text uppercase tracking-tight">Inventory Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Initial Quantity</label>
                  <input 
                    type="number" 
                    defaultValue="0" 
                    className="w-full px-4 py-2 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Low Stock Threshold</label>
                  <input 
                    type="number" 
                    defaultValue="10" 
                    className="w-full px-4 py-2 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-sm focus:ring-1 focus:ring-[#16803A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-secondary-text uppercase tracking-widest mb-2">Status</label>
                  <div className="flex gap-2">
                    {['Active', 'Inactive'].map((status) => (
                      <button 
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, status})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          formData.status === status 
                          ? 'bg-[#16803A] border-[#16803A] text-white shadow-md' 
                          : 'bg-white border-[#DCE8DF] text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
