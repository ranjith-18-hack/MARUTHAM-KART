import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { Package, Search, Plus, Filter, MoreVertical, LayoutGrid, List } from "lucide-react";
import { products } from "@/data/mockData";

export const Route = createFileRoute("/farmer/products/")({
  head: () => ({
    meta: [{ title: "My Products | Farmer Portal" }],
  }),
  component: FarmerProducts,
});

function FarmerProducts() {
  // Filter products for the current mock farmer (Muthu Kumar)
  const myProducts = products.filter(p => p.farmer.id === 'f1');

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">My Products</h1>
          <button className="bg-[#16803A] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-[#16803A]/20">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search products..."
              className="w-full bg-white border border-border-color p-3 pl-10 rounded-xl focus:ring-2 focus:ring-[#16803A] outline-none text-sm font-medium"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border border-border-color px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-text">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <div className="bg-white border border-border-color rounded-xl flex p-1">
              <button className="p-2 bg-very-light-green text-primary-green rounded-lg">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="p-2 text-secondary-text">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProducts.map((product) => (
            <div key={product.id} className="bg-white border border-border-color rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#16803A] text-[8px] font-black rounded-full uppercase tracking-widest border border-white">
                  {product.category}
                </div>
                <div className="absolute top-3 right-3">
                  <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-secondary-text hover:text-primary-green shadow-sm transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-primary-text leading-tight">{product.name}</h3>
                    <p className="text-[10px] font-bold text-secondary-text mt-1">₹{product.price}/{product.unit}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black rounded-full uppercase tracking-widest ${
                    product.availability === 'Available' ? 'bg-very-light-green text-primary-green' : 'bg-red-50 text-red-500'
                  }`}>
                    {product.availability}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border-color border-dashed">
                  <div>
                    <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Available</p>
                    <p className="text-xs font-black text-primary-text mt-0.5">{product.availableQty} {product.unit}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Total Orders</p>
                    <p className="text-xs font-black text-primary-text mt-0.5">128</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="flex-1 py-2.5 bg-[#F5FBF7] text-[#16803A] text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#DCE8DF] transition-colors">
                    Update Stock
                  </button>
                  <button className="flex-1 py-2.5 bg-primary-text text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-colors">
                    Edit Product
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Product Card */}
          <button className="bg-white border-2 border-dashed border-border-color rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 hover:border-primary-green hover:bg-[#F5FBF7] transition-all group min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-very-light-green flex items-center justify-center text-primary-green group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-primary-text uppercase tracking-widest">Add New Product</p>
              <p className="text-[8px] font-bold text-secondary-text mt-1 uppercase tracking-widest">Grow your supply</p>
            </div>
          </button>
        </div>
      </main>
    </FarmerLayout>
  );
}
