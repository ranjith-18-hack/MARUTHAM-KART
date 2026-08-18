import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { AlertCircle, FileText, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/transport/alerts/")({
  component: TransportAlertsPage,
});

function TransportAlertsPage() {
  const alerts = [
    { type: 'Maintenance', msg: 'Vehicle MK-V-104 requires service within 24 hours.', time: '10:32 AM' },
    { type: 'Delay', msg: 'Order MK-BULK-1032 delayed in Tiruppur due to heavy traffic.', time: '09:45 AM' },
    { type: 'Compliance', msg: 'Driver MK-D-102 license renewal due next week.', time: 'Yesterday' }
  ];

  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Operational Alerts</h1>
        <div className="space-y-4">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center p-6 bg-white border border-[#DCE8DF] rounded-[2rem] shadow-sm hover:border-[#16803A]">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl mr-6">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-[#17231A]">{a.type}</h4>
                <p className="text-xs font-bold text-slate-500 mt-1">{a.msg}</p>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.time}</p>
            </div>
          ))}
        </div>
      </div>
    </TransportLayout>
  );
}