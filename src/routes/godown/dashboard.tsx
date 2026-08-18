import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { motion } from "framer-motion";
import { WarehouseIllustration } from "@/components/illustrations/IllustrationLibrary";
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Database, 
  Clock, 
  AlertCircle,
  Thermometer,
  Droplets,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { godownApi } from "@/lib/api";

export const Route = createFileRoute("/godown/dashboard")({
  head: () => ({
    meta: [
      { title: "Godown Dashboard | MARUTHAM KART" },
      { name: "description", content: "Overview of warehouse operations, stock levels, and capacity." },
    ],
  }),
  component: GodownDashboard,
});

function GodownDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      godownApi.getDashboard(),
      godownApi.getAlerts({ is_resolved: false }),
    ]).then(([dashRes, alertRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (alertRes.status === "fulfilled" && Array.isArray(alertRes.value)) setAlerts(alertRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const totalProducts = dashboard?.total_products ?? 0;
  const pendingOrders = dashboard?.pending_orders ?? 0;
  const pickingOrders = dashboard?.picking_orders ?? 0;
  const packingOrders = dashboard?.packing_orders ?? 0;
  const readyOrders = dashboard?.ready_for_dispatch_orders ?? 0;
  const unresolvedAlerts = dashboard?.unresolved_alerts ?? alerts.length;

  const stats = [
    { label: "Active Products", value: String(totalProducts), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Incoming Queue", value: `${pendingOrders} orders`, icon: ArrowDownCircle, color: "text-[#16803A]", bg: "bg-[#F5FBF7]" },
    { label: "Picking & Packing", value: `${pickingOrders + packingOrders} in-progress`, icon: ArrowUpCircle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Ready for Dispatch", value: `${readyOrders} orders`, icon: Database, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Low Stock Items", value: `${dashboard?.low_stock_products_count ?? 0} products`, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
    { label: "Unresolved Alerts", value: `${unresolvedAlerts} alerts`, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-8">
        {/* Hero Section with Illustration */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-border-color shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-lg">
              <h2 className="text-3xl font-black text-primary-text uppercase tracking-tight">Godown Command Center</h2>
              <p className="text-secondary-text font-semibold">
                Centralized inventory management for the Marutham Kart ecosystem. Monitoring stock, quality, and fulfillment in real-time.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-very-light-green border border-border-color rounded-xl">
                  <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest block">Facility</span>
                  <span className="text-sm font-black text-primary-green uppercase">{dashboard?.godown_name || "Coimbatore Central Godown"}</span>
                </div>
                <div className="px-4 py-2 bg-very-light-green border border-border-color rounded-xl">
                  <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest block">Location</span>
                  <span className="text-sm font-black text-primary-green uppercase">{dashboard?.godown_location || "Tamil Nadu"}</span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-sm lg:max-w-md">
              <WarehouseIllustration className="w-full h-auto drop-shadow-lg" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </section>

        {/* Header Stats */}
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-2xl border border-[#DCE8DF] shadow-sm"
              >
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-lg font-black text-primary-text mt-1">{stat.value}</h3>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Warehouse Zones */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-primary-text uppercase tracking-tight">Warehouse Storage Zones</h3>
                  <p className="text-xs text-secondary-text font-bold">Zone configuration and current storage utilization</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#16803A]">Healthy</span>
                  <span className="text-xs font-bold text-secondary-text ml-1 uppercase">Capacity</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'Zone A', name: 'Grain Silos', category: 'Grains & Rice', capacity: 10000, currentStock: 6800, temperature: '22°C', humidity: '45%' },
                  { id: 'Zone B', name: 'Flour Storage', category: 'Wheat & Flour', capacity: 5000, currentStock: 3200, temperature: '20°C', humidity: '40%' },
                  { id: 'Zone C', name: 'Cold Storage 01', category: 'Dairy & Milk', capacity: 2000, currentStock: 1400, temperature: '4°C', humidity: '85%' },
                  { id: 'Zone D', name: 'Fresh Produce', category: 'Vegetables & Fruits', capacity: 3000, currentStock: 1800, temperature: '8°C', humidity: '75%' },
                ].map((zone) => (
                  <div key={zone.id} className="p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-black text-primary-text text-sm uppercase tracking-tight">{zone.id} — {zone.name}</h4>
                        <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest">{zone.category}</p>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-[#DCE8DF] text-[#16803A]">
                        {Math.round((zone.currentStock / zone.capacity) * 100)}%
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-[#16803A]" 
                        style={{ width: `${(zone.currentStock / zone.capacity) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-secondary-text">
                      <span>Stock: {zone.currentStock} kg</span>
                      <span>Avail: {zone.capacity - zone.currentStock} kg</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#DCE8DF] flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Thermometer className="w-3 h-3 text-[#16803A]" />
                        <span className="text-[10px] font-black text-[#16803A]">{zone.temperature}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-black text-blue-500">{zone.humidity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm">
              <h3 className="text-lg font-black text-primary-text uppercase tracking-tight mb-6">Warehouse Alerts</h3>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-xs text-secondary-text font-medium py-6 text-center">No unresolved warehouse alerts. Operations normal.</p>
                ) : (
                  alerts.slice(0, 4).map((alert, i) => (
                    <div key={i} className="p-3 rounded-xl border flex gap-3 bg-amber-50 border-amber-100">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{alert.message || "Stock alert"}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{alert.alert_type || "Low Stock"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
