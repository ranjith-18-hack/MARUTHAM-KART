import { ReactNode } from "react";
import { GodownSidebar } from "./GodownSidebar";
import { GodownBottomNav } from "./GodownBottomNav";
import { currentGodown } from "@/data/mockData";
import { Bell, Search, User } from "lucide-react";

export const GodownLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <GodownSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="h-16 border-b border-border-color bg-white sticky top-0 z-40 hidden md:flex items-center justify-between px-8">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-primary-text uppercase tracking-tight">
                {currentGodown.name}
              </h2>
              <p className="text-[10px] text-secondary-text font-bold">
                ID: {currentGodown.id} • {currentGodown.location}
              </p>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input 
                type="text" 
                placeholder="Search stock, batch, or order..." 
                className="pl-10 pr-4 py-2 bg-[#F5FBF7] border border-[#DCE8DF] rounded-xl text-xs w-64 focus:ring-1 focus:ring-[#16803A] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-2 hover:bg-[#F5FBF7] rounded-full transition-colors">
              <Bell className="w-5 h-5 text-secondary-text" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center space-x-3 pl-4 border-l border-border-color">
              <div className="text-right">
                <p className="text-xs font-black text-primary-text">{currentGodown.officerName}</p>
                <p className="text-[10px] text-[#16803A] font-bold">Godown Officer</p>
              </div>
              <div className="w-9 h-9 bg-[#16803A] rounded-xl flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="h-16 border-b border-border-color bg-white flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#16803A] rounded-lg flex items-center justify-center text-white">
              <span className="font-black text-xs">MK</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xs font-black text-primary-text tracking-tight uppercase">Warehouse</h2>
              <p className="text-[8px] text-secondary-text font-bold">ID: {currentGodown.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 bg-[#F5FBF7] rounded-xl">
              <Bell className="w-4 h-4 text-secondary-text" />
            </button>
            <div className="w-8 h-8 bg-[#16803A] rounded-xl flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <GodownBottomNav />
    </div>
  );
};
