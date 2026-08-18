import { createFileRoute } from "@tanstack/react-router";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { recruitmentAnalytics } from "@/data/mockData";
import { BarChart3, TrendingUp, Users, UserCheck } from "lucide-react";

export const Route = createFileRoute("/recruitment/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const stats = [
    { label: "Approval Rate", value: `${recruitmentAnalytics.stats.approvalRate}%`, icon: UserCheck, color: "text-green-600" },
    { label: "Avg Verification", value: recruitmentAnalytics.stats.avgVerificationTime, icon: TrendingUp, color: "text-blue-600" },
    { label: "Monthly Growth", value: "+12%", icon: BarChart3, color: "text-purple-600" },
    { label: "Accounts Created", value: recruitmentAnalytics.stats.accountsCreatedMonth, icon: Users, color: "text-[#16803A]" },
  ];

  return (
    <RecruitmentLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-black text-primary-text mt-1">{stat.value}</h3>
                </div>
                <div className={`p-2 bg-slate-50 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications by Category Chart Mockup */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
            <h4 className="font-black text-sm mb-6">Applications by Category</h4>
            <div className="space-y-4">
              {recruitmentAnalytics.categories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{cat.name}</span>
                    <span>{cat.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(cat.count / 250) * 100}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Activity Mockup */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
            <h4 className="font-black text-sm mb-6">Regional Performance</h4>
            <div className="space-y-3">
              {[
                { name: "Chennai", count: 145, trend: "up" },
                { name: "Coimbatore", count: 98, trend: "up" },
                { name: "Madurai", count: 64, trend: "down" },
                { name: "Trichy", count: 42, trend: "up" },
              ].map((reg, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-700">{reg.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#16803A]">{reg.count}</span>
                    <span className={`text-[10px] font-bold ${reg.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {reg.trend === 'up' ? '↑' : '↓'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
