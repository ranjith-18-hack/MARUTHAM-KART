import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  Clock, 
  Truck, 
  ShieldCheck, 
  Loader2,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { driverDeliveries } from "@/data/mockData";

export const Route = createFileRoute("/driver/deliveries/pickup-verification")({
  component: OTPVerification,
});

function OTPVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Demo using first available order if no specific one passed
  const delivery = driverDeliveries[0];

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]!;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsConfirmed(true);
      toast.success("Delivery confirmed successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5FBF7] p-6 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!isConfirmed ? (
          <motion.div 
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#DCE8DF]"
          >
            <div className="flex justify-between items-center mb-10">
              <button onClick={() => window.history.back()} className="p-3 bg-[#F5FBF7] rounded-2xl">
                <ArrowLeft className="w-5 h-5 text-[#16803A]" />
              </button>
              <h2 className="font-black text-[#16803A] tracking-tight uppercase">Confirm Delivery</h2>
              <div className="w-11" />
            </div>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <ShieldCheck className="w-10 h-10 text-[#16803A]" />
              </div>
              <h3 className="text-xl font-black text-primary-text mb-2">Enter Customer OTP</h3>
              <p className="text-sm font-bold text-secondary-text px-4">
                Ask the customer for the 6-digit code sent to their registered mobile.
              </p>
            </div>

            <div className="flex justify-between gap-2 mb-10">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="number"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-11 h-16 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl text-center text-2xl font-black text-primary-text focus:ring-2 focus:ring-[#16803A] outline-none transition-all"
                />
              ))}
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-8">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-secondary-text uppercase">Order ID</span>
                <span className="text-[10px] font-black text-[#16803A]">{delivery?.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-secondary-text uppercase">Customer</span>
                <span className="text-[10px] font-black text-primary-text">{delivery?.customerName}</span>
              </div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full py-5 bg-[#16803A] text-white font-black rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Complete"}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-xl border border-[#DCE8DF] text-center"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100 relative">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle className="w-14 h-14 text-[#16803A]" />
              </motion.div>
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-[#16803A]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>

            <h3 className="text-2xl font-black text-primary-text mb-4 uppercase">Delivery Confirmed</h3>
            
            <div className="space-y-4 mb-10">
              <SuccessStep label="Customer Verified" />
              <SuccessStep label="Order Delivered" />
              <SuccessStep label="Time Recorded" />
            </div>

            <button 
              onClick={() => navigate({ to: "/driver/dashboard" })}
              className="w-full py-5 bg-[#16803A] text-white font-black rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              Back to Dashboard <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessStep({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-[#16803A]">
      <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
        <CheckCircle className="w-3 h-3" />
      </div>
      <span className="text-sm font-black uppercase tracking-tight">{label}</span>
    </div>
  );
}
