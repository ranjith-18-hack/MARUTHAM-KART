import { LayoutDashboard, ShoppingBag, ClipboardList, PieChart, User, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

export const BusinessBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/business/dashboard" },
    { label: "Catalog", icon: ShoppingBag, path: "/business/catalog" },
    { label: "Orders", icon: ClipboardList, path: "/business/orders" },
    { label: "Analytics", icon: PieChart, path: "/business/analytics" },
    { label: "Account", icon: User, path: "/business/profile" },
    { label: "Customer", icon: ArrowLeft, path: "/home" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex flex-col items-center transition-colors ${isActive ? 'text-[#16803A]' : 'text-slate-400'}`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#F5FBF7]' : ''}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
