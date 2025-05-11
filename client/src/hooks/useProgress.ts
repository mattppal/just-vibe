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
  
  // Fetch progress data
  const { data: progressData, isLoading, error } = useQuery<ProgressResponse>({
    queryKey: ['/api/progress'],
    enabled: isAuthenticated, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  // Mark lesson as complete mutation
  const completeMutation = useMutation({
    mutationFn: async (lessonSlug: string) => {
      console.log('Sending API request with lesson slug:', lessonSlug);
      
      // Ensure we're sending the slug without any ordering prefix
      // Extract just the base part of the slug, removing section prefix and number ordering
      // For example, "1-getting-started/course-welcome" → "course-welcome"
      let cleanSlug = lessonSlug;
      
      // If the slug contains a slash, it might have section information
      if (cleanSlug.includes('/')) {
        // Extract just the part after the last slash
        cleanSlug = cleanSlug.split('/').pop() || cleanSlug;
      }
      
      // Remove any numeric prefix
      cleanSlug = cleanSlug.replace(/^\d+-/, '');
      
      console.log('Clean slug:', cleanSlug);
      
      // Make a direct fetch request to bypass any middleware issues
      const response = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonSlug: cleanSlug }),
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
    
    // Extract the base slug without section prefix
    let baseSlug = lessonSlug;
    if (baseSlug.includes('/')) {
      baseSlug = baseSlug.split('/').pop() || baseSlug;
    }
    baseSlug = baseSlug.replace(/^\d+-/, '');
    
    // Check if we have this lesson in our completed list
    return Object.keys(progressData.completedLessons).some(slug => {
      const cleanSlug = slug.replace(/^\d+-/, '');
      return cleanSlug === baseSlug;
    });
  }, [progressData]);
  
  // Mark a lesson as complete
  const completeLesson = useCallback((lessonSlug: string) => {
    console.log('Completing lesson with slug:', lessonSlug);
    
    if (!lessonSlug) {
      console.error('Invalid lesson slug:', lessonSlug);
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
  
  return {
    progress: progressData as ProgressResponse | undefined,
    isLoading,
    error,
    isLessonCompleted,
    completeLesson,
    isCompleting: completeMutation.isPending,
  };
}
