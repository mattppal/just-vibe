import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressData } from '@shared/schema';

/**
 * Hook for accessing and managing user's course progress
 */
export function useProgress() {
  const queryClient = useQueryClient();
  
  // Fetch user progress data
  const { data: progress, isLoading, error } = useQuery<ProgressData>({
    queryKey: ['/api/progress'],
    // Only fetch if user is authenticated
    enabled: !!queryClient.getQueryData(['/api/auth/user']),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
  
  // Calculate total lessons completed
  const completedCount = progress?.totalCompletedCount || 0;
  
  // Mutation for marking a lesson as complete
  const markComplete = useMutation({
    mutationFn: async ({ lessonSlug, version }: { lessonSlug: string, version?: string }) => {
      console.log(`Attempting to mark lesson ${lessonSlug} as complete`);
      const response = await fetch(`/api/progress/lesson/${lessonSlug}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ version }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Error marking lesson as complete: ${response.status} ${response.statusText}`);
        throw new Error('Failed to mark lesson as complete');
      }
      
      const data = await response.json();
      console.log('Mark complete API response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mark complete mutation successful, invalidating queries');
      // Invalidate and refetch progress data
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      
      // Force an immediate refetch
      queryClient.fetchQuery({
        queryKey: ['/api/progress']
      });
      
      console.log('Updated progress data:', data);
    },
  });
  
  // Mutation for marking a lesson as incomplete
  const markIncomplete = useMutation({
    mutationFn: async (lessonSlug: string) => {
      console.log(`Attempting to mark lesson ${lessonSlug} as incomplete`);
      const response = await fetch(`/api/progress/lesson/${lessonSlug}/incomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Error marking lesson as incomplete: ${response.status} ${response.statusText}`);
        throw new Error('Failed to mark lesson as incomplete');
      }
      
      const data = await response.json();
      console.log('Mark incomplete API response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mark incomplete mutation successful, invalidating queries');
      // Invalidate and refetch progress data
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      
      // Force an immediate refetch
      queryClient.fetchQuery({
        queryKey: ['/api/progress']
      });
      
      console.log('Updated progress data:', data);
    },
  });
  
  // Check if a specific lesson is completed
  const isLessonCompleted = (lessonSlug: string): boolean => {
    if (!progress?.completedLessons) {
      console.log('No completed lessons data found for this user');
      return false;
    }
    const isCompleted = !!progress.completedLessons[lessonSlug];
    console.log(`Checking completion for lesson: ${lessonSlug} - Completed: ${isCompleted}`);
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
