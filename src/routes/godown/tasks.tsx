import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { Clock, User, ArrowRight, Package, Truck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/godown/tasks")({
  head: () => ({
    meta: [
      { title: "Activity Log | MARUTHAM KART" },
      { name: "description", content: "Warehouse operational audit log and activity history." },
    ],
  }),
  component: ActivityLogPage,
});

function ActivityLogPage() {
  const activities = [
    { time: "10:42 AM", employee: "MK-GD-102", action: "Received 500 kg rice", location: "Zone A", status: "Completed" },
    { time: "10:15 AM", employee: "MK-GD-105", action: "Picking order ORD-MK-2045", location: "Zone B", status: "In Progress" },
    { time: "09:30 AM", employee: "MK-GD-110", action: "Quality inspection - Batch #1024", location: "Zone F", status: "Completed" },
    { time: "09:05 AM", employee: "MK-GD-102", action: "Dispatch bulk order B-ORD-7012", location: "Loading Bay 2", status: "Completed" },
    { time: "08:45 AM", employee: "MK-GD-108", action: "Moved 200kg wheat from Zone B to Zone G", location: "Zone G", status: "Completed" },
    { time: "08:20 AM", employee: "MK-GD-101", action: "System login - Shift start", location: "Office", status: "Info" },
  ];

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Activity Audit Log</h1>
          <p className="text-sm text-secondary-text font-bold">Comprehensive record of all warehouse operations</p>
        </div>

        <div className="bg-white border border-[#DCE8DF] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5FBF7] border-b border-[#DCE8DF]">
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {activities.map((activity, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{activity.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3 text-[#16803A]" />
                        <span className="text-xs font-black text-primary-text">{activity.employee}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary-text">{activity.action}</td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-text">{activity.location}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                        activity.status === 'Completed' ? 'bg-green-50 border-green-100 text-green-600' :
                        activity.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        'bg-slate-50 border-slate-100 text-slate-500'
                      } uppercase tracking-tight`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
