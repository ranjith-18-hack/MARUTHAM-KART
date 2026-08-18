import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Clock, 
  Truck,
  CheckCircle,
  Flag,
  Navigation2,
  Package
} from "lucide-react";

import { useState, useEffect } from "react";

export const Route = createFileRoute("/driver/navigation")({
  component: DriverNavigation,
});

function DriverNavigation() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simple animation for progress bar
  useEffect(() => {
    let timer: any;
    if (isNavigating && progress < 100) {
      timer = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 100));
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isNavigating, progress]);




  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24 flex flex-col">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 p-6 z-20 flex items-center justify-between">
        <Link to="/driver/dashboard" className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
          <ArrowLeft className="w-5 h-5 text-[#16803A]" />
        </Link>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-primary-text uppercase tracking-widest">Live Route</span>
        </div>
      </header>

      {/* Mock Map View */}
      <div className="flex-1 relative bg-slate-200 overflow-hidden">
        {/* Mock Map Background Grid */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-12 opacity-10">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="border border-slate-900" />
          ))}
        </div>

        {/* Mock Roads */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
          {/* Main Road */}
          <path 
            d="M50,100 L150,250 L250,200 L300,450 L100,550" 
            fill="none" 
            stroke="#cbd5e1" 
            strokeWidth="30" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Active Route Path */}
          <motion.path 
            d="M50,100 L150,250 L250,200 L300,450 L100,550" 
            fill="none" 
            stroke="#16803A" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ type: "tween" }}
          />

          {/* Markers */}
          <circle cx="50" cy="100" r="8" fill="#16803A" /> {/* Start */}
          <circle cx="100" cy="550" r="8" fill="#ef4444" /> {/* End */}
          
          {/* Current Vehicle Position */}
          <motion.g 
            style={{ 
              offsetPath: "path('M50,100 L150,250 L250,200 L300,450 L100,550')",
              offsetDistance: `${progress}%`
            }}
          >
            <circle r="15" fill="#16803A" fillOpacity="0.2" />
            <circle r="8" fill="#16803A" />
            <Navigation2 className="w-4 h-4 text-white -translate-x-2 -translate-y-2 rotate-45" />
          </motion.g>
        </svg>

        {/* UI Elements on Map */}
        <div className="absolute inset-x-6 bottom-32 space-y-4">
          {/* Route Milestones */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white/50 shadow-xl">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#16803A]" />
                <div className="w-0.5 h-10 bg-[#16803A]/30" />
                <div className="w-3 h-3 rounded-full border-2 border-[#16803A] bg-white" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-secondary-text uppercase mb-0.5">Pickup Location</p>
                  <p className="text-sm font-black text-primary-text">Coimbatore Godown</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-secondary-text uppercase mb-0.5">Current Route</p>
                  <p className="text-sm font-black text-primary-text">Avinashi Road → Tiruppur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="bg-white p-6 rounded-t-[2.5rem] shadow-2xl z-20 border-t border-[#DCE8DF]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="p-4 bg-[#F5FBF7] rounded-2xl border border-[#DCE8DF]">
              <Clock className="w-6 h-6 text-[#16803A]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest mb-1">Time Remaining</p>
              <p className="text-xl font-black text-primary-text">18 <span className="text-sm">mins</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest mb-1">Distance</p>
            <p className="text-xl font-black text-[#16803A]">4.2 <span className="text-sm">km</span></p>
          </div>
        </div>

        <div className="flex gap-3">
          {!isNavigating ? (
            <button 
              onClick={() => setIsNavigating(true)}
              className="flex-1 py-5 bg-[#16803A] text-white font-black rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-3"
            >
              Start Navigation <Navigation className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsNavigating(false)}
              className="flex-1 py-5 bg-white border-2 border-[#16803A] text-[#16803A] font-black rounded-2xl flex items-center justify-center gap-3"
            >
              Stop Navigation
            </button>
          )}
          <button className="p-5 bg-white border border-[#DCE8DF] rounded-2xl text-primary-text">
            <Flag className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DCE8DF] px-6 py-4 z-50 flex justify-between items-center">
        <NavButton icon={<Truck className="w-6 h-6" />} label="Dashboard" to="/driver/dashboard" />
        <NavButton icon={<Package className="w-6 h-6" />} label="Deliveries" to="/driver/deliveries" />
        <NavButton active icon={<MapPin className="w-6 h-6" />} label="Route" to="/driver/navigation" />
        <NavButton icon={<div className="w-6 h-6 rounded-full bg-slate-200 border border-[#DCE8DF] flex items-center justify-center text-[10px] font-black text-[#16803A]">A</div>} label="Profile" to="/driver/profile" />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, to }: any) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#16803A]' : 'text-slate-400 opacity-60'}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
