import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getDocByPath, DocPage as DocPageType } from '@/lib/docs';
import { useQuery } from '@tanstack/react-query';
import TableOfContents from "@/components/TableOfContents";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, Home as HomeIcon, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const { isAuthenticated, login } = useAuth();
  
  // Fetch the introduction document directly
  const { data: doc, isLoading, error: queryError } = useQuery<DocPageType | null, Error, DocPageType | null>({
    queryKey: ["/api/docs/path/welcome/introduction"],
    queryFn: async () => {
      try {
        const result = await getDocByPath("/welcome/introduction");
        return result || null;
      } catch (error) {
        console.error('Error fetching introduction doc:', error);
        throw error;
      }
    },
    staleTime: 72 * 60 * 60 * 1000, // 72 hours - extended cache life
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - keep in cache for a week
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false
  });
  
  // Update document title when data is loaded
  useEffect(() => {
    if (doc) {
      document.title = `${doc.title} | Just Vibe Docs`;
    }
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
        </div>
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
        </div>
      </div>
    );
  }

  return (
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