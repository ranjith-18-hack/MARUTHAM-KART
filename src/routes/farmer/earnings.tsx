import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Download, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { farmerApi } from "@/lib/api";

export const Route = createFileRoute("/farmer/earnings")({
  head: () => ({
    meta: [{ title: "Earnings | Farmer Portal" }],
  }),
  component: FarmerEarnings,
});

function FarmerEarnings() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      farmerApi.getDashboard(),
      farmerApi.getPayouts(),
    ]).then(([dashRes, payRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (payRes.status === "fulfilled" && Array.isArray(payRes.value)) setPayouts(payRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const totalRevenue = Number(dashboard?.total_revenue || 0);
  const pendingPayments = Number(dashboard?.pending_payouts || 0);
  const totalSettled = totalRevenue - pendingPayments;

  const stats = [
    { label: "Total Revenue Earned", value: `₹${totalRevenue.toLocaleString("en-IN")}`, change: "+100% Verified", trend: "up" },
    { label: "Settled Payouts", value: `₹${Math.max(0, totalSettled).toLocaleString("en-IN")}`, change: "NEFT Transferred", trend: "up" },
    { label: "Pending Disbursements", value: `₹${pendingPayments.toLocaleString("en-IN")}`, change: "Processing", trend: "down" },
    { label: "Active Harvest Batches", value: String(dashboard?.batches_count || 0), change: "Direct Sourced", trend: "up" },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Earnings & Payouts Ledger</h1>
          <button className="bg-[#16803A] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-[#16803A]/20">
            <Download className="w-4 h-4" />
            <span>Download Ledger</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading earnings records...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-border-color shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-primary-text mt-1">{stat.value}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-primary-green" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'text-primary-green' : 'text-amber-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payout Transactions Table */}
            <div className="bg-white p-6 rounded-3xl border border-border-color shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-primary-text uppercase tracking-widest">Disbursement & Payout Transactions</h3>
                <span className="text-xs text-secondary-text font-bold uppercase tracking-wider">{payouts.length} Records</span>
              </div>

              {payouts.length === 0 ? (
                <div className="py-12 text-center text-xs text-secondary-text font-medium">
                  No payout disbursements recorded yet. Payouts will appear here as orders are fulfilled and settled.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-[#F5FBF7] border-b border-border-color">
                      <tr>
                        {['Date', 'Batch / Crop', 'Amount', 'Mode', 'Transaction Ref', 'Status'].map(h => (
                          <th key={h} className="p-3 text-[10px] font-black text-secondary-text uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {payouts.map((p, i) => (
                        <tr key={i} className="hover:bg-[#F5FBF7] transition-colors">
                          <td className="p-3 text-xs font-bold text-secondary-text">
                            {new Date(p.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-3 font-bold text-xs text-primary-text">{p.batch_code || "Harvest Procurement"}</td>
                          <td className="p-3 font-black text-xs text-primary-green">₹{Number(p.amount || 0).toFixed(2)}</td>
                          <td className="p-3 text-xs font-medium text-secondary-text">{p.payment_method || "NEFT / Bank Transfer"}</td>
                          <td className="p-3 font-mono text-[10px] text-secondary-text">{p.transaction_reference || `TXN-${p.id?.slice(0, 8).toUpperCase()}`}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              p.status === "Completed" ? "bg-very-light-green text-primary-green" : "bg-amber-50 text-amber-600"
                            }`}>
                              {p.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </FarmerLayout>
  );
}
