import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Truck, Building2, MapPin, Search, Filter, Weight } from "lucide-react";
import { transportQueue } from "@/data/mockData";

export const Route = createFileRoute("/transport/bulk-logistics")({
  component: BulkLogisticsPage,
});

function BulkLogisticsPage() {
  const bulkDeliveries = transportQueue.filter(o => o.type === 'Bulk Delivery');

  return (
    <TransportLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#17231A]">Bulk Logistics</h1>
            <p className="text-slate-500 font-bold text-sm">Enterprise and B2B heavy transport</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {bulkDeliveries.map((d) => (
            <div key={d.id} className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#DCE8DF]">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#17231A]">{d.destination}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{d.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-black uppercase tracking-wider">{d.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                  <p className="text-sm font-bold text-[#17231A] flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-[#16803A]" />
                    {d.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Required Vehicle</p>
                  <p className="text-sm font-bold text-[#17231A]">Mini Truck / Truck</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Vehicle</p>
                  <p className="text-sm font-bold text-[#16803A]">{d.vehicleId || 'Awaiting Assignment'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ETA</p>
                  <p className="text-sm font-bold text-[#17231A]">{d.eta || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#DCE8DF] flex justify-end space-x-3">
                <button className="px-6 py-3 border border-[#DCE8DF] text-xs font-black uppercase rounded-xl hover:bg-[#F8FAFB]">View Details</button>
                <button className="px-6 py-3 bg-[#16803A] text-white text-xs font-black uppercase rounded-xl hover:bg-[#11662d]">Assign Fleet</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}
