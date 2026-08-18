import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { History, Clock, User, Truck } from "lucide-react";
import { transportHistory } from "@/data/mockData";

export const Route = createFileRoute("/transport/history")({
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Delivery History</h1>
        <div className="bg-white border border-[#DCE8DF] rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFB] border-b border-[#DCE8DF]">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Destination</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Completed</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {transportHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-[#F8FAFB]">
                    <td className="px-8 py-6 text-sm font-black text-[#17231A]">{h.id}</td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-600">{h.destination}</td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-600">{h.type}</td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-600">{h.requiredDate}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase">{h.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}