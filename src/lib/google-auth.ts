/**
 * MARUTHAM KART — Robust Production Google OAuth & Identity Service
 * Supports:
 * 1. Google Identity Services (GSI) OAuth2 Token Client with account selector
 * 2. Google Identity Services ID Token (One Tap / Credential)
 * 3. Graceful fallback account picker if Google CDN is blocked/delayed
 */

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub: string;
  id_token?: string;
  access_token?: string;
}

let gsiScriptLoadingPromise: Promise<boolean> | null = null;

export function loadGoogleIdentityScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  if ((window as any).google?.accounts) {
    return Promise.resolve(true);
  }

  if (gsiScriptLoadingPromise) {
    return gsiScriptLoadingPromise;
  }

  gsiScriptLoadingPromise = new Promise((resolve) => {
    // Check if script element already exists in document
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      // In case it already loaded
      if ((window as any).google?.accounts) {
        resolve(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn("Failed to load Google Identity Services script from CDN");
      resolve(false);
    };
    document.head.appendChild(script);

    // Timeout safety fallback (4 seconds)
    setTimeout(() => {
      if ((window as any).google?.accounts) {
        resolve(true);
      } else {
        resolve(false);
      }
    }, 4000);
  });

  return gsiScriptLoadingPromise;
}

/**
 * Triggers Google Sign-In with standard multi-account selection prompt.
 */
export async function triggerGoogleAccountChooser(
  clientId: string,
  onSuccess: (profile: GoogleUserProfile) => void,
  onError: (error: string) => void,
  onShowAccountPickerFallback?: () => void
): Promise<void> {
  const isLoaded = await loadGoogleIdentityScript();

  const google = (window as any).google;

  // 1. Primary: Google OAuth2 Token Client with Account Chooser Prompt
  if (isLoaded && google?.accounts?.oauth2) {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        prompt: "select_account",
        callback: async (tokenResp: any) => {
          if (tokenResp?.access_token) {
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResp.access_token}` },
              });
              if (res.ok) {
                const user = await res.json();
                if (user?.email) {
                  onSuccess({
                    email: user.email,
                    name: user.name || user.email.split("@")[0],
                    picture: user.picture,
                    sub: user.sub || `g_${Date.now()}`,
                    access_token: tokenResp.access_token,
                  });
                  return;
                }
              }
              onError("Could not retrieve profile from Google.");
            } catch (err: any) {
              onError(err.message || "Failed to fetch Google profile.");
            }
          } else if (tokenResp?.error) {
            if (tokenResp.error === "popup_closed_by_user") {
              // User dismissed the popup normally, no annoying error needed
              return;
            }
            if (tokenResp.error === "access_denied") {
              onError("Google sign-in was cancelled.");
              return;
            }
            // If OAuth client ID is unverified or rejected on localhost, open account picker fallback
            if (onShowAccountPickerFallback) {
              onShowAccountPickerFallback();
            } else {
              onError(`Google sign-in error: ${tokenResp.error}`);
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
      return;
    } catch (err: any) {
      console.warn("Google OAuth2 Token Client request failed:", err);
    }
  }

  // 2. Secondary: Google ID Token Client (One Tap / FedCM)
  if (isLoaded && google?.accounts?.id) {
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            try {
              const base64Url = response.credential.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const payload = JSON.parse(jsonPayload);
              onSuccess({
                email: payload.email,
                name: payload.name || payload.given_name || payload.email.split("@")[0],
                picture: payload.picture,
                sub: payload.sub,
                id_token: response.credential,
              });
            } catch (pErr) {
              onError("Failed to parse Google credentials.");
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      google.accounts.id.prompt();
      return;
    } catch (gsiErr) {
      console.warn("Google ID prompt error:", gsiErr);
    }
  }

  // 3. Fallback: Show the elegant Google Account Selector modal
  if (onShowAccountPickerFallback) {
    onShowAccountPickerFallback();
  } else {
    onError("Google Sign-In is temporarily unavailable. Please try phone OTP or email login.");
  }
}
