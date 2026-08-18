import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { transportDrivers, transportVehicles } from "@/data/mockData";
import { User, Phone, Truck, ShieldCheck, MapPin, Activity, Star } from "lucide-react";

export const Route = createFileRoute("/transport/drivers/")({
  component: DriverManagementPage,
});

function DriverManagementPage() {
  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Driver Fleet</h1>
            <p className="text-slate-500 font-bold text-sm">Active personnel management & performance monitoring</p>
          </div>
          <button className="px-8 py-4 bg-[#16803A] text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-[#11662d] shadow-lg shadow-green-900/20 transition-all active:scale-95">
            Onboard Driver
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-[#DCE8DF] shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Drivers</p>
            <p className="text-3xl font-black text-[#17231A] mt-2">{transportDrivers.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-[#DCE8DF] shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
            <p className="text-3xl font-black text-green-600 mt-2">
              {transportDrivers.filter(d => d.availability === 'Available').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-[#DCE8DF] shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On Route</p>
            <p className="text-3xl font-black text-blue-600 mt-2">
              {transportDrivers.filter(d => d.availability === 'On Route').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-[#DCE8DF] shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Rating</p>
            <div className="flex items-end mt-2 space-x-1">
              <p className="text-3xl font-black text-[#17231A]">4.8</p>
              <Star className="w-5 h-5 text-orange-400 fill-orange-400 mb-1.5" />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transportDrivers.map((driver) => (
            <div key={driver.id} className="bg-white border border-[#DCE8DF] rounded-[2rem] p-8 shadow-sm hover:border-[#16803A]/30 transition-all flex flex-col">
              <div className="flex items-center space-x-5 mb-8">
                <div className="w-16 h-16 bg-[#F8FAFB] border border-[#DCE8DF] rounded-2xl flex items-center justify-center text-slate-400">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#17231A]">{driver.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.id} • {driver.type}</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{driver.phone}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    driver.availability === 'Available' ? 'bg-green-50 text-green-600' :
                    driver.availability === 'On Route' ? 'bg-blue-50 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {driver.availability}
                  </span>
                </div>

                <div className="p-5 bg-[#F8FAFB] rounded-[1.25rem] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assigned Vehicle</span>
                    <span className="text-xs font-black text-[#16803A] uppercase">{driver.vehicleId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Workload</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-slate-200 rounded-full mr-3 overflow-hidden">
                        <div className="h-full bg-[#16803A]" style={{ width: `${(driver.workload / 5) * 100}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-[#17231A]">{driver.workload}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#DCE8DF]">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-600">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Verified
                </div>
                <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}