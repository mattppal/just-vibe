import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getDocByPath, DocPage as DocPageType } from "@/lib/docs";
import TableOfContents from "@/components/TableOfContents";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, Home, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function DocPage() {
  const [location, setLocation] = useLocation();
  const [doc, setDoc] = useState<DocPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const { isAuthenticated, login } = useAuth();
  
  // Determine the path from the URL
  const path = location;
  
  // We no longer immediately redirect on auth errors
  // Instead, we show a proper login screen with options to navigate elsewhere

  useEffect(() => {
    async function fetchDoc() {
      try {
        setLoading(true);
        setError(null);
        setAuthRequired(false);
        
        const docData = await getDocByPath(path);
        
        if (docData) {
          setDoc(docData);
          
          // Preload adjacent documents (next and previous) based on section if possible
          if (docData.section) {
            // Import here to avoid circular dependencies
            import('@/lib/docs').then(async ({ getDocsBySection }) => {
              try {
                const sectionsData = await getDocsBySection();
                const currentSection = sectionsData[docData.section];
                
                if (currentSection) {
                  // Find current document index
                  const currentIndex = currentSection.findIndex(d => d.slug === docData.slug);
                  
                  if (currentIndex !== -1) {
                    // Preload next document if available
                    if (currentIndex < currentSection.length - 1) {
                      const nextDoc = currentSection[currentIndex + 1];
                      queryClient.prefetchQuery({
                        queryKey: [`/api/docs/path${nextDoc.path}`],
                        queryFn: () => getDocByPath(nextDoc.path)
                      });
                    }
                    
                    // Preload previous document if available
                    if (currentIndex > 0) {
                      const prevDoc = currentSection[currentIndex - 1];
                      queryClient.prefetchQuery({
                        queryKey: [`/api/docs/path${prevDoc.path}`],
                        queryFn: () => getDocByPath(prevDoc.path)
                      });
                    }
                  }
                }
              } catch (e) {
                // Silently fail for preloading
                console.log('Preloading adjacent docs failed:', e);
              }
            });
          }
        } else {
          setError("Document not found");
        }
      } catch (err: any) {
        console.error("Error fetching document:", err);
        
        // Check if this is an auth error (401)
        if (err?.response?.status === 401 || 
            (typeof err === 'object' && err.message === "Unauthorized")) {
          setAuthRequired(true);
        } else {
          setError("Failed to load document");
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchDoc();
  }, [path]);
  
  // No longer need to process HTML content as rehype-highlight handles code blocks
  
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
  
  // We no longer need this code block processing - rehype-highlight does it for us
  
  if (loading) {
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
    <div className="flex">
      <article className="max-w-none flex-1">
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
        
        {/* Render the HTML content with prose class */}
        <div 
          className="prose prose-invert max-w-none font-sans text-white prose-headings:text-white prose-p:text-white prose-a:text-primary prose-pre:bg-[#111]" 
          dangerouslySetInnerHTML={{ __html: doc.html }} 
        />
      </article>
      
      {doc.headings.length > 0 && (
        <div className="hidden xl:block">
          <TableOfContents items={doc.headings.map(h => ({ id: h.id, title: h.title }))} />
        </div>
      )}
    </div>
  );
}