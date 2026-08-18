import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { Truck, MapPin, Calendar, Clock, AlertCircle, Plus, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { farmerApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/farmer/pickups")({
  head: () => ({
    meta: [{ title: "Pickup Schedule | Farmer Portal" }],
  }),
  component: FarmerPickups,
});

function FarmerPickups() {
  const [pickups, setPickups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form state
  const [cropType, setCropType] = useState("");
  const [quantityKg, setQuantityKg] = useState(250);
  const [pickupAddress, setPickupAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const fetchPickups = async () => {
    try {
      setIsLoading(true);
      const res = await farmerApi.getPickups();
      if (Array.isArray(res)) setPickups(res);
    } catch (err) {
      console.warn("Failed to load pickups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await farmerApi.createPickup({
        crop_type: cropType,
        quantity_kg: Number(quantityKg),
        pickup_address: pickupAddress,
        contact_phone: contactPhone,
      });
      toast.success("Crop pickup request submitted to Transport dispatch!");
      setShowModal(false);
      setCropType("");
      fetchPickups();
    } catch (err: any) {
      toast.error(err?.message || "Failed to request pickup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Farmgate Pickups</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-primary-green text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-dark-green shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Request Pickup</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading pickup schedules...</p>
          </div>
        ) : pickups.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-border-color shadow-sm text-center space-y-4">
            <Truck className="w-12 h-12 text-secondary-text mx-auto opacity-50" />
            <h3 className="text-base font-black text-primary-text uppercase">No Scheduled Pickups</h3>
            <p className="text-xs text-secondary-text max-w-sm mx-auto font-medium">
              Need transport to pick up freshly harvested produce from your farmgate? Request a vehicle dispatch here.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-green text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-dark-green"
            >
              Request First Pickup
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pickups.map((p, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-border-color shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border-color border-dashed pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-very-light-green text-[#16803A] rounded-2xl flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-primary-text uppercase tracking-widest">{p.crop_type || "Farm Produce"}</h2>
                      <span className="px-2.5 py-0.5 bg-very-light-green text-primary-green text-[9px] font-black rounded-full uppercase tracking-widest border border-primary-green/20">
                        {p.status || "Scheduled"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-primary-text uppercase">{p.quantity_kg} kg</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5FBF7] text-secondary-text flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary-green" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Scheduled Date</p>
                      <p className="text-xs font-bold text-primary-text mt-0.5">
                        {new Date(p.scheduled_date || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5FBF7] text-secondary-text flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary-green" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Pickup Address</p>
                      <p className="text-xs font-bold text-primary-text mt-0.5">{p.pickup_address || "Farmgate Location"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#F5FBF7] p-4 rounded-2xl flex items-center space-x-3 text-[#16803A] border border-[#DCE8DF]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-[10px] font-bold">Please keep goods sorted and ready at your farm entrance before the dispatch vehicle arrives.</p>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border-color shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <h3 className="font-black text-base text-primary-text uppercase tracking-tight">Request Farmgate Pickup</h3>
              <button onClick={() => setShowModal(false)} className="text-secondary-text hover:text-primary-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePickup} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Crop / Produce Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Red Tomatoes / Ponni Rice"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Estimated Quantity (Kg)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farmgate Pickup Address</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Full farm address with village/taluk"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-border-color rounded-xl text-sm font-semibold mt-1 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-secondary-text rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary-green text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-dark-green shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Requesting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FarmerLayout>
  );
}
