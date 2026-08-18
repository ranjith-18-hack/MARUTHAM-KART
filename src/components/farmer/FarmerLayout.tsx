import { ReactNode } from "react";
import { FarmerSidebar } from "./FarmerSidebar";
import { FarmerBottomNav } from "./FarmerBottomNav";

interface FarmerLayoutProps {
  children: ReactNode;
}

export const FarmerLayout = ({ children }: FarmerLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-[#F9FBFA]">
      <FarmerSidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {children}
      </div>
      <FarmerBottomNav />
    </div>
  );
};
