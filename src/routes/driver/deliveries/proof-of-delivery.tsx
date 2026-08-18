import { createFileRoute } from "@tanstack/react-router";
import { 
    CheckCircle, 
    ArrowLeft, 
    Camera, 
    PenTool, 
    Smartphone,
    Package,
    User
} from "lucide-react";

export const Route = createFileRoute("/driver/deliveries/proof-of-delivery")({
  component: ProofOfDelivery,
});

function ProofOfDelivery() {
  return (
    <div className="min-h-screen bg-[#F5FBF7] p-6 flex flex-col">
        <header className="flex items-center mb-8">
            <button className="mr-4 p-2 bg-white rounded-full border border-[#DCE8DF]"><ArrowLeft className="w-5 h-5 text-[#16803A]" /></button>
            <h2 className="font-black text-xl text-primary-text">Proof of Delivery</h2>
        </header>

        <div className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm space-y-6">
            <div>
                <label className="block text-xs font-black text-secondary-text uppercase mb-2">Receiver Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none" placeholder="Enter name" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-[#F5FBF7] border-2 border-dashed border-[#DCE8DF] rounded-2xl flex flex-col items-center justify-center text-secondary-text">
                    <Camera className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-[10px] font-black uppercase">Take Photo</span>
                </div>
                <div className="p-6 bg-[#F5FBF7] border-2 border-dashed border-[#DCE8DF] rounded-2xl flex flex-col items-center justify-center text-secondary-text">
                    <PenTool className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-[10px] font-black uppercase">Signature</span>
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-secondary-text uppercase mb-2">Delivery OTP</label>
                <div className="relative">
                    <Smartphone className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl outline-none" placeholder="Enter 4-digit OTP" />
                </div>
            </div>

            <button className="w-full py-5 bg-[#16803A] text-white font-black rounded-2xl shadow-lg flex items-center justify-center mt-4">
                Confirm Delivery <CheckCircle className="w-5 h-5 ml-2" />
            </button>
        </div>
    </div>
  );
}
