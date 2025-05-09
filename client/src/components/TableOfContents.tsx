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
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Create an observer to track which heading is currently visible
    const observer = new IntersectionObserver(
      (entries) => {
        // Sort entries by their current intersection ratio to find the most visible heading
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        // Adjust rootMargin to consider top of viewport as the trigger area
        // Negative values mean we're looking at elements already inside the viewport
        rootMargin: "-100px 0px -70% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1], // Multiple thresholds for better accuracy
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
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
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
