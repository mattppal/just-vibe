import React, { useMemo } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useQuery } from '@tanstack/react-query';
import { DocPage } from '@/lib/docs';

export function ProgressBar() {
  const { progress, isLoading } = useProgress();
  
  // Get sections data from API for accurate lesson count
  const { data: sections, isLoading: isSectionsLoading } = useQuery<Record<string, any>>({ 
    queryKey: ['/api/sections'],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  // Calculate total lessons and completion percentage
  const { totalLessons, completedCount, completionPercentage } = useMemo(() => {
    // Calculate total number of lessons
    let total = 0;
    if (sections) {
      // Count all documents in all sections except root
      Object.entries(sections).forEach(([sectionName, docs]) => {
        if (sectionName !== 'root' && Array.isArray(docs)) {
          total += docs.length;
        }
      });
    }
    
    const completed = progress?.totalCompletedCount || 0;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    
    return {
      totalLessons: total,
      completedCount: completed,
      completionPercentage: percentage
    };
  }, [sections, progress]);
  
  if (isLoading) {
    return null;
  }
  
  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
        <span>{completedCount} of {totalLessons} lessons complete</span>
        <span>{completionPercentage}%</span>
      </div>
      <div className="h-1 w-full bg-gray-800 rounded-full relative overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300" 
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  );
}
