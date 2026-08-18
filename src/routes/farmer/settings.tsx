import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { Settings, Bell, Lock, Smartphone, Globe, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/farmer/settings")({
  head: () => ({
    meta: [{ title: "Settings | Farmer Portal" }],
  }),
  component: FarmerSettings,
});

function FarmerSettings() {
  const sections = [
    { title: "Notification Settings", icon: Bell },
    { title: "Account & Security", icon: Lock },
    { title: "App Preferences", icon: Smartphone },
    { title: "Language", icon: Globe, detail: "English (Tamil Coming Soon)" },
    { title: "Privacy Policy", icon: ShieldCheck },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-primary-text uppercase tracking-tighter">Settings</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        {sections.map((s, i) => (
          <button key={i} className="w-full bg-white p-6 rounded-3xl border border-border-color shadow-sm flex items-center justify-between hover:border-primary-green transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#F5FBF7] text-[#16803A] rounded-2xl flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-primary-text uppercase tracking-wider">{s.title}</p>
                {s.detail && <p className="text-[10px] font-bold text-secondary-text uppercase mt-0.5">{s.detail}</p>}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
          </button>
        ))}

        <div className="pt-12 text-center">
          <p className="text-[10px] font-black text-secondary-text uppercase tracking-[0.2em] mb-4">Version 2.4.0 (2026)</p>
          <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Log out from Farmer Portal</button>
        </div>
      </main>
    </FarmerLayout>
  );
}
