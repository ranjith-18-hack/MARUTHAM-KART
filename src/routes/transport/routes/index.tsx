import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Navigation, MapPin } from "lucide-react";
import { transportRoutes } from "@/data/mockData";

export const Route = createFileRoute("/transport/routes/")({
  component: RoutesPage,
});

function RoutesPage() {
  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Route Planning</h1>
        <div className="space-y-4">
          {transportRoutes.map((route) => (
            <div key={route.id} className="p-8 bg-white border border-[#DCE8DF] rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#EAF7EE] rounded-2xl flex items-center justify-center text-[#16803A]">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#17231A]">{route.origin} → {route.destination}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{route.id} • {route.distance}</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">{route.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#DCE8DF]">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Estimated Time</p>
                  <p className="text-sm font-bold text-[#17231A]">{route.estimatedTime}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Total Stops</p>
                  <p className="text-sm font-bold text-[#17231A]">{route.stops}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Assigned Fleet</p>
                  <p className="text-sm font-bold text-[#17231A]">{route.vehicleId}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}