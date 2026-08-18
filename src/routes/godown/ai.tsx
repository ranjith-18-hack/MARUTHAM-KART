import { createFileRoute } from "@tanstack/react-router";
import { GodownLayout } from "@/components/godown/GodownLayout";
import { Bot, Send, Search, Clock, Sparkles, Database } from "lucide-react";

export const Route = createFileRoute("/godown/ai")({
  head: () => ({
    meta: [
      { title: "Marutham AI (Godown Mode) | MARUTHAM KART" },
      { name: "description", content: "AI assistant for warehouse inventory and logistics queries." },
    ],
  }),
  component: GodownAIPage,
});

function GodownAIPage() {
  const suggestions = [
    "How much rice is currently available?",
    "Which products expire this week?",
    "Show today's incoming stock.",
    "Which zone has the highest capacity?",
    "Which orders are waiting for allocation?",
    "Show pending dispatches."
  ];

  return (
    <GodownLayout>
      <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex flex-col bg-[#F5FBF7]">
        {/* Chat Header */}
        <div className="p-6 bg-white border-b border-[#DCE8DF] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#16803A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#16803A]/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary-text uppercase tracking-tight">Marutham AI</h2>
              <p className="text-[10px] text-[#16803A] font-black uppercase tracking-widest">Warehouse Intelligence Mode</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <span className="px-3 py-1 bg-white border border-[#DCE8DF] rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">Model: Enterprise-4.0</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="flex items-start space-x-3 max-w-2xl">
            <div className="w-10 h-10 bg-[#16803A] rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white p-5 rounded-3xl rounded-tl-none shadow-sm border border-[#DCE8DF]">
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                Hello Officer. I'm connected to the warehouse inventory and logistics system. I can help you analyze stock turnover, monitor expiry, or check dispatch statuses.
                <br /><br />
                How can I assist you with the Godown operations today?
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <Database className="w-16 h-16 text-slate-300 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Ready • Analyzing Batches</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            <p className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suggested Queries</p>
            {suggestions.map((s, i) => (
              <button key={i} className="px-4 py-2 bg-white border border-[#DCE8DF] rounded-xl text-xs font-bold text-[#16803A] hover:bg-[#16803A] hover:text-white transition-all shadow-sm">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#DCE8DF]">
          <div className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Ask me anything about the warehouse..."
              className="w-full p-5 bg-[#F5FBF7] border border-[#DCE8DF] rounded-2xl pr-20 text-sm font-bold outline-none focus:ring-2 focus:ring-[#16803A] transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#16803A] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#16803A]/20 hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            Marutham AI can provide data-driven operational insights.
          </p>
        </div>
      </div>
    </GodownLayout>
  );
}
