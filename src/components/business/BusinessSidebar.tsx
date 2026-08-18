import { LayoutDashboard, ShoppingBag, ClipboardList, PieChart, User, Bell, HelpCircle, MessageSquare, Settings, Truck, Repeat, FileText, CreditCard, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const BusinessSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/business/dashboard" },
    { label: "Bulk Catalog", icon: ShoppingBag, path: "/business/catalog" },
    { label: "My Orders", icon: ClipboardList, path: "/business/orders" },
    { label: "Recurring Orders", icon: Repeat, path: "/business/recurring" },
    { label: "Quotes", icon: MessageSquare, path: "/business/quotes" },
  ];

  const financialItems = [
    { label: "Invoices", icon: FileText, path: "/business/invoices" },
    { label: "Payments", icon: CreditCard, path: "/business/payments" },
    { label: "Analytics", icon: PieChart, path: "/business/analytics" },
  ];

  const secondaryItems = [
    { label: "MARUTHAM AI", icon: MessageSquare, path: "/business/ai" },
    { label: "Business Profile", icon: User, path: "/business/profile" },
    { label: "Settings", icon: Settings, path: "/business/settings" },
    { label: "Back to Customer", icon: ArrowLeft, path: "/home" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 hidden md:flex flex-col z-50">
      <div className="p-6 flex items-center space-x-3">
        <img src={logoAsset.url} alt="Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
        <div className="flex flex-col">
          <span className="font-black text-[#16803A] tracking-tighter text-lg leading-none">MARUTHAM KART</span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Business Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">Procurement</div>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-8 mb-4 px-3">Finance</div>
        {financialItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-8 mb-4 px-3">System</div>
        {secondaryItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#16803A] rounded-full flex items-center justify-center text-white text-xs font-black">GH</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate">Grand Hyatt</p>
            <p className="text-[10px] text-[#16803A] font-bold uppercase tracking-wider">✓ Verified</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
