import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  Clock, 
  Truck, 
  Navigation, 
  Phone,
  CheckCircle,
  ShieldCheck,
  Loader2,
  Lock
} from "lucide-react";
import { useEffect, useState } from "react";
import { ordersApi, driverApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/deliveries/$orderId")({
  component: DeliveryDetail,
});

function DeliveryDetail() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [otpInput, setOtpInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getOrderDetail(orderId);
      setOrder(data);
    } catch (err) {
      console.warn("Failed to load order detail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleStartDelivery = async () => {
    try {
      setIsSubmitting(true);
      await driverApi.startDelivery(orderId);
      toast.success("Trip started! Status set to Out for Delivery.");
      fetchOrder();
    } catch (err: any) {
      toast.error(err?.message || "Failed to start delivery trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) {
      toast.error("Please enter the customer OTP");
      return;
    }
    try {
      setIsSubmitting(true);
      await driverApi.verifyOtp(orderId, otpInput);
      toast.success("OTP Verified! Delivery Completed Successfully! 🎉");
      fetchOrder();
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5FBF7] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#16803A] animate-spin mb-3" />
        <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Loading delivery pass...</p>
      </div>
    );
  }

  const isDelivered = order?.status === "Delivered";
  const isOutForDelivery = order?.status === "Out for Delivery" || order?.status === "On Route" || order?.status === "Dispatched";

  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24">
      <header className="bg-white p-6 border-b border-[#DCE8DF] sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/driver/dashboard" className="mr-4 p-2 bg-[#F5FBF7] rounded-full">
            <ArrowLeft className="w-5 h-5 text-[#16803A]" />
          </Link>
          <div>
            <h2 className="font-black text-lg text-primary-text">Delivery Pass</h2>
            <p className="text-[10px] font-mono text-secondary-text font-bold">#{orderId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
          isDelivered ? "bg-green-100 text-primary-green" : "bg-blue-100 text-blue-700"
        }`}>
          {order?.status || "Assigned"}
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
        {/* Customer & Address Details */}
        <section className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Drop-off Destination</span>
              <h3 className="text-base font-black text-primary-text">{order?.delivery_phone || "+91 98765 43210"}</h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed mt-1 flex items-start">
                <MapPin className="w-4 h-4 mr-1 text-[#16803A] flex-shrink-0 mt-0.5" />
                <span>{order?.delivery_address || "Customer Location, Tamil Nadu"}</span>
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-secondary-text">Order Total</span>
            <span className="text-[#16803A] font-black text-sm">₹{Number(order?.total_amount || 0).toFixed(2)}</span>
          </div>
        </section>

        {/* Order Items */}
        <section className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm space-y-3">
          <h3 className="text-xs font-black text-secondary-text uppercase tracking-widest">Package Contents</h3>
          <div className="space-y-2">
            {(order?.order_items || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-primary-green" />
                  <span className="font-bold text-slate-800">{item.product_name}</span>
                </div>
                <span className="font-black text-slate-600">{item.quantity} {item.unit || "Kg"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Action / OTP Verification Card */}
        <section className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm space-y-4">
          {isDelivered ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle className="w-12 h-12 text-[#16803A] mx-auto" />
              <h3 className="text-base font-black text-primary-text uppercase">Delivered Successfully</h3>
              <p className="text-xs text-secondary-text font-medium">OTP verified and delivery confirmation recorded in ledger.</p>
            </div>
          ) : !isOutForDelivery ? (
            <div className="space-y-3 text-center">
              <p className="text-xs font-bold text-slate-600">Click below when leaving the facility with this shipment:</p>
              <button
                disabled={isSubmitting}
                onClick={handleStartDelivery}
                className="w-full py-4 bg-[#16803A] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 hover:bg-[#11662d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>{isSubmitting ? "Starting..." : "Start Delivery Route"}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center space-x-2 text-[#16803A]">
                <Lock className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase">Customer Delivery OTP</h3>
              </div>
              <p className="text-xs text-secondary-text font-medium">
                Ask the customer for the 4-digit OTP provided in their order confirmation to complete drop-off:
              </p>
              <input
                type="text"
                maxLength={6}
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter Delivery OTP"
                className="w-full text-center tracking-[0.5em] text-2xl font-black p-3 bg-slate-50 border border-[#DCE8DF] rounded-2xl outline-none focus:ring-2 focus:ring-[#16803A]"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#16803A] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 hover:bg-[#11662d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? "Verifying..." : "Verify OTP & Complete Delivery"}</span>
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
