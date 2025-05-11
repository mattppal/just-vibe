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
    <div className={`${className} flex justify-center items-center`}>
      {markComplete.isPending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-black/80 p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <div className="animate-bounce text-green-500">
              <CheckCircle className="h-16 w-16" />
            </div>
            <p className="text-white font-medium">Saving progress...</p>
          </div>
        </div>
      )}
      <Button
        variant={isCompleted ? 'outline' : 'default'}
        size="lg"
        className={`${isCompleted ? 'border-green-600 text-green-600 hover:bg-green-600/10' : 'bg-green-600 hover:bg-green-700'} transition-all duration-300 max-w-md w-full`}
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
