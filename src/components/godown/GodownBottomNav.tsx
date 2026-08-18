import { LayoutDashboard, Package, ArrowUpCircle, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

export const GodownBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/godown/dashboard" },
    { label: "Inventory", icon: Package, path: "/godown/inventory" },
    { label: "Orders", icon: ArrowUpCircle, path: "/godown/outbound" },
    { label: "Alerts", icon: AlertTriangle, path: "/godown/alerts" },
    { label: "More", icon: MoreHorizontal, path: "/godown/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path as any} 
            className={`flex flex-col items-center transition-colors ${isActive ? 'text-[#16803A]' : 'text-slate-400'}`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#F5FBF7]' : ''}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className={`text-[9px] mt-1 ${isActive ? 'font-black uppercase tracking-tighter' : 'font-bold'}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
