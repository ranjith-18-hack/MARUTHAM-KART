import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ListOrdered, Truck, Map, MoreHorizontal } from "lucide-react";

export const TransportBottomNav = () => {
  const navItems = [
    { to: "/transport/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/transport/queue", icon: ListOrdered, label: "Deliveries" },
    { to: "/transport/tracking", icon: Map, label: "Tracking" },
    { to: "/transport/vehicles", icon: Truck, label: "Vehicles" },
    { to: "/transport/more", icon: MoreHorizontal, label: "More" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DCE8DF] z-50 px-2 py-2">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to as any}
            className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-[#16803A] active:text-[#16803A]"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-black mt-1 uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
