import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { ArrowLeft, Package, Truck, MapPin, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/business/orders/$orderId")({
  head: () => ({
    meta: [{ title: "Bulk Order Tracking | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessOrderTracking,
});

function BusinessOrderTracking() {
  const params = Route.useParams() as { orderId: string };
  const orderId = params.orderId;
  
  const timeline = [
    { status: 'Order Placed', time: 'Aug 14, 10:30 AM', completed: true },
    { status: 'Order Confirmed', time: 'Aug 14, 11:15 AM', completed: true },
    { status: 'Inventory Allocated', time: 'Aug 14, 02:00 PM', completed: true },
    { status: 'Processing', time: 'Aug 14, 04:30 PM', completed: true },
    { status: 'Packed', time: 'In Progress', current: true },
    { status: 'Transport Assigned', time: 'Scheduled' },
    { status: 'Dispatched', time: 'Pending' },
    { status: 'Out for Delivery', time: 'Pending' },
    { status: 'Delivered', time: 'Pending' },
  ];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button className="p-2 hover:bg-slate-50 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Track Bulk Order {orderId}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="bg-[#16803A] p-8 rounded-[2.5rem] text-white space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Estimated Delivery</p>
              <h2 className="text-3xl font-black tracking-tighter mt-1">16 August, 09:00 AM</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Current Status</p>
              <p className="text-xl font-black mt-1 uppercase tracking-tighter">Packing in Progress</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/20">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Bulk Qty</p>
              <p className="font-black">500 kg</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Logistics</p>
              <p className="font-black">Eicher 14ft</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Transport ID</p>
              <p className="font-black">TRK-9921</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Dest</p>
              <p className="font-black">Chennai</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10">Procurement Timeline</h3>
          
          <div className="relative space-y-8">
            {timeline.map((step, i) => (
              <div key={i} className="flex items-start space-x-6 relative">
                {i !== timeline.length - 1 && (
                  <div className={`absolute left-[11px] top-[24px] w-[2px] h-[calc(100%+8px)] ${step.completed ? 'bg-[#16803A]' : 'bg-slate-100'}`}></div>
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step.completed ? 'bg-[#16803A] text-white' : step.current ? 'bg-white border-4 border-[#16803A]' : 'bg-slate-100'}`}>
                  {step.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-black uppercase tracking-widest ${step.completed || step.current ? 'text-slate-900' : 'text-slate-300'}`}>{step.status}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{step.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex items-start space-x-4">
          <MapPin className="w-6 h-6 text-[#16803A] flex-shrink-0" />
          <div>
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Delivery Address</h4>
            <p className="text-xs font-bold text-slate-500 uppercase mt-1 leading-relaxed">Grand Hyatt Chennai, 365, Anna Salai, Teynampet, Chennai, TN 600018</p>
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}
