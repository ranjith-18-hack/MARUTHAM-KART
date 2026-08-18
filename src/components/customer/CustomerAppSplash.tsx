import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sprout, Wheat, Leaf, Home, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import logoSrc from "@/assets/logo.png";

interface CustomerAppSplashProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const CustomerAppSplash = ({ onComplete, forceShow = false }: CustomerAppSplashProps) => {
  const { user, isAuthenticated } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (forceShow) return true;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("mk_customer_splash_seen") !== "true";
    }
    return true;
  });

  // Time-aware greeting for authenticated user
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = "Good day";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const firstName = user?.name ? user.name.trim().split(" ")[0] : "";
    return firstName ? `${timeGreeting}, ${firstName} 👋` : `${timeGreeting} 👋`;
  }, [user]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = prefersReducedMotion ? 1200 : 3400;

    const timer = setTimeout(() => {
      setIsVisible(false);
      try {
        sessionStorage.setItem("mk_customer_splash_seen", "true");
      } catch (e) {}
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, prefersReducedMotion, onComplete]);

  // Fast skip if user taps the screen
  const handleUserTap = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("mk_customer_splash_seen", "true");
    } catch (e) {}
    if (onComplete) onComplete();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      key="marutham-customer-splash-overlay"
      onClick={handleUserTap}
      className="fixed inset-0 z-[99999] bg-[#FAFDFB] flex flex-col items-center justify-between p-6 select-none overflow-hidden cursor-pointer"
      style={{
        paddingTop: "max(1.75rem, env(safe-area-inset-top, 28px))",
        paddingBottom: "max(1.75rem, env(safe-area-inset-bottom, 28px))",
      }}
    >
          {/* Subtle Ambient Background Contour Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1000 1000"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M-100 800 C 200 700, 400 900, 700 780 C 900 700, 1100 850, 1200 800"
                stroke="#047857"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                d="M-100 900 C 300 820, 600 960, 900 880 C 1100 830, 1200 920, 1300 890"
                stroke="#10B981"
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 2.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                d="M-50 980 C 350 920, 750 990, 1150 940"
                stroke="#065F46"
                strokeWidth="3.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 3.0, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
          </div>

          {/* Top Brand Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center pt-2"
          >
            <span className="text-[10px] font-black tracking-[0.25em] text-emerald-900 uppercase">
              Direct Agritech Marketplace
            </span>
          </motion.div>

          {/* Unified Continuous Center Stage (Zero DOM unmounting for buttery 60fps) */}
          <div className="relative w-full max-w-sm flex flex-col items-center justify-center my-auto space-y-6">
            {/* Act 1 & 2: Growing Sprout Vector */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{
                scale: [0.7, 1, 1, 0.95],
                opacity: [0, 1, 1, 0.9],
                y: [20, 0, 0, -4],
              }}
              transition={{
                duration: 3.2,
                times: [0, 0.3, 0.7, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex flex-col items-center"
            >
              {/* Soft Ambient Glow Halo */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0.7, 0.35],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-4 rounded-full bg-emerald-200/50 blur-2xl pointer-events-none"
              />

              {/* Sprout Icon & Organic SVG */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-100 shadow-md shadow-emerald-900/5 flex items-center justify-center text-emerald-800 relative z-10">
                <svg
                  className="w-10 h-10 text-emerald-800"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M7 20h10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M10 20c0-4 1.5-8 5-11"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M15 9c2-3 4.5-4 7-4-1 3-2 5.5-4 7"
                    initial={{ pathLength: 0, scale: 0 }}
                    animate={{ pathLength: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M9 13c-2-2-4-2.5-6-2.5 1 2.5 2.5 4 4.5 4.5"
                    initial={{ pathLength: 0, scale: 0 }}
                    animate={{ pathLength: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </motion.div>

            {/* Act 2: Seamless Farm-to-Home Journey Line */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full py-2 flex items-center justify-between px-4 max-w-xs"
            >
              {[
                { icon: Sprout, label: "Farm", delay: 0.9 },
                { icon: Wheat, label: "Produce", delay: 1.2 },
                { icon: Leaf, label: "Marutham", delay: 1.5 },
                { icon: Home, label: "Kitchen", delay: 1.8 },
              ].map((step) => {
                const IconComp = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: step.delay, duration: 0.5, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200/90 shadow-xs flex items-center justify-center text-emerald-800">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-950 mt-1">
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Act 3: Authentic MARUTHAM KART Logo & Typography */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center space-y-3 pt-2"
            >
              {/* Brand Logo Container */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-3 shadow-xl shadow-emerald-900/10 border border-emerald-100 flex items-center justify-center">
                  <img
                    src={logoSrc}
                    alt="MARUTHAM KART"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/logo.png";
                    }}
                  />
                </div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1 text-amber-500"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </div>

              {/* Brand Name & Tagline */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight uppercase leading-none">
                  MARUTHAM KART
                </h1>

                <p className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-emerald-800 uppercase">
                  FROM FARMERS. FOR EVERYONE.
                </p>
              </div>

              {/* Subtitle Statement or Personalized Greeting */}
              <div className="pt-0.5">
                {isAuthenticated && user?.name ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-1 text-xs font-bold text-emerald-900 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>{greeting}</span>
                  </motion.div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 0.5 }}
                    className="text-[11px] text-slate-500 font-semibold italic max-w-xs"
                  >
                    Fresh from our farmers. Straight to your home.
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bottom Progress Bar & Gentle Skip Cue */}
          <div className="w-full max-w-xs flex flex-col items-center space-y-2 pb-1">
            <div className="w-24 h-1 bg-emerald-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-emerald-700 rounded-full"
              />
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              Tap anywhere to enter
            </span>
          </div>
        </div>
  );
};
