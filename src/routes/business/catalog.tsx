import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Search, Filter, MapPin } from "lucide-react";
import { b2bProducts } from "@/data/mockData";

export const Route = createFileRoute("/business/catalog")({
  head: () => ({
    meta: [{ title: "Bulk Catalog | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessCatalog,
});

function BusinessCatalog() {
  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto space-y-4">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Bulk Product Catalog</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Search bulk products..." className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" />
            </div>
            <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              <span>Filter Categories</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {b2bProducts.map((p) => (
            <Link to={`/business/products/${p.id}` as any} key={p.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#16803A] text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Bulk Price</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{p.farmer.location}</p>
                  </div>
                </div>

                <div className="bg-[#F5FBF7] p-4 rounded-2xl border border-[#DCE8DF]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pricing Tiers</p>
                  <div className="space-y-1.5">
                    {p.priceTiers.map((tier, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                          {tier.min}{tier.max === 'plus' ? '+' : `–${tier.max}`} {p.unit}
                        </span>
                        <span className={`text-xs font-black ${idx === p.priceTiers.length - 1 ? 'text-[#16803A]' : 'text-slate-900'}`}>
                          ₹{tier.price}/{p.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Min Order</p>
                    <p className="text-sm font-black text-slate-900">{p.minBulkQty} {p.unit}</p>
                  </div>
                  <button className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all">
                    View Details
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </BusinessLayout>
  );
}
