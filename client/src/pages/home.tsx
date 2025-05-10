import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getDocByPath, DocPage, getDocsBySection } from '@/lib/docs';

export default function Home() {
  const [, setLocation] = useLocation();
  const [homeDoc, setHomeDoc] = useState<DocPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Use direct API request to bypass any cached errors
  useEffect(() => {
    // Directly fetch from the API
    const fetchHomeDoc = async () => {
      try {
        setLoading(true);
        console.log('Fetching home document...');
        
        // Try to get the doc directly from the sections API first
        const sectionsData = await getDocsBySection();
        console.log('Sections data:', sectionsData);
        
        // Look for any 'root' section
        if (sectionsData.root && sectionsData.root.length > 0) {
          console.log('Found root section in sections API:', sectionsData.root[0]);
          
          // Use the doc from sections directly with an API call for the specific slug
          const rootDoc = sectionsData.root[0];
          console.log('Using root doc from sections data');
          
          try {
            // Directly fetch content for this specific doc by its slug (bypassing the path)
            const response = await fetch(`/api/docs/${rootDoc.slug}`);
            
            if (response.ok) {
              const docWithContent = await response.json();
              console.log('Successfully loaded root document with fetch API');
              setHomeDoc(docWithContent);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error fetching by slug:', err);
          }
          
          // If we get here, we'll use the sections data directly
          // We will be missing the HTML content, but this will still allow us to display the root doc title
          console.log('Falling back to sections data for root doc');
          setHomeDoc(rootDoc as DocPage);
          setLoading(false);
          return;
        }
        
        // Fall back to standard API call if section approach didn't work
        const doc = await getDocByPath('/');
        console.log('Standard API result:', doc);
        
        if (doc) {
          setHomeDoc(doc);
        } else {
          setErrorState('Home page content not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home page:', error);
        setErrorState('Failed to load home page');
        setLoading(false);
      }
    };
    
    fetchHomeDoc();
  }, []);
  
  // Update document title when data is loaded
  useEffect(() => {
    if (homeDoc) {
      document.title = `${homeDoc.title} | Just Vibe Docs`;
    }
  }, [homeDoc]);
  
  // If the root doc doesn't exist, redirect to welcome/introduction as fallback
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      if (!loading && !homeDoc) {
        console.log('No home doc found, redirecting to introduction');
        // Fallback to the original redirection if no root content exists
        setLocation('/welcome/introduction');
      }
    }, 2000); // Add a delay to avoid immediate redirect if loading takes time
    
    return () => clearTimeout(redirectTimer);
  }, [loading, homeDoc, setLocation]);

  // Loading state
  if (loading) {
    return (
      <div className="py-20 animate-pulse text-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
        <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
      </div>
    );
  }
  
  // If we have content, render the DocPage content
  if (homeDoc) {
    return (
      <div className="prose prose-invert max-w-none">
        <h1>{homeDoc.title}</h1>
        <p className="text-muted-foreground text-lg mb-8">{homeDoc.description}</p>
        {homeDoc.html ? (
          <div 
            id="doc-content"
            className="docs-html"
            dangerouslySetInnerHTML={{ __html: homeDoc.html }}
          />
        ) : (
          <div className="py-4">
            <p className="text-gray-400">Loading content...</p>
          </div>
        )}
      </div>
    );
  }
  
  // Error or no document found
  return (
    <div className="py-20 text-center bg-black text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Documentation Not Found</h1>
      <p className="text-gray-400">{errorState || 'Redirecting to introduction page...'}</p>
    </div>
  );
}