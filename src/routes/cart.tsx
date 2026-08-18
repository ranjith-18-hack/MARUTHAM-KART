import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/customer/BottomNav";
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
    <div className="min-h-screen bg-very-light-green pb-24">
      <header className="bg-white p-4 border-b border-border-color sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center">
          <button onClick={() => window.history.back()} className="p-2 -ml-2 text-primary-text hover:text-primary-green">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black text-primary-text ml-2">My Cart ({cart.item_count || 0})</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading your cart...</p>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-border-color flex space-x-4">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-3xl overflow-hidden shrink-0 p-1">
                    <img
                      src={item.image_url || "/products/marutham_fallback.jpg"}
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/products/marutham_fallback.jpg";
                      }}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-primary-text">{item.name}</h3>
                      <button 
                        disabled={updatingId === item.id}
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-secondary-text p-1 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-secondary-text font-medium">{item.category || "Fresh Harvest"}</p>
                    <div className="flex justify-between items-end mt-2">
                      <p className="font-black text-primary-green text-sm">
                        ₹{item.price}<span className="text-[10px] text-secondary-text font-normal"> / {item.unit || "Kg"}</span>
                      </p>
                      <div className="flex items-center border border-border-color rounded-lg bg-very-light-green">
                        <button 
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 px-2 text-primary-green hover:bg-white rounded-l transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-black">{item.quantity}</span>
                        <button 
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 px-2 text-primary-green hover:bg-white rounded-r transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border-color space-y-4">
              <h3 className="font-black text-primary-text">Bill Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-secondary-text font-medium">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary-text font-medium">
                  <span>Delivery Fee</span>
                  <span>{delivery > 0 ? `₹${delivery.toFixed(2)}` : "FREE"}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-border-color flex justify-between font-black text-lg text-primary-text">
                  <span>Grand Total</span>
                  <span className="text-primary-green">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link 
              to="/checkout"
              className="w-full bg-primary-green text-white p-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-lg hover:bg-dark-green transition-all active:scale-[0.98]"
            >
              <CreditCard className="w-5 h-5" />
              <span>Proceed to Checkout (₹{total.toFixed(2)})</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
            <EmptyStateIllustration type="cart" className="w-48 h-48 drop-shadow-sm" />
            <div className="space-y-2">
              <h2 className="text-xl font-black text-primary-text uppercase tracking-tight">Your cart is empty</h2>
              <p className="text-secondary-text font-semibold max-w-xs mx-auto text-sm">
                Looks like you haven't added any fresh farm goodness yet.
              </p>
            </div>
            <Link to="/home" className="bg-primary-green text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-dark-green transition-all shadow-lg shadow-primary-green/20">
              Start Shopping
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
