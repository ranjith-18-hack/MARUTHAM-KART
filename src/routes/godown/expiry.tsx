import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { batches } from "@/data/mockData";
import { Clock, Filter, Search, AlertTriangle, ShieldCheck, Thermometer, Droplets } from "lucide-react";

export const Route = createFileRoute("/godown/expiry")({
  head: () => ({
    meta: [
      { title: "Expiry & Freshness Monitor | MARUTHAM KART" },
      { name: "description", content: "Monitor product shelf life and freshness levels." },
    ],
  }),
  component: ExpiryMonitorPage,
});

function ExpiryMonitorPage() {
  const expiringSoon = batches.filter(b => b.status === 'Expiring Soon');

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Expiry & Freshness Monitor</h1>
          <p className="text-sm text-secondary-text font-bold">Proactive monitoring of product shelf life</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Expiring Today", value: "2", color: "text-red-600", bg: "bg-red-50" },
            { label: "Expiring in 3 Days", value: "5", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Expiring in 7 Days", value: "11", color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Expired Batches", value: "0", color: "text-slate-400", bg: "bg-slate-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#DCE8DF] shadow-sm">
              <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6">
              <h3 className="text-sm font-black text-primary-text uppercase tracking-tight mb-6">Immediate Attention Required</h3>
              <div className="space-y-4">
                {expiringSoon.map((batch) => (
                  <div key={batch.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-600 border border-red-100">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-red-800">{batch.productName}</h4>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Batch: {batch.id} • Expiry: {batch.expiryDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-red-800">{batch.quantity} kg</p>
                      <button className="mt-1 text-[10px] font-black text-white bg-red-600 px-3 py-1 rounded-lg uppercase tracking-tight hover:bg-red-700 transition-colors">
                        Prioritize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#DCE8DF] rounded-3xl p-6 h-fit">
            <h3 className="text-sm font-black text-primary-text uppercase tracking-tight mb-6">Quality Review Rules</h3>
            <div className="space-y-4">
              {[
                { label: "Dairy Products", rule: "Daily Review Required", icon: Thermometer },
                { label: "Fresh Vegetables", rule: "Check every 48 hours", icon: Droplets },
                { label: "Grains & Pulses", rule: "Monthly Quality Review", icon: ShieldCheck },
              ].map((rule, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-[#F5FBF7] rounded-xl border border-[#DCE8DF]">
                  <rule.icon className="w-4 h-4 text-[#16803A] mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-primary-text uppercase tracking-tight">{rule.label}</p>
                    <p className="text-[10px] font-bold text-secondary-text mt-0.5">{rule.rule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GodownLayout>
  );
}
