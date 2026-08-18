import { createFileRoute } from "@tanstack/react-router";
import { 
    Phone, 
    MessageSquare, 
    AlertTriangle, 
    ArrowLeft, 
    User,
    ShieldAlert
} from "lucide-react";

export const Route = createFileRoute("/driver/support")({
  component: DriverSupport,
});

function DriverSupport() {
  return (
    <div className="min-h-screen bg-[#F5FBF7]">
      <header className="bg-white p-6 border-b border-[#DCE8DF] flex items-center">
        <button className="mr-4 p-2 bg-[#F5FBF7] rounded-full"><ArrowLeft className="w-5 h-5 text-[#16803A]" /></button>
        <h2 className="font-black text-xl text-primary-text">Transport Support</h2>
      </header>

      <main className="p-6 space-y-6">
        {/* Support Officer */}
        <div className="bg-white p-6 rounded-3xl border border-[#DCE8DF] shadow-sm flex items-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mr-4 border-2 border-white">
                <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
                <h3 className="text-lg font-black text-primary-text">Ranjith R</h3>
                <p className="text-xs font-bold text-[#16803A]">Transport Officer (On Duty)</p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-white border border-[#DCE8DF] rounded-2xl flex flex-col items-center justify-center group hover:border-[#16803A] transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                    <Phone className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-black text-sm text-primary-text">Call Support</span>
            </button>
            <button className="p-6 bg-white border border-[#DCE8DF] rounded-2xl flex flex-col items-center justify-center group hover:border-[#16803A] transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-black text-sm text-primary-text">Message</span>
            </button>
        </div>

        {/* Emergency */}
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
                <h3 className="font-black text-red-600">Emergency Support</h3>
                <p className="text-xs font-bold text-red-400">Call for immediate roadside assistance</p>
            </div>
        </div>

        <button className="w-full py-5 bg-white border border-red-100 text-red-600 font-black rounded-2xl flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-5 h-5 mr-2" /> Report an Accident / Breakdown
        </button>
      </main>
    </div>
  );
}
