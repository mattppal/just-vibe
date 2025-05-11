import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LessonCompleteButtonProps {
  lessonSlug: string;
}

export function LessonCompleteButton({ lessonSlug }: LessonCompleteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isLessonCompleted, completeLesson, uncompleteLesson, isCompleting } = useProgress();
  const { toast } = useToast();
  
  const isCompleted = isLessonCompleted(lessonSlug);
  
  // Handle click when not authenticated
  const handleUnauthenticatedClick = () => {
    toast({
      title: 'Authentication required',
      description: 'Please sign in to track your course progress',
      variant: 'default',
    });
  };
  
  // Handle the button click based on authentication status
  const handleButtonClick = () => {
    if (!isAuthenticated) {
      handleUnauthenticatedClick();
      return;
    }
    
    if (isCompleted) {
      uncompleteLesson(lessonSlug);
    } else {
      completeLesson(lessonSlug);
    }
  };
  
  return (
    <Button
      variant={isCompleted ? "outline" : "default"}
      size="lg"
      onClick={handleButtonClick}
      disabled={isCompleting}
      title={isCompleted ? "Click to mark as not completed" : "Mark this lesson as complete"}
      className={`flex items-center gap-2 min-w-[160px] justify-center transition-all duration-300 ease-in-out group ${isCompleted ? 'border-green-500 text-green-500 bg-green-50/10 hover:bg-red-50/10 hover:text-red-400 hover:border-red-400' : 'bg-green-500/90 text-white hover:bg-green-600'}`}
    >
        {isCompleting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : isCompleted ? (
          <>
            <Check className="h-5 w-5 text-green-500 group-hover:hidden" />
            <span className="font-medium group-hover:hidden">Completed</span>
            <span className="hidden group-hover:inline text-red-400 font-medium">Mark as uncompleted</span>
          </>
        ) : (
          <>
            <span>Mark as Complete</span>
          </>
        )}
    </Button>
  );
}
