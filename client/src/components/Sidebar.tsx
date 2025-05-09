import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, Lock, Search, X } from "lucide-react";
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
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();
  
  // Determine which section to expand based on the current location
  useEffect(() => {
    if (Object.keys(sections).length > 0) {
      // Find which section contains the current page
      for (const [sectionName, sectionDocs] of Object.entries(sections)) {
        const isActiveSection = sectionDocs.some(doc => doc.path === location);
        const sectionId = getSectionId(sectionName);
        
        if (isActiveSection) {
          // Expand the section containing the current page
          setExpandedSections(prev => {
            if (!prev.includes(sectionId)) {
              return [...prev, sectionId];
            }
            return prev;
          });
        }
      }
    }
  }, [sections, location]);
  
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
  
  // Generate unique IDs for accordion items
  const getSectionId = (section: string) => {
    return section.toLowerCase().replace(/[^\w]+/g, '-');
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
          "fixed inset-y-0 left-0 z-50 w-72 min-w-[272px] bg-background border-r border-border overflow-y-auto pb-10 pt-6",
          "lg:sticky lg:block lg:z-30 lg:shrink-0",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-foreground font-bold text-xl flex items-center gap-2">
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
              className="w-full bg-[hsl(var(--code))] text-foreground border-border placeholder-secondary"
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
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
                  {sectionName}
                </div>
                
                {/* Simple list if section has few documents */}
                {sectionDocs.length <= 3 ? (
                  <ul className="space-y-2">
                    {sectionDocs.map(doc => (
                      <li key={doc.slug}>
                        <Link 
                          href={doc.path}
                          className={cn(
                            "nav-link block relative px-3 py-2 rounded-md hover:bg-[hsl(var(--code))] text-sm",
                            location === doc.path ? "active text-foreground bg-[hsl(var(--code))]" : "text-secondary",
                            doc.requiresAuth && !isAuthenticated && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {doc.requiresAuth && !isAuthenticated && (
                              <Lock className="w-3 h-3 text-secondary" aria-hidden="true" />
                            )}
                            <span>{doc.sidebarTitle}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* Accordion for sections with more documents */
                  <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections} className="w-full">
                    {/* Group by first 2 characters of slug or some other criterion */}
                    <AccordionItem value={getSectionId(sectionName)} className="border-none">
                      <AccordionTrigger className="py-2 px-3 hover:bg-[hsl(var(--code))] rounded-md text-sm text-secondary hover:text-foreground">
                        <span>{sectionName}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0">
                        <ul className="pl-4 space-y-2">
                          {sectionDocs.map(doc => (
                            <li key={doc.slug}>
                              {doc.requiresAuth && !isAuthenticated ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "block px-3 py-2 rounded-md text-sm opacity-50 cursor-not-allowed",
                                        location === doc.path ? "text-foreground bg-[hsl(var(--code))]" : "text-secondary"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Lock className="w-3 h-3 text-secondary" aria-hidden="true" />
                                        <span>{doc.sidebarTitle}</span>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span>Login required to view this content</span>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Link
                                  href={doc.path}
                                  className={cn(
                                    "block px-3 py-2 rounded-md text-sm",
                                    location === doc.path ? "text-foreground bg-[hsl(var(--code))]" : "text-secondary hover:bg-[hsl(var(--code))]"
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}