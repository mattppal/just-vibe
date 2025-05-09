import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function Home() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Direct fetch from API endpoint instead of using the docs library
    async function redirectToFirstDoc() {
      try {
        // Directly fetch from API for more reliable results
        const sectionsResponse = await apiRequest('/api/sections');
        
        if (sectionsResponse && typeof sectionsResponse === 'object') {
          // Find first section with docs
          const sections = sectionsResponse as Record<string, any[]>;
          const sectionKeys = Object.keys(sections);
          
          if (sectionKeys.length > 0) {
            const firstSection = sections[sectionKeys[0]];
            
            if (firstSection && firstSection.length > 0) {
              const firstDoc = firstSection[0];
              // Check if path exists and redirect
              if (firstDoc && firstDoc.path) {
                console.log('Redirecting to:', firstDoc.path);
                setLocation(firstDoc.path);
                return;
              }
            }
          }
          
          // Fallback if no docs found
          setLocation('/introduction');
        }
      } catch (error) {
        console.error('Error redirecting to first doc:', error);
        // Fallback redirect to a known page
        setLocation('/introduction');
      } finally {
        setLoading(false);
      }
    }

    redirectToFirstDoc();
  }, [setLocation]);

  return (
    <div className="py-20 animate-pulse text-center bg-black text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
      <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
    </div>
  );
}