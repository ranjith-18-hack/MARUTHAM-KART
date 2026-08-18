import { createFileRoute, Link } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { Search, PackagePlus, Eye, History, Loader2, X, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { godownApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/godown/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Management | MARUTHAM KART" },
      { name: "description", content: "Real-time stock management, adjustments, and transfers." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<string>("ADD");
  const [adjustQty, setAdjustQty] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>("Stock arrival verification");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInventory = async (search?: string) => {
    try {
      setIsLoading(true);
      const res = await godownApi.getInventory({ search: search || undefined, limit: 200 });
      if (res && res.items) {
        setItems(res.items);
      }
    } catch (err) {
      console.warn("Failed to load godown inventory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      await godownApi.adjustStock({
        product_id: selectedProduct.product_id,
        movement_type: adjustType === "ADD" ? "INBOUND" : "OUTBOUND",
        quantity: Number(adjustQty),
        reason: adjustReason,
      });
      toast.success(`Stock adjusted for ${selectedProduct.product_name}!`);
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GodownLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary-text uppercase tracking-tight">Godown Inventory</h1>
            <p className="text-sm text-secondary-text font-bold">Real-time stock management and physical bin locations</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchInventory(searchTerm); }}
                className="pl-10 pr-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-xs w-64 focus:ring-2 focus:ring-[#16803A] outline-none font-semibold"
              />
            </div>
            <button
              onClick={() => {
                if (items.length > 0) {
                  setSelectedProduct(items[0]);
                  setShowAdjustModal(true);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-[#16803A] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428]"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Stock Adjustment</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading warehouse inventory...</p>
          </div>
        ) : (
          <div className="bg-white border border-[#DCE8DF] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5FBF7] border-b border-[#DCE8DF]">
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Available Stock</th>
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Unit Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Location Bin</th>
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-secondary-text uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8DF]">
                  {items.map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-primary-text">{item.product_name}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-secondary-text">{item.category || "General"}</td>
                      <td className="px-6 py-4 text-xs font-black text-[#16803A]">{item.available_qty} {item.unit || "Kg"}</td>
                      <td className="px-6 py-4 text-xs font-bold text-primary-text">₹{Number(item.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-secondary-text">
                        {item.location ? `Rack ${item.location.rack || 'A'}, Shelf ${item.location.shelf || '1'}` : "General Bay"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                          item.availability === 'Available' ? 'bg-green-50 border-green-100 text-green-600' :
                          'bg-amber-50 border-amber-100 text-amber-600'
                        } uppercase tracking-tight`}>
                          {item.availability || "Available"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowAdjustModal(true);
                          }}
                          className="px-3 py-1.5 bg-very-light-green text-primary-green rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary-green hover:text-white transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border-color shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h3 className="font-black text-base text-primary-text uppercase tracking-tight">Stock Adjustment</h3>
                <p className="text-xs text-secondary-text font-bold">{selectedProduct.product_name} (Current: {selectedProduct.available_qty} {selectedProduct.unit})</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="text-secondary-text hover:text-primary-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Movement Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAdjustType("ADD")}
                    className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider ${adjustType === "ADD" ? "bg-primary-green text-white" : "bg-slate-100 text-secondary-text"}`}
                  >
                    + Inbound Addition
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("REMOVE")}
                    className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider ${adjustType === "REMOVE" ? "bg-amber-600 text-white" : "bg-slate-100 text-secondary-text"}`}
                  >
                    - Outbound Deduction
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Quantity ({selectedProduct.unit || 'Kg'})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Inbound shipment arrival / Quality adjustment"
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-secondary-text rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary-green text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-dark-green shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Adjusting..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GodownLayout>
  );
}
