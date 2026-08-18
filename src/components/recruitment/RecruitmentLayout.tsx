import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, CheckCircle2, UserPlus, Settings, Bell, MessageSquare, ChevronLeft } from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export default function RecruitmentLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navItems = [
    { name: "Dashboard", path: "/recruitment/dashboard", icon: LayoutDashboard },
    { name: "Applications", path: "/recruitment/applications", icon: FileText },
    { name: "Hotels / Businesses", path: "/recruitment/applications", icon: FileText },
    { name: "Drivers", path: "/recruitment/applications", icon: FileText },
    { name: "Vehicle Partners", path: "/recruitment/applications", icon: FileText },
    { name: "Employees", path: "/recruitment/applications", icon: FileText },
    { name: "Verification", path: "/recruitment/verification", icon: CheckCircle2 },
    { name: "Approvals", path: "/recruitment/applications", icon: CheckCircle2 },
    { name: "Account Creation", path: "/recruitment/accounts", icon: UserPlus },
    { name: "Directory", path: "/recruitment/directory", icon: Users },
    { name: "Onboarding", path: "/recruitment/onboarding", icon: FileText },
    { name: "Analytics", path: "/recruitment/analytics", icon: LayoutDashboard },
    { name: "Notifications", path: "/recruitment/dashboard", icon: Bell },
    { name: "MARUTHAM AI", path: "/recruitment/ai", icon: MessageSquare },
    { name: "Settings", path: "/recruitment/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF7] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#DCE8DF] flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-[#DCE8DF]">
          <Link to="/portal-select" className="flex items-center text-[#16803A] mb-4 hover:underline text-xs font-bold uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Portals
          </Link>
          <img src={logoAsset.url} alt="Logo" className="w-12 h-12 object-contain mix-blend-multiply" />
          <h1 className="text-sm font-black text-[#16803A] mt-2">MARUTHAM KART</h1>
          <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest">Recruitment Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link 
              key={item.name + item.path} 
              to={item.path as any} 
              className={`flex items-center p-3 rounded-lg font-bold text-sm transition-colors ${
                location.pathname === item.path 
                  ? 'bg-[#16803A] text-white shadow-sm' 
                  : 'text-secondary-text hover:bg-[#F5FBF7] hover:text-[#16803A]'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${location.pathname === item.path ? 'text-white' : ''}`} />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white p-4 border-b border-[#DCE8DF] flex justify-between items-center">
          <h2 className="font-black text-primary-text">Recruitment & Account Management</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-secondary-text hover:text-[#16803A]"><Bell className="w-5 h-5" /></button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-primary-text">Sundar C</p>
              <p className="text-[10px] text-secondary-text uppercase">Recruitment Officer</p>
            </div>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
