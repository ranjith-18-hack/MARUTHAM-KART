import { LayoutDashboard, Package, ShoppingBag, PieChart, User, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

export const FarmerBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/farmer/dashboard" },
    { label: "Products", icon: Package, path: "/farmer/products" },
    { label: "Orders", icon: ShoppingBag, path: "/farmer/orders" },
    { label: "Earnings", icon: PieChart, path: "/farmer/earnings" },
    { label: "Profile", icon: User, path: "/farmer/profile" },
    { label: "Customer", icon: ArrowLeft, path: "/home" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-color p-3 flex justify-around items-center md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex flex-col items-center transition-colors ${isActive ? 'text-primary-green' : 'text-secondary-text'}`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-very-light-green' : ''}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
