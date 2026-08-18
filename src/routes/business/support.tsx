import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { HelpCircle, MessageSquare, Phone, Mail, Globe, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/business/support")({
  head: () => ({
    meta: [{ title: "Enterprise Support | MARUTHAM KART BUSINESS" }],
  }),
  component: BusinessSupport,
});

function BusinessSupport() {
  return (
    <BusinessLayout>
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-40">
        <h1 className="max-w-7xl mx-auto text-xl font-black text-slate-900 uppercase tracking-tighter text-left">Enterprise Support</h1>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <Link to="/business/ai" className="block bg-[#16803A] p-8 rounded-[3rem] text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Marutham AI for Business</h2>
              <p className="text-sm font-medium opacity-90 mt-2 max-w-md uppercase tracking-wide">Instant help with order tracking, procurement analytics, and bulk pricing queries.</p>
            </div>
            <button className="px-8 py-3 bg-white text-[#16803A] text-[10px] font-black rounded-xl uppercase tracking-widest mt-4">Launch Assistant</button>
          </div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contact Account Manager</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Phone className="w-5 h-5 text-[#16803A]" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Support Line</p>
                  <p className="text-sm font-black text-slate-900">+91 1800 555 9999</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Mail className="w-5 h-5 text-[#16803A]" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procurement Support Email</p>
                  <p className="text-sm font-black text-slate-900">business@maruthamkart.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resources & FAQs</h3>
            <div className="space-y-3">
              {['Bulk Logistics Policy', 'Payment Settlement Cycles', 'Tax Invoicing Guide', 'Recurring Order Help'].map((item, i) => (
                <button key={i} className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50 rounded-xl border border-slate-100 transition-all text-left">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item}</span>
                  <Globe className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </BusinessLayout>
  );
}
