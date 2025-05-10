import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DocPage as DocPageType } from '@/lib/docs';

// Loading animation component
const LoadingAnimation = () => (
  <div className="py-20 animate-pulse text-center bg-black text-white">
    <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
    <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
  </div>
);

export default function HomePage() {
  const [, setLocation] = useLocation();
  
  // Fetch the first document in the content directory
  const { data: firstDoc, isLoading } = useQuery<DocPageType>({
    queryKey: ["/api/docs/first"],
    queryFn: async () => {
      const response = await apiRequest("/api/docs/first");
      return response as DocPageType;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });
  
  // Redirect to the first document's path when data is loaded
  useEffect(() => {
    if (firstDoc && firstDoc.path) {
      // Redirect to the document's path, which now includes the section
      setLocation(firstDoc.path);
    }
  }, [firstDoc, setLocation]);

  // Show loading animation while fetching the first document
  return <LoadingAnimation />;
}