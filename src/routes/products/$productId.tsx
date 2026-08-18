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
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
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
          className="bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-900 transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between pb-28 md:pb-0">
      <div>
        <CustomerHeader />

        {/* Breadcrumb row */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Link to="/home" className="hover:text-emerald-800">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/products" search={{ category: product.category } as any} className="hover:text-emerald-800">
              {product.category || "Produce"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            {/* LEFT: Image Presentation & Gallery */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm overflow-hidden relative">
                {/* Main Image Frame with Controlled Height */}
                <div className="w-full h-64 sm:h-80 md:h-96 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 flex items-center justify-center relative p-4 group">
                  <img
                    src={activeImage}
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/products/marutham_fallback.jpg";
                    }}
                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Zoom Button */}
                  <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-700 shadow-sm hover:bg-white hover:text-emerald-800 transition-all cursor-pointer"
                    title="Zoom Image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Direct From Farmer Tag */}
                  <div className="absolute bottom-3 left-3 bg-emerald-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Sprout className="w-3.5 h-3.5 text-emerald-300" /> Direct Harvest
                  </div>
                </div>

                {/* Thumbnails row */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 bg-slate-50 p-1 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-emerald-700 ring-2 ring-emerald-700/20"
                            : "border-slate-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Farmer Trust Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-lg font-bold shrink-0">
                  👨‍🌾
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-900">{farmerName}</h4>
                    {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Verified Producer in {farmerLocation} • Zero Middlemen
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Product Specs, Pricing & Purchase CTA */}
            <div className="lg:col-span-6 space-y-6">
              {/* Product Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                    {product.category || "Farm Produce"}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {rating} (Customer Verified)
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-900">
                    ₹{product.price}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500">
                    / {product.unit || "kg"}
                  </span>
                  {product.mrp && Number(product.mrp) > Number(product.price) && (
                    <span className="text-xs text-slate-400 line-through font-semibold">
                      ₹{product.mrp}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Product Details & Origin
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {product.description ||
                    "Directly sourced and quality inspected at our regional godown. Cleaned, graded, and packed under strict hygiene conditions to retain maximum natural nutritional value."}
                </p>
              </div>

              {/* Quantity Selector & Action CTAs */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-50 font-bold transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center text-xs font-black text-slate-900">
                      {quantity} {product.unit || "kg"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-50 font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(false)}
                    disabled={isAdding}
                    className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 py-3 px-4 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer"
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-emerald-800" />
                    )}
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    disabled={isBuying}
                    className="flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white py-3 px-4 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-800/20 cursor-pointer"
                  >
                    {isBuying ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Buy Now & Deliver</span>
                  </button>
                </div>
              </div>

              {/* Delivery Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200/80">
                  <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold text-slate-800">Regional Godown Logistics</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold text-slate-800">100% Quality Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-96 flex items-center justify-center">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="text-center text-xs font-black text-slate-900 mt-4 uppercase">
              {product.name}
            </p>
          </div>
        </div>
      )}

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}
