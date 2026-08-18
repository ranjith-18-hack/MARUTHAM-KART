import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Truck, Navigation, ChevronRight, Package, Home } from "lucide-react";

export const Route = createFileRoute("/transport/more")({
  component: TransportMorePage,
});

function TransportMorePage() {
  const menuItems = [
    { label: "Home Delivery", icon: Home, path: "/transport/home-delivery" },
    { label: "Bulk Logistics", icon: Truck, path: "/transport/bulk-logistics" },
    { label: "Routes", icon: Navigation, path: "/transport/routes" },
    { label: "Maintenance", icon: Wrench, path: "/transport/maintenance" },
    { label: "Employees", icon: Users, path: "/transport/employees" },
    { label: "Shifts", icon: Clock, path: "/transport/shifts" },
    { label: "History", icon: History, path: "/transport/history" },
    { label: "Reports", icon: BarChart3, path: "/transport/reports" },
    { label: "Alerts", icon: AlertCircle, path: "/transport/alerts" },
    { label: "MARUTHAM AI", icon: Bot, path: "/transport/ai" },
  ];

  return (
    <TransportLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-[#17231A]">More Services</h1>
        
        <div className="grid grid-cols-1 gap-3">
          {menuItems.map((item, i) => (
            <a 
              key={i} 
              href={item.path}
              className="flex items-center justify-between p-5 bg-white border border-[#DCE8DF] rounded-2xl hover:bg-[#F8FAFB] transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#EAF7EE] rounded-xl flex items-center justify-center text-[#16803A]">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-[#17231A] text-sm uppercase tracking-tight">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </a>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}

import { Wrench, Users, Clock, History, BarChart3, AlertCircle, Bot } from "lucide-react";
