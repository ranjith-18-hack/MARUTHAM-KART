import { Link } from "@tanstack/react-router";
import {
  Sprout,
  Truck,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  Heart,
  ExternalLink,
} from "lucide-react";

export function CustomerFooter() {
  return (
    <footer className="bg-emerald-950 text-white mt-12 border-t border-emerald-900/60">
      {/* 1. Value Proposition Pillars */}
      <div className="border-b border-emerald-900/60 bg-emerald-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-800/60 rounded-2xl text-emerald-300 shrink-0 border border-emerald-700/50">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Direct From Farmers
                </h4>
                <p className="text-xs text-emerald-100/70 font-medium mt-1 leading-relaxed">
                  Fair price paid directly to agricultural producers with zero middleman markups.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-800/60 rounded-2xl text-emerald-300 shrink-0 border border-emerald-700/50">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Regional Godown Routing
                </h4>
                <p className="text-xs text-emerald-100/70 font-medium mt-1 leading-relaxed">
                  Dispatched directly from your nearest localized godown for peak harvest freshness.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-800/60 rounded-2xl text-emerald-300 shrink-0 border border-emerald-700/50">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Chemical-Free Assurance
                </h4>
                <p className="text-xs text-emerald-100/70 font-medium mt-1 leading-relaxed">
                  Naturally ripened fruits, unpolished single-origin grains, and pure cold-pressed oils.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-800/60 rounded-2xl text-emerald-300 shrink-0 border border-emerald-700/50">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Verified Batch Quality
                </h4>
                <p className="text-xs text-emerald-100/70 font-medium mt-1 leading-relaxed">
                  Moisture tested, double graded, and packed in tamper-proof food-safe packaging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
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
                <span className="text-lg font-black text-white tracking-tight uppercase leading-none block">
                  MARUTHAM KART
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mt-0.5">
                  From Farmers. For Everyone.
                </span>
              </div>
            </Link>
            <p className="text-xs text-emerald-200/80 font-medium leading-relaxed max-w-sm">
              Connecting rural Tamil Nadu farmers directly to homes, hotels, and businesses through smart localized cold-chain logistics and agricultural warehouses.
            </p>
            <div className="space-y-2 pt-2 text-xs text-emerald-300/90 font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>support@maruthamkart.com</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Categories
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/70 font-medium">
              <li>
                <Link to="/products" search={{ category: "Vegetables" } as any} className="hover:text-white transition-colors">
                  Fresh Vegetables
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ category: "Rice" } as any} className="hover:text-white transition-colors">
                  Traditional Rice
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ category: "Millets" } as any} className="hover:text-white transition-colors">
                  Nutri Millets
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ category: "Pulses" } as any} className="hover:text-white transition-colors">
                  Pulses & Dal
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ category: "Milk" } as any} className="hover:text-white transition-colors">
                  Fresh Dairy & Milk
                </Link>
              </li>
              <li>
                <Link to="/products" search={{ category: "Organic" } as any} className="hover:text-white transition-colors">
                  Cold-Pressed Oils
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Customer Links
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/70 font-medium">
              <li>
                <Link to="/home" className="hover:text-white transition-colors">
                  Marketplace Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Product Catalog
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  View Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track My Orders
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-white transition-colors">
                  Profile & Saved Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Agricultural Ecosystem & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Supply Network
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/70 font-medium">
              <li>
                <Link to="/portal-select" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Farmer Direct Portal</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </Link>
              </li>
              <li>
                <Link to="/portal-select" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Godown Logistics</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </Link>
              </li>
              <li>
                <Link to="/portal-select" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Transport Fleet Hub</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </Link>
              </li>
              <li>
                <Link to="/portal-select" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Business B2B Quotes</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="border-t border-emerald-900/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300/60 font-medium">
          <p>© 2026 MARUTHAM KART. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Cultivated with pride by Tamil Nadu Farmers</span>
            <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          </p>
        </div>
      </div>
    </footer>
  );
}
