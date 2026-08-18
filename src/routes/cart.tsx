import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, CreditCard, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/customer/BottomNav";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { EmptyStateIllustration } from "@/components/illustrations/IllustrationLibrary";
import { cartApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "My Cart | MARUTHAM KART" },
      { name: "description", content: "Review your selected farm-fresh products before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>({ items: [], item_count: 0, subtotal: 0, delivery_charge: 0, total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err: any) {
      console.warn("Error fetching cart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      setUpdatingId(itemId);
      const updated = await cartApi.updateItem(itemId, newQty);
      setCart(updated);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingId(itemId);
      const updated = await cartApi.removeItem(itemId);
      setCart(updated);
      toast.success("Item removed from cart");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  const items = cart.items || [];
  const subtotal = Number(cart.subtotal || 0);
  const delivery = Number(cart.delivery_charge || 0);
  const total = Number(cart.total || 0);

  return (
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between pb-24 md:pb-0">
      <div>
        <CustomerHeader cartCount={cart.item_count || 0} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                My Shopping Cart
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {cart.item_count || 0} farm products selected
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-800 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Loading your cart...
              </p>
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Cart Items List */}
              <div className="lg:col-span-8 space-y-3">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex space-x-4 items-center"
                  >
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 p-1">
                      <img
                        src={item.image_url || "/products/marutham_fallback.jpg"}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/products/marutham_fallback.jpg";
                        }}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">
                          {item.name}
                        </h3>
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 p-1 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-bold">
                        {item.category || "Fresh Produce"}
                      </p>
                      <div className="flex justify-between items-center pt-2">
                        <p className="font-black text-emerald-950 text-base">
                          ₹{item.price}
                          <span className="text-xs text-slate-400 font-normal"> / {item.unit || "kg"}</span>
                        </p>
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 px-2 text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-black text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 px-2 text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Order Summary & Checkout Card */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                    Order Summary
                  </h3>
                  <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Item Subtotal ({cart.item_count || 0} items)</span>
                      <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regional Delivery Charge</span>
                      <span className="font-bold text-emerald-800">
                        {delivery > 0 ? `₹${delivery.toFixed(2)}` : "FREE"}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-lg text-slate-900">
                      <span>Grand Total</span>
                      <span className="text-emerald-900">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white p-3.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Checkout (₹{total.toFixed(2)})</span>
                  </Link>

                  <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>100% Guaranteed Safe & Secure Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-xs">
              <EmptyStateIllustration type="cart" className="w-44 h-44 drop-shadow-sm" />
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Your cart is empty
                </h2>
                <p className="text-slate-500 font-semibold max-w-xs mx-auto text-xs">
                  Looks like you haven&apos;t added any fresh farm harvest goods yet.
                </p>
              </div>
              <Link
                to="/products"
                className="bg-emerald-800 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-900 transition-all shadow-md shadow-emerald-800/20"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </main>
      </div>

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}
