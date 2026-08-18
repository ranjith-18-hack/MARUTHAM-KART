import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  ChevronRight,
  Bell,
  ShoppingCart,
  User,
  MapPin,
  ChevronDown,
  Warehouse,
  Truck,
  Sparkles,
  Sprout,
  Flame,
  ShieldCheck,
  Award,
} from "lucide-react";
import { BottomNav } from "@/components/customer/BottomNav";
import { ProductCard } from "@/components/customer/ProductCard";
import { FarmerFieldIllustration } from "@/components/illustrations/IllustrationLibrary";
import { LocationModal } from "@/components/customer/LocationModal";
import { useEffect, useState, useMemo } from "react";
import { catalogApi, cartApi, notificationsApi, customerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home | MARUTHAM KART" },
      {
        name: "description",
        content:
          "Fresh from farmers, for everyone. Shop authentic agricultural products directly from Tamil Nadu farmers.",
      },
      { property: "og:title", content: "Home | MARUTHAM KART" },
      {
        property: "og:description",
        content:
          "Fresh from farmers, for everyone. Shop authentic agricultural products directly from Tamil Nadu farmers.",
      },
    ],
  }),
  component: CustomerHome,
});

function CustomerHome() {
  const navigate = useNavigate();
  const { activeAddress } = useAuth();
  const [productsList, setProductsList] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [assignedGodown, setAssignedGodown] = useState<any>(null);

  const loadData = async () => {
    try {
      // Fetch initial products fast
      const prodRes = await catalogApi.getProducts({ limit: 32 }).catch((err) => {
        console.warn("Catalog fetch error:", err);
        return { items: [] };
      });

      if (prodRes && prodRes.items && prodRes.items.length > 0) {
        setProductsList(prodRes.items);
      }
      setIsLoading(false);

      // Fetch user specific data asynchronously in background
      Promise.allSettled([
        cartApi.getCart(),
        notificationsApi.getUnreadCount(),
        customerApi.getProfile(),
      ]).then(([cartRes, notifRes, profileRes]) => {
        if (cartRes.status === "fulfilled" && cartRes.value) {
          setCartCount(cartRes.value.item_count || 0);
        }
        if (notifRes.status === "fulfilled" && notifRes.value) {
          setUnreadNotifications(notifRes.value.unread_count || 0);
        }
        if (profileRes.status === "fulfilled" && profileRes.value?.assigned_godown) {
          setAssignedGodown(profileRes.value.assigned_godown);
        }
      });
    } catch (err) {
      console.warn("Failed to load home data:", err);
      setIsLoading(false);
    }
  };

  const handleCartItemAdded = () => {
    setCartCount((prev) => prev + 1);
    cartApi.getCart().then((c) => {
      if (c?.item_count !== undefined) setCartCount(c.item_count);
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [activeAddress]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate({ to: "/products", search: { search: searchQuery } as any });
    }
  };

  // Organize distinct product groups from the live API
  const vegetables = useMemo(() => {
    return productsList.filter(
      (p) =>
        (p.category || "").toLowerCase().includes("veg") ||
        (p.name || "").toLowerCase().includes("tomato") ||
        (p.name || "").toLowerCase().includes("potato") ||
        (p.name || "").toLowerCase().includes("onion") ||
        (p.name || "").toLowerCase().includes("carrot") ||
        (p.name || "").toLowerCase().includes("drumstick") ||
        (p.name || "").toLowerCase().includes("chilli") ||
        (p.name || "").toLowerCase().includes("spinach") ||
        (p.name || "").toLowerCase().includes("keerai") ||
        (p.name || "").toLowerCase().includes("brinjal") ||
        (p.name || "").toLowerCase().includes("capsicum") ||
        (p.name || "").toLowerCase().includes("cauliflower") ||
        (p.name || "").toLowerCase().includes("cabbage") ||
        (p.name || "").toLowerCase().includes("ladies finger") ||
        (p.name || "").toLowerCase().includes("ginger") ||
        (p.name || "").toLowerCase().includes("coriander")
    );
  }, [productsList]);

  const fruits = useMemo(() => {
    return productsList.filter(
      (p) =>
        (p.category || "").toLowerCase().includes("fruit") ||
        (p.name || "").toLowerCase().includes("mango") ||
        (p.name || "").toLowerCase().includes("banana") ||
        (p.name || "").toLowerCase().includes("apple") ||
        (p.name || "").toLowerCase().includes("orange") ||
        (p.name || "").toLowerCase().includes("pomegranate")
    );
  }, [productsList]);

  const dairyAndEggs = useMemo(() => {
    return productsList.filter(
      (p) =>
        (p.category || "").toLowerCase().includes("dairy") ||
        (p.category || "").toLowerCase().includes("milk") ||
        (p.name || "").toLowerCase().includes("milk") ||
        (p.name || "").toLowerCase().includes("egg") ||
        (p.name || "").toLowerCase().includes("paneer") ||
        (p.name || "").toLowerCase().includes("curd")
    );
  }, [productsList]);

  const grainsAndMillets = useMemo(() => {
    return productsList.filter(
      (p) =>
        (p.category || "").toLowerCase().includes("rice") ||
        (p.category || "").toLowerCase().includes("millet") ||
        (p.category || "").toLowerCase().includes("wheat") ||
        (p.category || "").toLowerCase().includes("flour") ||
        (p.category || "").toLowerCase().includes("pulse") ||
        (p.category || "").toLowerCase().includes("grain")
    );
  }, [productsList]);

  const organicAndOils = useMemo(() => {
    return productsList.filter(
      (p) =>
        (p.category || "").toLowerCase().includes("organic") ||
        (p.name || "").toLowerCase().includes("oil") ||
        (p.name || "").toLowerCase().includes("turmeric") ||
        (p.name || "").toLowerCase().includes("jaggery") ||
        (p.name || "").toLowerCase().includes("honey")
    );
  }, [productsList]);

  return (
    <div className="min-h-screen bg-[#F8FDF9] pb-24 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link to="/home" className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="MARUTHAM KART"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/favicon.png";
              }}
            />
            <div>
              <h1 className="text-base font-black text-emerald-900 tracking-tight uppercase leading-none">
                MARUTHAM KART
              </h1>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest block mt-0.5">
                Direct From Farmers
              </span>
            </div>
          </Link>

          {/* Action Icons */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Notifications */}
            <Link to="/notifications" className="relative group">
              <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-xs">
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
              <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white shadow-xs animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile / Account */}
            <Link
              to="/account"
              className="w-9 h-9 bg-emerald-800 border border-emerald-900 rounded-xl flex items-center justify-center text-white shadow-sm hover:scale-105 transition-all"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Dynamic Delivery Location & Godown Pill */}
        <div className="max-w-7xl mx-auto mt-2.5 flex flex-wrap items-center justify-between gap-2">
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

        {/* Search Bar */}
        <div className="mt-2.5 max-w-7xl mx-auto relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-emerald-700 transition-colors" />
          <input
            type="text"
            placeholder="Search farm fresh vegetables, rice, milk, fruits, millets... (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all shadow-xs placeholder:text-slate-400 font-medium text-xs text-slate-800"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-6 lg:p-10 relative overflow-hidden text-white shadow-md">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-700/50">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> 100% Verified Tamil Nadu Farmers
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                Fresh From Farmers, <br />
                <span className="text-emerald-300">Direct to Your Kitchen.</span>
              </h2>
              <p className="text-emerald-100/90 font-medium text-xs sm:text-sm leading-relaxed">
                Zero chemical ripening, unpolished grains, pure A2 dairy, and cold-pressed oils sourced directly from regional farming communities.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="bg-emerald-400 text-emerald-950 px-6 py-2.5 rounded-xl font-extrabold text-xs hover:bg-emerald-300 transition-all shadow-md shadow-emerald-400/20 text-center"
                >
                  Explore All Products
                </Link>
                <Link
                  to="/products"
                  search={{ category: "Vegetables" } as any}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2.5 rounded-xl font-bold text-xs transition-all text-center"
                >
                  Fresh Vegetables
                </Link>
              </div>
            </div>
            <div className="w-full max-w-xs lg:max-w-sm shrink-0">
              <FarmerFieldIllustration className="w-full h-auto drop-shadow-xl" />
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Shop By Category
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Direct agricultural harvest
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {[
              { name: "Vegetables", icon: "🥦", cat: "Vegetables" },
              { name: "Rice & Grains", icon: "🌾", cat: "Rice" },
              { name: "Flour / Atta", icon: "🥡", cat: "Flour" },
              { name: "Millets", icon: "🥣", cat: "Millets" },
              { name: "Pulses & Dal", icon: "🫘", cat: "Pulses" },
              { name: "Fruits", icon: "🍎", cat: "Fruits" },
              { name: "Dairy & Milk", icon: "🥛", cat: "Milk" },
              { name: "Organic Oils", icon: "🌿", cat: "Organic" },
            ].map((cat) => (
              <Link
                key={cat.name}
                to="/products"
                search={{ category: cat.cat } as any}
                className="group p-3 bg-white border border-slate-200/90 rounded-2xl hover:border-emerald-700 hover:shadow-md transition-all text-center space-y-1.5 block cursor-pointer"
              >
                <div className="w-10 h-10 mx-auto bg-emerald-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className="block text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 1: Fresh Vegetables */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                🥦
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Farm Fresh Vegetables
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Harvested Today Morning
                </p>
              </div>
            </div>
            <Link
              to="/products"
              search={{ category: "Vegetables" } as any}
              className="text-emerald-800 text-xs font-bold flex items-center hover:text-emerald-950 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse space-y-3">
                  <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl" />
                  <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {(vegetables.length > 0 ? vegetables.slice(0, 8) : productsList.slice(0, 8)).map((product, idx) => (
                <ProductCard key={product.id} product={product} priority={idx < 4} onAddToCart={handleCartItemAdded} />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Fresh Fruits & Dairy */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
                🥛
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Farm Dairy, Eggs & Fresh Fruits
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Pure A2 Milk, Country Eggs & Tree-Ripened Fruits
                </p>
              </div>
            </div>
            <Link
              to="/products"
              search={{ category: "Fruits" } as any}
              className="text-emerald-800 text-xs font-bold flex items-center hover:text-emerald-950 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...fruits, ...dairyAndEggs].slice(0, 8).map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} onAddToCart={handleCartItemAdded} />
            ))}
          </div>
        </section>

        {/* Section 3: Rice, Wheat, Millets & Pulses */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                🌾
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Cauvery Rice, Millets & Whole Grains
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Single-Origin Delta Harvest & Stone-Milled Flour
                </p>
              </div>
            </div>
            <Link
              to="/products"
              search={{ category: "Rice" } as any}
              className="text-emerald-800 text-xs font-bold flex items-center hover:text-emerald-950 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {grainsAndMillets.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleCartItemAdded} />
            ))}
          </div>
        </section>

        {/* Section 4: Organic Cold-Pressed Oils & Heritage Spices */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                🌿
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Wood-Pressed Oils & Organic Essentials
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Chekku Groundnut Oil, Palm Jaggery & Raw Forest Honey
                </p>
              </div>
            </div>
            <Link
              to="/products"
              search={{ category: "Organic" } as any}
              className="text-emerald-800 text-xs font-bold flex items-center hover:text-emerald-950 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {organicAndOils.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleCartItemAdded} />
            ))}
          </div>
        </section>
      </main>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
