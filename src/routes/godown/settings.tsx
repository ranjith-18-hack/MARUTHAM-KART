import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { Settings, Shield, Bell, User, Database, Smartphone } from "lucide-react";

export const Route = createFileRoute("/godown/settings")({
  head: () => ({
    meta: [
      { title: "Warehouse Settings | MARUTHAM KART" },
      { name: "description", content: "Configure warehouse operational parameters and security." },
    ],
  }),
  component: GodownSettingsPage,
});

function GodownSettingsPage() {
  const sections = [
    { title: "Operational Profile", icon: User, desc: "Godown details and officer management" },
    { title: "Notification Config", icon: Bell, desc: "Manage threshold alerts and employee notifications" },
    { title: "Security & Access", icon: Shield, desc: "Terminal permissions and employee ID management" },
    { title: "Storage Parameters", icon: Database, desc: "Set zone capacities and temperature thresholds" },
    { title: "Mobile Terminals", icon: Smartphone, desc: "Manage handheld scanners and mobile tablets" },
  ];

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">System Settings</h1>
          <p className="text-sm text-secondary-text font-bold">Warehouse configuration and management parameters</p>
        </div>

        <div className="max-w-3xl space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm hover:border-[#16803A]/20 transition-all flex items-center justify-between cursor-pointer group">
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-[#F5FBF7] rounded-2xl flex items-center justify-center text-[#16803A] group-hover:bg-[#16803A] group-hover:text-white transition-all">
                  <section.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-primary-text uppercase tracking-tight">{section.title}</h3>
                  <p className="text-[10px] font-bold text-secondary-text mt-1">{section.desc}</p>
                </div>
              </div>
              <Settings className="w-5 h-5 text-slate-300 group-hover:text-[#16803A] transition-all" />
            </div>
          ))}
        </div>
      </div>
    </GodownLayout>
  );
}
