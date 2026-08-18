import { createFileRoute, useNavigate } from "@tanstack/react-router";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { useState } from "react";
import { managedAccounts } from "@/data/mockData";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/transport/")({
  component: TransportLoginPage,
});

function TransportLoginPage() {
  const navigate = useNavigate();
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    setTimeout(() => {
      const account = managedAccounts.find(acc => acc.id === empId && acc.department === 'Transport');
      
      if (account) {
        if (account.status !== 'Active') {
          toast.error(`Account status is ${account.status}`);
          setIsLoggingIn(false);
          return;
        }
        toast.success(`Welcome, ${account.name}`);
        navigate({ to: "/transport/dashboard" });
      } else {
        toast.error("Invalid Transport Employee ID");
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#DCE8DF] p-10 rounded-[2.5rem] shadow-2xl shadow-green-900/5">
        <div className="text-center mb-10">
          <img 
            src={logoAsset.url} 
            alt="Marutham Kart Logo" 
            className="w-24 h-24 mx-auto mb-6 object-contain mix-blend-multiply" 
          />
          <h1 className="text-3xl font-black text-[#16803A] tracking-tighter leading-none mb-2">
            TRANSPORT PORTAL
          </h1>
          <div className="inline-block px-3 py-1 bg-[#EAF7EE] rounded-full">
            <p className="text-[#16803A] font-black text-[10px] uppercase tracking-[0.2em]">
              Logistics Management System
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-black text-[#17231A] uppercase tracking-widest mb-2 ml-1">
              Employee ID
            </label>
            <input 
              type="text" 
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full p-4 bg-[#F8FAFB] border border-[#DCE8DF] rounded-2xl font-bold text-[#17231A] focus:ring-2 focus:ring-[#16803A] focus:border-transparent outline-none transition-all" 
              placeholder="MK-EMP-XXX"
              required 
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs font-black text-[#17231A] uppercase tracking-widest">
                Password
              </label>
              <button type="button" className="text-[10px] font-black text-[#16803A] uppercase tracking-wider hover:underline">
                Forgot?
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-[#F8FAFB] border border-[#DCE8DF] rounded-2xl font-bold text-[#17231A] focus:ring-2 focus:ring-[#16803A] focus:border-transparent outline-none transition-all" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full p-5 bg-[#16803A] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#11662d] shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Secure Login"}
            </button>
          </div>
        </form>

        <div className="mt-10 pt-8 border-t border-[#DCE8DF] flex justify-between items-center opacity-60">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</p>
            <p className="text-xs font-bold text-[#17231A]">Coimbatore Division</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
            <p className="text-xs font-bold text-green-600 flex items-center justify-end">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Operational
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
