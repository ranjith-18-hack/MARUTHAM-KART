import React, { useState } from "react";
import {
  MapPin,
  Plus,
  Check,
  X,
  Home,
  Briefcase,
  Building,
  Loader2,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { customerApi, type CustomerAddress } from "@/lib/api";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { addresses, activeAddress, setActiveAddress, setDefaultAddress, refreshAddresses } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Address Form State
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [doorNo, setDoorNo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLabel, setAddressLabel] = useState<"Home" | "Work" | "Other">("Home");

  if (!isOpen) return null;

  const handleSelectAddress = async (addr: CustomerAddress) => {
    setActiveAddress(addr);
    await setDefaultAddress(addr.id);
    onClose();
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim() || !area.trim() || !city.trim() || !postalCode.trim()) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    setLoading(true);
    try {
      const newAddr = await customerApi.createAddress({
        recipient_name: recipientName.trim() || "Customer",
        phone: phone.trim() || "9876543210",
        door_no: doorNo.trim() || undefined,
        street_address: streetAddress.trim(),
        area: area.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        address_label: addressLabel,
        is_default: true,
      });

      await refreshAddresses();
      setActiveAddress(newAddr);
      setShowAddForm(false);
      toast.success("New delivery address added!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to add address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-700 text-white rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Delivery Location</h3>
              <p className="text-[11px] font-medium text-slate-500">Choose where your order will be delivered</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {!showAddForm ? (
            <>
              {/* Address List */}
              <div className="space-y-2.5">
                {addresses.map((addr) => {
                  const isSelected = activeAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl mt-0.5 ${
                            isSelected ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {addr.address_label === "Home" && <Home className="w-4 h-4" />}
                          {addr.address_label === "Work" && <Briefcase className="w-4 h-4" />}
                          {addr.address_label === "Other" && <Building className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{addr.address_label}</span>
                            {addr.is_default && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {addr.door_no ? `${addr.door_no}, ` : ""}
                            {addr.street_address}, {addr.area}
                          </p>
                          <p className="text-xs text-slate-500 font-bold">
                            {addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="p-1 bg-emerald-600 text-white rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {addresses.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No delivery addresses saved yet.
                  </div>
                )}
              </div>

              {/* Add New Address Trigger */}
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full py-3.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all mt-3"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Delivery Address</span>
              </button>
            </>
          ) : (
            /* Add Address Form */
            <form onSubmit={handleCreateAddress} className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-800">Add New Address</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Back to list
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["Home", "Work", "Other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressLabel(type)}
                    className={`py-2 rounded-xl text-xs font-bold ${
                      addressLabel === type
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                />
              </div>

              <input
                type="text"
                placeholder="House / Door No (e.g. 12-A)"
                value={doorNo}
                onChange={(e) => setDoorNo(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
              />

              <input
                type="text"
                required
                placeholder="Street / Building Name"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Area / Locality"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Use This Address"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
