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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
  
  // Calculate total lessons completed
  const completedCount = progress?.totalCompletedCount || 0;
  
  // Mutation for marking a lesson as complete
  const markComplete = useMutation({
    mutationFn: async ({ lessonSlug, version }: { lessonSlug: string, version?: string }) => {
      const response = await fetch(`/api/progress/lesson/${lessonSlug}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark lesson as complete');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch progress data
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    },
  });
  
  // Mutation for marking a lesson as incomplete
  const markIncomplete = useMutation({
    mutationFn: async (lessonSlug: string) => {
      const response = await fetch(`/api/progress/lesson/${lessonSlug}/incomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark lesson as incomplete');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch progress data
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    },
  });
  
  // Check if a specific lesson is completed
  const isLessonCompleted = (lessonSlug: string): boolean => {
    if (!progress?.completedLessons) return false;
    return !!progress.completedLessons[lessonSlug];
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
