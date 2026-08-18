import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  Package, 
  Layers, 
  Clock, 
  Crosshair, 
  ArrowUpCircle, 
  MapPin, 
  Thermometer, 
  Users, 
  ClipboardList, 
  BarChart3, 
  AlertTriangle, 
  MessageSquare, 
  Settings,
  ArrowLeft,
  Truck
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const GodownSidebar = () => {
  const location = useLocation();
  
  const mainNav = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/godown/dashboard" },
    { label: "Products", icon: Package, path: "/godown/products" },
    { label: "Inbound Stock", icon: ArrowDownCircle, path: "/godown/inbound" },
    { label: "Inventory", icon: Layers, path: "/godown/inventory" },
    { label: "Batch Management", icon: Layers, path: "/godown/batches" },
    { label: "Expiry Monitor", icon: Clock, path: "/godown/expiry" },

    { label: "Stock Allocation", icon: Crosshair, path: "/godown/allocation" },
    { label: "Outbound Orders", icon: ArrowUpCircle, path: "/godown/outbound" },
  ];


  const warehouseNav = [
    { label: "Stock History", icon: ClipboardList, path: "/godown/products/history" },
    { label: "Storage Locations", icon: MapPin, path: "/godown/locations" },
    { label: "Cold Storage", icon: Thermometer, path: "/godown/cold-storage" },
    { label: "Employees", icon: Users, path: "/godown/employees" },
    { label: "Dispatch Management", icon: Truck, path: "/godown/outbound" },
    { label: "Activity Log", icon: ClipboardList, path: "/godown/tasks" },
    { label: "Reports", icon: BarChart3, path: "/godown/reports" },
  ];


  const systemNav = [
    { label: "Alerts", icon: AlertTriangle, path: "/godown/alerts" },
    { label: "MARUTHAM AI", icon: MessageSquare, path: "/godown/ai" },
    { label: "Settings", icon: Settings, path: "/godown/settings" },
    { label: "Back to Customer", icon: ArrowLeft, path: "/home" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border-color h-screen sticky top-0 hidden md:flex flex-col z-50">
      <div className="p-6 flex items-center space-x-3">
        <img src={logoAsset.url} alt="Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
        <div className="flex flex-col">
          <span className="font-black text-[#16803A] tracking-tighter text-lg leading-none">MARUTHAM KART</span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Warehouse Management</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">Operations</div>
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path as any}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-xs font-bold">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 mb-4 px-3">Facility</div>
        {warehouseNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path as any}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-xs font-bold">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 mb-4 px-3">System</div>
        {systemNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path as any}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#16803A]'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-xs font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-[#F5FBF7] p-3 rounded-xl border border-[#DCE8DF] flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#16803A] rounded-full flex items-center justify-center text-white text-[10px] font-black">PR</div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">Prakash Raj</p>
            <p className="text-[8px] text-[#16803A] font-black uppercase tracking-widest mt-0.5">Godown Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
