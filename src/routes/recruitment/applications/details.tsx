import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { applicants } from "@/data/mockData";
import { FileText, Phone, Mail, MapPin, Calendar, User, History, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/recruitment/applications/details")({
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const app = applicants[0] || {
    id: 'APP-HB-1001',
    name: 'Grand Royal Hotel',
    category: 'Hotel / Business',
    type: 'Hotel',
    location: 'Coimbatore',
    submittedDate: '12 Aug 2026',
    status: 'Verification Pending',
    assignedOfficer: 'MK-REC-01',
    contactEmail: 'admin@grandroyal.com',
    contactPhone: '+91 98765 43210',
    documents: [],
    notes: 'Large scale requirement for vegetables and dairy.'
  };

  return (
    <RecruitmentLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#16803A]/10 flex items-center justify-center">
              <User className="w-8 h-8 text-[#16803A]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary-text">{app.name}</h2>
              <div className="flex gap-2 mt-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{app.id}</span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#F5FBF7] text-[#16803A] border border-[#16803A]/20 rounded-full uppercase">
                  {app.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-[#16803A] border border-[#16803A]/20 rounded-xl text-xs font-black uppercase hover:bg-[#16803A] hover:text-white transition-all">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-600/20 rounded-xl text-xs font-black uppercase hover:bg-amber-600 hover:text-white transition-all">
              <RefreshCcw className="w-3.5 h-3.5" /> Request Resubmission
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-600/20 rounded-xl text-xs font-black uppercase hover:bg-red-600 hover:text-white transition-all">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-[#DCE8DF] mb-4">
          {['details', 'documents', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all
                ${activeTab === tab ? 'border-[#16803A] text-[#16803A]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'details' && (
              <>
                <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
                  <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 border-b border-[#F5FBF7] pb-2">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name / Organization</p>
                      <p className="text-sm font-black text-primary-text">{app.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Category</p>
                      <p className="text-sm font-black text-primary-text">{app.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Type</p>
                      <p className="text-sm font-black text-primary-text">{app.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location</p>
                      <div className="flex items-center gap-1 text-sm font-black text-primary-text">
                        <MapPin className="w-3.5 h-3.5 text-[#16803A]" /> {app.location}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
                  <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 border-b border-[#F5FBF7] pb-2">Contact Details</h3>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</p>
                      <div className="flex items-center gap-1 text-sm font-black text-primary-text">
                        <Mail className="w-3.5 h-3.5 text-blue-500" /> {app.contactEmail}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</p>
                      <div className="flex items-center gap-1 text-sm font-black text-primary-text">
                        <Phone className="w-3.5 h-3.5 text-green-500" /> {app.contactPhone}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
                 <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Submitted Documents</h3>
                 <div className="space-y-4">
                    {app.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-[#F5FBF7] rounded-xl border border-[#DCE8DF]">
                         <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div>
                               <p className="text-xs font-black">{doc.name}</p>
                               <p className="text-[9px] text-slate-500 uppercase font-bold">{doc.type}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black text-[#16803A] uppercase border border-[#16803A]/20 px-2 py-0.5 rounded-full">{doc.status}</span>
                            <button className="text-[10px] font-black text-[#16803A] hover:underline uppercase">View</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
                 <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Application History</h3>
                 <div className="space-y-6">
                    {[
                      { event: "Application Approved", date: "16 Aug 2026", officer: "Sundar C", icon: CheckCircle2, color: "text-[#16803A]" },
                      { event: "Documents Verified", date: "15 Aug 2026", officer: "Sundar C", icon: CheckCircle2, color: "text-[#16803A]" },
                      { event: "Application Received", date: "12 Aug 2026", officer: "System", icon: Calendar, color: "text-blue-500" },
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                         <div className={`w-8 h-8 rounded-full bg-[#F5FBF7] flex items-center justify-center shrink-0 border border-[#DCE8DF] ${step.color}`}>
                            <step.icon className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-black">{step.event}</p>
                            <p className="text-[10px] text-slate-500">{step.date} • {step.officer}</p>
                         </div>
                         {idx < 2 && <div className="absolute left-4 top-8 w-0.5 h-8 bg-[#DCE8DF]"></div>}
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
               <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Internal Details</h3>
               <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Assigned Officer</p>
                    <p className="text-xs font-black text-primary-text">{app.assignedOfficer}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Submitted Date</p>
                    <p className="text-xs font-black text-primary-text">{app.submittedDate}</p>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#DCE8DF] shadow-sm">
               <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-2">Notes</h3>
               <textarea className="w-full h-32 text-xs border border-[#DCE8DF] rounded-xl p-3 outline-none focus:border-[#16803A]" placeholder="Add recruiter notes..."></textarea>
               <button className="w-full mt-2 py-2 bg-[#F5FBF7] text-[#16803A] text-[10px] font-black uppercase rounded-lg border border-[#16803A]/10 hover:bg-[#16803A] hover:text-white transition-all">Save Notes</button>
            </div>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
