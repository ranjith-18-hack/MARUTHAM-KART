import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { Crosshair, AlertCircle, CheckCircle2, Package, Loader2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { godownApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/godown/allocation")({
  head: () => ({
    meta: [
      { title: "Stock Allocation & Fulfillment | MARUTHAM KART" },
      { name: "description", content: "Allocate available stock to incoming customer and business orders." },
    ],
  }),
  component: StockAllocationPage,
});

function StockAllocationPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await godownApi.getOrders({ limit: 50 });
      if (res && res.items) {
        setOrders(res.items);
      }
    } catch (err) {
      console.warn("Failed to fetch godown orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePickOrder = async (order: any) => {
    try {
      setProcessingId(order.id);
      const pickItems = (order.order_items || []).map((item: any) => ({
        order_item_id: item.id,
        picked_qty: item.quantity,
        location: "Rack A1-Bin 3",
      }));
      await godownApi.pickOrder(order.id, pickItems);
      toast.success(`Order #${order.id.slice(0, 8)} items picked successfully!`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to pick order items");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePackOrder = async (orderId: string) => {
    try {
      setProcessingId(orderId);
      await godownApi.packOrder(orderId, 1, 5.0, "Secure eco-friendly packing");
      toast.success(`Order #${orderId.slice(0, 8)} packed successfully!`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to pack order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      setProcessingId(orderId);
      await godownApi.markReady(orderId);
      toast.success(`Order #${orderId.slice(0, 8)} marked Ready for Dispatch and handed to Transport Queue!`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark order ready");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Stock Allocation & Order Fulfillment</h1>
          <p className="text-sm text-secondary-text font-bold">Pick, pack, and mark orders ready for fleet dispatch</p>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading order queue...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#DCE8DF] rounded-3xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-primary-green mx-auto opacity-50" />
            <h3 className="text-base font-black text-primary-text uppercase">Order Queue Clear</h3>
            <p className="text-xs text-secondary-text max-w-sm mx-auto font-medium">All incoming customer orders have been processed and dispatched.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6">
                <h3 className="text-sm font-black text-primary-text uppercase tracking-tight mb-6">Orders In Fulfillment Queue</h3>
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = order.status;
                    const isProcessing = processingId === order.id;

                    return (
                      <div key={order.id} className="p-5 border border-[#DCE8DF] rounded-2xl bg-white hover:border-[#16803A]/30 transition-all shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono font-black text-[#16803A]">#{order.id.slice(0, 8).toUpperCase()}</span>
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase">
                                {status}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-primary-text uppercase tracking-tight">
                              {order.order_items && order.order_items.length > 0 
                                ? `${order.order_items[0].product_name || 'Farm Items'}${order.order_items.length > 1 ? ` + ${order.order_items.length - 1} more` : ''}` 
                                : 'Direct Farm Produce'}
                            </h4>
                            <div className="flex items-center space-x-4 text-[10px] font-bold text-secondary-text">
                              <span>Total: ₹{Number(order.total_amount).toFixed(2)}</span>
                              <span>Destination: {order.delivery_address || 'Tamil Nadu'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            {status === "Pending" && (
                              <button
                                disabled={isProcessing}
                                onClick={() => handlePickOrder(order)}
                                className="px-5 py-2.5 bg-primary-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-dark-green disabled:opacity-50"
                              >
                                {isProcessing ? "Picking..." : "Pick Stock Items"}
                              </button>
                            )}

                            {(status === "Picking" || status === "Processing") && (
                              <button
                                disabled={isProcessing}
                                onClick={() => handlePackOrder(order.id)}
                                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-amber-700 disabled:opacity-50"
                              >
                                {isProcessing ? "Packing..." : "Pack Package"}
                              </button>
                            )}

                            {status === "Packing" && (
                              <button
                                disabled={isProcessing}
                                onClick={() => handleMarkReady(order.id)}
                                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>{isProcessing ? "Submitting..." : "Ready for Dispatch"}</span>
                              </button>
                            )}

                            {(status === "Ready for Dispatch" || status === "Dispatched" || status === "On Route" || status === "Delivered") && (
                              <span className="px-3 py-1 bg-very-light-green text-primary-green border border-primary-green/20 rounded-lg text-[10px] font-black uppercase">
                                ✓ Handed to Transport Fleet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 space-y-6">
                <h3 className="text-sm font-black text-primary-text uppercase tracking-tight">Fulfillment Progress</h3>
                
                <div className="space-y-3">
                  <div className="p-4 bg-[#F5FBF7] rounded-2xl border border-border-color space-y-1">
                    <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">1. Stock Picking</p>
                    <p className="text-xs text-primary-text font-bold">Pick items from designated rack and shelf storage.</p>
                  </div>
                  <div className="p-4 bg-[#F5FBF7] rounded-2xl border border-border-color space-y-1">
                    <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">2. Secure Packing</p>
                    <p className="text-xs text-primary-text font-bold">Pack produce in eco-packaging with weight verification.</p>
                  </div>
                  <div className="p-4 bg-[#F5FBF7] rounded-2xl border border-border-color space-y-1">
                    <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">3. Fleet Handoff</p>
                    <p className="text-xs text-primary-text font-bold">Marking ready automatically triggers Transport auto-allocation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GodownLayout>
  );
}
