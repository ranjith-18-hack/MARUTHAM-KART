import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Tractor, Building2, ChevronRight, ArrowLeft, Warehouse, Truck, Users, Briefcase } from "lucide-react";

export const Route = createFileRoute("/portal-select")({
  head: () => ({
    meta: [
      { title: "Choose Your Ecosystem Portal | MARUTHAM KART" },
      { name: "description", content: "Select between Customer, Farmer, Godown, Driver, or Business portals." },
    ],
  }),
  component: PortalSelectPage,
});

function PortalSelectPage() {
  const portals = [
    {
      id: "customer",
      title: "Customer Marketplace",
      description: "Shop fresh agricultural produce directly from Tamil Nadu farms.",
      icon: ShoppingBag,
      path: "/home",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-600 text-white",
    },
    {
      id: "farmer",
      title: "Farmer Direct Portal",
      description: "Register harvest produce, manage farm batches, orders, and earnings.",
      icon: Tractor,
      path: "/farmer/dashboard",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-600 text-white",
    },
    {
      id: "godown",
      title: "Godown & Cold-Storage",
      description: "Manage regional inventory, batch grading, picking, and packing.",
      icon: Warehouse,
      path: "/godown",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-700 text-white",
    },
    {
      id: "transport",
      title: "Transport Fleet Hub",
      description: "Manage delivery vehicles, driver assignments, and routes.",
      icon: Truck,
      path: "/transport",
      color: "bg-teal-50 text-teal-700 border-teal-200",
      iconBg: "bg-teal-700 text-white",
    },
    {
      id: "driver",
      title: "Driver Partner App",
      description: "Real-time delivery queues, navigation, and OTP verification.",
      icon: Truck,
      path: "/driver",
      color: "bg-sky-50 text-sky-700 border-sky-200",
      iconBg: "bg-sky-600 text-white",
    },
    {
      id: "business",
      title: "Business & Hotel B2B",
      description: "Bulk recurring procurement for commercial kitchens and institutions.",
      icon: Building2,
      path: "/business/dashboard",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      iconBg: "bg-purple-600 text-white",
    },
    {
      id: "recruitment",
      title: "Recruitment & Staffing",
      description: "Manage driver and personnel applications, verification, and KYC.",
      icon: Users,
      path: "/recruitment",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "bg-rose-600 text-white",
    },
    {
      id: "office",
      title: "Office & Central Ledger",
      description: "Audit compliance, financial reconciliation, and ledger reporting.",
      icon: Briefcase,
      path: "/office/dashboard",
      color: "bg-slate-50 text-slate-700 border-slate-200",
      iconBg: "bg-slate-700 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-800 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
          <img
            src="/logo.png"
            alt="MARUTHAM KART"
            className="w-16 h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/favicon.png";
            }}
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              MARUTHAM KART Ecosystem
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-1">
              Select your role or department to access the specialized management portal.
            </p>
          </div>
        </div>

        {/* Portal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map((p) => (
            <Link
              key={p.id}
              to={p.path}
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-950/5 transition-all flex items-start gap-4 group"
            >
              <div className={`p-3 rounded-2xl ${p.iconBg} shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                <p.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-900 group-hover:text-emerald-800 text-sm transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 font-medium py-4">
        MARUTHAM KART Agri-Tech Ecosystem • Tamil Nadu, India
      </footer>
    </div>
  );
}
