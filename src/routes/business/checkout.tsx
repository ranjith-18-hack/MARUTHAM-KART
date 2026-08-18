import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Truck, Calendar, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/business/checkout")({
  head: () => ({
    meta: [{ title: "Bulk Checkout | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessCheckout,
});

function BusinessCheckout() {
  const [schedule, setSchedule] = useState('Immediate');

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter">Bulk Checkout</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-[#16803A]" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Delivery Scheduling</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSchedule('Immediate')}
                    className={`p-6 rounded-2xl border text-left transition-all ${schedule === 'Immediate' ? 'bg-[#F5FBF7] border-[#16803A]' : 'bg-white border-slate-200'}`}
                  >
                    <p className={`text-xs font-black uppercase tracking-widest ${schedule === 'Immediate' ? 'text-[#16803A]' : 'text-slate-400'}`}>Immediate</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Next Available Slot</p>
                  </button>
                  <button 
                    onClick={() => setSchedule('Scheduled')}
                    className={`p-6 rounded-2xl border text-left transition-all ${schedule === 'Scheduled' ? 'bg-[#F5FBF7] border-[#16803A]' : 'bg-white border-slate-200'}`}
                  >
                    <p className={`text-xs font-black uppercase tracking-widest ${schedule === 'Scheduled' ? 'text-[#16803A]' : 'text-slate-400'}`}>Scheduled</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Pick your preferred time</p>
                  </button>
                </div>

                {schedule === 'Scheduled' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Window</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                        <option>Morning (6 AM – 10 AM)</option>
                        <option>Afternoon (1 PM – 5 PM)</option>
                        <option>Evening (6 PM – 9 PM)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-[#16803A]" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Delivery Address</h3>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">Grand Hyatt Chennai</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">365, Anna Salai, Teynampet, Chennai, TN 600018</p>
                  </div>
                  <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline">Change</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Payment Summary</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Items</span>
                  <span className="text-xs font-black text-slate-900">700 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Value</span>
                  <span className="text-xs font-black text-slate-900">₹42,500</span>
                </div>
                <div className="flex justify-between text-[#16803A]">
                  <span className="text-xs font-bold uppercase tracking-wider">Bulk Discount</span>
                  <span className="text-xs font-black">-₹2,100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logistics (Est)</span>
                  <span className="text-xs font-black">₹2,500</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 uppercase">Grand Total</span>
                <span className="text-2xl font-black text-[#16803A] tracking-tighter">₹42,900</span>
              </div>

              <div className="space-y-4 pt-4">
                <button className="w-full py-5 bg-[#16803A] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all flex items-center justify-center space-x-3">
                  <CreditCard className="w-4 h-4" />
                  <span>Place Bulk Order</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                <span>Enterprise Grade Security</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
