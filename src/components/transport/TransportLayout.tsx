import React from "react";
import { TransportSidebar } from "@/components/transport/TransportSidebar";
import { TransportBottomNav } from "@/components/transport/TransportBottomNav";

export const TransportLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFB] flex">
      <TransportSidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
      <TransportBottomNav />
    </div>
  );
};
