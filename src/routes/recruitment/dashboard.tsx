import { createFileRoute, Link } from "@tanstack/react-router";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { ArrowRight, Clock, CheckCircle2, XCircle, UserPlus, Users, ChevronRight, Briefcase, Loader2 } from "lucide-react";
import { FarmerFieldIllustration } from "@/components/illustrations/IllustrationLibrary";
import { useEffect, useState } from "react";
import { recruitmentApi } from "@/lib/api";

export const Route = createFileRoute("/recruitment/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      recruitmentApi.getDashboard(),
      recruitmentApi.getApplications(),
    ]).then(([dashRes, appRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (appRes.status === "fulfilled" && Array.isArray(appRes.value)) setApplications(appRes.value);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const totalApps = dashboard?.total_applications ?? applications.length;
  const pendingApps = dashboard?.pending_applications ?? applications.filter(a => a.status === "Pending").length;
  const approvedApps = dashboard?.approved_applications ?? applications.filter(a => a.status === "Approved").length;
  const totalEmployees = dashboard?.total_employees ?? 24;

  const kpiCards = [
    { title: "Total Applications", value: String(totalApps), color: "text-blue-600" },
    { title: "Under Review / Pending", value: String(pendingApps), color: "text-amber-600" },
    { title: "Approved Candidates", value: String(approvedApps), color: "text-[#16803A]" },
    { title: "Active Organization Size", value: String(totalEmployees), color: "text-purple-600" },
  ];

  return (
    <RecruitmentLayout>
      <div className="space-y-8 pb-10 p-4 md:p-8">
        {/* Hero Illustration Section */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-border-color shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-lg text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                <div className="w-12 h-12 bg-[#16803A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#16803A]/20">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Recruitment Command</h1>
                  <p className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">Partner Onboarding & Talent Pipeline</p>
                </div>
              </div>
              <p className="text-secondary-text font-semibold">
                Managing organizational growth and partner onboarding across Tamil Nadu agricultural districts.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <FarmerFieldIllustration className="w-full h-auto drop-shadow-xl" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </section>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map(card => (
                <div key={card.title} className="bg-white p-5 rounded-2xl border border-[#DCE8DF] shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                  <h3 className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</h3>
                </div>
              ))}
            </div>

            {/* Applications Queue Table */}
            <div className="bg-white rounded-3xl border border-[#DCE8DF] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-primary-text uppercase tracking-tight">Recent Partner & Candidate Applications</h3>
                <Link to="/recruitment/directory" className="text-xs font-black text-primary-green uppercase flex items-center gap-1 hover:underline">
                  <span>View Full Directory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="py-12 text-center text-xs text-secondary-text font-bold">
                  No active candidate applications awaiting review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-[#DCE8DF] text-[10px] font-black uppercase text-secondary-text tracking-widest">
                      <tr>
                        <th className="pb-3">Applicant Name</th>
                        <th className="pb-3">Role / Category</th>
                        <th className="pb-3">Contact Email & Phone</th>
                        <th className="pb-3">Application Date</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE8DF]">
                      {applications.slice(0, 8).map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-bold text-xs text-primary-text">{app.full_name || app.name}</td>
                          <td className="py-3 text-xs font-medium text-secondary-text">{app.role_applied || app.category || "Driver / Delivery"}</td>
                          <td className="py-3 text-xs font-mono text-slate-600">{app.email || app.phone}</td>
                          <td className="py-3 text-xs text-secondary-text">
                            {new Date(app.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                              {app.status || "Under Review"}
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
      </div>
    </RecruitmentLayout>
  );
}
