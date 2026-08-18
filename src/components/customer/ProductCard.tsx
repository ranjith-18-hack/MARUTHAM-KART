import React, { useState, memo } from "react";
import { Star, CheckCircle2, MapPin, Plus, Sprout, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cartApi } from "@/lib/api";
import { toast } from "sonner";

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  category?: string;
  image_url?: string;
  image?: string;
  availability?: string;
  rating?: number;
  available_qty?: number;
  description?: string;
  quality_info?: string;
  harvest_date?: string;
  farmer_id?: string;
  farmer_name?: string;
  farmer_location?: string;
  farmer_verified?: boolean;
  farmer_code?: string;
  farmer?: {
    name?: string;
    location?: string;
    verified?: boolean;
  };
}

interface ProductCardProps {
  product: ProductItem;
  priority?: boolean;
  onAddToCart?: () => void;
}

export const ProductCard = memo(({ product, priority = false, onAddToCart }: ProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsAdding(true);
      setAddedSuccess(true);
      await cartApi.addItem(product.id, 1);
      toast.success(`Added ${product.name} to cart!`);
      if (onAddToCart) onAddToCart();
      setTimeout(() => setAddedSuccess(false), 1200);
    } catch (err: any) {
      setAddedSuccess(false);
      toast.error(err?.message || "Failed to add product to cart. Please log in.");
    } finally {
      setIsAdding(false);
    }
  };

  const getProductImage = (): string => {
    if (product.image_url && product.image_url.trim()) {
      return product.image_url;
    }
    if (product.image && product.image.trim()) {
      return product.image;
    }

    const n = (product.name || "").toLowerCase();
    const c = (product.category || "").toLowerCase();

    if (n.includes("tomato")) return "/products/country_tomatoes.jpg";
    if (n.includes("drumstick") || n.includes("murungai")) return "/products/drumsticks.jpg";
    if (n.includes("chilli") || n.includes("milagai")) return "/products/green_chillies.jpg";
    if (n.includes("ginger") || n.includes("inji")) return "/products/fresh_ginger.jpg";
    if (n.includes("ladies finger") || n.includes("okra") || n.includes("vendaikai")) return "/products/ladies_finger_okra.jpg";
    if (n.includes("brinjal") || n.includes("eggplant") || n.includes("kathirikai")) return "/products/brinjal.jpg";
    if (n.includes("capsicum") || n.includes("kuda milagai")) return "/products/capsicum.jpg";
    if (n.includes("cauliflower")) return "/products/cauliflower.jpg";
    if (n.includes("cabbage") || n.includes("muttaikose")) return "/products/cabbage.jpg";
    if (n.includes("shallot") || n.includes("sambar onion") || n.includes("chinna vengayam")) return "/products/shallots_small_onions.jpg";
    if (n.includes("coriander") || n.includes("mint") || n.includes("curry leaf") || n.includes("kothamalli")) return "/products/coriander_mint.jpg";
    if (n.includes("ponni") || n.includes("rice") || c.includes("rice")) return "/products/ponni_rice.jpg";
    if (n.includes("samba") || n.includes("seeraga")) return "/products/seeraga_samba_rice.jpg";
    if (n.includes("wheat") || c.includes("wheat")) return "/products/organic_wheat.jpg";
    if (n.includes("atta") || n.includes("flour") || c.includes("flour")) return "/products/wheat_flour_atta.jpg";
    if (n.includes("barnyard") || n.includes("kuthiraivali") || c.includes("millet")) return "/products/barnyard_millet.jpg";
    if (n.includes("ragi") || n.includes("kelvaragu") || n.includes("finger")) return "/products/finger_millet_ragi.jpg";
    if (n.includes("toor") || n.includes("dal") || c.includes("pulse")) return "/products/toor_dal.jpg";
    if (n.includes("moong") || n.includes("gram")) return "/products/moong_dal.jpg";
    if (n.includes("chana") || n.includes("chickpea")) return "/products/chickpeas.jpg";
    if (n.includes("onion") || n.includes("vengayam")) return "/products/red_onions.jpg";
    if (n.includes("potato") || n.includes("urulai")) return "/products/fresh_potatoes.jpg";
    if (n.includes("carrot")) return "/products/ooty_carrots.jpg";
    if (n.includes("spinach") || n.includes("keerai") || n.includes("palak")) return "/products/fresh_spinach.jpg";
    if (n.includes("mango") || n.includes("alphonso")) return "/products/alphonso_mangoes.jpg";
    if (n.includes("banana")) return "/products/robusta_bananas.jpg";
    if (n.includes("apple")) return "/products/shimla_apples.jpg";
    if (n.includes("orange")) return "/products/nagpur_oranges.jpg";
    if (n.includes("pomegranate") || n.includes("mathulai")) return "/products/ruby_pomegranate.jpg";
    if (n.includes("milk") || c.includes("milk") || c.includes("dairy")) return "/products/farm_cow_milk.jpg";
    if (n.includes("egg") || n.includes("muttai")) return "/products/farm_fresh_eggs.jpg";
    if (n.includes("paneer")) return "/products/fresh_paneer.jpg";
    if (n.includes("curd") || n.includes("thayir")) return "/products/fresh_curd.jpg";
    if (n.includes("groundnut") || n.includes("kadai")) return "/products/cold_pressed_groundnut_oil.jpg";
    if (n.includes("coconut oil")) return "/products/pure_coconut_oil.jpg";
    if (n.includes("coconut") || n.includes("thengai")) return "/products/fresh_coconut.jpg";
    if (n.includes("turmeric") || n.includes("manjal")) return "/products/salem_turmeric.jpg";
    if (n.includes("jaggery") || n.includes("karupatti")) return "/products/organic_palm_jaggery.jpg";
    if (n.includes("honey") || n.includes("then")) return "/products/raw_forest_honey.jpg";

    return "/products/green_vegetables.jpg";
  };

  const imageSrc = getProductImage();
  const farmerName = product.farmer_name || product.farmer?.name || "Marutham Organic Farm";
  const farmerLocation = product.farmer_location || product.farmer?.location || "Tamil Nadu";
  const isVerified = product.farmer_verified ?? (product.farmer?.verified ?? true);
  const rating = Number(product.rating || 4.9).toFixed(1);
  const availability = product.availability || (product.available_qty && product.available_qty > 0 ? "Available" : "Available");
  const isOrganic = (product.category || "").toLowerCase().includes("organic") || (product.name || "").toLowerCase().includes("organic") || isVerified;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden group hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 flex flex-col justify-between will-change-transform">
      <div>
        <Link to="/products/$productId" params={{ productId: product.id }} className="block relative">
          {/* Image Container with Controlled Aspect Ratio & Smooth Background */}
          <div className="w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/70 relative overflow-hidden flex items-center justify-center p-2.5">
            <img
              src={imageSrc}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("marutham_fallback.jpg")) {
                  target.src = "/products/marutham_fallback.jpg";
                }
              }}
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {isOrganic && (
                <div className="bg-emerald-900/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md flex items-center shadow-xs">
                  <Sprout className="w-2.5 h-2.5 mr-1 text-emerald-300" />
                  <span className="text-[8px] font-black uppercase tracking-wider">Organic</span>
                </div>
              )}
            </div>

            {/* Rating Pill */}
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-slate-200/80 shadow-xs flex items-center gap-1 z-10">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[9px] font-black text-slate-800">{rating}</span>
            </div>
          </div>
        </Link>

        {/* Product Meta & Information */}
        <div className="p-3.5 space-y-1.5">
          {/* Farm Attribution */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold leading-tight">
            <div className="flex items-center text-emerald-800 font-bold truncate max-w-[140px]">
              <span className="truncate">By {farmerName}</span>
              {isVerified && <CheckCircle2 className="w-2.5 h-2.5 ml-1 text-emerald-600 shrink-0" />}
            </div>
            <span className="text-[9px] text-slate-400 truncate max-w-[90px]">{farmerLocation.split(",")[0]}</span>
          </div>

          {/* Product Title */}
          <Link to="/products/$productId" params={{ productId: product.id }} className="block">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-800 transition-colors">
              {product.name}
            </h4>
          </Link>
        </div>
      </div>

      {/* Price & Action Area */}
      <div className="p-3.5 pt-0">
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-black text-base sm:text-lg text-emerald-900">₹{product.price}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">/ {product.unit || "kg"}</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 block -mt-0.5">Farm Direct</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              addedSuccess
                ? "bg-emerald-700 text-white shadow-emerald-700/20"
                : "bg-emerald-800 text-white hover:bg-emerald-900 hover:shadow-emerald-900/20"
            }`}
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : addedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
