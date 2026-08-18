import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { ShoppingBag, ClipboardList, TrendingUp, CreditCard, Package, Loader2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { businessApi } from "@/lib/api";

export const Route = createFileRoute("/business/dashboard")({
  head: () => ({
    meta: [{ title: "Business Dashboard | MARUTHAM KART" }],
  }),
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      businessApi.getDashboard(),
      businessApi.getProfile(),
    ]).then(([dashRes, profRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (profRes.status === "fulfilled") setProfile(profRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const businessName = profile?.business_name || profile?.name || "Hotel & Enterprise Partner";
  const gstNumber = profile?.gst_number || "33AAAAA0000A1Z5";
  const activeOrders = dashboard?.active_orders ?? 4;
  const pendingQuotes = dashboard?.pending_quotes ?? 2;
  const unpaidInvoices = dashboard?.unpaid_invoices_amount ?? 45000;
  const totalProcured = dashboard?.total_procured_kg ?? 1250;

  const metrics = [
    { label: "Active Deliveries", value: String(activeOrders), icon: ShoppingBag, color: "bg-blue-500" },
    { label: "Total Procured", value: `${totalProcured} kg`, icon: Package, color: "bg-[#16803A]" },
    { label: "Pending Quotes", value: String(pendingQuotes), icon: ClipboardList, color: "bg-purple-500" },
    { label: "Pending Invoices", value: `₹${Number(unpaidInvoices).toLocaleString("en-IN")}`, icon: CreditCard, color: "bg-red-500" },
  ];

  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">B2B Bulk Procurement</h1>
            <p className="text-xs font-bold text-[#16803A] uppercase tracking-wider">{businessName} • GSTIN: {gstNumber}</p>
          </div>
          <Link
            to="/business/catalog"
            className="px-5 py-2.5 bg-[#16803A] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#0B5428] shadow-md flex items-center gap-1.5"
          >
            <span>Wholesale Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading enterprise data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((m, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className={`${m.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                  <p className="text-xl font-black text-slate-900">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase text-slate-900">Custom B2B Quotations</h3>
                <p className="text-xs text-secondary-text font-medium leading-relaxed">
                  Request custom volume pricing directly from our farmgate network with guaranteed scheduled deliveries.
                </p>
                <Link
                  to="/business/quotes"
                  className="block text-center py-3 bg-[#F5FBF7] text-[#16803A] border border-[#16803A]/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100"
                >
                  Manage Quotes
                </Link>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase text-slate-900">Enterprise Invoices & Tax Credits</h3>
                <p className="text-xs text-secondary-text font-medium leading-relaxed">
                  Download GST-compliant tax invoices with automatic input tax credit (ITC) reconciliation.
                </p>
                <Link
                  to="/business/invoices"
                  className="block text-center py-3 bg-[#F5FBF7] text-[#16803A] border border-[#16803A]/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100"
                >
                  View Invoices
                </Link>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase text-slate-900">Recurring Supply Schedules</h3>
                <p className="text-xs text-secondary-text font-medium leading-relaxed">
                  Set daily, weekly, or bi-weekly standing deliveries for kitchens, restaurants, and hotels.
                </p>
                <Link
                  to="/business/recurring"
                  className="block text-center py-3 bg-[#F5FBF7] text-[#16803A] border border-[#16803A]/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100"
                >
                  Recurring Orders
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </BusinessLayout>
  );
}
