import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for accessing and managing user's course progress
 */
export function useProgress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch user progress data
  const { data: progress, isLoading, error, refetch } = useQuery<ProgressData>({
    queryKey: ['/api/progress'],
    // Only fetch if user is authenticated
    enabled: !!queryClient.getQueryData(['/api/auth/user']),
    staleTime: 0, // Always consider data stale to ensure fresh data
    gcTime: 10 * 1000, // Short cache time of 10 seconds (used to be cacheTime in React Query v4)
    refetchOnWindowFocus: true, 
    refetchOnMount: true,
    refetchInterval: 5000, // Refetch every 5 seconds to keep progress data updated
    retry: 3, // Retry failed requests 3 times
  });
  
  // Calculate total lessons completed
  const completedCount = progress?.totalCompletedCount || 0;
  
  // Mutation for marking a lesson as complete
  const markComplete = useMutation({
    mutationFn: async ({ lessonSlug, version }: { lessonSlug: string, version?: string }) => {
      console.log(`Attempting to mark lesson ${lessonSlug} as complete`);
      try {
        const response = await fetch(`/api/progress/lesson/${lessonSlug}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ version }),
          credentials: 'include'
        });
        
        // Log the response status and key headers for debugging
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Cache-Control:', response.headers.get('cache-control'));
        
        if (!response.ok) {
          console.error(`Error marking lesson as complete: ${response.status} ${response.statusText}`);
          // Try to get error details if possible
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`Failed to mark lesson as complete: ${response.statusText}`);
        }
        
        // First get response as text to debug any parsing issues
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        // Then parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Mark complete API response:', data);
          return data;
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.error('Response text that failed to parse:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error('Error during markComplete:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mark complete mutation successful, updating cache with:', data);
      
      // Immediately update the local cache with the new data
      queryClient.setQueryData(['/api/progress'], data);
      
      // Force refetch to get the latest data from the server
      refetch();
      
      // Then invalidate cached queries to trigger refetch on next render
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      
      // Show success notification
      toast({
        title: "Lesson completed!",
        description: "Your progress has been saved.",
        className: "bg-green-600 text-white border-green-700",
      });
      
      console.log('Updated progress data:', data);
    },
  });
  
  // Mutation for marking a lesson as incomplete
  const markIncomplete = useMutation({
    mutationFn: async (lessonSlug: string) => {
      console.log(`Attempting to mark lesson ${lessonSlug} as incomplete`);
      try {
        const response = await fetch(`/api/progress/lesson/${lessonSlug}/incomplete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        // Log the response status and headers for debugging
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
          console.error(`Error marking lesson as incomplete: ${response.status} ${response.statusText}`);
          // Try to get error details if possible
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`Failed to mark lesson as incomplete: ${response.statusText}`);
        }
        
        // First get response as text to debug any parsing issues
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        // Then parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Mark incomplete API response:', data);
          return data;
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.error('Response text that failed to parse:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error('Error during markIncomplete:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mark incomplete mutation successful, updating cache with:', data);
      
      // Immediately update the local cache with the new data
      queryClient.setQueryData(['/api/progress'], data);
      
      // Force refetch to get the latest data from the server
      refetch();
      
      // Then invalidate cached queries to trigger refetch on next render
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      
      // Show notification
      toast({
        title: "Progress reset",
        description: "Lesson marked as incomplete.",
        variant: "default",
      });
      
      console.log('Updated progress data:', data);
    },
  });
  
  // Check if a specific lesson is completed
  const isLessonCompleted = (lessonSlug: string): boolean => {
    if (!progress) {
      console.log('Progress data not available yet');
      return false;
    }
    if (!progress.completedLessons) {
      console.log('No completed lessons data found for this user');
      return false;
    }
    const isCompleted = !!progress.completedLessons[lessonSlug];
    console.log(`Checking completion for lesson: ${lessonSlug} - Completed: ${isCompleted}`, 
                { completedLessons: progress.completedLessons, totalCount: progress.totalCompletedCount });
    return isCompleted;
  };
  
  // Calculate progress percentage based on total lessons
  const getProgressPercentage = (totalLessons: number): number => {
    if (!progress || totalLessons <= 0) return 0;
    return Math.min(100, Math.round((completedCount / totalLessons) * 100));
  };
  
  return {
    progress,
    isLoading,
    error,
    completedCount,
    markComplete,
    markIncomplete,
    isLessonCompleted,
    getProgressPercentage,
  };
}