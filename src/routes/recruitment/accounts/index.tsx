import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { UserPlus, CheckCircle2, ShieldCheck, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { managedAccounts, auditLogs, AccountStatus } from "@/data/mockData";
import { toast } from "sonner";
import { determineEmployeeId, getPortalFromDepartment, getPermissionsFromRole } from "@/lib/auth-mapping";

export const Route = createFileRoute("/recruitment/accounts/")({
  component: AccountCreationCenter,
});

function AccountCreationCenter() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Godown Manager",
    department: "Godown",
    location: "Coimbatore",
    role: "Officer"
  });

  const pending = [
    { id: "APP-HB-1001", name: "Grand Royal Hotel", category: "Hotel / Business Partner", date: "14 Aug 2026", status: "Approved" },
    { id: "APP-VO-3012", name: "Vijay Transport", category: "Vehicle Partner", date: "11 Aug 2026", status: "Approved" },
  ];

  const handleCreateAccount = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newId = determineEmployeeId(formData.category, managedAccounts.length);
      const portal = getPortalFromDepartment(formData.department, formData.category);
      const permissions = getPermissionsFromRole(formData.category);

      const newAccount = {
        id: newId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        category: formData.category as any,
        department: formData.department as any,
        role: formData.role,
        portal: portal,
        location: formData.location,
        createdDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdBy: 'MK-REC-03',
        status: 'Active' as AccountStatus,
        verificationStatus: 'Verified' as const,
        joiningDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        permissions: permissions
      };

      managedAccounts.push(newAccount);
      
      auditLogs.push({
        action: 'Account Provisioning',
        target: newId,
        newValue: formData.department,
        performedBy: 'MK-REC-03',
        date: new Date().toISOString()
      });

      toast.success(`Account ${newId} created and portal access granted.`);
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  const portalPreview = getPortalFromDepartment(formData.department, formData.category);

  return (
    <RecruitmentLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#DCE8DF] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#DCE8DF] flex justify-between items-center">
            <div>
              <h3 className="font-black text-primary-text uppercase tracking-widest text-sm">Account Creation Center</h3>
              <p className="text-xs text-secondary-text mt-1">Approved applicants waiting for portal access credentials</p>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#F5FBF7]">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-[#DCE8DF]">
                <th className="p-4">App ID</th>
                <th className="p-4">Applicant</th>
                <th className="p-4">Account Type</th>
                <th className="p-4">Approval Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE8DF]">
              {pending.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-bold text-slate-600">{app.id}</td>
                  <td className="p-4 text-sm font-black">{app.name}</td>
                  <td className="p-4 text-xs text-secondary-text">{app.category}</td>
                  <td className="p-4 text-xs text-secondary-text">{app.date}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-green-50 text-[#16803A] text-[9px] font-black rounded-full border border-[#16803A]/20 uppercase">{app.status}</span></td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({
                          ...formData,
                          name: app.name,
                          category: app.category as any,
                          department: app.category.includes('Partner') ? 'Transport' : 'Business'
                        });
                        setShowModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#16803A] text-white text-[10px] font-black rounded-xl hover:bg-[#12662e] shadow-lg shadow-[#16803A]/10"
                    >
                      <UserPlus className="w-3 h-3" />
                      Create Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {!success ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-xl text-primary-text">Centralized Account Provisioning</h3>
                    <p className="text-xs text-secondary-text mt-1 font-bold italic">Assigning roles and portal mapping automatically.</p>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary-text flex items-center gap-1"><UserPlus className="w-2.5 h-2.5" /> Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-bold bg-[#F5FBF7]/30" 
                      placeholder="e.g. Rahul Sharma" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary-text flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Official Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-bold bg-[#F5FBF7]/30" 
                      placeholder="rahul.s@marutham.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary-text flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> Contact Number</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-bold bg-[#F5FBF7]/30" 
                      placeholder="+91 98XXX XXXXX" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary-text flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Branch Location</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-bold bg-[#F5FBF7]/30" 
                      placeholder="Coimbatore Main" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary-text">Employment Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-black bg-white"
                    >
                      <option>Godown Manager</option>
                      <option>Godown Employee</option>
                      <option>Driver</option>
                      <option>Transport Manager</option>
                      <option>Recruitment Employee</option>
                      <option>Office Employee</option>
                      <option>Hotel / Business Partner</option>
                      <option>Vehicle Partner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary-text">Assigned Department</label>
                    <select 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full p-3 border border-[#DCE8DF] rounded-xl text-sm font-black bg-white"
                    >
                      <option>Godown</option>
                      <option>Transport</option>
                      <option>Recruitment</option>
                      <option>Office</option>
                      <option>Business</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center gap-6 p-5 bg-[#F5FBF7] rounded-2xl border border-[#16803A]/10">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#DCE8DF]">
                    <ShieldCheck className="w-6 h-6 text-[#16803A]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-[#16803A] uppercase tracking-widest">Portal Access Mapping</p>
                    <p className="text-lg font-black text-primary-text leading-none mt-1">
                      {portalPreview === '/godown' ? 'Warehouse Command Center' : 
                       portalPreview === '/transport' ? 'Logistics Dashboard' :
                       portalPreview === '/driver/dashboard' ? 'Mobile Driver App' :
                       portalPreview === '/business' ? 'B2B Procurement Hub' : 'Corporate Management'}
                    </p>
                    <p className="text-[10px] font-bold text-secondary-text mt-1 italic">
                      Destination: {portalPreview}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => setShowModal(false)} 
                    disabled={isSubmitting}
                    className="flex-1 p-4 border border-[#DCE8DF] text-primary-text font-black rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateAccount} 
                    disabled={isSubmitting}
                    className="flex-1 p-4 bg-[#16803A] text-white rounded-xl font-black hover:bg-[#12662e] shadow-xl shadow-[#16803A]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Provision Account"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 text-[#16803A] rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-primary-text mb-2">Account Provisioned!</h3>
                <p className="text-sm text-secondary-text font-bold mb-8 px-10">
                  The account has been created and mapped to the {formData.department} portal. Welcome emails have been dispatched.
                </p>
                <div className="bg-[#F5FBF7] p-6 rounded-2xl border border-[#DCE8DF] mb-8 text-left max-w-sm mx-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Employee ID</span>
                    <span className="text-xs font-black text-[#16803A]">Auto-Generated</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                    <span className="text-xs font-black text-blue-600">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Portal Path</span>
                    <span className="text-xs font-black text-slate-600">{portalPreview}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setSuccess(false);
                  }} 
                  className="px-10 py-4 bg-[#16803A] text-white rounded-xl font-black hover:bg-[#12662e] shadow-lg shadow-[#16803A]/10"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </RecruitmentLayout>
  );
}

