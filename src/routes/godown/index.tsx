import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { Lock, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { managedAccounts } from "@/data/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/godown/")({
  head: () => ({
    meta: [
      { title: "Godown Login | MARUTHAM KART" },
      { name: "description", content: "Internal Warehouse Management System Login." },
    ],
  }),
  component: GodownLogin,
});

function GodownLogin() {
  const navigate = useNavigate();
  const [empId, setEmpId] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    setTimeout(() => {
      const account = managedAccounts.find(acc => acc.id === empId && acc.department === 'Godown');
      
      if (account) {
        if (account.status !== 'Active') {
          toast.error(`Account status is ${account.status}`);
          setIsLoggingIn(false);
          return;
        }
        toast.success(`Welcome, ${account.name}`);
        navigate({ to: "/godown/dashboard" });
      } else {
        toast.error("Invalid Godown Employee ID");
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F5FBF7] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-[#DCE8DF]"
      >
        <div className="text-center mb-8">
          <img src={logoAsset.url} alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain mix-blend-multiply" />
          <h1 className="text-2xl font-black text-primary-text tracking-tight uppercase">MARUTHAM KART</h1>
          <p className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em] mt-1">Godown Management</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest ml-1">Employee ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="MK-EMP-XXX"
                className="w-full bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#16803A] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#16803A] transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#16803A] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Internal Access Only • Authorized Personnel
          </p>
        </div>
      </motion.div>
    </div>
  );
}

