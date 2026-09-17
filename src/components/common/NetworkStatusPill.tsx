import { useEffect, useState } from "react";
import { WifiOff, CheckCircle2 } from "lucide-react";

export function NetworkStatusPill() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };

    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !justReconnected) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300 pointer-events-none">
      {isOffline ? (
        <div className="bg-amber-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-sm border border-amber-600/50 pointer-events-auto">
          <WifiOff className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
          <span className="flex-1">No internet connection. Waiting for network...</span>
        </div>
      ) : (
        <div className="bg-emerald-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-sm border border-emerald-600/50 pointer-events-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="flex-1">Back online. Everything synced!</span>
        </div>
      )}
    </div>
  );
}
