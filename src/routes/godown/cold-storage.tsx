import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { warehouseZones } from "@/data/mockData";
import { Thermometer, Droplets, AlertCircle, Info, Fan, Power } from "lucide-react";

export const Route = createFileRoute("/godown/cold-storage")({
  head: () => ({
    meta: [
      { title: "Cold Storage Monitoring | MARUTHAM KART" },
      { name: "description", content: "Real-time temperature and humidity monitoring for perishables." },
    ],
  }),
  component: ColdStoragePage,
});

function ColdStoragePage() {
  const coldZones = warehouseZones.filter(z => z.temperature);

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Cold Storage & Environment</h1>
          <p className="text-sm text-secondary-text font-bold">Live environmental monitoring for perishable goods</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coldZones.map((zone) => (
            <div key={zone.id} className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h3 className="text-lg font-black text-primary-text uppercase tracking-tight">{zone.id} — Cold Room</h3>
                  <p className="text-[10px] font-black text-[#16803A] uppercase tracking-widest">{zone.category}</p>
                </div>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-green-100 flex items-center">
                    <Power className="w-3 h-3 mr-1" /> Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Thermometer className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Temperature</span>
                  </div>
                  <h4 className="text-3xl font-black text-blue-900">{zone.temperature}</h4>
                  <p className="text-[8px] font-bold text-blue-400 uppercase mt-1">Status: Optimal</p>
                </div>
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Droplets className="w-4 h-4 text-teal-600" />
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Humidity</span>
                  </div>
                  <h4 className="text-3xl font-black text-teal-900">{zone.humidity}</h4>
                  <p className="text-[8px] font-bold text-teal-400 uppercase mt-1">Status: Normal</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#16803A] border border-slate-100 animate-spin-slow">
                    <Fan className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-text uppercase tracking-tight">System Status</p>
                    <p className="text-[8px] font-bold text-secondary-text">Compressors Operating Normally</p>
                  </div>
                </div>
                <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline">View Logs</button>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start space-x-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm border border-amber-50">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Operational Advisory</h4>
            <p className="text-xs text-amber-800/80 leading-relaxed mt-1 font-bold">
              Ambient temperature is rising. Ensure Zone F main doors are closed during loading cycles to prevent cooling loss. Defrost cycle scheduled for Zone E at 02:00 AM.
            </p>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
