import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { inventoryItems } from "@/data/mockData";
import { Plus, Search, Filter, Package, AlertCircle, MoreHorizontal, Eye, Edit3 } from "lucide-react";
import { useState } from "react";


export const Route = createFileRoute("/godown/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  return (
    <GodownLayout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Products</h1>
            <p className="text-sm text-secondary-text font-bold">Manage product catalog and master inventory settings</p>
          </div>
          <button 
            onClick={() => navigate({ to: "/godown/products/new" })}
            className="flex items-center space-x-2 px-4 py-2 bg-[#16803A] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428]"
          >

            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl border border-[#DCE8DF] shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
            <input placeholder="Search products..." className="w-full pl-10 py-2 text-xs border border-[#DCE8DF] rounded-xl outline-none" />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-[#DCE8DF] rounded-xl text-xs font-black text-secondary-text uppercase tracking-widest">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map((product) => (
            <div key={product.id} className="bg-white border border-[#DCE8DF] rounded-3xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <img src={product.image} alt={product.productName} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                <span className={`text-[10px] font-black px-2 py-1 rounded-full border uppercase ${
                  product.status === 'Healthy' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                }`}>
                  {product.status}
                </span>
              </div>
              <h3 className="font-black text-primary-text mb-1">{product.productName}</h3>
              <p className="text-[10px] font-bold text-secondary-text mb-4 uppercase">{product.category}</p>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-primary-text">
                <div>
                  <p className="text-[10px] text-secondary-text uppercase">Stock</p>
                  <p>{product.totalStock} {product.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-secondary-text uppercase">Price</p>
                  <p>₹{product.sellingPrice}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <Link 
                  to="/godown/products/$productId" 
                  params={{ productId: product.productId }}
                  className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline flex items-center space-x-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Product</span>
                </Link>
                <div className="flex items-center space-x-1">
                  <Link 
                    to="/godown/products/$productId" 
                    params={{ productId: product.productId }}
                    className="p-2 hover:bg-slate-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4 text-slate-400 hover:text-[#16803A]" />
                  </Link>
                  <button className="p-2 hover:bg-slate-50 rounded-lg"><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </GodownLayout>
  );
}
