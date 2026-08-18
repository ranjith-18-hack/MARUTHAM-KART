import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  QrCode,
  Smartphone,
  Building2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Warehouse,
  IndianRupee,
  Lock,
  X,
  Sparkles,
} from "lucide-react";
import { cartApi, paymentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute('/checkout/')({
  head: () => ({
    meta: [
      { title: "Secure Checkout | MARUTHAM KART" },
      { name: "description", content: "Authoritative secure checkout for farm fresh produce." },
    ],
  }),
  component: CheckoutPage,
});

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Step = 'ADDRESS' | 'PAYMENT' | 'REVIEW' | 'CONFIRMED' | 'FAILED';
type UPIApp = 'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'QR';

function CheckoutPage() {
  const { user, activeAddress } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('ADDRESS');
  const [cart, setCart] = useState<any>({ items: [], item_count: 0, subtotal: 0, delivery_charge: 0, total: 0 });
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "CARD" | "NETBANKING">("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  // UPI Sandbox Simulator State
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [selectedUPIApp, setSelectedUPIApp] = useState<UPIApp>('GPay');
  const [upiPin, setUpiPin] = useState("");
  const [isProcessingSandbox, setIsProcessingSandbox] = useState(false);

  // Order & Payment State
  const [activeIntent, setActiveIntent] = useState<any>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [idempotencyKey] = useState<string>(() => `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Load Active Address into Form
  useEffect(() => {
    if (activeAddress) {
      const formatted = `${activeAddress.door_no ? `${activeAddress.door_no}, ` : ""}${activeAddress.street_address}, ${activeAddress.area}, ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.postal_code}`;
      setDeliveryAddress(formatted);
      setDeliveryPhone(activeAddress.phone || user?.phone || "");
    } else if (user) {
      setDeliveryPhone(user.phone || "");
    }
  }, [activeAddress, user]);

  // Load Cart Data
  useEffect(() => {
    cartApi.getCart().then(setCart).catch((err) => {
      console.warn("Failed to get cart for checkout:", err);
    });
  }, []);

  const subtotal = Number(cart.subtotal || 0);
  const deliveryFee = Number(cart.delivery_charge || 40);
  const grandTotal = Number(cart.total || (subtotal + deliveryFee));

  // ── 1. Handle Cash on Delivery (COD) ─────────────────────────────────────────
  const handleCODCheckout = async () => {
    setIsSubmitting(true);
    try {
      const intent = await paymentsApi.createIntent({
        delivery_address: deliveryAddress,
        delivery_phone: deliveryPhone,
        payment_method: "COD",
        notes: "Deliver fresh farm produce - Cash on Delivery",
        idempotency_key: idempotencyKey,
      });

      setConfirmedOrder({
        id: intent.order_id,
        order_code: intent.order_code,
        status: intent.order_status,
        payment_status: intent.payment_status,
        payment_method: "COD",
        total_amount: intent.total_amount,
        delivery_address: deliveryAddress,
        assigned_godown: intent.assigned_godown,
      });

      setStep('CONFIRMED');
      toast.success("COD Order Placed Successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to place COD order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 2. Authoritative Verification Complete ───────────────────────────────────
  const completeVerification = async (
    orderId: string,
    paymentId: string | undefined,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    assignedGodown: any
  ) => {
    setVerifyingPayment(true);
    try {
      const verification = await paymentsApi.verifyPayment({
        order_id: orderId,
        payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      });

      if (verification.success) {
        setConfirmedOrder({
          id: verification.order_id,
          order_code: verification.order_code,
          status: verification.order_status,
          payment_status: verification.payment_status,
          payment_method: verification.payment_method,
          total_amount: verification.amount,
          transaction_id: verification.transaction_id,
          verified_at: verification.verified_at,
          delivery_address: deliveryAddress,
          assigned_godown: assignedGodown,
        });

        setShowSandboxModal(false);
        setStep('CONFIRMED');
        toast.success("Payment Verified & Captured Successfully!");
      } else {
        throw new Error("Cryptographic payment verification failed.");
      }
    } catch (verErr: any) {
      setFailureReason(verErr?.message || "Server verification failed for this transaction.");
      setShowSandboxModal(false);
      setStep('FAILED');
    } finally {
      setVerifyingPayment(false);
      setIsSubmitting(false);
    }
  };

  // ── 3. Handle Sandbox Simulator Submission ──────────────────────────────────
  const handleSandboxPaymentSubmit = async () => {
    if (!activeIntent) return;
    setIsProcessingSandbox(true);

    try {
      // Simulate UPI network processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 11)}`;
      const mockSignature = `sig_sandbox_${mockPaymentId}`;

      await completeVerification(
        activeIntent.order_id,
        activeIntent.payment_id,
        activeIntent.razorpay_order_id,
        mockPaymentId,
        mockSignature,
        activeIntent.assigned_godown
      );
    } catch (err: any) {
      toast.error("Sandbox simulation failed: " + err.message);
    } finally {
      setIsProcessingSandbox(false);
    }
  };

  // ── 4. Handle Online UPI / Card / Net Banking via Gateway ────────────────────
  const handleOnlinePaymentCheckout = async () => {
    setIsSubmitting(true);
    setFailureReason(null);

    try {
      // 1. Create Server-Side Payment Intent & Order
      const intent = await paymentsApi.createIntent({
        delivery_address: deliveryAddress,
        delivery_phone: deliveryPhone,
        payment_method: paymentMethod,
        notes: `Online checkout via ${paymentMethod}`,
        idempotency_key: idempotencyKey,
      });

      setActiveIntent(intent);

      // Check if in Sandbox Mode or Live Razorpay
      const isSandbox =
        intent.gateway === "razorpay_sandbox" ||
        (intent.razorpay_order_id && intent.razorpay_order_id.startsWith("order_test_")) ||
        !intent.razorpay_key_id ||
        intent.razorpay_key_id === "rzp_test_maruthamkart_sandbox";

      if (isSandbox || typeof window.Razorpay === "undefined") {
        // Open Interactive UPI Sandbox Simulator Modal
        setIsSubmitting(false);
        setShowSandboxModal(true);
        return;
      }

      // 2. Configure Official Live Razorpay Checkout Options
      const options = {
        key: intent.razorpay_key_id,
        amount: Math.round(Number(intent.total_amount) * 100),
        currency: intent.currency || "INR",
        name: "MARUTHAM KART",
        description: `Order ${intent.order_code} — Farm Fresh Produce`,
        order_id: intent.razorpay_order_id,
        image: "/favicon.png",
        prefill: {
          name: intent.customer_name || user?.name || "Customer",
          contact: intent.customer_phone || user?.phone || "",
          email: intent.customer_email || user?.email || "",
        },
        theme: {
          color: "#047857", // emerald-700
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setVerifyingPayment(false);
            toast.info("Payment window was closed. You can retry anytime.");
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await completeVerification(
            intent.order_id,
            intent.payment_id,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            intent.assigned_godown
          );
        },
      };

      // 3. Open Razorpay Gateway Modal
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failResp: any) => {
        setIsSubmitting(false);
        setVerifyingPayment(false);
        setFailureReason(failResp.error?.description || "Payment failed at gateway.");
        setStep('FAILED');
      });
      rzp.open();
    } catch (err: any) {
      setIsSubmitting(false);
      setVerifyingPayment(false);
      setFailureReason(err?.message || "Failed to initialize payment session.");
      toast.error(err?.message || "Payment initiation error.");
    }
  };

  const handleNext = () => {
    if (step === 'ADDRESS') {
      if (!deliveryAddress.trim()) {
        toast.error("Please enter your complete delivery destination address.");
        return;
      }
      setStep('PAYMENT');
    } else if (step === 'PAYMENT') {
      setStep('REVIEW');
    } else if (step === 'REVIEW') {
      if (paymentMethod === "COD") {
        handleCODCheckout();
      } else {
        handleOnlinePaymentCheckout();
      }
    }
  };

  // ── Step Indicator ─────────────────────────────────────────────────────────
  const steps: Step[] = ['ADDRESS', 'PAYMENT', 'REVIEW'];
  const currentStepIndex = steps.indexOf(step as any);

  // ── View: CONFIRMED RECEIPT SCREEN ──────────────────────────────────────────
  if (step === 'CONFIRMED') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 relative shadow-lg shadow-emerald-700/10">
          <CheckCircle2 className="w-12 h-12 text-emerald-700" />
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {confirmedOrder?.payment_method === "COD" ? "Order Confirmed!" : "Payment Successful!"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md">
            {confirmedOrder?.payment_method === "COD"
              ? "Your order is dispatched to the nearest warehouse. Please pay upon package arrival."
              : "Your payment has been securely verified and captured. Warehouse packing is in progress."}
          </p>
        </div>

        {/* Receipt Card */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-left shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Order Reference</p>
              <p className="text-sm font-black text-slate-900">{confirmedOrder?.order_code || "#ORD-MK-CONFIRMED"}</p>
            </div>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {confirmedOrder?.status || "Pending"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Payment Method</p>
              <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                {confirmedOrder?.payment_method === "COD" ? "💵 Cash on Delivery" : "⚡ UPI / Online Payment"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Payment Status</p>
              <p className={`font-bold mt-0.5 ${confirmedOrder?.payment_status === "CAPTURED" ? "text-emerald-700" : "text-amber-700"}`}>
                {confirmedOrder?.payment_status === "CAPTURED" ? "✓ CAPTURED" : "⏳ Pay at Delivery"}
              </p>
            </div>
          </div>

          {confirmedOrder?.transaction_id && (
            <div className="bg-slate-50 p-2.5 rounded-xl text-xs flex justify-between items-center border border-slate-100">
              <span className="text-slate-500 font-medium">Transaction ID</span>
              <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]">{confirmedOrder.transaction_id}</span>
            </div>
          )}

          {confirmedOrder?.assigned_godown && (
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2.5 text-xs">
              <Warehouse className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-emerald-950">Fulfillment: {confirmedOrder.assigned_godown.name}</p>
                <p className="text-[11px] text-emerald-700">Estimated delivery: {confirmedOrder.assigned_godown.estimated_delivery_hours || 2} Hours</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Amount</span>
            <span className="text-lg font-black text-emerald-800">
              ₹{Number(confirmedOrder?.total_amount || grandTotal).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-2.5">
          <button
            onClick={() => navigate({ to: '/orders' })}
            className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order & Delivery Status</span>
          </button>
          <button
            onClick={() => navigate({ to: '/home' })}
            className="w-full bg-white border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── View: FAILED PAYMENT SCREEN ────────────────────────────────────────────
  if (step === 'FAILED') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 relative shadow-lg shadow-rose-700/10">
          <AlertTriangle className="w-12 h-12 text-rose-600" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payment Incomplete</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {failureReason || "Your online transaction could not be verified by the gateway."}
          </p>
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-3 text-left shadow-lg">
          <p className="text-xs font-bold text-slate-800">What would you like to do?</p>
          <div className="space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              You can retry payment with UPI or select another method.
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              No duplicate orders or unverified charges have occurred.
            </p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-2.5">
          <button
            onClick={() => handleOnlinePaymentCheckout()}
            disabled={isSubmitting}
            className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-700/25 hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>Retry UPI Payment</span>
          </button>
          <button
            onClick={() => setStep('PAYMENT')}
            className="w-full bg-white border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all"
          >
            Change Payment Method (e.g. Cash on Delivery)
          </button>
        </div>
      </div>
    );
  }

  // ── View: CHECKOUT FLOW (ADDRESS / PAYMENT / REVIEW) ────────────────────────
  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-32">
      {/* Top App Header */}
      <header className="bg-white p-4 border-b border-slate-100 sticky top-0 z-50 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => {
                if (step === 'PAYMENT') setStep('ADDRESS');
                else if (step === 'REVIEW') setStep('PAYMENT');
                else window.history.back();
              }}
              className="p-2 -ml-2 text-slate-700 hover:text-emerald-700 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-black text-slate-900 ml-1">Checkout & Payment</h1>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> SSL Secured
          </span>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-white px-4 py-4 border-b border-slate-100">
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-100 z-0">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
          {steps.map((s, i) => (
            <div key={s} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                  i <= currentStepIndex
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 font-bold tracking-tight uppercase ${
                  i <= currentStepIndex ? 'text-emerald-800' : 'text-slate-400'
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {/* ── STEP 1: DELIVERY DESTINATION ──────────────────────────────────── */}
        {step === 'ADDRESS' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Delivery Address</h3>
              {activeAddress && (
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Active Saved Profile
                </span>
              )}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-700 mt-1 shrink-0" />
                <div className="flex-1 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Full Destination Address
                  </label>
                  <textarea
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter complete house / flat no, street, area, city, pincode..."
                    className="w-full text-xs font-semibold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-emerald-600 transition-all resize-none"
                  />

                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider pt-1">
                    Contact Mobile for Delivery
                  </label>
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Warehouse Dispatch Badge */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-3xl flex items-center gap-3">
              <Warehouse className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">Nearest Active Godown Fulfillment</p>
                <p className="text-[11px] text-emerald-700">Orders are packed directly from local climate-controlled warehouse.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: PAYMENT METHOD SELECTION ──────────────────────────────── */}
        {step === 'PAYMENT' && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Select Payment Method</h3>

            <div className="space-y-3">
              {/* Option A: UPI */}
              <div
                onClick={() => setPaymentMethod("UPI")}
                className={`p-4.5 bg-white rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === "UPI"
                    ? "border-emerald-600 bg-emerald-50/20 shadow-md shadow-emerald-700/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">Pay with UPI</h4>
                      <span className="text-[9px] bg-emerald-700 text-white font-black px-1.5 py-0.5 rounded-md uppercase">
                        Instant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Google Pay, PhonePe, Paytm, BHIM, QR & UPI ID</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "UPI" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                  }`}
                >
                  {paymentMethod === "UPI" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </div>

              {/* Option B: Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4.5 bg-white rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === "COD"
                    ? "border-emerald-600 bg-emerald-50/20 shadow-md shadow-emerald-700/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Cash on Delivery (COD)</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Pay cash or UPI to driver when your order arrives</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "COD" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                  }`}
                >
                  {paymentMethod === "COD" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </div>

              {/* Option C: Credit / Debit Card */}
              <div
                onClick={() => setPaymentMethod("CARD")}
                className={`p-4.5 bg-white rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === "CARD"
                    ? "border-emerald-600 bg-emerald-50/20 shadow-md shadow-emerald-700/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Credit / Debit Card</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Visa, MasterCard, RuPay via secure gateway</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "CARD" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                  }`}
                >
                  {paymentMethod === "CARD" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </div>

              {/* Option D: Net Banking */}
              <div
                onClick={() => setPaymentMethod("NETBANKING")}
                className={`p-4.5 bg-white rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === "NETBANKING"
                    ? "border-emerald-600 bg-emerald-50/20 shadow-md shadow-emerald-700/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Net Banking</h4>
                    <p className="text-[11px] text-slate-500 font-medium">SBI, HDFC, ICICI, Axis & 50+ Indian banks</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "NETBANKING" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                  }`}
                >
                  {paymentMethod === "NETBANKING" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: ORDER SUMMARY & REVIEW ───────────────────────────────── */}
        {step === 'REVIEW' && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Order Summary & Price Breakdown</h3>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              {/* Product list */}
              <div className="space-y-3">
                {(cart.items || []).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} {item.unit || 'Kg'} × ₹{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{Number(item.line_total || item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="pt-2 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Farm Direct Delivery Fee</span>
                  <span className="font-bold text-slate-900">₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode Selected</span>
                  <span className="font-bold text-emerald-800">
                    {paymentMethod === "COD" ? "Cash on Delivery" : `Online (${paymentMethod})`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Authoritative Total</span>
                  <span className="text-lg text-emerald-800 font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery destination preview */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 text-xs flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-slate-900">Delivery To: {deliveryPhone}</p>
                <p className="text-[11px] text-slate-500 truncate">{deliveryAddress}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Payable Amount</p>
            <p className="text-xl font-black text-emerald-800">₹{grandTotal.toFixed(2)}</p>
          </div>

          <button
            disabled={isSubmitting || verifyingPayment || (cart.items || []).length === 0}
            onClick={handleNext}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-7 py-4 rounded-2xl font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting || verifyingPayment ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{verifyingPayment ? "Verifying Payment..." : "Processing..."}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>
                  {step === 'REVIEW'
                    ? paymentMethod === "COD"
                      ? "Place Order (Pay on Delivery)"
                      : `Pay ₹${grandTotal.toFixed(2)} via UPI`
                    : "Continue"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE UPI SANDBOX SIMULATOR MODAL ────────────────────────── */}
      {showSandboxModal && activeIntent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowSandboxModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  UPI Payment Gateway
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">
                    Sandbox
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">Order: {activeIntent.order_code}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Total Amount</span>
              <span className="text-base font-black text-emerald-800">₹{Number(activeIntent.total_amount).toFixed(2)}</span>
            </div>

            {/* UPI App Selection */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Choose UPI App</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'GPay' as UPIApp, name: 'Google Pay', icon: '🟢' },
                  { id: 'PhonePe' as UPIApp, name: 'PhonePe', icon: '🟣' },
                  { id: 'Paytm' as UPIApp, name: 'Paytm', icon: '🔵' },
                  { id: 'BHIM' as UPIApp, name: 'BHIM UPI', icon: '🟠' },
                  { id: 'QR' as UPIApp, name: 'Scan QR', icon: '📷' },
                ].map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedUPIApp(app.id)}
                    className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      selectedUPIApp === app.id
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">{app.icon}</span>
                    <span className="text-[10px]">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated UPI PIN Pad */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Enter 4 or 6 Digit UPI PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={upiPin}
                onChange={(e) => setUpiPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-black p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-emerald-600"
              />
              <p className="text-[10px] text-slate-400 text-center">Simulated secure UPI sandbox payment</p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleSandboxPaymentSubmit}
              disabled={isProcessingSandbox || verifyingPayment}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingSandbox || verifyingPayment ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying UPI Transaction...</span>
                </div>
              ) : (
                <span>Pay ₹{Number(activeIntent.total_amount).toFixed(2)} via {selectedUPIApp}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
