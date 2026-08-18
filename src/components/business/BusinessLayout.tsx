import { ReactNode } from "react";
import { BusinessSidebar } from "./BusinessSidebar";
import { BusinessBottomNav } from "./BusinessBottomNav";

interface BusinessLayoutProps {
  children: ReactNode;
}

export const BusinessLayout = ({ children }: BusinessLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <BusinessSidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {children}
      </div>
      <BusinessBottomNav />
    </div>
  );
};
