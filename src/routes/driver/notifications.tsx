import { createFileRoute } from "@tanstack/react-router";
import { 
    Bell, 
    ArrowLeft, 
    Truck, 
    Calendar, 
    Package, 
    AlertTriangle,
    MessageSquare
} from "lucide-react";

export const Route = createFileRoute("/driver/notifications")({
  component: DriverNotifications,
});

function DriverNotifications() {
  const notifications = [
    { id: 1, title: "New delivery assigned", time: "10 mins ago", type: "assignment", icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 2, title: "Pickup scheduled for 10:30 AM", time: "1 hour ago", type: "schedule", icon: Calendar, color: "text-[#16803A]", bg: "bg-green-50" },
    { id: 3, title: "Transport Officer sent instruction", time: "2 hours ago", type: "message", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
    { id: 4, title: "Vehicle service is due soon", time: "1 day ago", type: "alert", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF7]">
      <header className="bg-white p-6 border-b border-[#DCE8DF] flex items-center">
        <button className="mr-4 p-2 bg-[#F5FBF7] rounded-full"><ArrowLeft className="w-5 h-5 text-[#16803A]" /></button>
        <h2 className="font-black text-xl text-primary-text">Notifications</h2>
      </header>

      <main className="p-6 space-y-4">
        {notifications.map((n) => (
          <div key={n.id} className="bg-white p-5 rounded-2xl border border-[#DCE8DF] shadow-sm flex items-start group hover:border-[#16803A] transition-all">
            <div className={`w-12 h-12 rounded-xl ${n.bg} flex items-center justify-center mr-4 shrink-0`}>
              <n.icon className={`w-6 h-6 ${n.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-black text-primary-text text-sm leading-tight">{n.title}</h3>
                <span className="text-[10px] font-bold text-secondary-text ml-2 whitespace-nowrap">{n.time}</span>
              </div>
              <p className="text-xs text-secondary-text leading-relaxed">System notification regarding your current assignments and fleet status.</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
