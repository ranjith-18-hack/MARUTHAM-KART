import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  Home,
  Briefcase,
  Building,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { customerApi } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Delivery Location Setup | MARUTHAM KART" },
      {
        name: "description",
        content: "Set up your delivery location to get fresh farm products delivered right to your door.",
      },
    ],
  }),
  component: CustomerOnboardingScreen,
});

function CustomerOnboardingScreen() {
  const navigate = useNavigate();
  const { user, refreshAddresses } = useAuth();

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [doorNo, setDoorNo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [postalCode, setPostalCode] = useState("");
  const [addressLabel, setAddressLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [latLng, setLatLng] = useState<{ lat?: number; lng?: number }>({});

  // GPS Geolocation Handler
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your device.");
      return;
    }

    setGpsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatLng({ lat: latitude, lng: longitude });

        try {
          // Attempt reverse geocoding via OpenStreetMap API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "User-Agent": "MaruthamKartApp/1.0" } }
          );

          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const detectedArea = addr.suburb || addr.neighbourhood || addr.residential || addr.road || "Local Area";
            const detectedCity = addr.city || addr.town || addr.county || addr.state_district || "Coimbatore";
            const detectedState = addr.state || "Tamil Nadu";
            const detectedPin = addr.postcode || "";

            setArea(detectedArea);
            setCity(detectedCity);
            setState(detectedState);
            if (detectedPin) setPostalCode(detectedPin);
            if (!streetAddress && addr.road) {
              setStreetAddress(addr.road);
            }

            toast.success(`Location detected: ${detectedArea}, ${detectedCity}`);
          } else {
            toast.info("Coordinates recorded. Please confirm your area and city.");
          }
        } catch {
          toast.info("GPS coordinates retrieved. Please verify your locality.");
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        console.warn("GPS error:", error);
        toast.error("Unable to access current location. Please enter your address below.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Submit Onboarding Location
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!streetAddress.trim()) {
      setErrorMsg("Please enter your street address or building name.");
      return;
    }
    if (!area.trim()) {
      setErrorMsg("Please specify your area or locality.");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Please specify your city.");
      return;
    }
    if (!postalCode.trim() || postalCode.trim().length < 5) {
      setErrorMsg("Please enter a valid PIN code.");
      return;
    }

    setLoading(true);
    try {
      await customerApi.completeOnboarding({
        name: name.trim() || user?.name || "Customer",
        phone: phone.trim() || user?.phone || undefined,
        door_no: doorNo.trim() || undefined,
        street_address: streetAddress.trim(),
        area: area.trim(),
        city: city.trim(),
        state: state.trim() || "Tamil Nadu",
        postal_code: postalCode.trim(),
        latitude: latLng.lat,
        longitude: latLng.lng,
        address_label: addressLabel,
      });

      await refreshAddresses();
      toast.success("Delivery location configured!");
      navigate({ to: "/home" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save delivery location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col justify-between">
      {/* Top Banner */}
      <div className="w-full max-w-lg mx-auto pt-8 px-4 pb-2 flex flex-col items-center text-center">
        <div className="w-20 h-20 mb-3 relative flex items-center justify-center bg-white rounded-3xl shadow-sm border border-emerald-100 p-2">
          <img src="/logo.png" alt="MARUTHAM KART Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-emerald-900 tracking-tight">
          Delivery Location Setup
        </h1>
        <p className="text-xs font-semibold text-slate-500 max-w-xs mt-1">
          Tell us where to deliver your farm-fresh groceries.
        </p>
      </div>

      {/* Main Location Form Card */}
      <div className="w-full max-w-lg mx-auto px-4 pb-8 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5 border border-emerald-100/80">
          {/* Quick GPS Location Action */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all"
            >
              {gpsLoading ? (
                <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-700" />
              )}
              <span>Use My Current GPS Location</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-500 font-medium">Or enter details manually</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Address Type Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                Address Tag
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Home", "Work", "Other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressLabel(type)}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      addressLabel === type
                        ? "bg-emerald-700 text-white shadow-sm font-extrabold"
                        : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {type === "Home" && <Home className="w-3.5 h-3.5" />}
                    {type === "Work" && <Briefcase className="w-3.5 h-3.5" />}
                    {type === "Other" && <Building className="w-3.5 h-3.5" />}
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
            </div>

            {/* Street / Door */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  House / Door No
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-A / Flat 4"
                  value={doorNo}
                  onChange={(e) => setDoorNo(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  Street / Building
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avinashi Road, Near IT Park"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
            </div>

            {/* Area, City, PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peelamedu"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coimbatore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 641004"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", caretColor: "#16803A" }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Continue to Marketplace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
