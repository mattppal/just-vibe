import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getDocsBySection } from '@/lib/docs';

export default function Home() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function redirectToFirstDoc() {
      try {
        // Get all sections
        const sections = await getDocsBySection();
        
        // Find the first section with docs
        const firstSectionKey = Object.keys(sections)[0];
        if (firstSectionKey && sections[firstSectionKey]?.length > 0) {
          // Get the first doc in the first section
          const firstDoc = sections[firstSectionKey][0];
          // Redirect to that doc's path
          setLocation(firstDoc.path);
        }
      } catch (error) {
        console.error('Error redirecting to first doc:', error);
      } finally {
        setLoading(false);
      }
    }

    redirectToFirstDoc();
  }, [setLocation]);

  return (
    <div className="py-20 animate-pulse text-center">
      <h1 className="text-2xl font-bold mb-4">Loading Documentation...</h1>
      <p className="text-muted-foreground">Please wait while we find the right starting page for you.</p>
    </div>
  );
}