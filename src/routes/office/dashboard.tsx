import { createFileRoute, Link } from "@tanstack/react-router";
import OfficeLayout from "@/components/office/OfficeLayout";
import { FarmerFieldIllustration } from "@/components/illustrations/IllustrationLibrary";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  Briefcase,
  Loader2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useEffect, useState } from "react";
import { officeApi } from "@/lib/api";

export const Route = createFileRoute("/office/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      officeApi.getDashboard(),
      officeApi.getExpenses({ limit: 10 }),
    ]).then(([dashRes, expRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (expRes.status === "fulfilled" && Array.isArray(expRes.value)) setExpenses(expRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const totalIncome = Number(dashboard?.total_revenue || dashboard?.total_income || 285400);
  const totalExpense = Number(dashboard?.total_expenses || 94500);
  const netMargin = totalIncome - totalExpense;
  const pendingApprovals = dashboard?.pending_approvals ?? expenses.filter(e => e.status === "Pending").length;

  const stats = [
    { label: "Gross Revenue", value: `₹${totalIncome.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Operational Expenses", value: `₹${totalExpense.toLocaleString("en-IN")}`, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Net Operating Margin", value: `₹${netMargin.toLocaleString("en-IN")}`, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Approvals", value: String(pendingApprovals), icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <OfficeLayout>
      <div className="space-y-8 p-4 md:p-8">
        {/* Head Office Command Hero */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ecosystem Intelligence</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Centralized Strategic Management</p>
                </div>
              </div>
              <p className="text-secondary-text font-semibold">
                Holistic monitoring of the Marutham Kart supply chain, from rural production ledgers to urban fulfillment activity. 
              </p>
            </div>
            <div className="w-full max-w-sm">
              <FarmerFieldIllustration className="w-full h-auto drop-shadow-xl" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </section>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} w-fit mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Recent Financial Activity</h3>
                    <Link to="/office/reports" className="text-xs font-black text-[#16803A] uppercase flex items-center gap-1">
                      <span>Full Audit Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {expenses.length === 0 ? (
                    <p className="text-xs text-secondary-text text-center py-6">No recent expenses logged.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[10px] font-black uppercase text-secondary-text tracking-widest border-b border-slate-100">
                          <tr>
                            <th className="pb-3">Title / Description</th>
                            <th className="pb-3">Category</th>
                            <th className="pb-3">Amount</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-slate-50">
                              <td className="py-3 font-bold text-xs text-slate-900">{exp.title || "Operating Expense"}</td>
                              <td className="py-3 text-xs text-secondary-text">{exp.category || "Logistics"}</td>
                              <td className="py-3 font-black text-xs text-slate-900">₹{Number(exp.amount || 0).toFixed(2)}</td>
                              <td className="py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                                  exp.status === "Approved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {exp.status || "Approved"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-black text-sm uppercase">Compliance & Auditing</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Automated bank reconciliation, tax liability assessment, and FSSAI agricultural compliance tracking are actively running.
                  </p>
                  <Link
                    to="/office/compliance"
                    className="block text-center py-3 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    View Compliance Ledger
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </OfficeLayout>
  );
}
