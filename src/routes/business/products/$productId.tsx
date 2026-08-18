import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { ArrowLeft, MapPin, Truck, ShieldCheck, ShoppingCart, MessageSquare, Package } from "lucide-react";
import { b2bProducts } from "@/data/mockData";
import { useState } from "react";

export const Route = createFileRoute("/business/products/$productId")({
  head: () => ({
    meta: [{ title: "Bulk Product Details | MARUTHAM KART BUSINESS" }],
  }),
  component: BulkProductDetails,
});

function BulkProductDetails() {
  const params = Route.useParams() as { productId: string };
  const productId = params.productId;
  const product = b2bProducts.find(p => p.id === productId) || b2bProducts[0]!;
  const [qty, setQty] = useState(product.minBulkQty);

  const getCurrentTierPrice = () => {
    const tier = product.priceTiers.slice().reverse().find(t => {
      if (t.max === 'plus') return qty >= t.min;
      return qty >= t.min && qty <= t.max;
    });
    return tier ? tier.price : product.priceTiers[0]!.price;
  };

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button className="p-2 hover:bg-slate-50 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Product Details</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
              <img src={product.image} className="w-full h-full object-cover" />
            </div>
            
            <div className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-[#16803A]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality Assurance</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{product.qualityInfo}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                  <MapPin className="w-6 h-6 text-[#16803A]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source / Farmer</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{product.farmer.name} • {product.farmer.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="bg-very-light-green text-[#16803A] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-[#16803A]/10">Bulk Inventory</span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mt-4 uppercase">{product.name}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">{product.description}</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Pricing Tiers</p>
                <div className="grid grid-cols-3 gap-4">
                  {product.priceTiers.map((tier, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border transition-all ${qty >= tier.min && (tier.max === 'plus' || qty <= (tier.max as number)) ? 'bg-[#16803A] text-white border-[#16803A] shadow-lg shadow-[#16803A]/20' : 'bg-slate-50 text-slate-900 border-slate-200'}`}>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-80">{tier.min}{tier.max === 'plus' ? '+' : `–${tier.max}`} {product.unit}</p>
                      <p className="text-lg font-black mt-1">₹{tier.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Quantity ({product.unit})</p>
                  <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-fit">
                    <button onClick={() => setQty(q => Math.max(product.minBulkQty, q - 50))} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl font-black text-slate-900 hover:bg-slate-50 transition-all">-</button>
                    <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-20 bg-transparent text-center font-black text-slate-900 outline-none" />
                    <button onClick={() => setQty(q => q + 50)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl font-black text-slate-900 hover:bg-slate-50 transition-all">+</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Bulk Total</p>
                  <p className="text-3xl font-black text-[#16803A] tracking-tighter">₹{(qty * getCurrentTierPrice()).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="w-full py-5 bg-[#16803A] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all flex items-center justify-center space-x-3">
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Bulk Cart</span>
              </button>
              <button className="w-full py-5 bg-white text-[#16803A] border border-[#16803A] font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-[#F5FBF7] transition-all flex items-center justify-center space-x-3">
                <MessageSquare className="w-4 h-4" />
                <span>Request Quote</span>
              </button>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex items-center space-x-4">
              <Truck className="w-6 h-6 text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Logistics</p>
                <p className="text-xs font-bold text-slate-900 uppercase">24–48 Hours Delivery to your business location</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}
