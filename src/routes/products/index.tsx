import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductCard } from "@/components/customer/ProductCard";
import { BottomNav } from "@/components/customer/BottomNav";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
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
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col justify-between pb-24 md:pb-0">
      <div>
        <CustomerHeader />

        {/* Filters & Control Bar */}
        <section className="bg-white border-b border-slate-200/80 sticky top-[73px] z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
            {/* Top Row: Title, Filter Count & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  Farm Harvest Catalog
                </h1>
                <p className="text-xs text-slate-500 font-bold">
                  Direct from regional farmers & godowns
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Fresh Harvest First</option>
                  </select>
                </div>
              </div>
            </div>

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
        </section>

        {/* Main Products Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <p className="text-xs text-slate-500 font-medium">
                No active products matched &quot;{searchTerm || selectedCategory}&quot;. Try resetting your search filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchTerm("");
                  setSortBy("name");
                  fetchProducts("All", "", "name");
                }}
                className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer shadow-xs"
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                {productsList.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={() => {}} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <CustomerFooter />
      <BottomNav />
    </div>
  );
}
