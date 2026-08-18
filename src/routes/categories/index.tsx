import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, ChevronRight, Loader2, Grid } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { catalogApi } from "@/lib/api";
import { BottomNav } from "@/components/customer/BottomNav";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";

export const Route = createFileRoute('/categories/')({
  head: () => ({
    meta: [
      { title: "Categories | MARUTHAM KART" },
      { name: "description", content: "Browse farm fresh agricultural products by category - Vegetables, Rice, Millets, Pulses, Dairy, and Cold-Pressed Oils." },
      { property: "og:title", content: "Categories | MARUTHAM KART" },
    ],
  }),
  component: CategoriesPage,
});

interface CategoryItem {
  id: string;
  name: string;
  count: number;
  icon: string;
  description: string;
}

const CATEGORY_META: Record<string, { icon: string; description: string }> = {
  Vegetables: { icon: "🥦", description: "Farm harvested daily produce" },
  Rice: { icon: "🌾", description: "Single-origin unpolished traditional rice" },
  Wheat: { icon: "🌾", description: "Organic MP Sharbati & whole grain wheat" },
  Flour: { icon: "🥡", description: "Stone-ground fresh chakki atta & flours" },
  Millets: { icon: "🥣", description: "Barnyard, Kodo, Foxtail & Ragi superfoods" },
  Pulses: { icon: "🫘", description: "Unpolished toor dal, moong, and grams" },
  Fruits: { icon: "🍎", description: "Naturally ripened chemical-free fruits" },
  Milk: { icon: "🥛", description: "Pure pasture-raised farm milk & curd" },
  Dairy: { icon: "🧀", description: "A2 bilona ghee, paneer, and butter" },
  Organic: { icon: "🌿", description: "Cold-pressed oils, wild honey, and jaggery" },
};

function CategoriesPage() {
  const navigate = useNavigate();
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLiveCategories() {
      try {
        setIsLoading(true);
        const [catsRes, prodsRes] = await Promise.allSettled([
          catalogApi.getCategories(),
          catalogApi.getProducts({ limit: 100 }),
        ]);

        const rawCats: string[] = catsRes.status === "fulfilled" && Array.isArray(catsRes.value) ? catsRes.value : [];
        const prods: any[] = prodsRes.status === "fulfilled" && prodsRes.value?.items ? prodsRes.value.items : [];

        const defaultCats = ["Vegetables", "Rice", "Flour", "Millets", "Pulses", "Fruits", "Milk", "Organic"];
        const uniqueCatNames = Array.from(new Set([...rawCats, ...defaultCats])).filter(Boolean);

        const calculated: CategoryItem[] = uniqueCatNames.map((name) => {
          const count = prods.filter((p) => (p.category || "").toLowerCase().includes(name.toLowerCase())).length;
          const meta = CATEGORY_META[name] || { icon: "🌱", description: "Fresh agricultural goods" };
          return {
            id: name.toLowerCase(),
            name,
            count: count > 0 ? count : 4,
            icon: meta.icon,
            description: meta.description,
          };
        });

        setCategoriesList(calculated);
      } catch (err) {
        console.warn("Failed to load categories:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLiveCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesList;
    const q = searchQuery.toLowerCase();
    return categoriesList.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [categoriesList, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between pb-24 md:pb-0">
      <div>
        <CustomerHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Title Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                Farm Categories
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Direct agricultural harvest sorted by category
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider">
              {categoriesList.length} Active Categories
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative group max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-emerald-700 transition-colors" />
            <input
              type="text"
              placeholder="Search categories (e.g. Vegetables, Rice, Millets)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Categories Grid */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Loading categories from farm inventory...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/products"
                  search={{ category: cat.name } as any}
                  className="flex items-center p-4 bg-white border border-slate-200 hover:border-emerald-600 rounded-2xl hover:shadow-lg hover:shadow-emerald-950/5 transition-all group relative overflow-hidden"
                >
                  <div className="w-14 h-14 bg-emerald-50 text-2xl rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 border border-emerald-100/80">
                    {cat.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors text-sm uppercase tracking-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5 border border-emerald-200/50">
                      {cat.count}+ Harvest Items
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors shrink-0 text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}
