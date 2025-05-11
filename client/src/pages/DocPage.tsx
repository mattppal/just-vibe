import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getDocByPath, DocPage as DocPageType, getDocsBySection } from "@/lib/docs";
import MDXProvider from "@/components/MDXProvider";
import TableOfContents from "@/components/TableOfContents";
import { DocNavigation, findAdjacentDocs } from "@/components/DocNavigation";
import Footer from "@/components/Footer";
import { LessonCompletionButton } from "@/components/LessonCompletionButton";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, Home, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import ProgressDebugger from "@/components/ProgressDebugger";

export default function DocPage() {
  const [location, setLocation] = useLocation();
  const [doc, setDoc] = useState<DocPageType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [previousDoc, setPreviousDoc] = useState<{ title: string; path: string } | null>(null);
  const [nextDoc, setNextDoc] = useState<{ title: string; path: string } | null>(null);
  const { isAuthenticated, login } = useAuth();
  
  // Determine the path from the URL
  const path = location;
  
  // Use TanStack Query to fetch the doc data properly
  const { data: docData, isLoading, error: queryError } = useQuery<DocPageType | null, Error, DocPageType | null>({
    queryKey: [`/api/docs/path${path}`],
    queryFn: async () => {
      try {
        // Use the current path to fetch the document
        // The path already includes the section prefix from the router
        const result = await getDocByPath(path);
        return result || null;
      } catch (error) {
        console.error('Error fetching doc:', error);
        throw error;
      }
    },
    staleTime: 72 * 60 * 60 * 1000, // 72 hours - extended cache life
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - keep in cache for a week
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!path // Only run when path exists
  });
  
  // Use the existing queryClient to get sections data for navigation
  // This avoids making another API request since the sections data should already be in the cache
  const sectionsData = queryClient.getQueryData<Record<string, DocPageType[]>>(['/api/sections']);
  
  // Handle errors separately (React Query v5 doesn't accept onError in the options)
  useEffect(() => {
    if (queryError) {
      // Check if this is an auth error (401)
      if ((queryError as any)?.response?.status === 401 || 
          (typeof queryError === 'object' && queryError.message === "Unauthorized")) {
        setAuthRequired(true);
      } else {
        setError("Failed to load document");
      }
    }
  }, [queryError]);

  // Use another effect to fetch sections data if needed
  useEffect(() => {
    // If sections data is not in the cache, fetch it
    if (!queryClient.getQueryData(['/api/sections']) && !isLoading) {
      // Only fetch if the document has loaded successfully and we need sections data
      queryClient.prefetchQuery({
        queryKey: ['/api/sections'],
        queryFn: () => getDocsBySection()
      });
    }
  }, [isLoading]);

  // Update component state when query data changes
  useEffect(() => {
    if (docData) {
      // Get the latest sections data from cache each time we update
      const sectionsData = queryClient.getQueryData<Record<string, DocPageType[]>>(['/api/sections']);
      setDoc(docData);
      document.title = `${docData.title} | Just Vibe Docs`;
      
      // Find previous and next docs if we have sections data
      if (sectionsData) {
        const { previousDoc, nextDoc } = findAdjacentDocs(docData, sectionsData);
        setPreviousDoc(previousDoc);
        setNextDoc(nextDoc);
      } else {
        // If no sections data yet, clear previous/next navigation
        setPreviousDoc(null);
        setNextDoc(null);
      }
      
      // Use requestIdleCallback to prefetch only immediately adjacent docs when browser is idle
      const prefetchAdjacentDocs = () => {
        if (docData && docData.section) {
          // Get sections data from the cache if available, otherwise fetch from API
          const sectionsQueryData = queryClient.getQueryData<Record<string, DocPageType[]>>(['/api/sections']);
          
          // Process function to handle sections data
          const processSectionsData = (sectionsData: Record<string, DocPageType[]>) => {
            try {
              const currentSection = sectionsData[docData.section];
              
              if (currentSection) {
                const currentIndex = currentSection.findIndex(d => d.slug === docData.slug);
                
                if (currentIndex !== -1) {
                  // Create a small queue of only adjacent documents to prefetch
                  const prefetchQueue: DocPageType[] = [];
                  
                  // Only prefetch next and previous document, not all documents
                  // Next document has higher priority
                  if (currentIndex < currentSection.length - 1) {
                    const nextDoc = currentSection[currentIndex + 1];
                    if (!nextDoc.requiresAuth || isAuthenticated) {
                      prefetchQueue.push(nextDoc);
                    }
                  }
                  
                  // Previous document second priority
                  if (currentIndex > 0) {
                    const prevDoc = currentSection[currentIndex - 1];
                    if (!prevDoc.requiresAuth || isAuthenticated) {
                      prefetchQueue.push(prevDoc);
                    }
                  }
                  
                  // Only prefetch the next doc (first in queue) with much longer delay
                  // This significantly reduces unnecessary network requests
                  if (prefetchQueue.length > 0) {
                    const nextDoc = prefetchQueue[0]; // Only prefetch the first doc (usually the next page)
                    
                    // Much longer delay to give priority to user's current page
                    setTimeout(() => {
                      if (nextDoc.path) {
                        // The nextDoc.path already includes the section prefix
                        queryClient.prefetchQuery({
                          queryKey: [`/api/docs/path${nextDoc.path}`],
                          queryFn: () => getDocByPath(nextDoc.path),
                          staleTime: 72 * 60 * 60 * 1000 // 72 hours - extended cache life
                        });
                      }
                    }, 15000); // 15 second delay for prefetching
                  }
                }
              }
            } catch (e) {
              // Silently fail for preloading - this is a non-critical operation
            }
          };

          // If we have sections data in the cache, use it
          if (sectionsQueryData) {
            processSectionsData(sectionsQueryData);
          } else {
            // If not in cache, we'll use getQueryData with ensureQueryData for better caching
            // This will prioritize using the cache and only fetch if absolutely necessary
            // We're not using fetchQuery to avoid unnecessary network requests
            queryClient.ensureQueryData({
              queryKey: ['/api/sections'],
              staleTime: 24 * 60 * 60 * 1000, // 24 hours
              gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
              queryFn: () => getDocsBySection() // Use the existing function but wrapped in ensureQueryData
            }).then(data => {
              if (data) processSectionsData(data as Record<string, DocPageType[]>);
            }).catch(() => {
              // Silently fail for preloading
            });
          }
        }
      };
      
      // Significantly extend the prefetch delay to reduce server load
      // Only prefetch content if the user has stayed on the page for at least 45 seconds
      // This suggests they are actually reading the content and might navigate to related pages
      if (typeof window.requestIdleCallback === 'function') {
        setTimeout(() => {
          window.requestIdleCallback(prefetchAdjacentDocs, { timeout: 20000 }); // 20 second timeout (increased)
        }, 45000); // Wait 45 seconds before even trying to prefetch (increased from 20)
      } else {
        // No requestIdleCallback support, use a much longer timeout
        setTimeout(prefetchAdjacentDocs, 60000); // 60 second timeout (doubled from original)
      }
    } else if (!isLoading && !queryError) {
      setError("Document not found");
    }
  }, [docData, sectionsData, isLoading, queryError, isAuthenticated]);
  
  // Set IDs for headings to support table of contents
  useEffect(() => {
    if (!doc) return;
    
    // Add IDs to all headings in the content
    setTimeout(() => {
      doc.headings.forEach(heading => {
        const element = document.getElementById(heading.id);
        if (!element) {
          // Find headings by content if ID doesn't exist
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach(el => {
            if (el.textContent === heading.title && !el.id) {
              el.id = heading.id;
            }
          });
        }
      });
    }, 0);
  }, [doc]);
  
  // Process iframes to make them responsive
  useEffect(() => {
    if (!doc) return;
    
    // Make direct iframes responsive (proper wrapper approach)
    const contentNode = document.getElementById('doc-content');
    if (contentNode) {
      const iframes = contentNode.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        // Handle all iframes - basic properties
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        
        // Special handling for YouTube videos
        if (iframe.src.includes('youtube.com')) {
          // Skip already processed YouTube iframes
          if (iframe.parentElement?.classList.contains('youtube-container')) {
            return;
          }
          
          // Set title for accessibility if missing
          if (!iframe.hasAttribute('title')) {
            iframe.setAttribute('title', 'YouTube video');
          }
          
          // Ensure YouTube iframe has the required attributes
          iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
          iframe.setAttribute('frameborder', '0');
          
          // Create a container for the iframe for proper aspect ratio
          const container = document.createElement('div');
          container.className = 'youtube-container';
          
          // Replace the iframe with the container + iframe
          const parent = iframe.parentNode;
          if (parent) {
            // Insert the container before the iframe
            parent.insertBefore(container, iframe);
            // Move the iframe into the container
            container.appendChild(iframe);
          }
        } else {
          // Handle non-YouTube iframes
          iframe.setAttribute('width', '100%');
          iframe.setAttribute('height', 'auto');
          
          // Remove any style attribute that might interfere with our CSS
          if (iframe.hasAttribute('style')) {
            iframe.removeAttribute('style');
          }
        }
      });
    }
    
    // Legacy support for div.youtube-embed elements (if any exist)
    const youtubeEmbeds = document.querySelectorAll('div.youtube-embed');
    youtubeEmbeds.forEach((embed) => {
      const youtubeId = embed.getAttribute('data-youtube-id');
      if (youtubeId && !(embed as any).__processed) {
        // Create a container div for proper aspect ratio
        const container = document.createElement('div');
        container.className = 'youtube-container';
        
        // Create the iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${youtubeId}`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        iframe.title = 'YouTube video';
        iframe.setAttribute('frameborder', '0');
        
        // Add iframe to container
        container.appendChild(iframe);
        
        // Replace the original embed with our container
        embed.parentNode?.replaceChild(container, embed);
        (embed as any).__processed = true;
      }
    });
  }, [doc]);
  
  if (isLoading) {
    return (
      <div className="flex-1 py-8">
        <div className="animate-pulse">
          <div className="h-10 w-1/3 bg-[#111] rounded mb-6"></div>
          <div className="h-6 w-2/3 bg-[#111]/50 rounded mb-10"></div>
          <div className="space-y-6">
            <div className="h-4 bg-[#111] rounded w-full"></div>
            <div className="h-4 bg-[#111] rounded w-5/6"></div>
            <div className="h-4 bg-[#111] rounded w-4/6"></div>
            <div className="h-20 bg-[#111] rounded w-full"></div>
            <div className="h-4 bg-[#111] rounded w-full"></div>
            <div className="h-4 bg-[#111] rounded w-3/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (authRequired && !isAuthenticated) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
          <Lock className="h-12 w-12 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-gray-400 mb-8">You need to be logged in to view this content.</p>
          <div className="flex gap-3">
            <Button onClick={login} className="gap-2">
              <LogIn className="h-4 w-4" /> Login to continue
            </Button>
            <Button variant="outline" onClick={() => setLocation('/')} className="gap-2">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </div>
          <Alert variant="default" className="mt-8 max-w-md bg-[#111] border-yellow-700/50">
            <Lock className="h-4 w-4" />
            <AlertTitle>Protected Content</AlertTitle>
            <AlertDescription>
              This documentation page requires authentication. Please login to access all content.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </>
    );
  }
  
  if (error || !doc) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">{!doc ? "Page Not Found" : "Error Loading Page"}</h1>
          <p className="text-gray-400 mb-8">{error || "The document you're looking for doesn't exist or has been moved."}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              Try again
            </Button>
            <Button variant="default" onClick={() => setLocation('/')} className="gap-2">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem-1px)] xl:pr-64">
        {/* Main content column - full width with right padding on large screens to make room for fixed TOC */}
        <article className="max-w-none xl:w-auto">
          <nav className="flex items-center gap-1 text-sm mb-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              Docs
            </Link>
            {doc.section && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-400">
                  {doc.section
                    .replace(/^\d+-/, "")
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
              </>
            )}
            {doc.title && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-white">{doc.title}</span>
              </>
            )}
          </nav>
          <h1 className="text-3xl lg:text-4xl font-medium mb-4">{doc.title}</h1>
          <p className="text-muted-foreground text-lg mb-8">{doc.description}</p>
          
          {/* Render the HTML content with prose class - constraining width for better readability */}
          <div 
            id="doc-content"
            className="prose prose-invert prose-content font-sans text-white prose-headings:text-white prose-p:text-white prose-a:text-primary prose-pre:bg-[#111]" 
          >
            {/* Use MDXProvider for any content, which handles both MDX and regular markdown */}
            <MDXProvider>{doc.html}</MDXProvider>
          </div>
          
          {/* Lesson completion button */}
          {doc && (
            <div className="flex justify-center w-full mb-8 mt-12">
              <LessonCompletionButton lessonSlug={doc.slug} />
            </div>
          )}

          {/* Navigation links to previous and next pages */}
          <DocNavigation previousDoc={previousDoc} nextDoc={nextDoc} />
        </article>
        
        {/* TOC is now positioned with fixed positioning in the TableOfContents component */}
        {doc.headings.length > 0 && (
          <TableOfContents items={doc.headings.map(h => ({ id: h.id, title: h.title, level: h.level }))} />
        )}
      </div>
      
      {/* Add the Footer component */}
      <Footer />
    </>
  );
}