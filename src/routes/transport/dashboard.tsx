import { createFileRoute, Link } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { FarmerFieldIllustration } from "@/components/illustrations/IllustrationLibrary";
import { 
  Truck, 
  Users, 
  AlertCircle, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  TrendingUp,
  Activity,
  ClipboardList,
  Clock,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { transportApi } from "@/lib/api";

export const Route = createFileRoute("/transport/dashboard")({
  component: TransportDashboardPage,
});

function StatCard({ label, value, subtext, icon: Icon, color, trend }: { 
  label: string; 
  value: string; 
  subtext?: string;
  icon: any; 
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-[#DCE8DF] shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.15em] mb-1">{label}</p>
        <h3 className="text-3xl font-black text-[#17231A] tracking-tighter">{value}</h3>
        {subtext && <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{subtext}</p>}
      </div>
    </div>
  );
}

function TransportDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      transportApi.getDashboard(),
      transportApi.getQueue(),
    ]).then(([dashRes, queueRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (queueRes.status === "fulfilled" && Array.isArray(queueRes.value)) setQueue(queueRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const totalDeliveries = dashboard?.total_deliveries ?? queue.length;
  const pendingAssignments = dashboard?.pending_assignments ?? queue.filter((q: any) => q.status === "Ready for Dispatch").length;
  const activeTrips = dashboard?.active_trips ?? queue.filter((q: any) => q.status === "On Route" || q.status === "Dispatched").length;
  const completedToday = dashboard?.completed_today ?? queue.filter((q: any) => q.status === "Delivered").length;
  const availableVehicles = dashboard?.available_vehicles ?? 12;
  const availableDrivers = dashboard?.available_drivers ?? 8;

  const stats = [
    { label: "Total Deliveries", value: String(totalDeliveries), icon: Package, color: "bg-blue-50 text-blue-600", trend: "Live Queue" },
    { label: "Pending Assignment", value: String(pendingAssignments), icon: ClipboardList, color: "bg-orange-50 text-orange-600", subtext: "Awaiting Fleet Allocation" },
    { label: "Active Trips", value: String(activeTrips), icon: Truck, color: "bg-purple-50 text-purple-600", subtext: "On Route / In Transit" },
    { label: "Completed Deliveries", value: String(completedToday), icon: CheckCircle2, color: "bg-green-50 text-green-600", trend: "Delivered" },
    { label: "Available Drivers", value: String(availableDrivers), icon: Users, color: "bg-orange-50 text-orange-600", subtext: "Ready for assignment" },
    { label: "Available Fleet", value: String(availableVehicles), icon: Truck, color: "bg-indigo-50 text-indigo-600", subtext: "Ready to load" },
  ];

  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Hero Section */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-border-color shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-12 h-12 bg-primary-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-green/20">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Logistics Command Center</h1>
                  <p className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">Live Fleet & Dispatch Control</p>
                </div>
              </div>
              <p className="text-secondary-text font-semibold">
                Intelligent vehicle allocation and dispatch monitoring connecting Godown facilities to destination drop-offs across Tamil Nadu.
              </p>
              <div className="flex items-center space-x-3 text-slate-500 font-bold text-sm">
                <span className="px-3 py-1 bg-very-light-green rounded-lg border border-border-color">Tamil Nadu Division</span>
                <span className="px-3 py-1 bg-very-light-green rounded-lg border border-border-color">Active Shift</span>
              </div>
            </div>
            <div className="w-full max-w-sm lg:max-w-md">
              <FarmerFieldIllustration className="w-full h-auto drop-shadow-xl" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </section>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link 
            to={"/transport/assignments" as any} 
            className="px-8 py-4 bg-[#16803A] text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-[#11662d] shadow-lg shadow-green-900/20 transition-all active:scale-95 text-center inline-block"
          >
            Manage Transport Queue & Assignments
          </Link>
        </div>

        {/* Top Summary Stats */}
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {stats.map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </div>
        )}

        {/* Operational Overview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#17231A]">Live Transport Queue</h3>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active deliveries in dispatch pipeline</p>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="py-12 text-center text-xs text-secondary-text font-bold">
                  No orders in transport queue. Orders marked Ready for Dispatch at Godown will appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#DCE8DF]">
                        <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                        <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                        <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver / Vehicle</th>
                        <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE8DF]">
                      {queue.slice(0, 10).map((delivery) => (
                        <tr key={delivery.order_id || delivery.id} className="group hover:bg-[#F8FAFB] transition-colors">
                          <td className="py-4">
                            <div className="font-mono font-black text-xs text-[#17231A]">#{(delivery.order_id || delivery.id)?.slice(0, 8).toUpperCase()}</div>
                            <div className="text-[10px] font-bold text-slate-400">Total: ₹{Number(delivery.total_amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center text-xs font-bold text-[#17231A]">
                              <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                              {delivery.delivery_address || delivery.destination || 'Coimbatore'}
                            </div>
                          </td>
                          <td className="py-4">
                            {delivery.driver_name ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[#17231A]">{delivery.driver_name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{delivery.vehicle_number}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-orange-500 uppercase italic">Awaiting Assignment</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                              {delivery.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#16803A] rounded-[2.5rem] p-8 shadow-xl shadow-green-900/20 text-white space-y-4">
              <h3 className="text-xl font-black">Transport Automation</h3>
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                The auto-allocation engine evaluates package weight, cargo capacity, driver availability, and route distances to assign vehicles in real-time with 0 manual errors.
              </p>
              <Link
                to={"/transport/assignments" as any}
                className="w-full mt-4 py-3.5 bg-white text-[#16803A] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Launch Auto-Allocator</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}