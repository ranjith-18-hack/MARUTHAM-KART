import { createFileRoute } from "@tanstack/react-router";
import { TransportLayout } from "@/components/transport/TransportLayout";
import { Send, Bot, X, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/transport/ai")({
  component: TransportAIPage,
});

function TransportAIPage() {
  const suggestedQuestions = [
    "How many deliveries are active?",
    "Which vehicles are available?",
    "Show delayed deliveries.",
    "Which drivers are available?",
    "Show today's bulk deliveries.",
    "Which vehicle needs maintenance?",
    "Where is Order MK-2045?",
    "Which godown has pending dispatches?",
  ];

  return (
    <TransportLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col bg-white border border-[#DCE8DF] rounded-3xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-6 bg-[#16803A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-sm">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">MARUTHAM AI</h1>
              <p className="text-[10px] text-white/90 font-bold tracking-widest uppercase">Your Logistics Assistant</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFB]">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-[#16803A] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-[#DCE8DF] max-w-[80%]">
              <p className="text-sm font-bold text-[#17231A] leading-relaxed">
                Welcome to Transport Control AI. I can help you track fleet availability, monitor active routes, and analyze delivery performance.
              </p>
              <p className="text-sm font-bold text-[#17231A] mt-2 leading-relaxed">
                How can I assist you with logistics today?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
            {suggestedQuestions.map((q, i) => (
              <button 
                key={i} 
                className="text-left p-4 bg-white border border-[#DCE8DF] rounded-2xl text-xs font-bold text-[#16803A] hover:bg-[#EAF7EE] hover:border-[#16803A]/30 transition-all shadow-sm group"
              >
                <span className="group-hover:translate-x-1 inline-block transition-transform">{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#DCE8DF]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask about vehicles, drivers, or routes..." 
              className="w-full p-4 pr-14 bg-[#F8FAFB] border border-[#DCE8DF] rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#16803A]/20 focus:border-[#16803A] outline-none transition-all"
            />
            <button className="absolute right-2 w-10 h-10 bg-[#16803A] text-white rounded-xl flex items-center justify-center hover:bg-[#11662d] transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            AI Assistant is in preview mode
          </p>
        </div>
      </div>
    </TransportLayout>
  );
}
