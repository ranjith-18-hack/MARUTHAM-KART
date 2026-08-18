import { createFileRoute } from "@tanstack/react-router";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { applicants } from "@/data/mockData";

export const Route = createFileRoute("/recruitment/applications/")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return (
    <RecruitmentLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
           <h3 className="font-black text-primary-text uppercase tracking-widest text-sm">All Applications</h3>
           <div className="flex flex-wrap gap-2">
             <input type="text" placeholder="Search applications..." className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-xs outline-none focus:border-[#16803A]" />
             {['Category', 'Status', 'Location'].map(filter => (
               <select key={filter} className="px-4 py-2 border border-[#DCE8DF] rounded-xl text-xs font-bold text-slate-500 uppercase">
                 <option>{filter}</option>
               </select>
             ))}
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE8DF] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F5FBF7]">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Application ID</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Applicant / Organization</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted Date</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Officer</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE8DF]">
              {applicants.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-bold text-slate-600">{app.id}</td>
                  <td className="p-4 text-sm font-black text-primary-text">{app.name}</td>
                  <td className="p-4 text-xs text-secondary-text">{app.category}</td>
                  <td className="p-4 text-xs text-secondary-text">{app.location}</td>
                  <td className="p-4 text-xs text-secondary-text">{app.submittedDate}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-50 text-[#16803A] text-[10px] font-black rounded-full border border-[#16803A]/20 uppercase">
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-600">{app.assignedOfficer}</td>
                  <td className="p-4 text-right flex gap-2 justify-end">
                    <button className="text-[#16803A] text-[10px] font-black hover:underline uppercase">View</button>
                    <button className="text-blue-600 text-[10px] font-black hover:underline uppercase">Review</button>
                    <button className="text-red-600 text-[10px] font-black hover:underline uppercase">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
