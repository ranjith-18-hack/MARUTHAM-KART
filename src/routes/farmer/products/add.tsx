import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { ArrowLeft, Plus, CloudUpload, Info } from "lucide-react";

export const Route = createFileRoute("/farmer/products/add")({
  head: () => ({
    meta: [{ title: "Add Product | Farmer Portal" }],
  }),
  component: AddProduct,
});

function AddProduct() {
  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button className="p-2 hover:bg-[#F5FBF7] rounded-xl"><ArrowLeft className="w-5 h-5 text-secondary-text" /></button>
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Add Product</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        <div className="bg-white p-8 rounded-[2rem] border border-border-color shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Product Name</label>
              <input type="text" placeholder="e.g. Premium Basmati Rice" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Category</label>
              <select className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A] appearance-none">
                <option>Rice & Grains</option>
                <option>Wheat</option>
                <option>Vegetables</option>
                <option>Fruits</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Product Description</label>
            <textarea placeholder="Tell buyers about your product's quality, farm, and benefits..." className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A] h-32"></textarea>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest block">Product Images</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="aspect-square bg-[#F5FBF7] border-2 border-dashed border-[#DCE8DF] rounded-3xl flex flex-col items-center justify-center space-y-2 hover:border-primary-green transition-all">
                <CloudUpload className="w-6 h-6 text-[#16803A]" />
                <span className="text-[8px] font-black uppercase tracking-widest text-secondary-text">Upload</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Price per unit</label>
              <input type="text" placeholder="₹ per kg" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Available Qty</label>
              <input type="text" placeholder="e.g. 500 kg" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Harvest Date</label>
              <input type="date" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" />
            </div>
          </div>

          <div className="pt-8 border-t border-border-color border-dashed">
            <button className="w-full py-4 bg-[#16803A] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all">Submit Product</button>
          </div>
        </div>
      </main>
    </FarmerLayout>
  );
}
