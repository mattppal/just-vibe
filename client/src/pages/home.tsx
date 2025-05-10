import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DocPage as DocPageType } from '@/lib/docs';
import TableOfContents from "@/components/TableOfContents";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Loading animation component
const LoadingAnimation = () => (
  <div className="py-20 animate-pulse text-center bg-black text-white">
    <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
    <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
  </div>
);

export default function HomePage() {
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  
  // Fetch the first document in the content directory
  const { data: doc, isLoading, error: queryError } = useQuery<DocPageType>({
    queryKey: ["/api/docs/first"],
    queryFn: async () => {
      const response = await apiRequest("/api/docs/first");
      return response as DocPageType;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });
  
  // Update document title when data is loaded
  useEffect(() => {
    if (doc) {
      document.title = `${doc.title} | Just Vibe Docs`;
    }
  }, [doc]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      setError("Failed to load document");
    }
  }, [queryError]);

  if (isLoading) {
    return <LoadingAnimation />;
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem-1px)] xl:pr-64">
      {/* Main content column - full width with right padding on large screens to make room for fixed TOC */}
      <article className="max-w-none xl:w-auto">
        {/* Home-specific title and description */}
        <div className="mb-8 border-b border-[#222] pb-8">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-gray-400">Welcome to our comprehensive documentation platform. Find detailed guides, tutorials, and API references to help you get started.</p>
        </div>
        
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
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: doc.html }} id="doc-content" />
      </article>
      
      {/* Right sidebar for table of contents (fixed position on large screens) */}
      {doc.headings && doc.headings.length > 0 && (
        <div className="hidden xl:block fixed top-[calc(3.5rem+1px)] right-0 w-64 h-[calc(100vh-3.5rem-1px)] border-l border-[#222] p-6 overflow-auto">
          <TableOfContents items={doc.headings} />
        </div>
      )}
    </div>
  );
}