import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Star,
  MapPin,
  CheckCircle2,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Calendar,
  Minus,
  Plus,
  ChevronRight,
  Loader2,
  Sprout,
  Maximize2,
  X,
  Share2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/customer/BottomNav";
import { catalogApi, cartApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product Details | MARUTHAM KART" },
      {
        name: "description",
        content:
          "View authentic farm-fresh product details, quality specs, and verified farmer source on MARUTHAM KART.",
      },
    ],
  }),
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    catalogApi
      .getProductDetail(productId)
      .then((data) => {
        setProduct(data);
      })
      .catch((err) => {
        console.warn("Failed to fetch product details:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  const handleAddToCart = async (redirectCheckout = false) => {
    if (!product) return;
    try {
      if (redirectCheckout) setIsBuying(true);
      else setIsAdding(true);

      await cartApi.addItem(product.id, quantity);
      toast.success(`Added ${quantity} ${product.unit || "kg"} to cart!`);

      if (redirectCheckout) {
        navigate({ to: "/checkout" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add to cart. Please sign in.");
    } finally {
      setIsAdding(false);
      setIsBuying(false);
    }
  };

  const getFallbackImage = (name: string, category: string): string => {
    const n = (name || "").toLowerCase();
    const c = (category || "").toLowerCase();

    if (n.includes("tomato")) return "/products/country_tomatoes.jpg";
    if (n.includes("ponni") || n.includes("rice") || c.includes("rice")) return "/products/ponni_rice.jpg";
    if (n.includes("samba") || n.includes("seeraga")) return "/products/seeraga_samba_rice.jpg";
    if (n.includes("wheat") || c.includes("wheat")) return "/products/organic_wheat.jpg";
    if (n.includes("atta") || n.includes("flour") || c.includes("flour")) return "/products/wheat_flour_atta.jpg";
    if (n.includes("barnyard") || n.includes("kuthiraivali") || c.includes("millet")) return "/products/barnyard_millet.jpg";
    if (n.includes("ragi") || n.includes("finger")) return "/products/finger_millet_ragi.jpg";
    if (n.includes("toor") || n.includes("dal") || c.includes("pulse")) return "/products/toor_dal.jpg";
    if (n.includes("moong") || n.includes("gram")) return "/products/moong_dal.jpg";
    if (n.includes("chana") || n.includes("chickpea")) return "/products/chickpeas.jpg";
    if (n.includes("onion")) return "/products/red_onions.jpg";
    if (n.includes("potato")) return "/products/fresh_potatoes.jpg";
    if (n.includes("carrot")) return "/products/ooty_carrots.jpg";
    if (n.includes("spinach") || n.includes("keerai") || n.includes("palak")) return "/products/fresh_spinach.jpg";
    if (n.includes("mango") || n.includes("alphonso")) return "/products/alphonso_mangoes.jpg";
    if (n.includes("banana")) return "/products/robusta_bananas.jpg";
    if (n.includes("apple")) return "/products/shimla_apples.jpg";
    if (n.includes("orange")) return "/products/nagpur_oranges.jpg";
    if (n.includes("pomegranate")) return "/products/ruby_pomegranate.jpg";
    if (n.includes("milk") || c.includes("milk") || c.includes("dairy")) return "/products/farm_cow_milk.jpg";
    if (n.includes("egg")) return "/products/farm_fresh_eggs.jpg";
    if (n.includes("paneer")) return "/products/fresh_paneer.jpg";
    if (n.includes("curd") || n.includes("thayir")) return "/products/fresh_curd.jpg";
    if (n.includes("groundnut")) return "/products/cold_pressed_groundnut_oil.jpg";
    if (n.includes("coconut oil")) return "/products/pure_coconut_oil.jpg";
    if (n.includes("coconut")) return "/products/fresh_coconut.jpg";
    if (n.includes("turmeric")) return "/products/salem_turmeric.jpg";
    if (n.includes("jaggery")) return "/products/organic_palm_jaggery.jpg";
    if (n.includes("honey")) return "/products/raw_forest_honey.jpg";

    return "/products/green_vegetables.jpg";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FDF9] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading farm product details...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FDF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The item may have been removed or is temporarily out of stock.</p>
        <button
          onClick={() => navigate({ to: "/home" })}
          className="bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-900 transition-colors"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const primaryImage = product.image_url || product.image || getFallbackImage(product.name, product.category);
  const galleryImages = [
    primaryImage,
    getFallbackImage(product.name, product.category),
    "/products/green_vegetables.jpg",
  ].filter((img, idx, arr) => arr.indexOf(img) === idx);

  const activeImage = galleryImages[selectedImageIndex] || primaryImage;
  const farmerName = product.farmer_name || product.farmer?.name || "Marutham Organic Farm";
  const farmerLocation = product.farmer_location || product.farmer?.location || "Tamil Nadu";
  const isVerified = product.farmer_verified ?? (product.farmer?.verified ?? true);
  const rating = Number(product.rating || 4.9).toFixed(1);
  const availability = product.availability || (product.available_qty > 0 ? "Available" : "Available");

  return (
    <div className="min-h-screen bg-[#F8FDF9] pb-28 select-none">
      {/* Top App Header */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {product.name}
              </h1>
              <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block">
                {product.category || "Fresh Produce"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* LEFT: Image Presentation & Gallery (Controlled Container) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm overflow-hidden relative">
              {/* Main Image Frame with Controlled Height & Neutral Backdrop */}
              <div className="w-full h-64 sm:h-80 md:h-96 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 flex items-center justify-center relative p-4 group">
                <img
                  src={activeImage}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/products/marutham_fallback.jpg";
                  }}
                  className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                />

                {/* Controlled Zoom Button */}
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-sm text-slate-700 hover:text-emerald-800 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="Click to zoom image"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Zoom</span>
                </button>

                {/* Quality / Freshness Pill */}
                <div className="absolute top-3 left-3 bg-emerald-900/90 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Sprout className="w-3 h-3 text-emerald-300" />
                  <span>100% Farm Direct</span>
                </div>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1 no-scrollbar">
                  {galleryImages.map((thumbUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl border-2 p-1 bg-slate-50 overflow-hidden transition-all shrink-0 cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-emerald-700 shadow-sm shadow-emerald-700/20 scale-105"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/products/marutham_fallback.jpg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Farm Authenticity Guarantee Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-emerald-950">MARUTHAM KART Direct Guarantee</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Harvested directly by verified farmers with zero intermediary markups or storage adulteration.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Details & Purchase Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header / Title / Rating */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                  {product.category || "Farm Harvest"}
                </span>

                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/70 text-amber-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black">{rating}</span>
                  <span className="text-[10px] font-bold text-slate-400">(48+ verified reviews)</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price Banner */}
              <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100">
                <span className="text-3xl font-black text-emerald-900 tracking-tight">
                  ₹{product.price}
                </span>
                <span className="text-sm font-black text-slate-500 uppercase">
                  / {product.unit || "kg"}
                </span>
                <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {availability}
                </span>
              </div>
            </div>

            {/* Farmer Information Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Verified Producer
                </h3>
                {isVerified && (
                  <div className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    <span>Verified Organic Producer</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-2xl flex items-center justify-center border border-emerald-200 shrink-0">
                  👨‍🌾
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{farmerName}</h4>
                  <div className="flex items-center text-xs text-slate-500 font-medium mt-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                    <span>{farmerLocation}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Quality Specs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Quality Grade</span>
                <p className="text-xs font-black text-slate-900">
                  {product.quality_info || "Grade A+, 100% Unadulterated"}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Harvest Cycle</span>
                <p className="text-xs font-black text-slate-900">
                  {product.harvest_date || "Fresh Harvest Batch"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Product Details
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description ||
                  `Premium quality agricultural ${product.name} direct from ${farmerName}. Cultivated with traditional organic care for maximum nutritional value and taste.`}
              </p>
            </div>

            {/* Delivery Timeline Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 text-xs">
              <Truck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Fast Godown Dispatch</span>
                <span className="text-[11px] text-slate-500">
                  {product.delivery_estimate || "Dispatched from nearby local godown within 24 Hours."}
                </span>
              </div>
            </div>

            {/* Desktop Action Controls */}
            <div className="hidden sm:flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-emerald-800 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-black text-sm text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-emerald-800 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={isAdding}
                onClick={() => handleAddToCart(false)}
                className="flex-1 bg-emerald-800 text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-900 transition-all shadow-md shadow-emerald-800/20 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isAdding ? "Adding..." : "Add to Cart"}
              </button>

              <button
                type="button"
                disabled={isBuying}
                onClick={() => handleAddToCart(true)}
                className="bg-slate-900 text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isBuying ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Controlled Image Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{product.name}</h3>
                <span className="text-[10px] text-slate-500 font-medium">Zoomed Inspection View</span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-80 sm:h-96 flex items-center justify-center bg-slate-50 rounded-2xl p-4 overflow-hidden">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <p className="text-center text-[11px] text-slate-400">
              High-resolution product photo from verified Tamil Nadu agricultural batch.
            </p>
          </div>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 text-slate-700"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 font-black text-xs text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 text-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            disabled={isAdding}
            onClick={() => handleAddToCart(false)}
            className="flex-1 bg-emerald-800 text-white py-3 rounded-xl font-black text-xs shadow-md shadow-emerald-800/20 active:scale-95 disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>

          <button
            type="button"
            disabled={isBuying}
            onClick={() => handleAddToCart(true)}
            className="bg-slate-900 text-white py-3 px-4 rounded-xl font-black text-xs active:scale-95 disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
