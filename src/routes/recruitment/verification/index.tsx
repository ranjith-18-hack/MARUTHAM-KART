import { createFileRoute } from "@tanstack/react-router";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";

export const Route = createFileRoute("/recruitment/verification/")({
  component: VerificationCenter,
});

function VerificationCenter() {
  const docs = [
    { id: "APP-HB-1001", name: "Grand Royal Hotel", category: "Hotel / Business", doc: "Business Registration", date: "12 Aug 2026", status: "Verified", officer: "Sundar C" },
    { id: "APP-HB-1001", name: "Grand Royal Hotel", category: "Hotel / Business", doc: "FSSAI License", date: "12 Aug 2026", status: "Under Review", officer: "Sundar C" },
    { id: "APP-DR-2005", name: "Suresh Kumar", category: "Driver", doc: "Driving License", date: "13 Aug 2026", status: "Submitted", officer: "Meena K" },
  ];

  return (
    <RecruitmentLayout>
      <div className="space-y-6">
        {/* KPI Dashboard */}
        <div className="grid grid-cols-5 gap-4">
            {['Pending Verification', 'Documents Submitted', 'Verified', 'Rejected', 'Resubmission Required'].map(status => (
                <div key={status} className="bg-white p-4 rounded-xl border border-[#DCE8DF] shadow-sm text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase">{status}</p>
                    <p className="text-xl font-black text-[#16803A] mt-1">4</p>
                </div>
            ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE8DF] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#DCE8DF]">
            <h3 className="font-black text-primary-text uppercase tracking-widest text-sm">Verification Dashboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F5FBF7]">
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4">App ID</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Document</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8DF]">
                {docs.map((doc, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-600">{doc.id}</td>
                    <td className="p-4 text-sm font-black text-primary-text">{doc.name}</td>
                    <td className="p-4 text-xs text-secondary-text">{doc.category}</td>
                    <td className="p-4 text-xs font-bold">{doc.doc}</td>
                    <td className="p-4 text-xs text-secondary-text">{doc.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[9px] font-black rounded-full border border-current uppercase w-fit
                        ${doc.status === 'Verified' ? 'bg-green-50 text-[#16803A]' : 
                          doc.status === 'Under Review' ? 'bg-blue-50 text-blue-600' : 
                          'bg-amber-50 text-amber-600'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 text-[10px] font-black uppercase">
                        <button className="text-[#16803A] hover:underline">View</button>
                        <button className="text-blue-600 hover:underline">Verify</button>
                        <button className="text-red-600 hover:underline">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
