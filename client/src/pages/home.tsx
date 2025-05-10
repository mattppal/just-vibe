import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getDocByPath, DocPage } from '@/lib/docs';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const [, setLocation] = useLocation();
  
  // Use React Query to fetch the content for the root path ('/')
  const { data: doc, isLoading, error } = useQuery<DocPage | undefined>({
    queryKey: ['/api/docs/path/'],
    queryFn: async () => {
      try {
        return await getDocByPath('/');
      } catch (error) {
        console.error('Error fetching home page:', error);
        throw error;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  
  // Update document title when data is loaded
  useEffect(() => {
    if (doc) {
      document.title = `${doc.title} | Just Vibe Docs`;
    }
  }, [doc]);
  
  // If the root doc doesn't exist, redirect to welcome/introduction as fallback
  useEffect(() => {
    if (!isLoading && !doc && !error) {
      // Fallback to the original redirection if no root content exists
      setLocation('/welcome/introduction');
    }
  }, [isLoading, doc, error, setLocation]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-20 animate-pulse text-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
        <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
      </div>
    );
  }
  
  // If we have content, render the DocPage content
  if (doc) {
    return (
      <div className="prose prose-invert max-w-none">
        <h1>{doc.title}</h1>
        <p className="text-muted-foreground text-lg mb-8">{doc.description}</p>
        <div 
          id="doc-content"
          className="docs-html"
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </div>
    );
  }
  
  // Error or no document found
  return (
    <div className="py-20 text-center bg-black text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Documentation Not Found</h1>
      <p className="text-gray-400">Redirecting to introduction page...</p>
    </div>
  );
}