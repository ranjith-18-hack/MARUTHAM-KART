import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  MapPin,
  ChevronDown,
  Warehouse,
  LogOut,
  Package,
  Home,
  Grid,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cartApi, notificationsApi, customerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LocationModal } from "./LocationModal";

interface CustomerHeaderProps {
  cartCount?: number;
  onSearch?: (query: string) => void;
}

export function CustomerHeader({ cartCount: externalCartCount, onSearch }: CustomerHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeAddress, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(externalCartCount || 0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [assignedGodown, setAssignedGodown] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (externalCartCount !== undefined) {
      setCartCount(externalCartCount);
    }
  }, [externalCartCount]);

  useEffect(() => {
    // Background fetch user cart, notifications, and godown
    if (isAuthenticated) {
      Promise.allSettled([
        cartApi.getCart(),
        notificationsApi.getUnreadCount(),
        customerApi.getProfile(),
      ]).then(([cartRes, notifRes, profileRes]) => {
        if (cartRes.status === "fulfilled" && cartRes.value?.item_count !== undefined) {
          setCartCount(cartRes.value.item_count);
        }
        if (notifRes.status === "fulfilled" && notifRes.value?.unread_count !== undefined) {
          setUnreadNotifications(notifRes.value.unread_count);
        }
        if (profileRes.status === "fulfilled" && profileRes.value?.assigned_godown) {
          setAssignedGodown(profileRes.value.assigned_godown);
        }
      });
    }
  }, [isAuthenticated, activeAddress]);

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        navigate({ to: "/products", search: { search: searchQuery.trim() } as any });
      }
    }
  };

  const navLinks = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Products", path: "/products", icon: Grid },
    { label: "Categories", path: "/categories", icon: Package },
    { label: "My Orders", path: "/orders", icon: Package },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        {/* Top Navbar Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 1. Brand Logo */}
            <Link to="/home" className="flex items-center space-x-2.5 shrink-0">
              <img
                src="/logo.png"
                alt="MARUTHAM KART"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/favicon.png";
                }}
              />
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-950 tracking-tight uppercase leading-none block">
                  MARUTHAM KART
                </span>
                <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest block mt-0.5">
                  Direct From Farmers
                </span>
              </div>
            </Link>

            {/* 2. Desktop Navigation Links (hidden on mobile, visible md+) */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs"
                        : "text-slate-600 hover:text-emerald-800 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* 3. Search Bar (Desktop & Tablet) */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search farm fresh vegetables, rice, milk, pulses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 pl-10 pr-4 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
              />
            </form>

            {/* 4. Actions: Notifications, Cart, Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Notifications */}
              <Link to="/notifications" className="relative group">
                <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white shadow-xs">
                    {unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative group">
                <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-2xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white shadow-xs animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown / Link */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 bg-emerald-800 hover:bg-emerald-900 border border-emerald-900 rounded-xl text-white shadow-xs transition-all cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-bold max-w-[100px] truncate">
                      {user?.name || "Account"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-emerald-200 hidden sm:inline" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-black text-slate-900 truncate">{user?.name || "Customer"}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{user?.phone || user?.email || ""}</p>
                      </div>
                      <div className="py-1 space-y-0.5">
                        <Link
                          to="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-emerald-700" />
                          <span>My Profile & Addresses</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-emerald-700" />
                          <span>My Orders & Tracking</span>
                        </Link>
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                            navigate({ to: "/" });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Sub-row: Delivery Location & Godown Pill */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center text-xs text-slate-700 font-semibold hover:text-emerald-800 transition-colors group cursor-pointer bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-2.5 py-1"
            >
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-md">
                {activeAddress ? (
                  <>
                    <span className="font-bold text-slate-900">Deliver to: </span>
                    {activeAddress.area}, {activeAddress.city}
                  </>
                ) : (
                  <span className="text-emerald-800 font-bold">+ Add delivery location</span>
                )}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-emerald-700 transition-colors" />
            </button>

            {assignedGodown && (
              <div className="flex items-center text-[10px] text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-300/60 rounded-xl px-2.5 py-1">
                <Warehouse className="w-3 h-3 mr-1 text-emerald-700" />
                <span>
                  Fulfilling from:{" "}
                  <span className="font-extrabold text-emerald-950">
                    {assignedGodown.name || assignedGodown.location}
                  </span>{" "}
                  ({assignedGodown.estimated_distance_km} km)
                </span>
              </div>
            )}
          </div>

          {/* Mobile Search Bar (Visible only < 640px) */}
          <form onSubmit={handleSearchSubmit} className="mt-2.5 sm:hidden relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vegetables, rice, milk, pulses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
          </form>
        </div>
      </header>

      {/* Location Selector Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
}
