import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { outboundOrders } from "@/data/mockData";
import { Search, Filter, PackageCheck, Clipboard, Truck, ArrowRight, CheckCircle2, Box, XCircle, Info } from "lucide-react";
import { useState } from "react";
import { autoAllocateTransport } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/godown/outbound")({
  head: () => ({
    meta: [
      { title: "Outbound Orders | MARUTHAM KART" },
      { name: "description", content: "Manage outbound orders, picking, and dispatch." },
    ],
  }),
  component: OutboundOrdersPage,
});

function OutboundOrdersPage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [orders, setOrders] = useState(outboundOrders);
  const tabs = ["Pending", "Picking", "Packing", "Ready for Dispatch", "Dispatched", "Completed"];

  const handleStatusChange = (orderId: string, nextStatus: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status: nextStatus as any };
        
        // If transitioning to Ready for Dispatch, simulate auto-allocation
        if (nextStatus === "Ready for Dispatch") {
          const allocation = autoAllocateTransport(updated);
          if (allocation.vehicle && allocation.driver) {
            toast.success(`Transport allocated for ${orderId}: ${allocation.vehicle.number} with ${allocation.driver.name}`);
            console.log(`[AUDIT] Order ${orderId} allocated:`, allocation);
          } else {
            toast.warning(`Manual attention required for ${orderId}: ${allocation.reason}`);
          }
        }
        
        return updated;
      }
      return o;
    }));
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const getNextStatus = (current: string) => {
    const idx = tabs.indexOf(current);
    if (idx < tabs.length - 1) return tabs[idx + 1];
    return null;
  };

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Outbound Orders</h1>
            <p className="text-sm text-secondary-text font-bold">Manage order fulfillment, picking, and dispatch status</p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-100 p-3 rounded-2xl">
            <Info className="w-4 h-4 text-blue-500" />
            <p className="text-[10px] font-black text-blue-600 uppercase">Auto-Allocation active for Dispatch</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-2">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'bg-white border border-[#DCE8DF] text-slate-400 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#DCE8DF] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5FBF7] border-b border-[#DCE8DF]">
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Order Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Load Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Destination</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-primary-text">{order.id}</span>
                        <span className="text-[10px] font-bold text-slate-400">{order.buyer} ({order.buyerType})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-xs font-bold text-primary-text">{order.product} (x{order.quantity})</p>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">{order.weight} kg</span>
                          <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">{order.volume} m³</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{order.destination}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tight ${
                          order.status === 'Ready for Dispatch' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          order.status === 'Dispatched' ? 'bg-green-50 text-green-600 border border-green-100' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getNextStatus(order.status) ? (
                        <button 
                          onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                          className="px-4 py-2 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[#16803A] hover:text-[#16803A] transition-all flex items-center justify-end space-x-2 ml-auto"
                        >
                          <span>Move to {getNextStatus(order.status)}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[9px] font-black text-slate-400 uppercase">Process Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Box className="w-8 h-8" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No orders in {activeTab}</p>
            </div>
          )}
        </div>
      </div>
    </GodownLayout>
  );
}
