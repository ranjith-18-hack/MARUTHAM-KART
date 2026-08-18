import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { toast } from "sonner";

export function useMobileApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    // 1. Status Bar Setup
    if (isNative) {
      try {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: "#16803A" }).catch(() => {});
      } catch (e) {
        // Graceful fallback
      }
    }

    // 2. Android Hardware Back Button Handling
    const handleBackButton = (e?: any) => {
      if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
      }

      const currentPath = window.location.pathname;

      // Root pages: Double-tap to exit
      if (
        currentPath === "/" ||
        currentPath === "/home" ||
        currentPath === "/customer" ||
        currentPath === "/onboarding"
      ) {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          const capPlugins = (window as any).Capacitor?.Plugins;
          if (capPlugins?.App?.exitApp) {
            capPlugins.App.exitApp();
          } else if ((navigator as any).app?.exitApp) {
            (navigator as any).app.exitApp();
          }
        } else {
          lastBackPressTime.current = now;
          toast("Press back again to exit MARUTHAM KART", {
            duration: 2000,
          });
        }
      } else {
        // Sub-pages: Navigate back or return to /home
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigate({ to: "/home" as any });
        }
      }
    };

    document.addEventListener("backbutton", handleBackButton);
    window.addEventListener("ionBackButton", handleBackButton);

    // Also register on Capacitor's native bridge if available
    const capApp = (window as any).Capacitor?.Plugins?.App;
    let capListener: any = null;
    if (capApp?.addListener) {
      capApp.addListener("backButton", handleBackButton).then((handle: any) => {
        capListener = handle;
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener("backbutton", handleBackButton);
      window.removeEventListener("ionBackButton", handleBackButton);
      if (capListener && typeof capListener.remove === "function") {
        capListener.remove();
      }
    };
  }, [navigate]);

  return null;
}
