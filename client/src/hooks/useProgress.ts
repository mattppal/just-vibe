import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getCsrfToken } from '@/lib/queryClient';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ProgressResponse {
  completedLessons: Record<string, { version: string | null, completedAt: string }>;
  lastActivity: string;
  totalCompletedCount: number;
}

export function useProgress() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State to track completion actions
  const [completingSlug, setCompletingSlug] = useState<string | null>(null);
  
  // Fetch progress data
  const { data: progressData, isLoading, error } = useQuery<ProgressResponse>({
    queryKey: ['/api/progress'],
    enabled: isAuthenticated, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  // Mark lesson as complete mutation
  const completeMutation = useMutation({
    mutationFn: async (lessonSlug: string) => {
      // Normalize the path format but preserve the full path structure
      // Clean the slug by removing numeric prefixes but keep the full path
      // For example, "1-getting-started/2-course-welcome" → "getting-started/course-welcome"
      const normalizePath = (path: string): string => {
        // Remove any numeric prefixes from path segments
        return path.split('/').map(segment => segment.replace(/^\d+-/, '')).join('/');
      };
      
      // Normalize the path format
      const normalizedSlug = normalizePath(lessonSlug);
      
      // Make a direct fetch request to bypass any middleware issues
      const response = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonSlug: normalizedSlug }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Progress API error:', errorText);
        throw new Error(errorText || 'Failed to complete lesson');
      }
      
      return await response.json();
      
    },
    onSuccess: () => {
      // Invalidate the progress query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      // Show success toast
      toast({
        title: '🎉 Lesson completed!',
        description: 'Your progress has been saved.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error completing lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark lesson as complete.',
        variant: 'destructive',
      });
    },
  });
  
  // Check if a lesson is completed
  const isLessonCompleted = useCallback((lessonSlug: string): boolean => {
    if (!progressData) return false;
    if (!progressData.completedLessons) return false;
    
    // Normalize the lesson slug to match database format
    // Clean the slug by removing numeric prefixes and normalizing format
    const normalizePath = (path: string): string => {
      // Remove any numeric prefixes from path segments
      return path.split('/').map(segment => segment.replace(/^\d+-/, '')).join('/');
    };
    
    // Helper to extract just the base lesson name
    const getBaseName = (path: string): string => {
      // Return the final segment of a path (everything after the last slash)
      return path.split('/').pop() || path;
    };
    
    // Normalize the input slug
    const normalizedInputSlug = normalizePath(lessonSlug);
    const inputBaseName = getBaseName(normalizedInputSlug);
    
    // Get section from input slug if it exists
    const inputSection = normalizedInputSlug.includes('/') 
      ? normalizedInputSlug.split('/')[0] 
      : null;
    
    // Check if this normalized slug exists in our completed lessons
    return Object.keys(progressData.completedLessons).some(completedSlug => {
      // Also normalize the completed slug from the DB
      const normalizedCompletedSlug = normalizePath(completedSlug);
      const completedBaseName = getBaseName(normalizedCompletedSlug);
      const completedSection = normalizedCompletedSlug.includes('/') 
        ? normalizedCompletedSlug.split('/')[0] 
        : null;
      
      // Priority 1: Exact full path match (most reliable)
      if (normalizedCompletedSlug === normalizedInputSlug) {
        return true;
      }
      
      // Priority 2: If both have sections and the base names match, but sections don't,
      // we should NOT consider them the same
      if (inputSection && completedSection && (inputSection !== completedSection) && 
          (inputBaseName === completedBaseName)) {
        // Different sections with same base name - NOT a match
        return false;
      }
      
      // Priority 3: If input has no section, fall back to base name match
      // This is for backward compatibility
      if (!inputSection && (inputBaseName === completedBaseName)) {
        return true;
      }
      
      return false;
    });
  }, [progressData]);
  
  // Mark a lesson as complete
  const completeLesson = useCallback((lessonSlug: string) => {
    if (!lessonSlug) {
      toast({
        title: 'Error',
        description: 'Invalid lesson slug. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to track your progress.',
        variant: 'destructive',
      });
      return;
    }
    
    completeMutation.mutate(lessonSlug);
  }, [isAuthenticated, completeMutation, toast]);
  
  // Uncomplete lesson mutation
  const uncompleteMutation = useMutation({
    mutationFn: async (lessonSlug: string) => {
      // Normalize the path format but preserve the full path structure
      // Clean the slug by removing numeric prefixes but keep the full path
      const normalizePath = (path: string): string => {
        // Remove any numeric prefixes from path segments
        return path.split('/').map(segment => segment.replace(/^\d+-/, '')).join('/');
      };
      
      // Normalize the path format
      const normalizedSlug = normalizePath(lessonSlug);
      
      // Make a direct fetch request 
      const response = await fetch('/api/progress/uncomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonSlug: normalizedSlug }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Progress API error:', errorText);
        throw new Error(errorText || 'Failed to uncomplete lesson');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the progress query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      // Show success toast
      toast({
        title: 'Lesson marked as not completed',
        description: 'Your progress has been updated.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error uncompleting lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson status.',
        variant: 'destructive',
      });
    },
  });
  
  // Uncomplete a lesson
  const uncompleteLesson = useCallback((lessonSlug: string) => {
    if (!lessonSlug) {
      toast({
        title: 'Error',
        description: 'Invalid lesson slug. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to track your progress.',
        variant: 'destructive',
      });
      return;
    }
    
    uncompleteMutation.mutate(lessonSlug);
  }, [isAuthenticated, uncompleteMutation, toast]);

  return {
    progress: progressData as ProgressResponse | undefined,
    isLoading,
    error,
    isLessonCompleted,
    completeLesson,
    uncompleteLesson,
    isCompleting: completeMutation.isPending || uncompleteMutation.isPending,
  };
}
