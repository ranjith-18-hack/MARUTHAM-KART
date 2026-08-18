import { useEffect, useState } from "react";
import { WifiOff, CheckCircle2, ServerCrash } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export function NetworkStatusPill() {
  const [isOffline, setIsOffline] = useState(false);
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    let checkTimer: any;

    const checkConnectivity = async () => {
      // 1. Check real browser navigator status
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOffline(true);
        setServerUnreachable(false);
        return;
      } else {
        setIsOffline(false);
      }

      // 2. Active backend health check
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-cache",
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          if (serverUnreachable || isOffline) {
            setJustReconnected(true);
            setTimeout(() => setJustReconnected(false), 3000);
          }
          setServerUnreachable(false);
        } else {
          setServerUnreachable(true);
        }
      } catch (err) {
        // Backend ping error while device is online
        if (typeof navigator !== "undefined" && navigator.onLine) {
          setServerUnreachable(true);
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setServerUnreachable(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      checkConnectivity();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Initial check and periodic background heartbeat every 45s
    checkConnectivity();
    checkTimer = setInterval(checkConnectivity, 45000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(checkTimer);
    };
  }, []);

  if (!isOffline && !serverUnreachable && !justReconnected) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300">
      {isOffline ? (
        <div className="bg-amber-800/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-sm border border-amber-600/50">
          <WifiOff className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
          <span className="flex-1">No internet connection. Waiting for network...</span>
        </div>
      ) : serverUnreachable ? (
        <div className="bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-sm border border-slate-700">
          <ServerCrash className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="flex-1">Connecting to MARUTHAM KART servers...</span>
          <button
            onClick={() => window.location.reload()}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] font-bold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-emerald-800/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-sm border border-emerald-600/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="flex-1">Connected. Live orders & inventory synced!</span>
        </div>
      )}
    </div>
  );
}
