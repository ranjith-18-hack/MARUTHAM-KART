import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Settings,
  LogOut,
  HelpCircle,
  Phone,
  Mail,
  Award
} from "lucide-react";
import { drivers, vehicles } from "@/data/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/profile")({
  component: DriverProfile,
});

function DriverProfile() {
  const navigate = useNavigate();
  const driver = drivers.find(d => d.id === 'MK-DRI-1042') || drivers[0];
  const vehicle = vehicles.find(v => v.id === driver?.vehicleId) || vehicles[0];

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate({ to: "/driver" });
  };

  const [availability, setAvailability] = useState<"AVAILABLE" | "ON DELIVERY" | "BREAK" | "OFF DUTY" | "UNAVAILABLE">(driver?.status || 'AVAILABLE');

  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24">
      <header className="bg-white p-6 border-b border-[#DCE8DF] sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/driver/dashboard" className="mr-4 p-2 bg-[#F5FBF7] rounded-full">
            <ArrowLeft className="w-5 h-5 text-[#16803A]" />
          </Link>
          <h2 className="font-black text-xl text-primary-text">My Profile</h2>
        </div>
        <button className="p-3 bg-[#F5FBF7] rounded-2xl border border-[#DCE8DF]">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      <main className="p-6 space-y-8">
        {/* Profile Card */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="bg-green-50 text-[#16803A] px-4 py-1 rounded-full border border-green-100 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">{driver?.rating} Rating</span>
            </div>
          </div>
          
          <div className="w-32 h-32 bg-[#F5FBF7] rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-6 overflow-hidden relative group">
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[#16803A] font-black text-4xl uppercase">
              {driver?.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>

          <h3 className="text-2xl font-black text-primary-text mb-1">{driver?.name}</h3>
          <p className="text-sm font-black text-[#16803A] mb-8 uppercase tracking-widest">{driver?.id}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F5FBF7] p-4 rounded-3xl border border-[#DCE8DF]">
              <p className="text-[9px] font-black text-secondary-text uppercase mb-1">Deliveries</p>
              <p className="text-lg font-black text-primary-text">{driver?.totalDeliveries}</p>
            </div>
            <div className="bg-[#F5FBF7] p-4 rounded-3xl border border-[#DCE8DF]">
              <p className="text-[9px] font-black text-secondary-text uppercase mb-1">Experience</p>
              <p className="text-lg font-black text-primary-text">2 Years</p>
            </div>
          </div>
        </section>

        {/* Operational Status */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm">
          <h4 className="font-black text-xs uppercase text-secondary-text tracking-widest mb-6">Current Duty Status</h4>
          <div className="grid grid-cols-2 gap-3">
            {['AVAILABLE', 'ON DELIVERY', 'BREAK', 'OFF DUTY', 'UNAVAILABLE'].map((status) => (
              <button 
                key={status}
                onClick={() => setAvailability(status as any)}
                className={`py-4 rounded-2xl border font-black text-[10px] uppercase tracking-wider transition-all ${
                  availability === status 
                    ? 'bg-[#16803A] border-[#16803A] text-white shadow-lg shadow-green-900/10' 
                    : 'bg-[#F5FBF7] border-[#DCE8DF] text-slate-400'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* Information List */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm space-y-2">
          <InfoRow icon={<Phone className="w-5 h-5" />} label="Phone" value={driver?.phone} />
          <InfoRow icon={<Mail className="w-5 h-5" />} label="Email" value={driver?.email} />
          <InfoRow icon={<ShieldCheck className="w-5 h-5" />} label="License" value={driver?.licenseNumber} />
          <InfoRow icon={<Truck className="w-5 h-5" />} label="Vehicle" value={`${vehicle?.number} (${vehicle?.type})`} />
        </section>

        {/* Footer Actions */}
        <section className="space-y-4">
          <button className="w-full py-5 bg-white border border-[#DCE8DF] text-primary-text font-black rounded-3xl flex items-center justify-center gap-3 active:bg-[#F5FBF7] transition-colors">
            <HelpCircle className="w-5 h-5 text-blue-500" /> Help & Support
          </button>
          <button 
            onClick={handleLogout}
            className="w-full py-5 bg-red-50 text-red-600 font-black rounded-3xl flex items-center justify-center gap-3 border border-red-100 active:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout from Portal
          </button>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DCE8DF] px-6 py-4 z-50 flex justify-between items-center">
        <NavButton icon={<Truck className="w-6 h-6" />} label="Dashboard" to="/driver/dashboard" />
        <NavButton icon={<Package className="w-6 h-6" />} label="Deliveries" to="/driver/deliveries" />
        <NavButton icon={<MapPin className="w-6 h-6" />} label="Route" to="/driver/navigation" />
        <NavButton active icon={<div className="w-6 h-6 rounded-full bg-[#16803A] flex items-center justify-center text-[10px] font-black text-white">A</div>} label="Profile" to="/driver/profile" />
      </nav>
    </div>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#F5FBF7] transition-colors">
      <div className="text-[#16803A] opacity-40">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-secondary-text uppercase mb-0.5">{label}</p>
        <p className="text-sm font-black text-primary-text">{value}</p>
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

import { useState } from "react";
