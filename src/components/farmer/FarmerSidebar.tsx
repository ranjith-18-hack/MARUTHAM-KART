import { LayoutDashboard, Package, ShoppingBag, PieChart, User, Bell, HelpCircle, MessageSquare, Settings, Truck, ClipboardList, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const FarmerSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/farmer/dashboard" },
    { label: "Products", icon: Package, path: "/farmer/products" },
    { label: "Inventory", icon: ClipboardList, path: "/farmer/inventory" },
    { label: "Orders", icon: ShoppingBag, path: "/farmer/orders" },
    { label: "Pickup Schedule", icon: Truck, path: "/farmer/pickups" },
    { label: "Earnings", icon: PieChart, path: "/farmer/earnings" },
  ];

  const secondaryItems = [
    { label: "Notifications", icon: Bell, path: "/farmer/notifications" },
    { label: "MARUTHAM AI", icon: MessageSquare, path: "/farmer/ai" },
    { label: "Support", icon: HelpCircle, path: "/farmer/support" },
    { label: "Profile", icon: User, path: "/farmer/profile" },
    { label: "Settings", icon: Settings, path: "/farmer/settings" },
    { label: "Back to Customer", icon: ArrowLeft, path: "/home" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border-color h-screen sticky top-0 hidden md:flex flex-col">
      <div className="p-6 flex items-center space-x-3">
        <img src={logoAsset.url} alt="Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
        <span className="font-black text-[#16803A] tracking-tighter text-lg">MARUTHAM KART</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-black text-secondary-text/40 uppercase tracking-[0.2em] mb-4 px-3">Main Menu</div>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-secondary-text hover:bg-[#F5FBF7] hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-[10px] font-black text-secondary-text/40 uppercase tracking-[0.2em] mt-8 mb-4 px-3">System</div>
        {secondaryItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-secondary-text hover:bg-[#F5FBF7] hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-color">
        <div className="bg-[#F5FBF7] p-3 rounded-xl border border-[#DCE8DF] flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#16803A] rounded-full flex items-center justify-center text-white text-xs font-black">AK</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-primary-text truncate">Arun Kumar</p>
            <p className="text-[10px] text-primary-green font-bold">✓ Verified Farmer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
