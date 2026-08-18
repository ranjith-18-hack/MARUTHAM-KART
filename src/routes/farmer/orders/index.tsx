import { createFileRoute } from "@tanstack/react-router";
import { FarmerLayout } from "@/components/farmer/FarmerLayout";
import { ShoppingBag, Search, Filter, MoreVertical, Calendar, User, Clock, ChevronRight } from "lucide-react";
import { farmerOrders } from "@/data/mockData";

export const Route = createFileRoute("/farmer/orders/")({
  head: () => ({
    meta: [{ title: "Orders | Farmer Portal" }],
  }),
  component: FarmerOrders,
});

function FarmerOrders() {
  const tabs = ["New Orders", "Processing", "Ready for Pickup", "Completed", "Cancelled"];
  
  return (
    <FarmerLayout>
      <header className="bg-white border-b border-border-color p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-primary-text uppercase tracking-tighter">Orders</h1>
          <button className="p-2 bg-[#F5FBF7] text-[#16803A] rounded-xl relative">
            <Bell className="w-5 h-5" />
          </button>
        </div>
        
        {/* Horizontal Tabs */}
        <div className="mt-4 flex items-center space-x-6 overflow-x-auto no-scrollbar px-1">
          {tabs.map((tab, i) => (
            <button 
              key={tab} 
              className={`text-[10px] font-black uppercase tracking-widest pb-3 whitespace-nowrap transition-all border-b-2 ${
                i === 0 ? 'text-primary-green border-primary-green' : 'text-secondary-text border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search order ID, product or buyer..."
              className="w-full bg-white border border-border-color p-3 pl-10 rounded-xl focus:ring-2 focus:ring-[#16803A] outline-none text-sm font-medium"
            />
          </div>
          <button className="flex items-center justify-center space-x-2 bg-white border border-border-color px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-text">
            <Filter className="w-4 h-4" />
            <span>Sort By</span>
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {farmerOrders.map((order) => (
            <div key={order.id} className="bg-white border border-border-color rounded-3xl overflow-hidden shadow-sm hover:border-primary-green/30 transition-all p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-very-light-green rounded-2xl flex items-center justify-center text-[#16803A]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-primary-text uppercase tracking-wider">{order.id}</h3>
                    <p className="text-[10px] font-bold text-secondary-text mt-0.5">{order.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest ${
                    order.status === 'New' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'Processing' ? 'bg-orange-50 text-orange-600' :
                    'bg-very-light-green text-primary-green'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-border-color border-dashed">
                <div>
                  <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Product</p>
                  <p className="text-xs font-black text-primary-text mt-0.5">{order.product}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Quantity</p>
                  <p className="text-xs font-black text-primary-text mt-0.5">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Buyer Type</p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <User className="w-3 h-3 text-primary-green" />
                    <span className="text-xs font-black text-primary-text">{order.buyerType}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Order Value</p>
                  <p className="text-xs font-black text-primary-green mt-0.5">{order.value}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-secondary-text">
                    <Calendar className="w-4 h-4 text-primary-green" />
                    <span>Pickup: <span className="text-primary-text">{order.pickupDate}</span></span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none py-2.5 px-6 border border-border-color text-secondary-text text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-gray-50 transition-colors">
                    Reject
                  </button>
                  <button className="flex-1 md:flex-none py-2.5 px-6 bg-[#16803A] text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#0B5428] shadow-lg shadow-[#16803A]/20 transition-all flex items-center justify-center space-x-2">
                    <span>Accept Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </FarmerLayout>
  );
}

function Bell(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
