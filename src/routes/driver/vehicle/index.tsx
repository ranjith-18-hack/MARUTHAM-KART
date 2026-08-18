import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Truck, 
  Info, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  Wrench,
  FileText,
  MapPin,
  Package
} from "lucide-react";
import { drivers, vehicles } from "@/data/mockData";

export const Route = createFileRoute("/driver/vehicle/")({
  component: DriverVehicle,
});

function DriverVehicle() {
  const driver = drivers.find(d => d.id === 'MK-DRI-1042') || drivers[0];
  const vehicle = vehicles.find(v => v.id === driver?.vehicleId) || vehicles[0];

  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24">
      <header className="bg-white p-6 border-b border-[#DCE8DF] sticky top-0 z-20 flex items-center">
        <Link to="/driver/dashboard" className="mr-4 p-2 bg-[#F5FBF7] rounded-full">
          <ArrowLeft className="w-5 h-5 text-[#16803A]" />
        </Link>
        <h2 className="font-black text-xl text-primary-text">My Vehicle</h2>
      </header>

      <main className="p-6 space-y-8">
        {/* Vehicle Identity */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm text-center">
          <div className="w-24 h-24 bg-[#F5FBF7] rounded-[2rem] border border-[#DCE8DF] flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-[#16803A]" />
          </div>
          <h3 className="text-3xl font-black text-primary-text tracking-tight mb-1">{vehicle?.number}</h3>
          <p className="text-sm font-black text-[#16803A] uppercase tracking-widest">{vehicle?.type}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-[#F5FBF7] p-5 rounded-3xl border border-[#DCE8DF]">
              <p className="text-[9px] font-black uppercase text-secondary-text mb-1">Max Capacity</p>
              <p className="text-lg font-black text-primary-text">{vehicle?.capacity}</p>
            </div>
            <div className="bg-[#F5FBF7] p-5 rounded-3xl border border-[#DCE8DF]">
              <p className="text-[9px] font-black uppercase text-secondary-text mb-1">Status</p>
              <div className="flex items-center justify-center gap-1.5 text-green-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-black uppercase tracking-wider">{vehicle?.status}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation & Compliance */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm">
          <h4 className="font-black text-xs uppercase text-secondary-text tracking-widest mb-6">Compliance & Docs</h4>
          <div className="space-y-3">
            <DocRow icon={<FileText className="w-5 h-5" />} label="Insurance" value={vehicle?.insuranceExpiry} status="Valid" />
            <DocRow icon={<ShieldCheck className="w-5 h-5" />} label="Fitness (FC)" value={vehicle?.fitnessExpiry} status="Valid" />
            <DocRow icon={<Wrench className="w-5 h-5" />} label="Maintenance" value={vehicle?.lastMaintenance} status="Up to date" />
          </div>
        </section>

        {/* Pre-trip Checklist */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-xs uppercase text-secondary-text tracking-widest">Daily Checklist</h4>
            <span className="text-[10px] font-black text-slate-400 uppercase">Required Daily</span>
          </div>
          <div className="space-y-3">
            {[
              "Fuel / Battery Level",
              "Tyre Pressure Checked",
              "Brakes & Fluid Levels",
              "Lights & Indicators",
              "Cleaning Completed"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[#F5FBF7] rounded-2xl border border-[#DCE8DF]">
                <span className="text-sm font-black text-primary-text">{item}</span>
                <input type="checkbox" className="w-6 h-6 rounded-lg border-[#DCE8DF] text-[#16803A] focus:ring-[#16803A]" />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-5 bg-[#16803A] text-white font-black rounded-3xl shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all">
            Confirm Checklist
          </button>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DCE8DF] px-6 py-4 z-50 flex justify-between items-center">
        <NavButton icon={<Truck className="w-6 h-6" />} label="Dashboard" to="/driver/dashboard" />
        <NavButton icon={<Package className="w-6 h-6" />} label="Deliveries" to="/driver/deliveries" />
        <NavButton active icon={<Truck className="w-6 h-6" />} label="Vehicle" to="/driver/vehicle" />
        <NavButton icon={<div className="w-6 h-6 rounded-full bg-slate-200 border border-[#DCE8DF] flex items-center justify-center text-[10px] font-black text-[#16803A]">A</div>} label="Profile" to="/driver/profile" />
      </nav>
    </div>
  );
}

function DocRow({ icon, label, value, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#F5FBF7] rounded-2xl border border-[#DCE8DF]">
      <div className="flex items-center gap-4">
        <div className="text-[#16803A] opacity-40">{icon}</div>
        <div>
          <p className="text-[9px] font-black text-secondary-text uppercase mb-0.5">{label}</p>
          <p className="text-sm font-black text-primary-text">{value}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[9px] font-black text-[#16803A] bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">
          {status}
        </span>
      </div>
    </div>
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
