import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { warehouseZones } from "@/data/mockData";
import { MapPin, Info, LayoutGrid, Search, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/godown/locations")({
  head: () => ({
    meta: [
      { title: "Storage Locations | MARUTHAM KART" },
      { name: "description", content: "Warehouse map and specific storage unit management." },
    ],
  }),
  component: StorageLocationsPage,
});

function StorageLocationsPage() {
  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Storage Locations</h1>
            <p className="text-sm text-secondary-text font-bold">Manage zones, aisles, and individual storage bins</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
            <input 
              type="text" 
              placeholder="Search Bin ID (e.g., A01)..." 
              className="pl-10 pr-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-xs w-64 focus:ring-1 focus:ring-[#16803A] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouseZones.map((zone) => (
            <div key={zone.id} className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-black text-primary-text uppercase tracking-tight">{zone.id}</h3>
                  <p className="text-[10px] font-black text-[#16803A] uppercase tracking-widest">{zone.category}</p>
                </div>
                <div className="w-10 h-10 bg-[#F5FBF7] rounded-xl flex items-center justify-center text-[#16803A]">
                  <LayoutGrid className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {['01', '02', '03', '04'].map((bin) => (
                  <div key={bin} className="p-3 border border-[#DCE8DF] rounded-xl bg-[#F5FBF7] text-center group cursor-pointer hover:border-[#16803A] transition-all">
                    <p className="text-[10px] font-black text-secondary-text mb-1">{zone.id.slice(-1)}{bin}</p>
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#16803A]" style={{ width: bin === '03' ? '90%' : '40%' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</span>
                  <span className="text-xs font-black text-primary-text">
                    {Math.round((zone.currentStock / zone.capacity) * 100)}% Used
                  </span>
                </div>
                <button className="p-2 hover:bg-[#F5FBF7] rounded-lg transition-colors group">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16803A]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GodownLayout>
  );
}
