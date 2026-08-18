import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";
import { ChevronRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/business/register")({
  head: () => ({
    meta: [{ title: "Business Registration | MARUTHAM KART" }],
  }),
  component: BusinessRegistration,
});

function BusinessRegistration() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const steps = [
    { title: "Business Info" },
    { title: "Address Details" },
    { title: "Requirements" },
    { title: "Verification" },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <input placeholder="Business Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
              <option>Hotel</option>
              <option>Restaurant</option>
              <option>Catering</option>
            </select>
            <input placeholder="Contact Person" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
            <input placeholder="Mobile Number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <input placeholder="Address" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
            <input placeholder="City" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="State" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
              <input placeholder="PIN Code" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <textarea placeholder="Frequently purchased products..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24" />
            <input placeholder="Expected monthly quantity (kg/liters)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
            <input placeholder="Preferred delivery schedule" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
        );
      case 4:
        return (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#16803A] mx-auto" />
            <h3 className="text-xl font-black text-slate-900">Application Submitted</h3>
            <p className="text-sm text-slate-500 font-bold">Status: Under Review</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="mb-8">
          <img src={logoAsset.url} className="w-12 h-12 object-contain mix-blend-multiply mx-auto mb-4" />
          <div className="flex justify-between mb-8">
            {steps.map((s, i) => (
              <div key={i} className={`text-[8px] font-black uppercase tracking-widest ${step > i ? 'text-[#16803A]' : 'text-slate-300'}`}>
                {s.title}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}>{renderStep()}</motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          {step > 1 && step < 4 && <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 font-bold text-slate-400">Back</button>}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="ml-auto px-6 py-3 bg-[#16803A] text-white font-black rounded-xl flex items-center space-x-2">
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => navigate({ to: "/business" as any })} className="w-full py-4 bg-[#16803A] text-white font-black rounded-xl">Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
}
