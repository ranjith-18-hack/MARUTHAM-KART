import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { transportVehicles } from "@/data/mockData";
import { Truck, Wrench, MapPin, AlertCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/transport/vehicles/")({
  component: VehicleManagementPage,
});

function VehicleManagementPage() {
  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Fleet Management</h1>
            <p className="text-slate-500 font-bold text-sm">Managing {transportVehicles.length} active operational assets</p>
          </div>
          <button className="px-8 py-4 bg-[#16803A] text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-[#11662d] shadow-lg shadow-green-900/20 transition-all active:scale-95">
            Add New Vehicle
          </button>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transportVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white border border-[#DCE8DF] rounded-[2rem] p-8 shadow-sm hover:border-[#16803A]/30 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-[#EAF7EE] rounded-[1.5rem] text-[#16803A]">
                  <Truck className="w-7 h-7" />
                </div>
                <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${
                  vehicle.status === 'Available' ? 'bg-green-50 text-green-600' :
                  vehicle.status === 'On Route' ? 'bg-blue-50 text-blue-600' :
                  vehicle.status === 'Maintenance' ? 'bg-orange-50 text-orange-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-black text-[#17231A]">{vehicle.number}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{vehicle.id} • {vehicle.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F8FAFB] p-4 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                    <p className="text-xs font-black text-[#17231A]">{vehicle.capacity}</p>
                  </div>
                  <div className="bg-[#F8FAFB] p-4 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Driver</p>
                    <p className="text-xs font-black text-[#17231A] truncate">{vehicle.assignedDriver || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="flex items-center text-xs text-slate-600 font-bold py-3 border-y border-dashed border-[#DCE8DF]">
                  <MapPin className="w-4 h-4 mr-3 text-[#16803A]" />
                  {vehicle.currentLocation}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Wrench className="w-4 h-4 mr-2" />
                    Status: <span className={`${vehicle.serviceStatus === 'Healthy' ? 'text-green-600' : 'text-orange-600'} ml-1`}>{vehicle.serviceStatus}</span>
                  </div>
                  <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline">View Specs</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}