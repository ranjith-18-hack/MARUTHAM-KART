import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronRight } from "lucide-react";
import { categories } from "@/data/mockData";
import { BottomNav } from "@/components/customer/BottomNav";

export const Route = createFileRoute('/categories/')({
  head: () => ({
    meta: [
      { title: "Categories | MARUTHAM KART" },
      { name: "description", content: "Browse agricultural products by category - Rice, Wheat, Pulses, Dairy, and more." },
      { property: "og:title", content: "Categories | MARUTHAM KART" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <div className="min-h-screen bg-very-light-green pb-24">
      <header className="sticky top-0 z-50 bg-white border-b border-border-color p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tight">Categories</h1>
          <div className="bg-primary-green/10 text-primary-green text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
            {categories.length} Groups
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4 group-focus-within:text-primary-green transition-colors" />
          <input 
            type="text" 
            placeholder="Search categories..."
            className="w-full bg-white border border-border-color p-4 pl-11 rounded-2xl focus:ring-2 focus:ring-primary-green outline-none transition-all shadow-sm placeholder:text-secondary-text/30 font-semibold text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, i) => (
            <div 
              key={i} 
              className="flex items-center p-4 bg-white border border-border-color rounded-3xl hover:border-primary-green hover:shadow-xl hover:shadow-primary-green/5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-green/5 rounded-full -mr-8 -mt-8 group-hover:bg-primary-green/10 transition-colors"></div>
              <div className="w-16 h-16 bg-very-light-green rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 relative z-10 shadow-inner">
                {cat.icon}
              </div>
              <div className="ml-5 flex-1 relative z-10">
                <h3 className="font-black text-primary-text group-hover:text-primary-green transition-colors leading-tight uppercase tracking-tight text-sm">{cat.name}</h3>
                <p className="text-[10px] text-secondary-text font-black uppercase tracking-widest opacity-60 mt-0.5">{cat.count} Items Available</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-all relative z-10">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
