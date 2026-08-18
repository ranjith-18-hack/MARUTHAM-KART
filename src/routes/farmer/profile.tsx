import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { User, MapPin, Ruler, Briefcase, Star, ShoppingBag, Package, CheckCircle2, ChevronRight, Edit3, Settings } from "lucide-react";
import logoAsset from "@/assets/marutham-logo-v3.png.asset.json";

export const Route = createFileRoute("/farmer/profile")({
  head: () => ({
    meta: [{ title: "My Profile | Farmer Portal" }],
  }),
  component: FarmerProfile,
});

function FarmerProfile() {
  const farmer = {
    name: "Arun Kumar",
    location: "Pollachi, Tamil Nadu",
    farmSize: "12 Acres",
    products: ["Rice", "Wheat", "Millets", "Pulses"],
    experience: "15 Years",
    rating: 4.9,
    totalOrders: 1250,
    totalProducts: 4200,
  };

  const verifications = [
    { label: "Identity Verification", status: "Verified" },
    { label: "Farm Verification", status: "Verified" },
    { label: "Bank / Payment Verification", status: "Verified" },
    { label: "Product Verification", status: "Pending" },
  ];

  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">My Profile</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-[#F5FBF7] text-[#16803A] rounded-xl">
              <Settings className="w-5 h-5" />
            </button>
            <button className="bg-primary-text text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-[2rem] border border-border-color shadow-sm overflow-hidden">
          <div className="h-32 bg-[#16803A] relative">
            <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-3xl p-1 shadow-lg">
              <div className="w-full h-full bg-[#F5FBF7] rounded-2xl flex items-center justify-center text-[#16803A]">
                <User className="w-12 h-12" />
              </div>
            </div>
          </div>
          <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-black text-primary-text uppercase tracking-tighter">{farmer.name}</h2>
                <span className="px-3 py-1 bg-very-light-green text-primary-green text-[8px] font-black rounded-full uppercase tracking-widest border border-primary-green/20 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Farmer</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-secondary-text uppercase tracking-widest">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary-green" />
                  <span>{farmer.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-primary-green" />
                  <span>{farmer.experience} Exp</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Rating</p>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-black text-primary-text">{farmer.rating}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Completed</p>
                <p className="text-sm font-black text-primary-text mt-1">{farmer.totalOrders}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Supplied</p>
                <p className="text-sm font-black text-primary-text mt-1">{farmer.totalProducts}T</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Farm Details */}
          <section className="bg-white rounded-3xl p-6 border border-border-color shadow-sm space-y-6">
            <h3 className="text-sm font-black text-primary-text uppercase tracking-[0.2em] border-b border-border-color pb-4">Farm Details</h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5FBF7] flex items-center justify-center text-[#16803A]">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Farm Size</span>
                </div>
                <span className="text-xs font-black text-primary-text uppercase">{farmer.farmSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5FBF7] flex items-center justify-center text-[#16803A]">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Main Crops</span>
                </div>
                <div className="flex gap-2">
                  {farmer.products.map(p => (
                    <span key={p} className="px-2 py-1 bg-gray-50 text-secondary-text text-[8px] font-black rounded uppercase">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Verification Status */}
          <section className="bg-white rounded-3xl p-6 border border-border-color shadow-sm space-y-6">
            <h3 className="text-sm font-black text-primary-text uppercase tracking-[0.2em] border-b border-border-color pb-4">Verification Section</h3>
            <div className="space-y-4">
              {verifications.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border-color rounded-2xl">
                  <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">{v.label}</span>
                  <span className={`px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest border ${
                    v.status === 'Verified' ? 'bg-very-light-green text-primary-green border-primary-green/20' : 'bg-orange-50 text-orange-600 border-orange-200'
                  }`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </FarmerLayout>
  );
}
