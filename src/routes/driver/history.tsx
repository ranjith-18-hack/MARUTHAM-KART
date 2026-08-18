import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Clock, MapPin, Package, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/driver/history")({
  component: DriverHistory,
});

function DriverHistory() {
  const history = [
    { id: "MK-ORD-2040", date: "14 Aug 2026", type: "Home Delivery", destination: "Adyar, Chennai", qty: "5 kg", status: "Completed" },
    { id: "MK-BULK-0985", date: "13 Aug 2026", type: "Bulk Delivery", destination: "Grand Hyatt", qty: "450 kg", status: "Completed" },
    { id: "MK-ORD-2032", date: "12 Aug 2026", type: "Home Delivery", destination: "Guindy, Chennai", qty: "8 kg", status: "Failed" },
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF7] pb-24">
      <header className="bg-white p-6 border-b border-[#DCE8DF] sticky top-0 z-10 flex items-center">
        <button className="mr-4 p-2 bg-[#F5FBF7] rounded-full"><ArrowLeft className="w-5 h-5 text-[#16803A]" /></button>
        <h2 className="font-black text-xl text-primary-text">Delivery History</h2>
      </header>

      <main className="p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {["Today", "This Week", "This Month"].map((filter, i) => (
                <button key={i} className={`px-5 py-2 rounded-full text-xs font-black uppercase whitespace-nowrap border ${i === 0 ? 'bg-[#16803A] text-white border-[#16803A]' : 'bg-white text-secondary-text border-[#DCE8DF]'}`}>
                    {filter}
                </button>
            ))}
        </div>

        <div className="space-y-4">
            {history.map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-[#DCE8DF] shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-[10px] font-black uppercase text-secondary-text mb-1">{item.date}</p>
                            <h4 className="font-black text-primary-text">{item.id}</h4>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${item.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {item.status}
                        </span>
                    </div>
                    
                    <div className="space-y-1 mb-4 text-xs text-secondary-text font-bold">
                        <div className="flex items-center"><MapPin className="w-3 h-3 mr-2 text-[#16803A]" /> {item.destination}</div>
                        <div className="flex items-center"><Package className="w-3 h-3 mr-2" /> {item.qty} • {item.type}</div>
                    </div>
                    
                    <button className="w-full py-3 bg-[#F5FBF7] text-[#16803A] font-black rounded-xl text-xs">
                        View Details
                    </button>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
