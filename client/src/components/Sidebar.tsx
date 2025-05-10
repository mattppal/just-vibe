import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { ChevronRight, Search, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DocPage,
  getAllDocs,
  getDocsBySection,
  getDocByPath,
} from "@/lib/docs";
import { useEffect, useState, useRef, useMemo } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { debounce } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocPage[]>([]);
  const [allDocs, setAllDocs] = useState<DocPage[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Combined data fetching with optimizations
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        // First fetch sections - this is critical for navigation
        const sectionsData = await getDocsBySection();
        
        if (isMounted) {
          setSections(sectionsData);
          setLoading(false);
          
          // Build allDocs from sections - avoid a separate network request
          const allDocsArray: DocPage[] = [];
          Object.values(sectionsData).forEach(section => {
            allDocsArray.push(...section);
          });
          
          setAllDocs(allDocsArray);
        }
      } catch (error) {
        // Silent fail on errors
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Reset search results when allDocs gets updated
  useEffect(() => {
    if (searchQuery && allDocs.length > 0) {
      performSearch(searchQuery);
    }
  }, [allDocs, searchQuery]);

  // Handle search query directly
  function performSearch(query: string) {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const normalizedQuery = query.toLowerCase().trim();

    // Perform search on all available docs

    // Search in title, description, and content
    const results = allDocs.filter((doc) => {
      const titleMatch = doc.title?.toLowerCase().includes(normalizedQuery);
      const descMatch = doc.description
        ?.toLowerCase()
        .includes(normalizedQuery);
      const contentMatch = doc.content?.toLowerCase().includes(normalizedQuery);

      return titleMatch || descMatch || contentMatch;
    });

    setSearchResults(results);
  }

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Format section names for display
  const formatSectionName = (section: string) => {
    return section
      .replace(/^\d+-/, "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-20 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-[calc(3.5rem+1px)] bottom-0 left-0 z-30 w-72 min-w-[272px] bg-black text-white sidebar-with-border overflow-y-auto pb-10 pt-6",
          "lg:sticky lg:block lg:top-[calc(3.5rem+1px)] lg:h-[calc(100vh-3.5rem-1px)] lg:w-72 lg:min-w-[272px] lg:shrink-0",
          "transition-transform duration-300 ease-in-out scrollbar-thin",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-8 mb-8">
          <div className="relative">
            <Input
              type="text" /* Changed from search to text to remove default browser behavior */
              placeholder="Search..."
              className="w-full bg-[#111] text-white border-[#333] placeholder-gray-500"
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-orange-500"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-orange-600" />
              </button>
            ) : (
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-orange-600" />
            )}
          </div>
        </div>

        <nav className="px-8">
          {loading ? (
            <div className="text-secondary text-sm p-4">
              Loading documentation...
            </div>
          ) : isSearching ? (
            // Search results view
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                SEARCH RESULTS
              </div>

              {searchResults.length === 0 ? (
                <div className="text-secondary text-sm p-2 bg-[#111]/50 rounded-md">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <ul className="space-y-1 mb-6">
                  {searchResults.map((doc) => (
                    <li key={doc.slug}>
                      {doc.requiresAuth && !isAuthenticated ? (
                        <div
                          title="Login required to view this content"
                          className="block px-3 py-2 rounded-md text-sm opacity-50 cursor-not-allowed text-gray-500"
                        >
                          <div className="flex items-center gap-2">
                            <span role="img" aria-label="lock">
                              🔒
                            </span>
                            <span>{doc.sidebarTitle || doc.title}</span>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={doc.path}
                          className={cn(
                            "nav-link block relative px-3 py-2 rounded-md hover:bg-[#111] text-sm",
                            location === doc.path
                              ? "active text-orange-500 bg-[#111] font-medium"
                              : "text-gray-400 hover:text-orange-500",
                          )}
                          onMouseEnter={() => {
                            // Prefetch content when hovering over search result
                            queryClient.prefetchQuery({
                              queryKey: [`/api/docs/path${doc.path}`],
                              queryFn: () => getDocByPath(doc.path),
                            });
                          }}
                          onClick={() => {
                            // Optionally close search after clicking a result
                            if (window.innerWidth < 1024) {
                              // Close on mobile
                              onClose();
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {doc.sidebarTitle || doc.title}
                            </span>
                            <span className="text-xs text-gray-500 truncate mt-1">
                              {doc.description}
                            </span>
                          </div>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : Object.keys(sections).length === 0 ? (
            <div className="text-secondary text-sm p-4">
              No documentation found.
            </div>
          ) : (
            // Normal navigation by sections
            Object.entries(sections).map(([sectionName, sectionDocs]) => (
              <div key={sectionName} className="mb-8">
                {" "}
                {/* Increased margin bottom */}
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-300">
                  {formatSectionName(sectionName).toUpperCase()}
                </div>
                <ul className="space-y-1">
                  {" "}
                  {/* Reduced item spacing for better visual grouping */}
                  {sectionDocs.map((doc) => (
                    <li key={doc.slug}>
                      {doc.requiresAuth && !isAuthenticated ? (
                        <div
                          title="Login required to view this content"
                          className={cn(
                            "block px-3 py-1.5 rounded-md text-sm opacity-50 cursor-not-allowed" /* Adjusted padding */,
                            location === doc.path
                              ? "text-orange-500 bg-[#111]"
                              : "text-gray-500",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span role="img" aria-label="lock">
                              🔒
                            </span>
                            <span>{doc.sidebarTitle}</span>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={doc.path}
                          className={cn(
                            "nav-link block relative px-3 py-1.5 rounded-md hover:bg-[#111] text-sm transition-colors duration-150" /* Adjusted padding and added transition */,
                            location === doc.path
                              ? "active text-orange-500 bg-[#111] font-medium"
                              : "text-gray-400 hover:text-orange-500",
                          )}
                          onClick={() => {
                            // Close sidebar on mobile after user clicks a link
                            if (window.innerWidth < 1024) {
                              onClose();
                            }
                          }}
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
