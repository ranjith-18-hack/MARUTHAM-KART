import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MessageSquare, Sparkles, ShoppingBag, ClipboardList, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/business/ai")({
  head: () => ({
    meta: [{ title: "Marutham AI (Business Mode) | MARUTHAM KART" }],
  }),
  component: BusinessAI,
});

function BusinessAI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Welcome to Business Mode. I can help you with procurement analytics, bulk order tracking, and recurring deliveries. How can I assist Grand Hyatt today?" }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "How much rice did we purchase this month?",
    "Show my pending orders.",
    "When is my next delivery?",
    "Create a bulk order for 500 kg rice.",
    "Which products have the best bulk price?",
    "How much payment is pending?",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: "This is a frontend demonstration. The real Marutham AI will process your procurement data and answer this query via the Python backend integration." }]);
    }, 1000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <BusinessLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 p-6 z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#16803A] text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-[#16803A]/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                MARUTHAM AI <span className="bg-[#16803A]/10 text-[#16803A] text-[8px] px-2 py-0.5 rounded-full tracking-widest border border-[#16803A]/20">BUSINESS</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Procurement Assistant</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth" ref={scrollRef}>
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[2rem] shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>

        <footer className="p-4 md:p-8 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedQuestions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => setInput(q)}
                  className="bg-slate-50 text-slate-600 text-[10px] font-black px-4 py-2.5 rounded-xl border border-slate-200 whitespace-nowrap hover:bg-[#F5FBF7] hover:text-[#16803A] hover:border-[#16803A]/20 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about bulk procurement, delivery status, or pricing..." 
                className="w-full p-5 pr-16 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-2 focus:ring-[#16803A] transition-all text-sm font-medium" 
              />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#16803A] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </BusinessLayout>
  );
}
