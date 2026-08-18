import { createFileRoute } from "@tanstack/react-router";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";

export const Route = createFileRoute("/recruitment/settings")({
  component: RecruitmentSettings,
});

function RecruitmentSettings() {
  return (
    <RecruitmentLayout>
      <div className="max-w-2xl bg-white rounded-2xl border border-[#DCE8DF] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#DCE8DF]">
          <h3 className="font-black text-primary-text">Portal Settings</h3>
        </div>
        <div className="p-6 space-y-8">
          <section>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profile Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Name</label>
                  <input type="text" className="w-full p-2 border border-[#DCE8DF] rounded-lg text-sm bg-slate-50" value="Sundar C" readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Employee ID</label>
                  <input type="text" className="w-full p-2 border border-[#DCE8DF] rounded-lg text-sm bg-slate-50" value="MK-REC-01" readOnly />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Office Location</label>
                <input type="text" className="w-full p-2 border border-[#DCE8DF] rounded-lg text-sm bg-slate-50" value="Coimbatore Regional Office" readOnly />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Account Categories Management</h4>
            <div className="space-y-2">
              {['Hotel / Business', 'Driver', 'Vehicle Owner / Transport Partner', 'Employee'].map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 border border-[#DCE8DF] rounded-xl bg-slate-50/50">
                  <span className="text-sm font-bold text-slate-700">{cat}</span>
                  <span className="text-[10px] font-black text-[#16803A] uppercase">Active</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-tight italic">
              * Note: Farmer onboarding is managed via separate Head Office portal settings.
            </p>
          </section>

          <section>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Security</h4>
            <button className="text-xs font-black text-red-600 hover:underline">Change Portal Password</button>
          </section>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
