import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getDocByPath, DocPage as DocPageType, getDocsBySection } from "@/lib/docs";
import TableOfContents from "@/components/TableOfContents";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, Home, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function DocPage() {
  const [location, setLocation] = useLocation();
  const [doc, setDoc] = useState<DocPageType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const { isAuthenticated, login } = useAuth();
  
  // Determine the path from the URL
  const path = location;
  
  // Use TanStack Query to fetch the doc data properly
  const { data: docData, isLoading, error: queryError } = useQuery<DocPageType | null, Error, DocPageType | null>({
    queryKey: [`/api/docs/path${path}`],
    queryFn: async () => {
      try {
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

  // Update component state when query data changes
  useEffect(() => {
    if (docData) {
      setDoc(docData);
      document.title = `${docData.title} | Just Vibe Docs`;
      
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
            // If not in cache, fetch it (this should be rare since the sidebar should have loaded it)
            queryClient.fetchQuery({
              queryKey: ['/api/sections'],
              staleTime: 24 * 60 * 60 * 1000, // 24 hours
              gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
            }).then(data => {
              if (data) processSectionsData(data as Record<string, DocPageType[]>);
            }).catch(() => {
              // Silently fail for preloading
            });
          }
        }
      };
      
      // Use requestIdleCallback with a much longer timeout
      // Only run this if user has been on the page for at least 20 seconds
      if (typeof window.requestIdleCallback === 'function') {
        setTimeout(() => {
          window.requestIdleCallback(prefetchAdjacentDocs, { timeout: 15000 }); // 15 second timeout
        }, 20000); // Wait 20 seconds before even trying to prefetch
      } else {
        // No requestIdleCallback support, use a much longer timeout
        setTimeout(prefetchAdjacentDocs, 30000); // 30 second timeout
      }
    } else if (!isLoading && !queryError) {
      setError("Document not found");
    }
  }, [docData, isLoading, queryError, isAuthenticated]);
  
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
  
  // Process code blocks to add copy buttons and make iframes responsive
  useEffect(() => {
    if (!doc) return;
    
    // Find code blocks for copy buttons
    const codeBlocks = document.querySelectorAll('pre[data-copyable="true"]');
    codeBlocks.forEach((block) => {
      const codeContent = block.getAttribute('data-code');
      if (codeContent && !(block as any).__hasCopyButton) {
        // Create a simpler copy button without React components
        const copyButton = document.createElement('button');
        copyButton.className = 'absolute top-2 right-2 h-7 w-7 rounded-sm bg-black/30 p-1 text-white opacity-70 hover:opacity-100 transition-opacity z-10';
        copyButton.title = 'Copy code to clipboard';
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        
        // Ensure the original pre tag has relative positioning for absolute copy button
        (block as HTMLElement).style.position = 'relative';
        
        // Add copy functionality
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(codeContent)
            .then(() => {
              // Show success indication
              copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
              setTimeout(() => {
                copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
              }, 2000);
            })
            .catch(() => { /* Silent fail for clipboard errors */ });
        });
        
        // Add the copy button to the pre tag
        block.appendChild(copyButton);
        (block as any).__hasCopyButton = true;
      }
    });
    
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
    );
  }
  
  if (error || !doc) {
    return (
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
    );
  }
  
  return (
    <div className="flex min-h-[calc(100vh-3.5rem-1px)]">
      <article className="max-w-none flex-1 min-w-0">
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
          dangerouslySetInnerHTML={{ __html: doc.html }} 
        />
      </article>
      
      {doc.headings.length > 0 && (
        <div className="hidden xl:block w-64 flex-shrink-0">
          <TableOfContents items={doc.headings.map(h => ({ id: h.id, title: h.title }))} />
        </div>
      )}
    </div>
  );
}