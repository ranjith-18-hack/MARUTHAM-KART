import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { HelpCircle, MessageSquare, Phone, Mail, FileText, ShoppingBag, Wallet, Package, User, Sparkles } from "lucide-react";

export const Route = createFileRoute("/farmer/support")({
  head: () => ({
    meta: [{ title: "Support | Farmer Portal" }],
  }),
  component: FarmerSupport,
});

function FarmerSupport() {
  const sections = [
    { title: "Order Help", icon: ShoppingBag },
    { title: "Payment Help", icon: Wallet },
    { title: "Product Help", icon: Package },
    { title: "Account Help", icon: User },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-primary-text uppercase tracking-tighter">Help & Support</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        {/* Marutham AI Banner */}
        <section className="bg-[#16803A] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-[#16803A]/20">
          <div className="relative z-10 space-y-4 max-w-sm">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Powered by AI</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-tight">MARUTHAM AI</h2>
            <p className="text-sm font-medium text-white/80">Get instant answers about your farm performance, orders, and logistics.</p>
            <button className="bg-white text-[#16803A] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-lg">
              Start AI Chat
            </button>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </section>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sections.map((s, i) => (
            <button key={i} className="bg-white p-6 rounded-3xl border border-border-color shadow-sm hover:border-primary-green hover:shadow-md transition-all text-center space-y-3 group">
              <div className="w-12 h-12 bg-[#F5FBF7] text-[#16803A] rounded-2xl flex items-center justify-center mx-auto group-hover:bg-[#16803A] group-hover:text-white transition-all">
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-primary-text uppercase tracking-widest block">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Contact Options */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-secondary-text uppercase tracking-[0.2em]">Contact MARUTHAM KART</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-white p-6 rounded-3xl border border-border-color shadow-sm flex items-center space-x-4 hover:border-primary-green transition-all text-left">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-primary-text uppercase tracking-wider">Partner Hotline</p>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">1800-GROW-MARUTHAM</p>
              </div>
            </button>
            <button className="bg-white p-6 rounded-3xl border border-border-color shadow-sm flex items-center space-x-4 hover:border-primary-green transition-all text-left">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-primary-text uppercase tracking-wider">Email Support</p>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">partner@maruthamkart.com</p>
              </div>
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-[2rem] p-6 border border-border-color shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border-color pb-4">
            <h3 className="text-[10px] font-black text-primary-text uppercase tracking-[0.2em]">Frequently Asked Questions</h3>
            <button className="text-[10px] font-black text-[#16803A] uppercase tracking-widest">View all</button>
          </div>
          <div className="space-y-4">
            {[
              "How do I update my harvest date?",
              "When will I receive my monthly payment?",
              "What happens if a pickup is missed?",
              "How do I request quality verification?"
            ].map((q, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5FBF7] transition-all text-left">
                <span className="text-xs font-bold text-primary-text">{q}</span>
                <HelpCircle className="w-4 h-4 text-secondary-text" />
              </button>
            ))}
          </div>
        </section>
      </main>
    </FarmerLayout>
  );
}
