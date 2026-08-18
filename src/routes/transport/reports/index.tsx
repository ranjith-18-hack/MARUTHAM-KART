import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { BarChart3, TrendingUp, Package } from "lucide-react";

export const Route = createFileRoute("/transport/reports/")({
  component: TransportReportsPage,
});

function TransportReportsPage() {
  return (
    <TransportLayout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-black text-[#17231A] tracking-tight">Analytics & Reports</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm">
            <h3 className="text-lg font-black text-[#17231A] mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-3 text-[#16803A]" />
              Delivery Efficiency
            </h3>
            <div className="h-64 flex items-center justify-center border border-dashed border-[#DCE8DF] rounded-2xl text-slate-300 font-bold">
              Mock Chart: Monthly Delivery Trends
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#DCE8DF] shadow-sm">
            <h3 className="text-lg font-black text-[#17231A] mb-6 flex items-center">
              <Package className="w-5 h-5 mr-3 text-[#16803A]" />
              Type Distribution
            </h3>
            <div className="h-64 flex items-center justify-center border border-dashed border-[#DCE8DF] rounded-2xl text-slate-300 font-bold">
              Mock Chart: Bulk vs Household
            </div>
          </div>
        </div>
      </div>
    </TransportLayout>
  );
}