import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import RecruitmentLayout from "@/components/recruitment/RecruitmentLayout";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/recruitment/ai")({
  component: RecruitmentAI,
});

function RecruitmentAI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am MARUTHAM AI, your recruitment assistant. How can I help you manage applications and accounts today?' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'I have analyzed the current application pipeline. We have 5 driver licenses pending verification in the Coimbatore region. Would you like me to highlight them for you?' 
      }]);
    }, 1000);
  };

  const suggestions = [
    "Show pending driver applications.",
    "Which hotel applications need verification?",
    "Show vehicle partners awaiting approval.",
    "How many accounts were created this month?",
  ];

  return (
    <RecruitmentLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
        <div className="bg-white rounded-2xl border border-[#DCE8DF] shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* AI Header */}
          <div className="p-4 border-b border-[#DCE8DF] bg-[#F5FBF7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#16803A] flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-primary-text leading-tight">MARUTHAM AI</h3>
                <p className="text-[10px] text-[#16803A] font-black uppercase tracking-widest">Recruitment Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#16803A]/20 shadow-sm">
              <Sparkles className="w-3 h-3 text-[#16803A]" />
              <span className="text-[10px] font-black text-[#16803A] uppercase tracking-tighter">Recruitment Mode</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center 
                      ${msg.role === 'user' ? 'bg-slate-200' : 'bg-[#16803A]/10 text-[#16803A]'}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user' ? 'bg-[#16803A] text-white shadow-md' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[#DCE8DF] bg-slate-50">
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((text, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(text)}
                  className="text-[10px] font-black bg-white border border-[#DCE8DF] rounded-full px-3 py-1.5 text-slate-600 hover:border-[#16803A] hover:text-[#16803A] transition-all"
                >
                  {text}
                </button>
              ))}
            </div>
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask MARUTHAM AI about recruitment data..."
                className="w-full p-4 pr-12 bg-white border border-[#DCE8DF] rounded-xl text-sm focus:ring-2 focus:ring-[#16803A]/20 focus:border-[#16803A] outline-none shadow-sm"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#16803A] text-white rounded-lg shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </RecruitmentLayout>
  );
}
