import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';

interface LessonCompleteButtonProps {
  lessonSlug: string;
}

export function LessonCompleteButton({ lessonSlug }: LessonCompleteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isLessonCompleted, completeLesson, uncompleteLesson, isCompleting } = useProgress();
  
  const isCompleted = isLessonCompleted(lessonSlug);
  
  // If not authenticated, don't show the button
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="flex justify-end mt-8">
      <Button
        variant={isCompleted ? "outline" : "default"}
        size="lg"
        onClick={() => isCompleted ? uncompleteLesson(lessonSlug) : completeLesson(lessonSlug)}
        disabled={isCompleting}
        className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${isCompleted ? 'border-green-500 text-green-500 bg-green-50/10 hover:bg-red-50/10 hover:text-red-400 hover:border-red-400' : 'hover:bg-primary/90'}`}
      >
        {isCompleting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : isCompleted ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="font-medium">Completed</span>
          </>
        ) : (
          <>
            <span>Mark as Complete</span>
          </>
        )}
      </Button>
    </div>
  );
}
