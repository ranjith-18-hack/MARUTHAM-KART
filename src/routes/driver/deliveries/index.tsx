import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  Truck, 
  MapPin, 
  Package, 
  ChevronRight,
  Search,
  ArrowLeft,
  Calendar,
  Filter
} from "lucide-react";
import { driverDeliveries } from "@/data/mockData";

export const Route = createFileRoute("/driver/deliveries/")({
  component: DeliveryList,
});

function DeliveryList() {
  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24">
      <header className="bg-white p-6 border-b border-[#DCE8DF] sticky top-0 z-20">
        <div className="flex items-center mb-6">
          <Link to="/driver/dashboard" className="mr-4 p-2 bg-[#F5FBF7] rounded-full">
            <ArrowLeft className="w-5 h-5 text-[#16803A]" />
          </Link>
          <h2 className="font-black text-xl text-primary-text">My Deliveries</h2>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..."
            className="w-full pl-12 pr-4 py-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl focus:ring-2 focus:ring-[#16803A] outline-none font-bold text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterBadge label="Today" active />
          <FilterBadge label="Assigned" />
          <FilterBadge label="Transit" />
          <FilterBadge label="Completed" />
          <button className="p-3 bg-white border border-[#DCE8DF] rounded-xl">
            <Filter className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="space-y-4">
          {driverDeliveries.map((delivery) => (
            <DeliveryListItem key={delivery.id} delivery={delivery} />
          ))}
        </div>
      </main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DCE8DF] px-6 py-4 z-50 flex justify-between items-center">
        <NavButton icon={<Truck className="w-6 h-6" />} label="Dashboard" to="/driver/dashboard" />
        <NavButton active icon={<Package className="w-6 h-6" />} label="Deliveries" to="/driver/deliveries" />
        <NavButton icon={<MapPin className="w-6 h-6" />} label="Route" to="/driver/navigation" />
        <NavButton icon={<div className="w-6 h-6 rounded-full bg-slate-200 border border-[#DCE8DF] flex items-center justify-center text-[10px] font-black text-[#16803A]">A</div>} label="Profile" to="/driver/profile" />
      </nav>
    </div>
  );
}

function FilterBadge({ label, active }: any) {
  return (
    <button className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider border transition-all whitespace-nowrap ${
      active ? 'bg-[#16803A] text-white border-[#16803A]' : 'bg-white text-slate-400 border-[#DCE8DF]'
    }`}>
      {label}
    </button>
  );
}

function DeliveryListItem({ delivery }: any) {
  return (
    <Link 
      to="/driver/deliveries/$orderId"
      params={{ orderId: delivery.id }}
      className="block bg-white p-5 rounded-3xl border border-[#DCE8DF] shadow-sm active:bg-[#F5FBF7] transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mb-1 inline-block ${
            delivery.type === 'BULK / HOTEL' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-[#F5FBF7] text-[#16803A] border-[#DCE8DF]'
          }`}>
            {delivery.type}
          </span>
          <h4 className="font-black text-primary-text">{delivery.customerName}</h4>
          <p className="text-[10px] font-bold text-secondary-text uppercase">{delivery.id}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[#16803A] font-black text-xs justify-end">
            <Calendar className="w-3 h-3" /> {delivery.eta}
          </div>
          <span className="text-[9px] font-black uppercase text-slate-400">Scheduled</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#16803A]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-primary-text">{delivery.status.replace('_', ' ')}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>
    </Link>
  );
}

function NavButton({ icon, label, active, to }: any) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#16803A]' : 'text-slate-400 opacity-60'}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
