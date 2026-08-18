import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { Bell, ShoppingBag, Package, TrendingUp, CheckCircle2, Info, Clock } from "lucide-react";

export const Route = createFileRoute("/farmer/notifications")({
  head: () => ({
    meta: [{ title: "Notifications | Farmer Portal" }],
  }),
  component: FarmerNotifications,
});

function FarmerNotifications() {
  const notifications = [
    { 
      title: "New order received", 
      desc: "Order #ORD-1004 for 50kg Organic Wheat has been received.", 
      time: "2 mins ago", 
      icon: ShoppingBag, 
      color: "bg-blue-500",
      type: "Order"
    },
    { 
      title: "Stock Alert", 
      desc: "Your Premium Rice stock is running low (Current: 45kg).", 
      time: "1 hour ago", 
      icon: Package, 
      color: "bg-orange-500",
      type: "Inventory"
    },
    { 
      title: "Pickup scheduled", 
      desc: "Pickup for Order #ORD-1002 is scheduled for tomorrow at 10 AM.", 
      time: "3 hours ago", 
      icon: Clock, 
      color: "bg-purple-500",
      type: "Logistics"
    },
    { 
      title: "Payment completed", 
      desc: "Payment of ₹12,400 for June orders has been processed.", 
      time: "1 day ago", 
      icon: TrendingUp, 
      color: "bg-primary-green",
      type: "Financial"
    },
    { 
      title: "Product approved", 
      desc: "Your new 'Hybrid Country Tomatoes' listing is now live.", 
      time: "2 days ago", 
      icon: CheckCircle2, 
      color: "bg-primary-green",
      type: "System"
    },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Notifications</h1>
          <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline">Mark all as read</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        {notifications.map((n, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-border-color shadow-sm flex items-start space-x-4 hover:border-primary-green/30 transition-all cursor-pointer">
            <div className={`${n.color} w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-black/5`}>
              <n.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-black text-secondary-text uppercase tracking-[0.2em]">{n.type}</span>
                <span className="text-[8px] font-bold text-secondary-text/60 uppercase">{n.time}</span>
              </div>
              <h3 className="text-sm font-black text-primary-text mb-1">{n.title}</h3>
              <p className="text-xs font-medium text-secondary-text leading-relaxed">{n.desc}</p>
            </div>
          </div>
        ))}

        <div className="text-center pt-8">
          <button className="text-[10px] font-black text-secondary-text uppercase tracking-widest hover:text-primary-green transition-colors">
            View older notifications
          </button>
        </div>
      </main>
    </FarmerLayout>
  );
}
