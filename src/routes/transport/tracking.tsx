import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { 
  MapPin, 
  Truck, 
  Clock, 
  Filter, 
  Activity, 
  Navigation,
  RefreshCw,
  Search
} from "lucide-react";
import { transportQueue } from "@/data/mockData";

export const Route = createFileRoute("/transport/tracking")({
  component: LiveTrackingPage,
});

function LiveTrackingPage() {
  const activeDeliveries = transportQueue.filter(d => d.status === 'On Route');

  return (
    <TransportLayout>
      <div className="h-[calc(100vh-100px)] lg:h-[calc(100vh-64px)] flex flex-col space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Fleet Tracking</h1>
            <p className="text-slate-500 font-bold text-sm">Real-time geospatial operational monitoring</p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-5 py-3 bg-white border border-[#DCE8DF] rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-600">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Map</span>
            </button>
            <button className="flex items-center space-x-2 px-5 py-3 bg-[#16803A] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-green-900/20">
              <Navigation className="w-4 h-4" />
              <span>Route Optimization</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* Mock Map Area */}
          <div className="flex-1 bg-white rounded-[3rem] border border-[#DCE8DF] relative overflow-hidden shadow-sm">
            {/* Grid Pattern Background for Mock Map */}
            <div className="absolute inset-0 bg-[#F8FAFB] bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:40px_40px] opacity-50"></div>
            
            {/* Mock Route Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <path d="M 200 300 Q 400 100 600 500" stroke="#16803A" strokeWidth="4" fill="none" strokeDasharray="10 5" />
              <path d="M 100 600 Q 500 700 800 200" stroke="#3B82F6" strokeWidth="4" fill="none" strokeDasharray="10 5" />
            </svg>

            {/* Vehicle Markers */}
            <div className="absolute top-1/3 left-1/4 group cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
                <div className="relative w-10 h-10 bg-white rounded-2xl shadow-xl border-2 border-blue-600 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                {/* Info Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-white p-3 rounded-2xl shadow-2xl border border-[#DCE8DF] opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] font-black text-[#17231A]">MK-V-1024 (Manoj)</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Speed: 45 km/h</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-1/4 right-1/3 group cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-4 bg-green-500/20 rounded-full animate-ping"></div>
                <div className="relative w-10 h-10 bg-white rounded-2xl shadow-xl border-2 border-[#16803A] flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#16803A]" />
                </div>
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="absolute top-6 right-6 flex flex-col space-y-2">
              <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-[#DCE8DF] flex items-center justify-center font-black text-slate-600 hover:bg-[#F8FAFB]">+</button>
              <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-[#DCE8DF] flex items-center justify-center font-black text-slate-600 hover:bg-[#F8FAFB]">-</button>
            </div>

            {/* Float Info Card */}
            <div className="absolute bottom-10 left-10 bg-white p-6 rounded-[2rem] border border-[#DCE8DF] shadow-2xl max-w-sm">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#17231A]">MK-V-104 Logistics Truck</h4>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    <Activity className="w-3 h-3 mr-1 text-green-500" />
                    Live • On Route
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-[#DCE8DF]">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-[#16803A]" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Stop</p>
                    <p className="text-xs font-black text-[#17231A]">Hotel Green Leaf, Tiruppur</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expected Arrival</p>
                    <p className="text-xs font-black text-[#17231A]">02:45 PM (12 mins delay)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side monitor */}
          <div className="w-96 shrink-0 bg-white border border-[#DCE8DF] rounded-[3rem] overflow-hidden flex flex-col shadow-sm">
            <div className="p-8 border-b border-[#DCE8DF] bg-[#F8FAFB]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#17231A]">Active Fleet</h3>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">{activeDeliveries.length} Vehicles</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter drivers..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-[10px] font-bold text-[#17231A] outline-none"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-5 border border-[#DCE8DF] rounded-[1.5rem] hover:border-[#16803A] transition-all cursor-pointer group">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <span>{delivery.id}</span>
                    <span className="text-blue-600 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5 animate-pulse"></span>
                      Transit
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#17231A] mb-1">{delivery.vehicleId} • {delivery.driverId}</h4>
                  <div className="flex items-center text-[10px] text-slate-500 font-bold mb-4">
                    <MapPin className="w-3 h-3 mr-1 text-[#16803A]" />
                    {delivery.destination}
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-[#16803A]">Progress</span>
                      <span className="text-slate-500">72%</span>
                    </div>
                    <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded-full bg-slate-100">
                      <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#16803A] w-[72%]"></div>
                    </div>
                  </div>
                </div>
              ))}
              
              {activeDeliveries.length === 0 && (
                <div className="py-20 text-center opacity-40">
                  <Activity className="w-10 h-10 mx-auto mb-4 text-slate-300" />
                  <p className="text-xs font-black uppercase tracking-widest">No Active Transits</p>
                </div>
              )}
            </div>
            
            <div className="p-8 border-t border-[#DCE8DF]">
              <button className="w-full py-4 bg-[#F8FAFB] text-[#17231A] border border-[#DCE8DF] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#16803A] hover:text-white hover:border-[#16803A] transition-all">
                Full Dispatch Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}