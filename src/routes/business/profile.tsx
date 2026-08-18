import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { User, MapPin, CreditCard, ShieldCheck, FileText, Bell, Lock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/business/profile")({
  head: () => ({
    meta: [{ title: "Business Profile | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessProfile,
});

function BusinessProfile() {
  const sections = [
    { title: "Business Information", icon: FileText, desc: "Legal name, Registration details" },
    { title: "Delivery Addresses", icon: MapPin, desc: "Manage multiple locations" },
    { title: "Procurement Preferences", icon: Bell, desc: "Order frequency, Time windows" },
    { title: "Payment Information", icon: CreditCard, desc: "Saved cards, Bank details" },
    { title: "Security & Access", icon: Lock, desc: "Password, Multi-user management" },
  ];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter">Business Profile</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <span className="bg-very-light-green text-[#16803A] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#16803A]/20">✓ Verified Business</span>
          </div>
          
          <div className="w-24 h-24 bg-[#16803A] rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#16803A]/20">GH</div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Grand Hyatt Chennai</h2>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#16803A]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hotel & Luxury Dining</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sections.map((s, i) => (
            <button key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-[#16803A]/30 transition-all group text-left">
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 bg-slate-50 text-[#16803A] rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-[#F5FBF7]">
                  <s.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{s.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#16803A] group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>

        <div className="pt-8 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Enterprise Edition 2026.4.2</p>
          <button className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:underline">Log out from Business Portal</button>
        </div>
      </main>
    </BusinessLayout>
  );
}
