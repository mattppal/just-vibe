import React from 'react';
import { useProgress } from '@/hooks/useProgress';
import { Progress } from '@/components/ui/progress';

export function ProgressBar() {
  const { progress, isLoading } = useProgress();
  
  // Calculate completion percentage
  const totalLessons = countTotalLessons();
  const completedCount = progress?.totalCompletedCount || 0;
  const completionPercentage = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  
  // Function to count total lessons across all sections
  function countTotalLessons() {
    // This is a simple estimate - ideally we would get this from the backend
    // For now, we'll use a hard-coded number based on the typical content structure
    return 12; // Approximate number of lessons
  }
  
  if (isLoading) {
    return null;
  }
  
  return (
    <div className="px-8 pb-4">
      <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
        <span>{completedCount} of {totalLessons} lessons complete</span>
        <span>{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-1 bg-gray-800" indicatorClassName="bg-green-500" />
    </div>
  );
}
