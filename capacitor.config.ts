import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.maruthamkart.customer",
  appName: "MARUTHAM KART",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#16803A",
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#FAFDFB",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
