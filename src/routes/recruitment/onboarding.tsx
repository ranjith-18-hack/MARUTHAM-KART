import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { CheckCircle2, ChevronRight, FileText, UserPlus, Shield, Clock } from "lucide-react";

export const Route = createFileRoute("/recruitment/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const [selectedCategory, setSelectedCategory] = useState<'Business' | 'Driver' | 'Vehicle' | 'Employee'>('Business');

  const checklists = {
    Business: [
      { task: "Application Approved", status: "completed" },
      { task: "Business Documents Verified", status: "completed" },
      { task: "Bank Details Linked", status: "completed" },
      { task: "Account Credentials Sent", status: "pending" },
      { task: "Business Orientation Scheduled", status: "upcoming" },
      { task: "Marketplace Activation", status: "upcoming" },
    ],
    Driver: [
      { task: "Application Approved", status: "completed" },
      { task: "Driving License Verified", status: "completed" },
      { task: "Account Credentials Sent", status: "pending" },
      { task: "Driver Orientation", status: "upcoming" },
      { task: "Vehicle Assignment", status: "upcoming" },
    ],
    Vehicle: [
      { task: "Registration Documents Verified", status: "completed" },
      { task: "Insurance & Fitness Validated", status: "completed" },
      { task: "Partner Account Created", status: "pending" },
      { task: "Physical Inspection", status: "upcoming" },
    ],
    Employee: [
      { task: "Identity Verification", status: "completed" },
      { task: "Department Assignment", status: "completed" },
      { task: "System Access Provisioning", status: "pending" },
      { task: "Employee Orientation", status: "upcoming" },
    ]
  };

  return (
    <RecruitmentLayout>
      <div className="space-y-6">
        <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
          {Object.keys(checklists).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all
                ${selectedCategory === key ? 'bg-white text-[#16803A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#DCE8DF] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#DCE8DF] flex justify-between items-center">
              <div>
                <h3 className="font-black text-primary-text">{selectedCategory} Onboarding</h3>
                <p className="text-xs text-secondary-text mt-1">Status: Account Provisioning Phase</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#16803A]">40%</span>
                <p className="text-[10px] font-black text-slate-400 uppercase">Complete</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {checklists[selectedCategory].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border
                    ${item.status === 'completed' ? 'bg-[#16803A] border-[#16803A]' : 
                      item.status === 'pending' ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'}`}>
                    {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    {item.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <span className={`text-sm font-bold ${item.status === 'upcoming' ? 'text-slate-400' : 'text-slate-700'}`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
              <h4 className="font-black text-sm mb-4">Access Assignment Overview</h4>
              <div className="p-4 bg-[#F5FBF7] rounded-xl border border-[#16803A]/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-[#16803A]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Enterprise Role</p>
                  <p className="text-[10px] font-black text-[#16803A] uppercase tracking-widest">
                    {selectedCategory === 'Employee' ? 'Operations Officer' : 'Partner Tier 1'}
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full p-4 bg-[#16803A] text-white font-black rounded-2xl shadow-lg hover:bg-[#12662e] transition-all flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              Finalize Onboarding
            </button>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
