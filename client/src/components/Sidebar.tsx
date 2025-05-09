import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocPage, getAllDocs, getDocsBySection } from "@/lib/docs";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

type SectionData = Record<string, DocPage[]>;

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [sections, setSections] = useState<SectionData>({});
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    async function fetchDocs() {
      try {
        const sectionsData = await getDocsBySection();
        setSections(sectionsData);
      } catch (error) {
        console.error("Error fetching docs:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDocs();
  }, []);
  
  // Format section names for display
  const formatSectionName = (section: string) => {
    return section.replace(/^\d+-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden", 
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 min-w-[272px] bg-black text-white border-r border-[#333] overflow-y-auto pb-10 pt-6",
          "lg:sticky lg:block lg:z-30 lg:shrink-0",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white font-bold text-xl flex items-center gap-2">
              <span>Documentation</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1 text-secondary hover:text-foreground lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-6 relative">
            <Input 
              type="search" 
              placeholder="Search..." 
              className="w-full bg-[#111] text-white border-[#333] placeholder-gray-500"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-secondary" />
          </div>
        </div>
        
        <nav className="px-4">
          {loading ? (
            <div className="text-secondary text-sm p-4">Loading documentation...</div>
          ) : Object.keys(sections).length === 0 ? (
            <div className="text-secondary text-sm p-4">No documentation found.</div>
          ) : (
            Object.entries(sections).map(([sectionName, sectionDocs]) => (
              <div key={sectionName} className="mb-6">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  {formatSectionName(sectionName).toUpperCase()}
                </div>
                
                <ul className="space-y-2">
                  {sectionDocs.map(doc => (
                    <li key={doc.slug}>
                      {doc.requiresAuth && !isAuthenticated ? (
                        <div
                          title="Login required to view this content"
                          className={cn(
                            "block px-3 py-2 rounded-md text-sm opacity-50 cursor-not-allowed",
                            location === doc.path ? "text-white bg-[#111]" : "text-gray-500"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span role="img" aria-label="lock">🔒</span>
                            <span>{doc.sidebarTitle}</span>
                          </div>
                        </div>
                      ) : (
                        <Link 
                          href={doc.path}
                          className={cn(
                            "nav-link block relative px-3 py-2 rounded-md hover:bg-[#111] text-sm",
                            location === doc.path ? "active text-white bg-[#111]" : "text-gray-400 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span>{doc.sidebarTitle}</span>
                          </div>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}