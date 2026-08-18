import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { managedAccounts } from "@/data/mockData";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/recruitment/")({
  component: RecruitmentLogin,
});

function RecruitmentLogin() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    setTimeout(() => {
      const account = managedAccounts.find(acc => acc.id === employeeId && acc.department === 'Recruitment');
      
      if (account) {
        if (account.status !== 'Active') {
          toast.error(`Account status is ${account.status}`);
          setIsLoggingIn(false);
          return;
        }
        toast.success(`Welcome, Officer ${account.name}`);
        navigate({ to: "/recruitment/dashboard" });
      } else {
        toast.error("Invalid Recruitment Employee ID");
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F5FBF7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#DCE8DF]">
        <div className="text-center mb-8">
          <img src={logoAsset.url} alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain mix-blend-multiply" />
          <h1 className="text-2xl font-black text-[#16803A]">RECRUITMENT PORTAL</h1>
          <p className="text-secondary-text text-sm">"Account & Partner Management"</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</label>
            <input 
              type="text" 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full p-3 border border-[#DCE8DF] rounded-xl focus:ring-2 focus:ring-[#16803A]/20 focus:border-[#16803A] outline-none font-bold"
              placeholder="MK-EMP-..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-[#DCE8DF] rounded-xl focus:ring-2 focus:ring-[#16803A]/20 focus:border-[#16803A] outline-none font-bold"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full p-4 bg-[#16803A] text-white font-black rounded-xl hover:bg-[#12662e] transition-colors flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#DCE8DF] text-center text-xs text-slate-400">
          <p>Recruitment Department | Coimbatore Regional Office</p>
        </div>
      </div>
    </div>
  );
}

