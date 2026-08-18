import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { AlertTriangle, Bell, Clock, Info, CheckCircle2, MoreVertical } from "lucide-react";

export const Route = createFileRoute("/godown/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Center | MARUTHAM KART" },
      { name: "description", content: "Real-time warehouse operational alerts and notifications." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const alerts = [
    { type: 'warning', text: '18 batches are approaching expiry.', time: '10 mins ago', category: 'Inventory' },
    { type: 'danger', text: 'Zone A is 90% occupied.', time: '25 mins ago', category: 'Capacity' },
    { type: 'info', text: 'Order MK-2045 is waiting for stock allocation.', time: '45 mins ago', category: 'Orders' },
    { type: 'warning', text: 'Cold Storage 02 temperature high (6°C).', time: '2 hrs ago', category: 'Environment' },
    { type: 'info', text: '12 outbound orders are ready for dispatch.', time: '3 hrs ago', category: 'Dispatch' },
    { type: 'success', text: 'Inbound delivery IN-101 processed successfully.', time: '4 hrs ago', category: 'Inbound' },
  ];

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Alert Center</h1>
            <p className="text-sm text-secondary-text font-bold">Monitor operational anomalies and status updates</p>
          </div>
          <button className="text-xs font-black text-[#16803A] uppercase tracking-widest hover:underline">Mark all as read</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm hover:border-[#16803A]/20 transition-all flex items-start gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                alert.type === 'danger' ? 'bg-red-50 text-red-500' : 
                alert.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                alert.type === 'success' ? 'bg-green-50 text-green-600' :
                'bg-blue-50 text-blue-500'
              }`}>
                {alert.type === 'danger' || alert.type === 'warning' ? <AlertTriangle className="w-7 h-7" /> : 
                 alert.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <Info className="w-7 h-7" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    alert.type === 'danger' ? 'text-red-500' : 
                    alert.type === 'warning' ? 'text-amber-500' : 
                    alert.type === 'success' ? 'text-green-600' :
                    'text-blue-500'
                  }`}>{alert.category}</span>
                  <div className="flex items-center text-slate-300 space-x-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{alert.time}</span>
                  </div>
                </div>
                <p className="text-sm font-black text-primary-text leading-tight">{alert.text}</p>
                <div className="mt-4 flex items-center space-x-4">
                  <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest hover:underline">Acknowledge</button>
                  <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline">View Details</button>
                </div>
              </div>

              <button className="p-2 text-slate-300 hover:text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </GodownLayout>
  );
}
