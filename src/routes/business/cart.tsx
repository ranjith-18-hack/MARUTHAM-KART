import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { ShoppingCart, Trash2, ArrowRight, Truck, CreditCard } from "lucide-react";
import { b2bProducts } from "@/data/mockData";
import { useState } from "react";

export const Route = createFileRoute("/business/cart")({
  head: () => ({
    meta: [{ title: "Bulk Cart | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessCart,
});

function BusinessCart() {
  const [items, setItems] = useState([
    { ...b2bProducts[0]!, qty: 500 },
    { ...b2bProducts[1]!, qty: 200 },
  ]);

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      const tier = item.priceTiers.slice().reverse().find(t => {
        if (t.max === 'plus') return item.qty >= t.min;
        return item.qty >= t.min && item.qty <= t.max;
      });
      const price = tier ? tier.price : item.priceTiers[0]!.price;
      return acc + (item.qty * price);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const transport = 2500;
  const taxes = subtotal * 0.05;
  const total = subtotal + transport + taxes;

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter">Bulk Cart</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items Section */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <img src={item.image} className="w-24 h-24 rounded-2xl object-cover border border-slate-100" />
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-black text-slate-900 uppercase">{item.name}</h3>
                  <p className="text-[10px] font-black text-[#16803A] uppercase tracking-widest">Bulk Price Active</p>
                  <p className="text-xs font-bold text-slate-500 uppercase mt-1">Source: {item.farmer.name}</p>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity ({item.unit})</p>
                    <p className="text-lg font-black text-slate-900">{item.qty}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                    <p className="text-lg font-black text-slate-900">₹{(item.qty * item.priceTiers[item.priceTiers.length - 1]!.price).toLocaleString()}</p>
                  </div>
                  <button className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6 sticky top-28">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Bulk Order Summary</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Procurement Subtotal</span>
                  <span className="text-xs font-black text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Transport Estimate</span>
                  <span className="text-xs font-black text-slate-900">₹{transport.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">GST / Charges (5%)</span>
                  <span className="text-xs font-black text-slate-900">₹{taxes.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 uppercase">Grand Total</span>
                <span className="text-2xl font-black text-[#16803A] tracking-tighter">₹{total.toLocaleString()}</span>
              </div>

              <button className="w-full py-5 bg-[#16803A] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all flex items-center justify-center space-x-3 mt-4">
                <span>Proceed to Bulk Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}
