import { createFileRoute } from "@tanstack/react-router";
import { 
    CheckCircle, 
    ArrowLeft, 
    ArrowRight,
    ShoppingBag,
    History,
    Calendar,
    MapPin,
    Package
} from "lucide-react";

export const Route = createFileRoute("/driver/deliveries/success")({
  component: DeliverySuccess,
});

function DeliverySuccess() {
  return (
    <div className="min-h-screen bg-[#F5FBF7] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl shadow-green-100">
        <CheckCircle className="w-12 h-12 text-[#16803A]" />
      </div>
      
      <h2 className="text-3xl font-black text-primary-text mb-2">Delivery Completed!</h2>
      <p className="text-secondary-text font-bold mb-10">Order MK-ORD-2045 successfully delivered.</p>

      <div className="w-full bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm mb-10 space-y-4 text-left">
        <div className="flex justify-between items-center pb-4 border-b border-[#F5FBF7]">
            <span className="text-[10px] font-black uppercase text-secondary-text">Delivery Time</span>
            <span className="font-black text-primary-text">11:45 AM</span>
        </div>
        <div className="flex justify-between items-start pb-4 border-b border-[#F5FBF7]">
            <span className="text-[10px] font-black uppercase text-secondary-text mt-1">Destination</span>
            <span className="font-black text-primary-text text-right max-w-[150px]">Adyar, Chennai</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-secondary-text">Quantity</span>
            <span className="font-black text-primary-text">12 kg</span>
        </div>
      </div>

      <div className="w-full space-y-4">
        <button className="w-full py-5 bg-[#16803A] text-white font-black rounded-2xl shadow-lg shadow-[#16803A]/20 flex items-center justify-center">
            Today's Deliveries <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <button className="w-full py-5 bg-white border border-[#DCE8DF] text-primary-text font-black rounded-2xl flex items-center justify-center">
            <History className="w-5 h-5 mr-2 text-secondary-text" /> View History
        </button>
      </div>
    </div>
  );
}
