import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  ListOrdered, 
  Home, 
  Truck, 
  ClipboardCheck, 
  Map, 
  Navigation, 
  Users, 
  Clock, 
  History, 
  BarChart3, 
  AlertCircle, 
  Bot, 
  Settings,
  ArrowLeft,
  Wrench
} from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link
    to={to as any}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-[#16803A] text-white shadow-md shadow-[#16803A]/20" 
        : "text-slate-600 hover:bg-[#EAF7EE] hover:text-[#16803A]"
    }`}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </Link>
);

export const TransportSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const menuItems = [
    { to: "/transport/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/transport/queue", icon: ListOrdered, label: "Delivery Queue" },
    { to: "/transport/home-delivery", icon: Home, label: "Home Delivery" },
    { to: "/transport/bulk-logistics", icon: Truck, label: "Bulk Logistics" },
    { to: "/transport/assignments", icon: ClipboardCheck, label: "Assignments" },
    { to: "/transport/tracking", icon: Map, label: "Live Tracking" },
    { to: "/transport/routes", icon: Navigation, label: "Routes" },
    { to: "/transport/vehicles", icon: Truck, label: "Vehicles" },
    { to: "/transport/drivers", icon: Users, label: "Drivers" },
    { to: "/transport/maintenance", icon: Wrench, label: "Maintenance" },
    { to: "/transport/employees", icon: Users, label: "Employees" },
    { to: "/transport/shifts", icon: Clock, label: "Shifts" },
    { to: "/transport/history", icon: History, label: "Delivery History" },
    { to: "/transport/reports", icon: BarChart3, label: "Reports" },
    { to: "/transport/alerts", icon: AlertCircle, label: "Alerts" },
    { to: "/transport/ai", icon: Bot, label: "MARUTHAM AI" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-[#DCE8DF] sticky top-0 overflow-hidden">
      <div className="p-6 border-b border-[#DCE8DF] flex flex-col items-center">
        <img src={logoAsset.url} alt="Marutham Kart" className="h-12 w-auto object-contain mix-blend-multiply mb-2" />
        <div className="text-center">
          <h2 className="text-[#16803A] font-black text-xs uppercase tracking-[0.2em]">Transport Control</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => (
          <SidebarItem 
            key={item.to} 
            to={item.to} 
            icon={item.icon} 
            label={item.label} 
            active={path === item.to}
          />
        ))}
      </div>

      <div className="p-4 border-t border-[#DCE8DF]">
        <Link 
          to="/portal-select"
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Customer</span>
        </Link>
        <div className="mt-4 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#16803A] font-bold text-xs border border-[#16803A]/20">
              TR
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-[#17231A] truncate">Ranjith R</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Transport Officer</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
