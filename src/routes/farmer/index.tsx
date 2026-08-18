import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { FarmerFieldIllustration } from "@/components/illustrations/IllustrationLibrary";
import { User, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/farmer/")({
  head: () => ({
    meta: [{ title: "Farmer Login | MARUTHAM KART" }],
  }),
  component: FarmerLogin,
});

function FarmerLogin() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/farmer/dashboard" as any });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-white"
    >
      {/* Left: Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-very-light-green items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#16803A_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-2xl text-center"
        >
          <FarmerFieldIllustration className="w-full h-auto drop-shadow-2xl" />
          <div className="mt-8 space-y-4">
            <h2 className="text-4xl font-black text-dark-green uppercase tracking-tight">Farmer Partnership</h2>
            <p className="text-secondary-text max-w-md mx-auto font-semibold">
              Join thousands of local farmers bringing fresh produce directly to the community. Fair pricing, digital tools, and total transparency.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img src={logoAsset.url} alt="Logo" className="w-16 h-16 mx-auto mb-6 object-contain mix-blend-multiply" />
            <h1 className="text-2xl font-black text-primary-green tracking-tight uppercase mb-1">MARUTHAM KART</h1>
            <p className="text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">Partner Portal Access</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl border border-border-color shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest ml-1">Mobile Number</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text group-focus-within:text-primary-green transition-colors">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="tel" 
                    placeholder="Registered Mobile"
                    className="w-full p-4 pl-11 bg-very-light-green border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-green outline-none transition-all placeholder:text-secondary-text/30 text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest ml-1">Security PIN</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text group-focus-within:text-primary-green transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    placeholder="••••••"
                    className="w-full p-4 pl-11 bg-very-light-green border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-green outline-none transition-all placeholder:text-secondary-text/30 text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full p-4 bg-primary-green text-white rounded-2xl font-black hover:bg-dark-green shadow-xl shadow-primary-green/10 transition-all active:scale-[0.98] text-sm tracking-wide flex items-center justify-center gap-3"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 text-center">
              <Link 
                to="/farmer/register"
                className="text-primary-green text-[10px] font-black hover:underline uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                New to Marutham Kart? Apply Now
              </Link>
            </div>
          </form>

          <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Facing issues logging in? Contact your local Regional Field Officer or visit the nearest Collection Center.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}