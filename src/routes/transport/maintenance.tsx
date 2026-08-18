import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Wrench, AlertCircle, Calendar } from "lucide-react";
import { transportVehicles } from "@/data/mockData";

export const Route = createFileRoute("/transport/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const maintenanceVehicles = transportVehicles.filter(v => v.serviceStatus !== 'Healthy');

  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Fleet Maintenance</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maintenanceVehicles.map((v) => (
            <div key={v.id} className="p-8 bg-white border border-[#DCE8DF] rounded-[2.5rem] shadow-sm">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#17231A]">{v.number}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.serviceStatus}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#DCE8DF]">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                  <span>Last Service</span>
                  <span className="text-[#17231A]">{v.lastService}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                  <span>Next Service</span>
                  <span className="text-orange-600 italic font-black">{v.nextService}</span>
                </div>
              </div>
            </div>
          ))}
          {maintenanceVehicles.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-40">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-[#16803A]" />
              <p className="text-xs font-black uppercase tracking-widest text-[#17231A]">Entire Fleet is Healthy</p>
            </div>
          )}
        </div>
      </div>
    </TransportLayout>
  );
}
import { ShieldCheck } from "lucide-react";