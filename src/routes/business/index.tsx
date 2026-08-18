import { createFileRoute, useNavigate } from "@tanstack/react-router";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { useState } from "react";
import { managedAccounts } from "@/data/mockData";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/business/")({
  head: () => ({
    meta: [{ title: "Business Portal Login | MARUTHAM KART" }],
  }),
  component: BusinessLogin,
});

function BusinessLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    setTimeout(() => {
      const account = managedAccounts.find(acc => 
        (acc.id === identifier || acc.email === identifier) && 
        acc.department === 'Business'
      );
      
      if (account) {
        if (account.status !== 'Active') {
          toast.error(`Account status is ${account.status}`);
          setIsLoggingIn(false);
          return;
        }
        toast.success(`Welcome back, ${account.name}`);
        navigate({ to: "/business/dashboard" as any });
      } else {
        // Fallback for demo or normal businesses
        toast.info("Proceeding as guest business partner...");
        navigate({ to: "/business/dashboard" as any });
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={logoAsset.url} className="w-16 h-16 object-contain mix-blend-multiply mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">MARUTHAM KART BUSINESS</h1>
          <p className="text-xs font-bold text-[#16803A] uppercase tracking-[0.2em] mt-1">Bulk sourcing. Reliable supply.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Mobile / ID / Email</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Business Identifier"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]" required />
          </div>
          
          <button 
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-4 bg-[#16803A] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
          </button>

          <button type="button" className="w-full py-4 bg-white text-[#16803A] border border-[#16803A] font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-[#F5FBF7] transition-all">
            Register Your Business
          </button>
        </form>
      </div>
    </div>
  );
}

