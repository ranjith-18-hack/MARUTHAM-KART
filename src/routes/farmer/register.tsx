import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle2, CloudUpload } from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const Route = createFileRoute("/farmer/register")({
  head: () => ({
    meta: [{ title: "Farmer Registration | MARUTHAM KART" }],
  }),
  component: FarmerRegistration,
});

function FarmerRegistration() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[#F9FBFA] flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-border-color shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 bg-[#16803A] text-white text-center relative">
          <img src={logoAsset.url} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-full p-2 absolute left-6 top-6 hidden md:block" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Farmer Application</h1>
          <p className="text-sm font-bold text-white/80 mt-1 uppercase tracking-widest">Apply to join the ecosystem</p>
        </div>

        {/* Progress bar */}
        <div className="px-8 pt-8 flex justify-between relative">
          <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-very-light-green -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-8 h-[2px] bg-[#16803A] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                s <= step ? 'bg-[#16803A] text-white shadow-lg shadow-[#16803A]/20' : 'bg-white border-2 border-very-light-green text-secondary-text'
              }`}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
        <div className="px-8 pt-2 flex justify-between text-[8px] font-black text-secondary-text uppercase tracking-widest">
          <span>Personal</span>
          <span>Farm Info</span>
          <span>Products</span>
          <span>Verification</span>
        </div>

        {/* Form Steps */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farmer Name</label>
                    <input type="text" placeholder="Enter full name" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Mobile Number</label>
                    <input type="tel" placeholder="Enter mobile number" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Email Address</label>
                    <input type="email" placeholder="Enter email" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farm Address</label>
                    <input type="text" placeholder="Enter farm address" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farm Location (City/Town)</label>
                    <input type="text" placeholder="e.g. Pollachi" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farm Size (Acres)</label>
                    <input type="number" placeholder="Enter acres" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farming Type</label>
                    <select className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all appearance-none">
                      <option>Organic Farming</option>
                      <option>Traditional Farming</option>
                      <option>Hydroponic</option>
                      <option>Natural Farming</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Years of Experience</label>
                    <input type="number" placeholder="Years" className="w-full p-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-secondary-text uppercase tracking-widest block mb-4">Select Products You Supply</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Rice', 'Wheat', 'Millets', 'Pulses', 'Vegetables', 'Fruits', 'Flour', 'Milk', 'Spices'].map((item) => (
                      <label key={item} className="flex items-center space-x-3 p-4 border border-[#DCE8DF] rounded-xl hover:border-primary-green transition-colors cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-[#DCE8DF] text-primary-green focus:ring-primary-green" />
                        <span className="text-[10px] font-black text-secondary-text uppercase tracking-wider group-hover:text-primary-green transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 bg-very-light-green text-primary-green rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary-green/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-primary-text uppercase tracking-tighter">Application Submitted</h2>
                  <p className="text-sm text-secondary-text font-medium px-8">Your farmer profile has been submitted for verification. Our team will review your details within 48 hours.</p>
                </div>

                <div className="bg-[#F5FBF7] border border-[#DCE8DF] p-6 rounded-2xl inline-block text-left w-full max-w-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Application Status</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-200">
                      Verification Pending
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-xs font-bold text-primary-text">
                      <div className="w-5 h-5 bg-primary-green text-white rounded-full flex items-center justify-center text-[8px]">✓</div>
                      <span>Personal Info Received</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs font-bold text-primary-text">
                      <div className="w-5 h-5 bg-primary-green text-white rounded-full flex items-center justify-center text-[8px]">✓</div>
                      <span>Farm Details Received</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs font-bold text-secondary-text">
                      <div className="w-5 h-5 border-2 border-gray-200 rounded-full"></div>
                      <span className="opacity-50">Identity Verification Underway</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => navigate({ to: "/farmer/dashboard" as any })}
                    className="w-full p-4 bg-primary-text text-white rounded-xl font-bold hover:bg-black transition-all text-sm tracking-wide uppercase"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 4 && (
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#DCE8DF]">
              <button 
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${step === 1 ? 'opacity-0' : 'text-secondary-text hover:text-primary-green'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button 
                onClick={nextStep}
                className="flex items-center space-x-2 bg-[#16803A] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all"
              >
                <span>{step === 3 ? 'Submit Application' : 'Continue'}</span>
                {step < 3 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center space-y-4">
        <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Need help with registration?</p>
        <button className="flex items-center space-x-2 text-primary-green text-xs font-black uppercase tracking-widest hover:underline mx-auto">
          <HelpCircle className="w-4 h-4" />
          <span>Contact Partner Support</span>
        </button>
      </div>
    </div>
  );
}

function HelpCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
