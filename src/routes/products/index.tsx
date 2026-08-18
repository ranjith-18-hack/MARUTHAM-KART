import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductCard } from "@/components/customer/ProductCard";
import { BottomNav } from "@/components/customer/BottomNav";
import { Search, Filter, ArrowUpDown, ChevronLeft, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";

interface ProductSearchParams {
  category?: string;
  search?: string;
  sort_by?: string;
}

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearchParams => ({
    category: typeof search.category === "string" ? search.category : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
    sort_by: typeof search.sort_by === "string" ? search.sort_by : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Fresh Farm Products Catalog | MARUTHAM KART" },
      {
        name: "description",
        content:
          "Browse fresh vegetables, single-origin rice, unpolished millets, dairy, and cold-pressed oils direct from Tamil Nadu farmers.",
      },
      { property: "og:title", content: "Fresh Farm Products Catalog | MARUTHAM KART" },
    ],
  }),
  component: ProductListingPage,
});

function ProductListingPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.category || "All");
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.search || "");
  const [sortBy, setSortBy] = useState<string>(searchParams.sort_by || "name");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProducts = async (cat?: string, q?: string, sort?: string) => {
    try {
      setIsLoading(true);
      const params: any = { limit: 100 };
      const categoryFilter = cat !== undefined ? cat : selectedCategory;
      if (categoryFilter && categoryFilter !== "All") {
        params.category = categoryFilter;
      }
      const queryFilter = q !== undefined ? q : searchTerm;
      if (queryFilter && queryFilter.trim()) {
        params.search = queryFilter.trim();
      }
      const sortFilter = sort !== undefined ? sort : sortBy;
      if (sortFilter) {
        params.sort_by = sortFilter;
      }

      const res = await catalogApi.getProducts(params);
      if (res && res.items) {
        setProductsList(res.items);
      }
    } catch (err) {
      console.warn("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    catalogApi
      .getCategories()
      .then((cats) => {
        const defaultCats = [
          "All",
          "Vegetables",
          "Rice",
          "Wheat",
          "Flour",
          "Millets",
          "Pulses",
          "Fruits",
          "Milk",
          "Dairy",
          "Organic",
        ];
        if (Array.isArray(cats) && cats.length > 0) {
          const combined = Array.from(new Set(["All", ...cats, ...defaultCats]));
          setCategories(combined);
        } else {
          setCategories(defaultCats);
        }
      })
      .catch(() => {
        setCategories([
          "All",
          "Vegetables",
          "Rice",
          "Wheat",
          "Flour",
          "Millets",
          "Pulses",
          "Fruits",
          "Milk",
          "Organic",
        ]);
      });
  }, []);

  useEffect(() => {
    fetchProducts(searchParams.category, searchParams.search, searchParams.sort_by);
    if (searchParams.category) setSelectedCategory(searchParams.category);
    if (searchParams.search) setSearchTerm(searchParams.search);
    if (searchParams.sort_by) setSortBy(searchParams.sort_by);
  }, [searchParams.category, searchParams.search, searchParams.sort_by]);

  // Debounced search when user types
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(selectedCategory, searchTerm, sortBy);
    }, 280);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    fetchProducts(cat, searchTerm, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    fetchProducts(selectedCategory, searchTerm, newSort);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(selectedCategory, searchTerm, sortBy);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchProducts(selectedCategory, "", sortBy);
  };

  return (
    <div className="min-h-screen bg-[#F8FDF9] pb-28 select-none">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 p-4 shadow-xs">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Top Title & Back */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/home"
                className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Farm Produce Marketplace
                </h1>
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                  Direct From Tamil Nadu Agricultural Hubs
                </p>
              </div>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="name">Sort: Default (A-Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name, variety, farm or crop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-9 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-900 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse space-y-3"
              >
                <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
              🌾
            </div>
            <h3 className="text-base font-black text-slate-900">No Farm Products Found</h3>
            <p className="text-xs text-slate-500">
              No active products matched &quot;{searchTerm || selectedCategory}&quot;. Try resetting your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
                setSortBy("name");
                fetchProducts("All", "", "name");
              }}
              className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>
                Showing <strong className="text-slate-900">{productsList.length}</strong> fresh agricultural products
              </span>
              {selectedCategory !== "All" && (
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Category: {selectedCategory}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {productsList.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={() => {}} />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
