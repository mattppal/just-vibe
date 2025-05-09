import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getDocByPath, DocPage as DocPageType } from "@/lib/docs";
import TableOfContents from "@/components/TableOfContents";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";

export default function DocPage() {
  const [location, setLocation] = useLocation();
  const [doc, setDoc] = useState<DocPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const { isAuthenticated, login } = useAuth();
  
  // Determine the path from the URL
  const path = location;
  
  // Redirect to home page if unauthorized access attempt
  useEffect(() => {
    if (authRequired && !isAuthenticated) {
      // Redirect with a small delay to avoid immediate redirects
      setTimeout(() => {
        console.log('Redirecting due to authentication requirement');
        setLocation('/');
      }, 100);
    }
  }, [authRequired, isAuthenticated, setLocation]);

  useEffect(() => {
    async function fetchDoc() {
      try {
        setLoading(true);
        setError(null);
        setAuthRequired(false);
        
        const docData = await getDocByPath(path);
        
        if (docData) {
          setDoc(docData);
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
      <div className="animate-pulse">
        <div className="h-8 w-1/3 bg-[hsl(var(--code))] rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-[hsl(var(--code))] rounded w-full"></div>
          <div className="h-4 bg-[hsl(var(--code))] rounded w-5/6"></div>
          <div className="h-4 bg-[hsl(var(--code))] rounded w-4/6"></div>
        </div>
      </div>
    );
  }
  
  if (authRequired && !isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="text-secondary mb-8">You need to be logged in to view this content.</p>
        <button
          onClick={login}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Log in
        </button>
      </div>
    );
  }
  
  if (error || !doc) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-secondary">{error || "Document not found"}</p>
      </div>
    );
  }
  
  return (
    <div className="flex">
      <article className="max-w-none flex-1">
        <h1 className="text-3xl lg:text-4xl font-medium mb-4">{doc.title}</h1>
        <p className="text-muted-foreground text-lg mb-8">{doc.description}</p>
        
        {/* Render the HTML content with prose class */}
        <div 
          className="prose prose-invert max-w-none font-sans text-white" 
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