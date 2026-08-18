import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag, Tractor, Building2, ChevronRight, ArrowLeft, Warehouse, Truck, Users, Briefcase } from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const Route = createFileRoute("/portal-select")({
  head: () => ({
    meta: [
      { title: "Choose Your Portal | MARUTHAM KART" },
      { name: "description", content: "Select between Customer, Farmer, or Business portals." },
    ],
  }),
  component: PortalSelectPage,
});

function PortalSelectPage() {
  const portals = [
    {
      id: "customer",
      title: "Customer",
      description: "Shop fresh agricultural products for home.",
      icon: ShoppingBag,
      path: "/home",
      color: "bg-blue-50 text-blue-600",
      iconColor: "text-blue-600",
    },
    {
      id: "farmer",
      title: "Farmer",
      description: "Manage products, stock, orders and earnings.",
      icon: Tractor,
      path: "/farmer/dashboard",
      color: "bg-orange-50 text-orange-600",
      iconColor: "text-orange-600",
    },
    {
      id: "business",
      title: "Business / Hotel",
      description: "Purchase agricultural products in bulk.",
      icon: Building2,
      path: "/business/dashboard",
      color: "bg-purple-50 text-purple-600",
      iconColor: "text-purple-600",
    },
    {
      id: "godown",
      title: "Godown / Warehouse",
      description: "Manage storage, inventory, and fulfillment.",
      icon: Warehouse,
      path: "/godown",
      color: "bg-green-50 text-green-600",
      iconColor: "text-green-600",
    },
    {
      id: "transport",
      title: "Transport Control",
      description: "Manage fleet, drivers, and logistics.",
      icon: Truck,
      path: "/transport",
      color: "bg-emerald-50 text-emerald-600",
      iconColor: "text-emerald-600",
    },
    {
      id: "driver",
      title: "Driver Portal",
      description: "Manage deliveries, routes, and vehicle.",
      icon: Truck,
      path: "/driver",
      color: "bg-sky-50 text-sky-600",
      iconColor: "text-sky-600",
    },
    {
      id: "recruitment",
      title: "Recruitment Portal",
      description: "Manage applications, verification, and accounts.",
      icon: Users,
      path: "/recruitment",
      color: "bg-red-50 text-red-600",
      iconColor: "text-red-600",
    },
    {
      id: "office",
      title: "Office / Finance",
      description: "Centralized financial and activity ledger.",
      icon: Briefcase,
      path: "/office/dashboard",
      color: "bg-slate-50 text-slate-600",
      iconColor: "text-slate-600",
    },

  ];




  return (
    <div className="min-h-screen bg-[#F5FBF7] flex flex-col p-6">
      <div className="max-w-md mx-auto w-full pt-8 pb-12 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-10">
          <img src={logoAsset.url} alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain mix-blend-multiply" />
          <h1 className="text-2xl font-black text-[#16803A] tracking-tight">Choose Your Portal</h1>
          <p className="text-secondary-text text-sm mt-1">Select how you want to use MARUTHAM KART</p>
        </div>

        {/* Portals List */}
        <div className="space-y-4 flex-1">
          {portals.map((portal, i) => (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={portal.path as any}
                className="flex items-center p-5 bg-white border border-[#DCE8DF] rounded-2xl shadow-sm hover:shadow-md hover:border-[#16803A]/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl ${portal.color} flex items-center justify-center mr-4 shrink-0`}>
                  <portal.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-black text-primary-text">{portal.title}</h3>
                  <p className="text-secondary-text text-xs mt-0.5 leading-relaxed">{portal.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#16803A] group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>


        {/* Footer info */}
        <div className="mt-8 text-center">
          <Link to="/home" className="inline-flex items-center text-[#16803A] font-bold text-sm hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customer Home
          </Link>
        </div>
      </div>
      
      <div className="text-center pb-6">
        <p className="text-[10px] text-secondary-text font-black uppercase tracking-widest">
          MARUTHAM KART &copy; 2026
        </p>
      </div>
    </div>
  );
}
