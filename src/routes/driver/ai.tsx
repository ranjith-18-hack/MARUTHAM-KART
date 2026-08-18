import { createFileRoute } from "@tanstack/react-router";
import { 
    MessageCircle, 
    Send, 
    User, 
    Bot, 
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const Route = createFileRoute("/driver/ai")({
  component: DriverAI,
});

function DriverAI() {
  const suggestions = [
    "Where is my next delivery?",
    "What is my delivery status?",
    "Show today's assignments.",
    "Report a vehicle problem.",
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF7] flex flex-col">
      <header className="bg-white p-6 border-b border-[#DCE8DF] flex items-center">
        <button className="mr-4 p-2 bg-[#F5FBF7] rounded-full"><ArrowLeft className="w-5 h-5 text-[#16803A]" /></button>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#16803A] rounded-xl flex items-center justify-center mr-3">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-primary-text">MARUTHAM AI</h2>
            <p className="text-[10px] font-black uppercase text-[#16803A]">Delivery Assistant</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
            <Bot className="w-16 h-16 text-[#16803A] opacity-20" />
            <div>
                <h3 className="text-xl font-black text-primary-text">How can I help you, Driver?</h3>
                <p className="text-sm text-secondary-text mt-2 px-8">I can help with routes, status updates, and vehicle reporting.</p>
            </div>
            
            <div className="w-full space-y-3">
                {suggestions.map((text, i) => (
                    <button key={i} className="w-full p-4 bg-white border border-[#DCE8DF] rounded-2xl text-left text-sm font-bold text-primary-text flex justify-between items-center group hover:border-[#16803A] transition-all">
                        {text}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#16803A]" />
                    </button>
                ))}
            </div>
        </div>
      </main>

      <div className="p-6 bg-white border-t border-[#DCE8DF]">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask anything..." 
            className="w-full pl-6 pr-14 py-4 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#16803A]" 
          />
          <button className="absolute right-2 top-2 p-3 bg-[#16803A] text-white rounded-xl">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
