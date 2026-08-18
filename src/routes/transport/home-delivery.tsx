import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Home, Search, Filter, MapPin, Truck, User } from "lucide-react";
import { transportQueue } from "@/data/mockData";

export const Route = createFileRoute("/transport/home-delivery")({
  component: HomeDeliveryManagementPage,
});

function HomeDeliveryManagementPage() {
  const homeDeliveries = transportQueue.filter(o => o.type === 'Home Delivery');

  return (
    <TransportLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#17231A]">Home Delivery Management</h1>
            <p className="text-slate-500 font-bold text-sm">Consumer and household orders</p>
          </div>
        </div>

        <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#DCE8DF]">
                  <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Order ID</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Customer</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Area</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Weight</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {homeDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8FAFB] transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-xs font-black text-[#17231A]">{d.id}</span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-[#17231A]">{d.customerName}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-xs font-bold text-slate-500">
                        <MapPin className="w-3 h-3 mr-1 text-[#16803A]" />
                        {d.destination}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-[#17231A]">{d.quantity}</td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-black text-[#16803A] uppercase">{d.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button className="text-[10px] font-black text-[#16803A] uppercase hover:underline">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}
