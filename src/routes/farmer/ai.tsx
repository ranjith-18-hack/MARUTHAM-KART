import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { MessageSquare, Send, User, Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/farmer/ai")({
  head: () => ({
    meta: [{ title: "Marutham AI | Farmer Portal" }],
  }),
  component: FarmerAI,
});

function FarmerAI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Namaste Arun Kumar! I'm your Marutham AI assistant. How can I help you with your farm and sales today?" }
  ]);
  const [input, setInput] = useState("");

  const suggestions = [
    "How many orders do I have?",
    "Which product is selling the most?",
    "When is my next pickup?",
    "How much payment is pending?",
    "How can I add a new product?",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput("");
    
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I'm analyzing your farm data... Based on your recent activity, you have 12 new orders today and your Premium Rice is the top performer this week. Your next pickup is scheduled for tomorrow at 10:00 AM." 
      }]);
    }, 1000);
  };

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-very-light-green text-primary-green rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Marutham AI</h1>
          </div>
          <span className="px-3 py-1 bg-primary-text text-white text-[8px] font-black rounded-full uppercase tracking-widest">Farmer Mode</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-[#16803A] text-white' : 'bg-very-light-green text-primary-green'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-3xl text-sm font-medium shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#16803A] text-white rounded-tr-none' 
                      : 'bg-white border border-border-color text-primary-text rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="space-y-4 pt-4 border-t border-border-color">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => setInput(s)}
                className="px-3 py-2 bg-white border border-border-color rounded-xl text-[10px] font-bold text-secondary-text hover:border-primary-green hover:text-primary-green transition-all"
              >
                {s}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Marutham AI anything about your farm..."
              className="w-full bg-white border border-border-color p-4 pr-16 rounded-2xl focus:ring-2 focus:ring-[#16803A] outline-none text-sm font-medium shadow-sm"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#16803A] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#16803A]/20 hover:bg-[#0B5428] transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </FarmerLayout>
  );
}
