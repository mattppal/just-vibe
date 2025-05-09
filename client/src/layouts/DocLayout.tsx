import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useTheme } from "@/hooks/use-theme";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface DocLayoutProps {
  children: ReactNode;
}

export default function DocLayout({ children }: DocLayoutProps) {
  const { mounted } = useTheme();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 flex-col lg:flex-row lg:flex-nowrap">
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 pt-8 px-4 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
