import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllDocs } from "@/lib/docs";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const docs = getAllDocs();
  
  return (
    <aside 
      className={cn(
        "sidebar fixed inset-y-0 left-0 z-30 w-64 bg-background border-r border-border overflow-y-auto pb-10 pt-6",
        "md:sticky md:translate-x-0",
        open ? "open" : ""
      )}
    >
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-foreground font-bold text-xl flex items-center gap-2">
            <span>Documentation</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-secondary hover:text-foreground md:hidden"
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
      
      <nav className="px-2">
        <div className="mb-4">
          <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            Getting Started
          </div>
          <ul>
            <li className="mb-1">
              <Link 
                href="/"
                className={cn(
                  "nav-link block relative px-2 py-1.5 rounded hover:bg-[hsl(var(--code))] text-sm",
                  location === "/" ? "active text-foreground" : "text-secondary"
                )}
              >
                Introduction
              </Link>
            </li>
            <li className="mb-1">
              <Link
                href="/installation" 
                className={cn(
                  "nav-link block relative px-2 py-1.5 rounded hover:bg-[hsl(var(--code))] text-sm",
                  location === "/installation" ? "active text-foreground" : "text-secondary"
                )}
              >
                Installation
              </Link>
            </li>
            <li className="mb-1">
              <Link 
                href="/quick-start"
                className={cn(
                  "nav-link block relative px-2 py-1.5 rounded hover:bg-[hsl(var(--code))] text-sm",
                  location === "/quick-start" ? "active text-foreground" : "text-secondary"
                )}
              >
                Quick Start
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-4">
          <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            Core Concepts
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="architecture" className="border-none">
              <AccordionTrigger className="py-1.5 px-2 hover:bg-[hsl(var(--code))] rounded text-sm text-secondary hover:text-foreground">
                <span>Architecture</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <ul className="ml-4">
                  <li className="mb-1">
                    <Link
                      href="#"
                      className="block px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
                    >
                      Overview
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="data-flow" className="border-none">
              <AccordionTrigger className="py-1.5 px-2 hover:bg-[hsl(var(--code))] rounded text-sm text-secondary hover:text-foreground">
                <span>Data Flow</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <ul className="ml-4">
                  <li className="mb-1">
                    <Link
                      href="#"
                      className="block px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
                    >
                      Overview
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="resources" className="border-none">
              <AccordionTrigger className="py-1.5 px-2 hover:bg-[hsl(var(--code))] rounded text-sm text-secondary hover:text-foreground">
                <span>Resources</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <ul className="ml-4">
                  <li className="mb-1">
                    <Link
                      href="#"
                      className="block px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
                    >
                      Resource Types
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="#"
                      className="block px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
                    >
                      Lifecycle
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="#"
                      className="block px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
                    >
                      Dependencies
                    </Link>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="mb-4">
          <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            API Reference
          </div>
          <ul>
            <li className="mb-1">
              <Link
                href="#"
                className="nav-link block relative px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
              >
                CLI
              </Link>
            </li>
            <li className="mb-1">
              <Link
                href="#"
                className="nav-link block relative px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
              >
                Configuration
              </Link>
            </li>
            <li className="mb-1">
              <Link
                href="#"
                className="nav-link block relative px-2 py-1.5 text-secondary rounded hover:bg-[hsl(var(--code))] text-sm"
              >
                Hooks
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
