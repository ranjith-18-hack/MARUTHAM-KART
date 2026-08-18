import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  BarChart3, 
  ShieldCheck, 
  History, 
  Settings, 
  Bell, 
  ChevronLeft,
  Building,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export default function OfficeLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navItems = [
    { name: "Finance Dashboard", path: "/office/dashboard", icon: LayoutDashboard },
    { name: "Department Reports", path: "/office/reports", icon: FileSpreadsheet },
    { name: "Reconciliation Hub", path: "/office/reconciliation", icon: AlertCircle },
    { name: "Compliance & Audit", path: "/office/audit", icon: ShieldCheck },
    { name: "Org Structure", path: "/office/dashboard", icon: Building },
    { name: "Finance Settings", path: "/office/dashboard", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 flex flex-col hidden lg:flex border-r border-slate-800">
        <div className="p-8 border-b border-slate-800">
          <Link to="/portal-select" className="flex items-center text-slate-400 mb-6 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Exit to Portals
          </Link>
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
            <div>
              <h1 className="text-sm font-black text-white tracking-tighter">MARUTHAM KART</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Head Office Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <Link 
              key={item.name + item.path} 
              to={item.path as any} 
              className={`flex items-center p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                location.pathname === item.path 
                  ? 'bg-[#16803A] text-white shadow-lg shadow-green-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-4 ${location.pathname === item.path ? 'text-white' : ''}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fiscal Year 2026-27</p>
            <p className="text-xs font-bold text-white">Q2 Performance: <span className="text-green-500">+12.4%</span></p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="lg:hidden p-2 text-slate-400"><ChevronLeft /></div>
             <div>
                <h2 className="font-black text-slate-900 text-lg tracking-tighter uppercase">Finance & Audit Command Center</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coimbatore Headquarters • Live Data</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
               <Bell className="w-5 h-5 text-slate-400 hover:text-slate-900 cursor-pointer" />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">Arjun V</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Chief Financial Officer</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#16803A] flex items-center justify-center text-white font-black text-xs">
                AV
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
