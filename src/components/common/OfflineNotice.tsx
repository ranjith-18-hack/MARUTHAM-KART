import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2 text-xs font-black text-center flex items-center justify-center space-x-2 shadow-lg animate-in slide-in-from-top duration-300">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>No Internet Connection. Please check your network to sync live products and orders.</span>
    </div>
  );
}
