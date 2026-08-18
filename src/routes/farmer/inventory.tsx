import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { ClipboardList, AlertCircle, Plus, Search, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { farmerApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/farmer/inventory")({
  head: () => ({
    meta: [{ title: "Inventory Management | Farmer Portal" }],
  }),
  component: FarmerInventory,
});

function FarmerInventory() {
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Grains");
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(50);
  const [storageType, setStorageType] = useState("Dry Warehouse");

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const res = await farmerApi.getBatches({ limit: 50 });
      if (Array.isArray(res)) {
        setBatches(res);
      } else if (res && res.items) {
        setBatches(res.items);
      }
    } catch (err) {
      console.warn("Failed to fetch farmer batches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await farmerApi.createBatch({
        product_name: productName,
        category: category,
        quantity: Number(quantity),
        price: Number(price),
        storage_type: storageType,
        organic_certified: true,
      });
      toast.success("Harvest batch registered successfully and stock synchronized!");
      setShowAddModal(false);
      setProductName("");
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.message || "Failed to register harvest batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Harvest Batches & Inventory</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-primary-green text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-dark-green shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Batch</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading harvest inventory...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-border-color p-12 text-center space-y-4">
            <ClipboardList className="w-12 h-12 text-secondary-text mx-auto opacity-50" />
            <h3 className="text-base font-black text-primary-text uppercase">No Harvest Batches Registered Yet</h3>
            <p className="text-xs text-secondary-text max-w-sm mx-auto font-medium">
              Register your fresh harvested crops here to automatically allocate warehouse storage and sync catalog stock.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-green text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-dark-green"
            >
              Register First Batch
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-border-color overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-[#F5FBF7] border-b border-border-color">
                <tr>
                  {['Batch Code', 'Product / Crop', 'Quantity', 'Price/Unit', 'Storage Zone', 'Status'].map(h => (
                    <th key={h} className="p-4 text-[10px] font-black text-secondary-text uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {batches.map((b, i) => (
                  <tr key={i} className="hover:bg-[#F5FBF7] transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-primary-green">{b.batch_code || `#BAT-${b.id?.slice(0, 6).toUpperCase()}`}</td>
                    <td className="p-4 font-black text-xs text-primary-text">{b.product_name || "Farm Produce"}</td>
                    <td className="p-4 text-xs font-bold text-secondary-text">{b.quantity_kg || b.quantity} {b.unit || 'Kg'}</td>
                    <td className="p-4 text-xs font-black text-primary-text">₹{Number(b.price_per_unit || b.price || 0).toFixed(2)}</td>
                    <td className="p-4 text-xs font-medium text-secondary-text">{b.storage_type || "Dry Storage"}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest bg-very-light-green text-primary-green border border-primary-green/20">
                        {b.status || "Received / Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-[#F5FBF7] p-6 rounded-3xl border border-[#DCE8DF] flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-[#16803A] flex-shrink-0" />
          <div>
            <h4 className="text-xs font-black text-primary-text uppercase tracking-wider">Automated Warehouse Stock Sync</h4>
            <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mt-1">
              Every harvest batch registered by a verified farmer is automatically verified into godown inventory and made available to retail and wholesale buyers.
            </p>
          </div>
        </div>
      </main>

      {/* Register Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border-color shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <h3 className="font-black text-base text-primary-text uppercase tracking-tight">Register Harvest Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-secondary-text hover:text-primary-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Crop / Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Ponni Rice"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-xs font-semibold mt-1 outline-none"
                  >
                    <option value="Grains">Grains</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Storage Requirement</label>
                  <select
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-xs font-semibold mt-1 outline-none"
                  >
                    <option value="Dry Warehouse">Dry Warehouse</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Ventilated">Ventilated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Quantity (Kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Price / Kg (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-secondary-text rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary-green text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-dark-green shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Submit Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FarmerLayout>
  );
}
