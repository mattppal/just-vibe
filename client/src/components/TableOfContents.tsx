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
    // Create a debounce function to avoid too many state updates
    const debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };
    
    // Function to determine which heading is currently at the top of the viewport
    const determineActiveHeading = () => {
      // Get all heading elements
      const headingElements = items.map(item => document.getElementById(item.id))
        .filter(el => el !== null) as HTMLElement[];
      
      if (headingElements.length === 0) return;
      
      // Define the top threshold - we consider a heading "at the top" when it's within this range from the top
      const topThreshold = 120; // pixels from the top of the viewport
      
      // Sort headings by their position - we want the one closest to but still below our threshold
      let activeHeading = null;
      let minDistance = Infinity;
      
      for (const heading of headingElements) {
        const rect = heading.getBoundingClientRect();
        // We only consider headings above the threshold (negative position means it's scrolled up)
        // but we want the one that just crossed the threshold, not ones far above
        if (rect.top <= topThreshold) {
          // Calculate how far this heading is from our threshold
          const distance = Math.abs(rect.top - topThreshold);
          if (distance < minDistance) {
            minDistance = distance;
            activeHeading = heading;
          }
        }
      }
      
      // If no heading is found above the threshold (very top of the page)
      // use the first visible heading
      if (!activeHeading && headingElements.length > 0) {
        // Find the first visible heading
        for (const heading of headingElements) {
          const rect = heading.getBoundingClientRect();
          if (rect.top > 0 && rect.bottom < window.innerHeight) {
            activeHeading = heading;
            break;
          }
        }
        
        // If still no heading is visible, use the first one
        if (!activeHeading) {
          activeHeading = headingElements[0];
        }
      }
      
      if (activeHeading) {
        setActiveId(activeHeading.id);
      }
    };
    
    // Debounced version to reduce performance impact
    const debouncedHandleScroll = debounce(determineActiveHeading, 100);
    
    // Initial check
    determineActiveHeading();
    
    // Add scroll event listener
    window.addEventListener('scroll', debouncedHandleScroll);
    
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
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
    <div className="hidden xl:block w-64 shrink-0 fixed right-0 top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-10 scrollbar-thin pr-6">
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
