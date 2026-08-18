import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { ArrowLeft, CheckCircle, Package, Truck, Clock } from "lucide-react";
import { farmerOrders } from "@/data/mockData";

export const Route = createFileRoute("/farmer/orders/$orderId")({
  component: OrderDetails,
});

function OrderDetails() {
  const params = Route.useParams() as { orderId: string };
  const orderId = params.orderId;
  const order = farmerOrders.find(o => o.id === orderId) || farmerOrders[0]!;

  const timeline = [
    { title: "Order Received", status: "completed" },
    { title: "Order Accepted", status: "completed" },
    { title: "Preparing", status: "current" },
    { title: "Ready for Pickup", status: "pending" },
    { title: "Picked Up", status: "pending" },
    { title: "Completed", status: "pending" },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button className="p-2 hover:bg-[#F5FBF7] rounded-xl"><ArrowLeft className="w-5 h-5 text-secondary-text" /></button>
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Order Details: {order.id}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Info Grid */}
        <div className="bg-white p-6 rounded-3xl border border-border-color shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Buyer Type', val: order.buyerType },
            { label: 'Order Date', val: order.date },
            { label: 'Total Value', val: order.value, highlight: true },
            { label: 'Expected Pickup', val: order.pickupDate },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">{item.label}</p>
              <p className={`text-sm font-black ${item.highlight ? 'text-primary-green' : 'text-primary-text'} mt-1`}>{item.val}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-3xl border border-border-color shadow-sm">
          <h3 className="text-[10px] font-black text-secondary-text uppercase tracking-[0.2em] mb-8">Fulfillment Timeline</h3>
          <div className="space-y-6">
            {timeline.map((t, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  t.status === 'completed' ? 'bg-primary-green text-white' : 
                  t.status === 'current' ? 'bg-[#16803A] text-white ring-4 ring-[#16803A]/20' : 
                  'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className={`text-xs font-black uppercase tracking-wider ${t.status === 'pending' ? 'text-secondary-text' : 'text-primary-text'}`}>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="py-4 bg-[#16803A] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#0B5428] transition-all">Mark as Ready</button>
          <button className="py-4 border border-border-color text-secondary-text font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-50 transition-all">View Pickup</button>
        </div>
      </main>
    </FarmerLayout>
  );
}
