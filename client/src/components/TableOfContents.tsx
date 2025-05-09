import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  // Initialize with first item ID so it's highlighted on initial page load
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");

  useEffect(() => {
    // Update active ID if items change
    if (items.length > 0) {
      // Check for hash in URL and use it if it exists and matches an item
      const hash = window.location.hash.replace('#', '');
      if (hash && items.some(item => item.id === hash)) {
        setActiveId(hash);
      } else {
        // Otherwise default to first item
        setActiveId(items[0].id);
      }
    }
  }, [items]);

  useEffect(() => {
    // Create an observer to track which heading is currently visible
    // Create a debounce function to avoid too many state updates
    const debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };
    
    // Debounced version of setActiveId to reduce jumpiness
    const debouncedSetActiveId = debounce((id: string) => {
      setActiveId(id);
    }, 100); // 100ms debounce time

    const observer = new IntersectionObserver(
      (entries) => {
        // Get all entries that are currently visible
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => {
            // First sort by y-position (closer to top gets priority)
            const aRect = a.boundingClientRect;
            const bRect = b.boundingClientRect;
            
            // If elements are very close in position, use intersection ratio as tiebreaker
            if (Math.abs(aRect.top - bRect.top) < 50) {
              return b.intersectionRatio - a.intersectionRatio;
            }
            
            // Otherwise, sort by position (closer to the top of viewport gets priority)
            return aRect.top - bRect.top;
          });
        
        if (visibleEntries.length > 0) {
          debouncedSetActiveId(visibleEntries[0].target.id);
        }
      },
      {
        // Adjust rootMargin to consider elements close to viewport top
        rootMargin: "-80px 0px -80% 0px",
        threshold: [0.1, 0.5], // Fewer thresholds for more stable detection
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Set the active ID immediately to avoid a delay in highlighting
      setActiveId(id);
      
      // Get the element's position accounting for any layout shifts
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 110; // More offset for better positioning
      
      // More natural scrolling with smooth behavior
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      // Update URL without scrolling
      history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="hidden xl:block w-64 shrink-0 sticky self-start top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-10">
      <div className="space-y-2 pt-6">
        <h3 className="font-medium mb-3 text-foreground text-sm">On This Page</h3>
        <ul className="text-sm space-y-2 border-l border-border pl-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "block pl-3 py-1 border-l -ml-[1px] transition-colors duration-200",
                  activeId === item.id
                    ? "text-primary border-primary font-medium"
                    : "text-secondary hover:text-foreground border-transparent"
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
