import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { procurementAnalytics } from "@/data/mockData";
import { BarChart3, TrendingUp, Package, PieChart } from "lucide-react";

export const Route = createFileRoute("/business/analytics")({
  head: () => ({
    meta: [{ title: "Procurement Analytics | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessAnalytics,
});

function BusinessAnalytics() {
  const maxSpending = Math.max(...procurementAnalytics.monthlySpending);

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter text-left">Procurement Analytics</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spending Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Monthly Spending</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Last 6 Months (₹)</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-300" />
            </div>
            
            <div className="h-64 flex items-end justify-between gap-4 pt-4">
              {procurementAnalytics.monthlySpending.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div 
                    className="w-full bg-[#16803A] rounded-t-xl transition-all duration-500 hover:bg-[#0B5428]"
                    style={{ height: `${(val / maxSpending) * 100}%` }}
                  ></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Month {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Consumption by Product</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Volume Analysis</p>
              </div>
              <PieChart className="w-5 h-5 text-slate-300" />
            </div>

            <div className="space-y-6">
              {procurementAnalytics.topProducts.map((p, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{p.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{p.qty} ({p.percent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-[#16803A] rounded-full"
                      style={{ width: `${p.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#F5FBF7] p-8 rounded-[2rem] border border-[#16803A]/10 space-y-2">
            <TrendingUp className="w-6 h-6 text-[#16803A]" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pt-2">Growth Rate</h4>
            <p className="text-2xl font-black text-slate-900">+12.5%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">vs Last Quarter</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-2">
            <Package className="w-6 h-6 text-[#16803A]" />
            <h4 className="text-xs font-black uppercase tracking-widest pt-2">Avg Order Value</h4>
            <p className="text-2xl font-black">₹42,800</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Consistent Procurement</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-2">
            <PieChart className="w-6 h-6 text-slate-300" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pt-2">Order Frequency</h4>
            <p className="text-2xl font-black text-slate-900">Weekly</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Procurement Cycle</p>
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}
