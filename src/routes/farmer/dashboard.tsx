import { createFileRoute, Link } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { ShoppingBag, Package, ClipboardList, TrendingUp, Wallet, Plus, ChevronRight, Bell, Loader2 } from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { useEffect, useState } from "react";
import { farmerApi } from "@/lib/api";

export const Route = createFileRoute("/farmer/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard | Farmer Portal" }],
  }),
  component: FarmerDashboard,
});

function FarmerDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      farmerApi.getDashboard(),
      farmerApi.getProfile(),
    ]).then(([dashRes, profRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (profRes.status === "fulfilled") setProfile(profRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const farmerName = profile?.name || "Farmer Partner";
  const farmerCode = profile?.farmer_code || "MK-FRM";
  const isVerified = profile?.verified ?? true;

  const totalRevenue = Number(dashboard?.total_revenue || 0);
  const pendingPayouts = Number(dashboard?.pending_payouts || 0);
  const batchesCount = Number(dashboard?.batches_count || 0);
  const activePickups = Number(dashboard?.active_pickups || 0);

  const metrics = [
    { label: "Active Harvest Batches", value: String(batchesCount), icon: Package, color: "bg-[#16803A]" },
    { label: "Active Pickups", value: String(activePickups), icon: ShoppingBag, color: "bg-blue-500" },
    { label: "Farm Location", value: profile?.location || "Tamil Nadu", icon: ClipboardList, color: "bg-orange-500" },
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "bg-purple-500" },
    { label: "Pending Payouts", value: `₹${pendingPayouts.toLocaleString("en-IN")}`, icon: Wallet, color: "bg-red-500" },
  ];

  const actions = [
    { label: "Add Harvest Batch", icon: Plus, path: "/farmer/inventory", primary: true },
    { label: "Manage Inventory", icon: Package, path: "/farmer/inventory" },
    { label: "Request Pickup", icon: Bell, path: "/farmer/pickups" },
    { label: "View Earnings", icon: TrendingUp, path: "/farmer/earnings" },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoAsset.url} alt="Logo" className="w-8 h-8 object-contain mix-blend-multiply md:hidden" />
            <div>
              <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farmer Portal ({farmerCode})</p>
              <h1 className="text-xl font-black text-primary-text">{farmerName}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isVerified && (
              <span className="hidden md:inline-flex items-center px-3 py-1 bg-very-light-green text-primary-green text-[10px] font-black rounded-full uppercase tracking-widest border border-primary-green/20">
                ✓ Verified Farmer
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading farmer dashboard...</p>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {metrics.map((metric, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-border-color shadow-sm space-y-3">
                  <div className={`${metric.color} w-8 h-8 rounded-lg flex items-center justify-center text-white`}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">{metric.label}</p>
                    <p className="text-lg font-black text-primary-text">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <section className="space-y-4">
              <h2 className="text-sm font-black text-secondary-text uppercase tracking-[0.2em]">Farmer Operations</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map((action, i) => (
                  <Link
                    key={i}
                    to={action.path as any}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center space-y-2 ${
                      action.primary 
                        ? 'bg-[#16803A] border-[#16803A] text-white shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428]' 
                        : 'bg-white border-border-color text-primary-text hover:border-primary-green hover:text-primary-green'
                    }`}
                  >
                    <action.icon className={`w-6 h-6 ${action.primary ? 'text-white' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{action.label}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Supply Chain Journey */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-border-color shadow-sm text-center space-y-8">
              <div className="max-w-lg mx-auto space-y-2">
                <h2 className="text-xl font-black text-primary-text uppercase tracking-tighter">Your Supply Chain Pipeline</h2>
                <p className="text-sm text-secondary-text font-medium">From your field to Godown to Transport to Customer.</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                {[
                  { label: 'Harvest Batch', icon: '🌾', active: true },
                  { label: 'Farmgate Pickup', icon: '🚜', active: true },
                  { label: 'Godown Quality', icon: '🏪', active: true },
                  { label: 'Fleet Transport', icon: '🚚', active: true },
                  { label: 'Customer Table', icon: '🏠', active: true },
                ].map((node, i, arr) => (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 ${node.active ? 'bg-very-light-green border-primary-green shadow-lg shadow-primary-green/10' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                        {node.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${node.active ? 'text-primary-green' : 'text-gray-400'}`}>{node.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`mx-2 mb-6 hidden sm:block ${node.active ? 'text-primary-green' : 'text-gray-200'}`}>
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </FarmerLayout>
  );
}
