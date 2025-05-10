import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { getDocByPath, DocPage } from '@/lib/docs';
import { useQuery } from '@tanstack/react-query';

// Interface to represent our API response that includes both DocPage fields and our additional fields
interface HomeDocResponse extends DocPage {
  isHomePage?: boolean;
  rootAlias?: boolean;
}

export default function Home() {
  const [, setLocation] = useLocation();
  
  // Fetch the home/introduction document
  const { data: homeDoc, isLoading } = useQuery<HomeDocResponse, Error>({ 
    queryKey: ['/api/docs/path/root'],
    queryFn: async () => {
      try {
        // Make the API request to get the root document
        const response = await fetch('/api/docs/path/root');
        if (!response.ok) {
          throw new Error('Failed to fetch home document');
        }
        const data = await response.json();
        return data as HomeDocResponse;
      } catch (error) {
        console.error('Error fetching home document:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    // If we got a home document, redirect to its proper path
    if (homeDoc?.path) {
      // Remove the leading slash if it exists
      const normalizedPath = homeDoc.path.startsWith('/') ? homeDoc.path.substring(1) : homeDoc.path;
      // Only redirect if we're not already on the right path
      if (normalizedPath !== '' && window.location.pathname !== `/${normalizedPath}`) {
        setLocation(normalizedPath);
      }
    } else if (!isLoading) {
      // If no home document was found and not still loading, default to introduction
      setLocation('introduction');
    }
  }, [homeDoc, isLoading, setLocation]);

  return (
    <div className="py-20 animate-pulse text-center bg-black text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
      <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
    </div>
  );
}