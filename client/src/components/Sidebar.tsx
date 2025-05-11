import { useLocation } from "wouter";
import NavigationLink from "./NavigationLink";
import { Input } from "@/components/ui/input";
import { ChevronRight, Search, X, FileText, CheckCircle, Lock } from "lucide-react";
// We're using Lucide icons for UI elements

import { cn } from "@/lib/utils";
import { useProgress } from "@/hooks/useProgress";
import { ProgressBar } from "./ProgressBar";
import { DocPage } from "@/lib/docs";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { debounce } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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
  const { isLessonCompleted } = useProgress();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocPage[]>([]);
  const [allDocs, setAllDocs] = useState<DocPage[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use React Query for data fetching with built-in caching
  const { data, isLoading: isSectionsLoading } = useQuery({
    queryKey: ["/api/sections"],
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - effectively disable refetching
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache retention
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false, // Ensure no periodic refetching
  });

  // Process the data when it changes
  useEffect(() => {
    if (data && typeof data === "object") {
      setSections(data as SectionData);

      // Build allDocs from sections - avoid separate network requests
      const allDocsArray: DocPage[] = [];
      Object.values(data as SectionData).forEach((section) => {
        allDocsArray.push(...section);
      });

      setAllDocs(allDocsArray);
    }
  }, [data]);

  // Update the loading state based on the query
  useEffect(() => {
    setLoading(isSectionsLoading);
  }, [isSectionsLoading]);

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

  // Debounce search to reduce CPU usage when typing quickly
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else if (query.trim().length === 0) {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300),
    [allDocs], // Only recreate if allDocs changes
  );

  // Search handler with debouncing
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Format section names for display
  const formatSectionName = (section: string) => {
    // Special case for root section
    if (section === "root") {
      return "Home";
    }

    return section
      .replace(/^\d+-/, "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to construct consistent full path for lessons
  const getFullLessonPath = (doc: any, section: string) => {
    // If the slug already includes a path, use it as is
    if (doc.slug.includes("/")) {
      return doc.slug;
    }

    // Otherwise, construct a full path with section and lesson name
    // Normalize section name - remove numeric prefixes
    const normalizedSection = section.replace(/^\d+-/, "");
    const baseSlug = doc.slug.split("/").pop() || doc.slug;

    // Special case for root section
    if (section === "root") {
      return baseSlug;
    }

    return `${normalizedSection}/${baseSlug}`;
  };

  // Handle sidebar link click
  const handleLinkClick = () => {
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }
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
        {/* Progress Bar */}
        {isAuthenticated && (
          <div className="px-8 mb-4">
            <ProgressBar />
          </div>
        )}

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
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="absolute right-3 top-2.5 w-4 h-4" />
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
                            <Lock className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{doc.sidebarTitle || doc.title}</span>
                          </div>
                        </div>
                      ) : (
                        <NavigationLink
                          href={doc.path}
                          className={cn(
                            "nav-link block relative px-3 py-2 rounded-md hover:bg-[#111] text-sm",
                            location === doc.path
                              ? "active text-orange-500 bg-[#111] font-medium"
                              : "text-gray-400 hover:text-orange-500",
                          )}
                          onClick={handleLinkClick}
                        >
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">
                                {doc.sidebarTitle || doc.title}
                              </span>
                              {isLessonCompleted(
                                getFullLessonPath(doc, doc.section || "root"),
                              ) && (
                                <CheckCircle className="h-4 w-4 flex-shrink-0 ml-1 opacity-75 text-green-500" />
                              )}
                            </div>
                            <span className="text-xs text-gray-500 truncate mt-1">
                              {doc.description}
                            </span>
                          </div>
                        </NavigationLink>
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
            // Normal navigation by sections - sort the sections by numeric prefix for proper ordering
            Object.entries(sections)
              .sort(([sectionNameA], [sectionNameB]) => {
                // Always keep root first
                if (sectionNameA === "root") return -1;
                if (sectionNameB === "root") return 1;

                // Extract numeric prefix from section names
                const getOrderPrefix = (name: string) => {
                  const match = name.match(/^(\d+)-/);
                  return match ? parseInt(match[1], 10) : 999;
                };

                // Sort by numeric prefix
                return (
                  getOrderPrefix(sectionNameA) - getOrderPrefix(sectionNameB)
                );
              })
              .map(([sectionName, sectionDocs]) => (
                <div key={sectionName} className="mb-8">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-300">
                    {formatSectionName(sectionName).toUpperCase()}
                  </div>
                  <ul className="space-y-1">
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
                              <Lock className="h-4 w-4 text-gray-500 mr-1" />
                              <span>{doc.sidebarTitle}</span>
                            </div>
                          </div>
                        ) : (
                          <NavigationLink
                            href={doc.path}
                            className={cn(
                              "nav-link block relative px-3 py-1.5 rounded-md hover:bg-[#111] text-sm transition-colors duration-150" /* Adjusted padding and added transition */,
                              location === doc.path
                                ? "active text-orange-500 bg-[#111] font-medium"
                                : "text-gray-400 hover:text-orange-500",
                            )}
                            onClick={handleLinkClick}
                          >
                            <div className="flex items-center gap-2 justify-between w-full">
                              <span>{doc.sidebarTitle}</span>
                              {isLessonCompleted(
                                getFullLessonPath(doc, sectionName),
                              ) && (
                                <CheckCircle className="h-4 w-4 flex-shrink-0 ml-1 opacity-75 text-green-500" />
                              )}
                            </div>
                          </NavigationLink>
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
