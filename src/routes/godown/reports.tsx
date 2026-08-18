import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { BarChart3, Download, FileText, PieChart, TrendingUp, Calendar, Filter } from "lucide-react";

export const Route = createFileRoute("/godown/reports")({
  head: () => ({
    meta: [
      { title: "Godown Reports | MARUTHAM KART" },
      { name: "description", content: "Generate and view warehouse performance and inventory reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const reports = [
    { title: "Daily Stock Report", desc: "Current inventory levels across all zones", icon: FileText },
    { title: "Inbound Report", desc: "Arrival history and inspection results", icon: TrendingUp },
    { title: "Outbound Report", desc: "Fulfillment and dispatch performance", icon: BarChart3 },
    { title: "Expiry Report", desc: "Upcoming expiry and batch status", icon: PieChart },
    { title: "Damage Report", desc: "Quality rejections and loss tracking", icon: FileText },
    { title: "Employee Performance", desc: "Task completion rates and efficiency", icon: TrendingUp },
  ];

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Management Reports</h1>
            <p className="text-sm text-secondary-text font-bold">Generate operational insights and performance reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-[#DCE8DF] bg-white rounded-xl text-xs font-black uppercase tracking-widest text-secondary-text">
              <Calendar className="w-4 h-4" />
              <span>Aug 2026</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-[#DCE8DF] bg-white rounded-xl text-xs font-black uppercase tracking-widest text-secondary-text">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, i) => (
            <div key={i} className="bg-white border border-[#DCE8DF] rounded-3xl p-6 shadow-sm hover:border-[#16803A]/30 transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#F5FBF7] rounded-2xl flex items-center justify-center text-[#16803A]">
                  <report.icon className="w-6 h-6" />
                </div>
                <button className="p-2 text-slate-300 hover:text-[#16803A] transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-sm font-black text-primary-text uppercase tracking-tight">{report.title}</h3>
              <p className="text-[10px] font-bold text-secondary-text mt-1 leading-relaxed">{report.desc}</p>
              
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Last generated: Today</span>
                <span className="text-[10px] font-black text-[#16803A] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Generate →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GodownLayout>
  );
}
