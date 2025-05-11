import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';

interface LessonCompletionButtonProps {
  lessonSlug: string;
  className?: string;
}

export function LessonCompletionButton({
  lessonSlug,
  className
}: LessonCompletionButtonProps) {
  const { isAuthenticated } = useAuth();
  const { 
    isLessonCompleted, 
    markComplete, 
    markIncomplete 
  } = useProgress();
  
  const isCompleted = isLessonCompleted(lessonSlug);
  
  const handleToggleCompletion = () => {
    if (isCompleted) {
      markIncomplete.mutate(lessonSlug);
    } else {
      markComplete.mutate({ lessonSlug });
    }
  };
  
  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className={className}>
      <Button
        variant={isCompleted ? 'outline' : 'default'}
        size="lg"
        className={`w-full sm:w-auto ${isCompleted ? 'border-green-600 text-green-600 hover:bg-green-600/10' : 'bg-green-600 hover:bg-green-700'}`}
        onClick={handleToggleCompletion}
        disabled={markComplete.isPending || markIncomplete.isPending}
      >
        {isCompleted ? (
          <>
            <XCircle className="mr-2 h-5 w-5" />
            Mark as Incomplete
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Mark as Complete
          </>
        )}
      </Button>
    </div>
  );
}
