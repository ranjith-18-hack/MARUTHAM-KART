import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, customerApi, tokenStorage, ApiError, type CustomerAddress, type CustomerProfile } from "./api";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: string;
  status: string;
  portal_redirect?: string;
  department?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
  needsOnboarding: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; role?: string; portal?: string; needsOnboarding?: boolean }>;
  loginWithOtp: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; needsOnboarding?: boolean }>;
  loginWithGoogle: (payload: { email: string; name: string; id_token?: string; google_id?: string; avatar_url?: string }) => Promise<{ success: boolean; needsOnboarding?: boolean }>;
  registerCustomer: (payload: { name: string; email?: string; phone?: string; password: string }) => Promise<{ success: boolean; needsOnboarding?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAddresses: () => Promise<void>;
  setActiveAddress: (addr: CustomerAddress) => void;
  setDefaultAddress: (id: string) => Promise<void>;
  getPortalForRole: (role: string, department?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ROLE_PORTAL_MAP: Record<string, string> = {
  CUSTOMER: "/home",
  FARMER: "/farmer/dashboard",
  GODOWN_MANAGER: "/godown/dashboard",
  GODOWN_EMPLOYEE: "/godown/dashboard",
  TRANSPORT_MANAGER: "/transport/dashboard",
  DRIVER: "/driver/dashboard",
  DELIVERY_PERSONNEL: "/driver/dashboard",
  RECRUITMENT_OFFICER: "/recruitment/dashboard",
  HOTEL_BUSINESS: "/business",
  ADMIN: "/office/dashboard",
  OFFICE_EMPLOYEE: "/office/dashboard",
};

export const getPortalForRole = (role: string, department?: string): string => {
  const normalizedRole = (role || "").toUpperCase().replace(/\s+/g, "_");
  if (ROLE_PORTAL_MAP[normalizedRole]) {
    return ROLE_PORTAL_MAP[normalizedRole];
  }
  if (department) {
    const dep = department.toLowerCase();
    if (dep.includes("godown")) return "/godown/dashboard";
    if (dep.includes("transport")) return "/transport/dashboard";
    if (dep.includes("recruitment")) return "/recruitment/dashboard";
    if (dep.includes("office") || dep.includes("finance")) return "/office/dashboard";
    if (dep.includes("business") || dep.includes("hotel") || dep.includes("sales")) return "/business";
  }
  return "/home";
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => tokenStorage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAddress, setActiveAddress] = useState<CustomerAddress | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  const fetchCustomerData = async (): Promise<boolean> => {
    try {
      const addrs = await customerApi.getAddresses();
      setAddresses(addrs);
      if (addrs && addrs.length > 0) {
        const def = addrs.find((a) => a.is_default) || addrs[0];
        setActiveAddress(def);
        setNeedsOnboarding(false);
        return true;
      } else {
        setActiveAddress(null);
        setNeedsOnboarding(true);
        return false;
      }
    } catch {
      setActiveAddress(null);
      setNeedsOnboarding(true);
      return false;
    }
  };

  const refreshUser = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setUser(null);
      setActiveAddress(null);
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    // Fast non-blocking background validation
    try {
      const profile = await authApi.getMe();
      const updatedUser: UserProfile = {
        id: profile.id,
        email: profile.email,
        phone: profile.phone,
        name: profile.name,
        role: profile.role,
        status: profile.status,
        portal_redirect: profile.portal_redirect,
      };
      setUser(updatedUser);
      tokenStorage.setUser(updatedUser);

      if (updatedUser.role.toUpperCase() === "CUSTOMER") {
        fetchCustomerData().catch(() => {});
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.includes("401") || err?.message?.includes("unauthorized")) {
        console.warn("Session expired:", err);
        tokenStorage.clear();
        setUser(null);
        setActiveAddress(null);
        setAddresses([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAddresses = async () => {
    if (user?.role.toUpperCase() === "CUSTOMER") {
      await fetchCustomerData();
    }
  };

  const setDefaultAddressHandler = async (id: string) => {
    try {
      const updated = await customerApi.setDefaultAddress(id);
      setActiveAddress(updated);
      await fetchCustomerData();
      toast.success("Delivery location updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update default address.");
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string = "") => {
    setIsLoading(true);
    try {
      const res = await authApi.login({
        identifier: identifier.trim(),
        password: password,
      });

      tokenStorage.setToken(res.access_token);
      tokenStorage.setRefreshToken(res.refresh_token);
      tokenStorage.setUser(res.user);
      setUser(res.user);

      let hasAddresses = false;
      if (res.user.role.toUpperCase() === "CUSTOMER") {
        hasAddresses = await fetchCustomerData();
      }

      const portal = getPortalForRole(res.user.role, (res.user as any).department);
      return { success: true, role: res.user.role, portal, needsOnboarding: !hasAddresses };
    } catch (error: any) {
      const msg = error instanceof ApiError ? error.message : "Invalid mobile/email or password";
      toast.error(msg);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (phone: string, otp: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({
        phone: phone.trim(),
        otp: otp.trim(),
        name,
        purpose: "login",
      });

      tokenStorage.setToken(res.access_token);
      tokenStorage.setRefreshToken(res.refresh_token);
      tokenStorage.setUser(res.user);
      setUser(res.user);

      const hasAddresses = await fetchCustomerData();
      toast.success("Signed in successfully!");
      return { success: true, needsOnboarding: !hasAddresses };
    } catch (error: any) {
      const msg = error instanceof ApiError ? error.message : "Invalid or expired OTP code";
      toast.error(msg);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (payload: { email: string; name: string; id_token?: string; access_token?: string; google_id?: string; avatar_url?: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.googleLogin(payload);

      tokenStorage.setToken(res.access_token);
      tokenStorage.setRefreshToken(res.refresh_token);
      tokenStorage.setUser(res.user);
      setUser(res.user);

      const hasAddresses = await fetchCustomerData();
      toast.success(`Welcome, ${res.user.name}!`);
      return { success: true, needsOnboarding: !hasAddresses };
    } catch (error: any) {
      const msg = error instanceof ApiError ? error.message : "Google authentication failed";
      toast.error(msg);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (payload: { name: string; email?: string; phone?: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.registerCustomer(payload);

      tokenStorage.setToken(res.access_token);
      tokenStorage.setRefreshToken(res.refresh_token);
      tokenStorage.setUser(res.user);
      setUser(res.user);

      setNeedsOnboarding(true);
      toast.success("Account created successfully!");
      return { success: true, needsOnboarding: true };
    } catch (error: any) {
      const msg = error instanceof ApiError ? error.message : "Registration failed";
      toast.error(msg);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      tokenStorage.clear();
      setUser(null);
      setActiveAddress(null);
      setAddresses([]);
      setNeedsOnboarding(false);
      toast.info("You have been signed out.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!tokenStorage.getToken(),
        isLoading,
        activeAddress,
        addresses,
        needsOnboarding,
        login,
        loginWithOtp,
        loginWithGoogle,
        registerCustomer,
        logout,
        refreshUser,
        refreshAddresses,
        setActiveAddress,
        setDefaultAddress: setDefaultAddressHandler,
        getPortalForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
