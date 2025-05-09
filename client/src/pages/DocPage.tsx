import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getDocByPath, DocPage as DocPageType } from "@/lib/docs";
import TableOfContents from "@/components/TableOfContents";

export default function DocPage() {
  const [location] = useLocation();
  const [doc, setDoc] = useState<DocPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine the path from the URL
  const path = location;
  
  useEffect(() => {
    async function fetchDoc() {
      try {
        setLoading(true);
        setError(null);
        
        const docData = await getDocByPath(path);
        
        if (docData) {
          setDoc(docData);
        } else {
          setError("Document not found");
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
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
      <article className="prose prose-invert prose-a:text-primary prose-headings:scroll-m-20 prose-code:font-mono prose-pre:bg-[hsl(var(--code))] max-w-none flex-1">
        <h1 className="text-3xl lg:text-4xl">{doc.title}</h1>
        <p className="text-muted-foreground text-lg">{doc.description}</p>
        
        {/* Render the HTML content */}
        <div dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>
      
      {doc.headings.length > 0 && (
        <div className="hidden xl:block">
          <TableOfContents items={doc.headings.map(h => ({ id: h.id, title: h.title }))} />
        </div>
      )}
    </div>
  );
}