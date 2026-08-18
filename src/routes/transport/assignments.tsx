import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { ClipboardCheck, Truck, User, RefreshCw, Loader2, Send, CheckCircle2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { transportApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/transport/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const [queueRes, driverRes, vehicleRes, logRes] = await Promise.allSettled([
        transportApi.getQueue(),
        transportApi.getDrivers({ is_available: true }),
        transportApi.getVehicles({ status: "Available" }),
        transportApi.getLogs({ limit: 15 }),
      ]);

      if (queueRes.status === "fulfilled" && Array.isArray(queueRes.value)) setQueue(queueRes.value);
      if (driverRes.status === "fulfilled" && Array.isArray(driverRes.value)) setDrivers(driverRes.value);
      if (vehicleRes.status === "fulfilled" && Array.isArray(vehicleRes.value)) setVehicles(vehicleRes.value);
      if (logRes.status === "fulfilled" && Array.isArray(logRes.value)) setLogs(logRes.value);
    } catch (err) {
      console.warn("Failed to load transport resources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAutoAllocate = async (orderId: string) => {
    try {
      setProcessingId(orderId);
      const res = await transportApi.autoAllocate(orderId);
      toast.success(res?.message || "Auto-allocated vehicle & driver successfully!");
      fetchResources();
    } catch (err: any) {
      toast.error(err?.message || "Auto-allocation failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDispatch = async (orderId: string) => {
    try {
      setProcessingId(orderId);
      await transportApi.dispatchOrder(orderId);
      toast.success(`Order #${orderId.slice(0, 8)} dispatched out for delivery!`);
      fetchResources();
    } catch (err: any) {
      toast.error(err?.message || "Failed to dispatch order");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingAssignments = queue.filter(q => q.status === "Ready for Dispatch");

  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Fleet Deployment & Auto-Allocation</h1>
            <p className="text-slate-500 font-bold text-sm">Coordinate driver & vehicle pairings using intelligent weight routing</p>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 border border-green-100 p-3.5 rounded-2xl shadow-sm">
            <RefreshCw className="w-4 h-4 text-[#16803A]" />
            <span className="text-xs font-black text-[#16803A] uppercase tracking-widest">Auto-Allocation Algorithm Active</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading fleet allocations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Pending Assignment Queue */}
            <div className="space-y-8">
              <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#17231A]">Awaiting Vehicle & Driver Assignment</h3>
                  <span className="text-xs font-black text-primary-green uppercase px-3 py-1 bg-very-light-green rounded-full">
                    {pendingAssignments.length} Pending
                  </span>
                </div>

                <div className="space-y-4">
                  {pendingAssignments.map(order => {
                    const orderId = order.order_id || order.id;
                    const isProcessing = processingId === orderId;

                    return (
                      <div key={orderId} className="p-6 bg-[#F8FAFB] border border-[#DCE8DF] rounded-[2rem] hover:border-[#16803A]/30 transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                              {order.delivery_type || "Customer Delivery"}
                            </span>
                            <h4 className="font-mono text-sm font-black text-[#17231A]">#{orderId.slice(0, 8).toUpperCase()}</h4>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">₹{Number(order.total_amount || 0).toFixed(2)}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                            <p className="text-xs font-bold text-slate-600 truncate max-w-[240px]">{order.delivery_address || "Tamil Nadu"}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              disabled={isProcessing}
                              onClick={() => handleAutoAllocate(orderId)}
                              className="flex items-center space-x-2 px-5 py-2.5 bg-[#16803A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#11662d] transition-all shadow-md shadow-green-900/10 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                              <span>{isProcessing ? "Allocating..." : "Auto Allocate"}</span>
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => handleDispatch(orderId)}
                              className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {pendingAssignments.length === 0 && (
                    <div className="py-16 text-center">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-[#16803A] opacity-60" />
                      <p className="text-xs font-black uppercase tracking-widest text-[#17231A]">All Ready Orders Assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Audit Log */}
              <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-xl font-black text-[#17231A] mb-6">Transport Audit Trail</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono font-bold text-primary-green">#{log.order_id?.slice(0, 8).toUpperCase() || log.id?.slice(0, 8)}</span>
                        <span className="font-black text-slate-400">{log.action || "ASSIGNED"}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{log.notes || "Vehicle and driver paired for transport dispatch"}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-secondary-text text-center py-6">No recent transport logs.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resources Monitor */}
            <div className="space-y-8">
              <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#17231A]">Available Resources</h3>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase">{drivers.length} Drivers</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{vehicles.length} Vehicles</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-[#DCE8DF] pb-2">Active Drivers</h4>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {drivers.map(d => (
                        <div key={d.id} className="flex items-center space-x-3 p-3 bg-white border border-[#DCE8DF] rounded-2xl">
                          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#17231A]">{d.name || d.user_name || "Verified Driver"}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{d.license_number || d.id?.slice(0, 6)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-[#DCE8DF] pb-2">Available Fleet</h4>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {vehicles.map(v => (
                        <div key={v.id} className="flex items-center space-x-3 p-3 bg-white border border-[#DCE8DF] rounded-2xl">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#17231A]">{v.vehicle_number || v.number}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{v.type} ({v.capacity_kg}kg)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TransportLayout>
  );
}