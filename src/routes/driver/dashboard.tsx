import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  Truck, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Package, 
  ChevronRight, 
  Calendar, 
  Bell,
  Loader2,
  Send
} from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/driver/dashboard")({
  component: DriverDashboard,
});

function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      driverApi.getDashboard(),
      driverApi.getDeliveries(),
    ]).then(([dashRes, delRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (delRes.status === "fulfilled" && Array.isArray(delRes.value)) setDeliveries(delRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const activeDeliveries = deliveries.filter(d => d.status !== "Delivered");
  const completedDeliveries = deliveries.filter(d => d.status === "Delivered");

  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24">
      {/* Header */}
      <header className="bg-white p-6 border-b border-[#DCE8DF] sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img src={logoAsset.url} alt="Logo" className="w-10 h-10 object-contain mix-blend-multiply mr-3" />
            <div>
              <span className="font-black text-[#16803A] text-lg leading-none block">MARUTHAM KART</span>
              <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Driver Companion</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-primary-green rounded-full text-[10px] font-black uppercase">
              On Duty
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-xs text-secondary-text font-bold">Driver Console</p>
            <h2 className="text-2xl font-black text-primary-text">{user?.name || "Assigned Driver"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-green-100 text-[#16803A] text-[9px] font-black px-2.5 py-0.5 rounded-full border border-green-200 uppercase tracking-tighter">
                {dashboard?.vehicle_number || "TN-38-MK-2026"}
              </div>
              <span className="text-[10px] font-bold text-secondary-text">{dashboard?.vehicle_type || "Delivery Fleet"}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-[#16803A] gap-1 mb-1 justify-end">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">{today}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading assigned trips...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8DF] shadow-sm">
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Active Deliveries</p>
                <p className="text-2xl font-black text-primary-green mt-1">{activeDeliveries.length}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8DF] shadow-sm">
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Completed Today</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{completedDeliveries.length}</p>
              </div>
            </div>

            {/* Active Deliveries List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-secondary-text uppercase tracking-widest px-1">Assigned Route Stops</h3>
              
              {activeDeliveries.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-[#DCE8DF] text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-primary-green mx-auto" />
                  <h4 className="text-sm font-black text-primary-text uppercase">No Pending Trips</h4>
                  <p className="text-xs text-secondary-text">All assigned deliveries for your shift are completed.</p>
                </div>
              ) : (
                activeDeliveries.map((delivery) => (
                  <Link
                    key={delivery.delivery_id || delivery.id}
                    to="/driver/deliveries/$orderId"
                    params={{ orderId: delivery.order_id || delivery.id }}
                    className="block p-5 bg-white rounded-3xl border border-[#DCE8DF] shadow-sm hover:border-primary-green transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-very-light-green text-primary-green flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-black text-primary-text">#{(delivery.order_id || delivery.id)?.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-secondary-text">{delivery.customer_name || "Customer Drop-off"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {delivery.status}
                      </span>
                    </div>

                    <div className="flex items-center text-xs font-bold text-slate-600">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-primary-green flex-shrink-0" />
                      <span className="truncate">{delivery.delivery_address || "Tamil Nadu"}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                      <span className="font-bold text-secondary-text">Total Amount: ₹{Number(delivery.total_amount || 0).toFixed(2)}</span>
                      <span className="font-black text-primary-green flex items-center gap-1">
                        Open Delivery Pass <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
