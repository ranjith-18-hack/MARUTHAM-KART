import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Settings, Bell, Lock, ShieldCheck, CreditCard, User, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/business/settings")({
  head: () => ({
    meta: [{ title: "Business Settings | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessSettings,
});

function BusinessSettings() {
  const settings = [
    { title: "Notification Preferences", icon: Bell, desc: "Order alerts, Quote updates" },
    { title: "Security & Login", icon: Lock, desc: "Password, 2FA, Business keys" },
    { title: "Team Management", icon: User, desc: "Procurement manager roles" },
    { title: "Billing & Subscriptions", icon: CreditCard, desc: "Wallet, Credit line settings" },
    { title: "Privacy & Compliance", icon: ShieldCheck, desc: "Data protection, Audit logs" },
    { title: "Help & Enterprise Support", icon: HelpCircle, desc: "Dedicated account manager" },
  ];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter text-left">Enterprise Settings</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
        {settings.map((s, i) => (
          <button key={i} className="w-full bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between hover:border-[#16803A]/30 transition-all group">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:text-[#16803A] group-hover:bg-[#F5FBF7] transition-all">
                <s.icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{s.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.desc}</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#16803A] transition-all"></div>
          </button>
        ))}

        <div className="pt-12 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Marutham Kart Enterprise v4.2</p>
        </div>
      </main>
    </BusinessLayout>
  );
}
