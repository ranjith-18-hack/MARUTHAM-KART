import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { subscribeToCartUpdates, CartEventPayload } from "@/lib/cart-events";

export function FloatingCartBar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [cartState, setCartState] = useState<{
    itemCount: number;
    subtotal: number;
    lastAddedProduct?: { name: string; price: number };
  }>({
    itemCount: 0,
    subtotal: 0,
  });

  const [isPulsing, setIsPulsing] = useState(false);

  // Hidden on checkout, cart page, login, or non-customer portals
  const isHiddenRoute =
    location.pathname === "/cart" ||
    location.pathname.startsWith("/checkout") ||
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/onboarding" ||
    location.pathname.startsWith("/business") ||
    location.pathname.startsWith("/farmer") ||
    location.pathname.startsWith("/godown") ||
    location.pathname.startsWith("/transport") ||
    location.pathname.startsWith("/office");

  // Initial load & fetch
  useEffect(() => {
    if (!isAuthenticated || isHiddenRoute) return;

    cartApi
      .getCart()
      .then((data) => {
        if (data) {
          setCartState((prev) => ({
            ...prev,
            itemCount: data.item_count || data.items?.length || 0,
            subtotal: Number(data.subtotal || 0),
          }));
        }
      })
      .catch(() => {});
  }, [isAuthenticated, location.pathname, isHiddenRoute]);

  // Subscribe to real-time additions from ProductCard or details page
  useEffect(() => {
    const unsubscribe = subscribeToCartUpdates((payload: CartEventPayload) => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 800);

      if (payload.cart) {
        setCartState({
          itemCount: payload.cart.item_count ?? payload.cart.items?.length ?? 0,
          subtotal: Number(payload.cart.subtotal ?? payload.cart.total ?? 0),
          lastAddedProduct: payload.product ? { name: payload.product.name, price: payload.product.price } : undefined,
        });
      } else {
        // Refresh from backend
        cartApi
          .getCart()
          .then((data) => {
            if (data) {
              setCartState({
                itemCount: data.item_count || data.items?.length || 0,
                subtotal: Number(data.subtotal || 0),
                lastAddedProduct: payload.product ? { name: payload.product.name, price: payload.product.price } : undefined,
              });
            }
          })
          .catch(() => {});
      }
    });

    return unsubscribe;
  }, []);

  if (isHiddenRoute || cartState.itemCount <= 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed bottom-[74px] md:bottom-6 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: isPulsing ? 1.02 : 1,
            boxShadow: isPulsing
              ? "0 20px 35px -5px rgba(6, 78, 59, 0.4), 0 10px 15px -5px rgba(6, 78, 59, 0.2)"
              : "0 15px 30px -5px rgba(2, 44, 34, 0.3), 0 8px 10px -6px rgba(2, 44, 34, 0.2)",
          }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="pointer-events-auto w-full max-w-lg bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 backdrop-blur-md"
        >
          {/* Left Info: Cart Count & Subtotal */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center text-white shadow-inner">
                <ShoppingBag className="w-5 h-5 text-emerald-100" />
              </div>
              <motion.span
                key={cartState.itemCount}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm"
              >
                {cartState.itemCount}
              </motion.span>
            </div>

            <div className="min-w-0">
              {cartState.lastAddedProduct ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <p className="text-xs font-black text-emerald-300 truncate">
                    Added {cartState.lastAddedProduct.name}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <p className="text-[11px] font-bold text-emerald-200">
                    {cartState.itemCount} {cartState.itemCount === 1 ? "item" : "items"} in cart
                  </p>
                </div>
              )}
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs text-slate-300 font-medium">Subtotal:</span>
                <span className="text-sm font-black text-white tracking-tight">
                  ₹{cartState.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: View Cart & Checkout Button */}
          <Link
            to="/cart"
            className="shrink-0 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-500/20"
          >
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 text-slate-950 font-black" />
          </Link>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
