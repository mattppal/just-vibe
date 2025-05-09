import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocPage, getAllDocs } from "@/lib/docs";
import { useEffect, useState } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchDocs() {
      try {
        const result = await getAllDocs();
        setDocs(result);
      } catch (error) {
        console.error("Error fetching docs:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDocs();
  }, []);
  
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
          <div className="mb-6">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
              Getting Started
            </div>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/"
                  className={cn(
                    "nav-link block relative px-3 py-2 rounded-md hover:bg-[hsl(var(--code))] text-sm",
                    location === "/" ? "active text-foreground bg-[hsl(var(--code))]" : "text-secondary"
                  )}
                >
                  Introduction
                </Link>
              </li>
              <li>
                <Link
                  href="/installation" 
                  className={cn(
                    "nav-link block relative px-3 py-2 rounded-md hover:bg-[hsl(var(--code))] text-sm",
                    location === "/installation" ? "active text-foreground bg-[hsl(var(--code))]" : "text-secondary"
                  )}
                >
                  Installation
                </Link>
              </li>
              <li>
                <Link 
                  href="/quick-start"
                  className={cn(
                    "nav-link block relative px-3 py-2 rounded-md hover:bg-[hsl(var(--code))] text-sm",
                    location === "/quick-start" ? "active text-foreground bg-[hsl(var(--code))]" : "text-secondary"
                  )}
                >
                  Quick Start
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="mb-6">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
              Core Concepts
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="architecture" className="border-none">
                <AccordionTrigger className="py-2 px-3 hover:bg-[hsl(var(--code))] rounded-md text-sm text-secondary hover:text-foreground">
                  <span>Architecture</span>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <ul className="pl-4 space-y-2">
                    <li>
                      <Link
                        href="#"
                        className="block px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                      >
                        Overview
                      </Link>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="data-flow" className="border-none">
                <AccordionTrigger className="py-2 px-3 hover:bg-[hsl(var(--code))] rounded-md text-sm text-secondary hover:text-foreground">
                  <span>Data Flow</span>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <ul className="pl-4 space-y-2">
                    <li>
                      <Link
                        href="#"
                        className="block px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                      >
                        Overview
                      </Link>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="resources" className="border-none">
                <AccordionTrigger className="py-2 px-3 hover:bg-[hsl(var(--code))] rounded-md text-sm text-secondary hover:text-foreground">
                  <span>Resources</span>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <ul className="pl-4 space-y-2">
                    <li>
                      <Link
                        href="#"
                        className="block px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                      >
                        Resource Types
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="block px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                      >
                        Lifecycle
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="block px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                      >
                        Dependencies
                      </Link>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div className="mb-6">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
              API Reference
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="nav-link block relative px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                >
                  CLI
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="nav-link block relative px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                >
                  Configuration
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="nav-link block relative px-3 py-2 text-secondary rounded-md hover:bg-[hsl(var(--code))] text-sm"
                >
                  Hooks
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}