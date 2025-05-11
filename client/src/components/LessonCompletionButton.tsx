import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import Confetti from 'react-confetti';

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
  
  // State for confetti animation
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  // Update window dimensions when the window is resized
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle successful completion with confetti
  useEffect(() => {
    if (markComplete.isSuccess) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [markComplete.isSuccess]);
  
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
    <div className={`${className || ''} flex justify-center items-center`}>
      {/* Success animation overlay */}
      {markComplete.isPending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 p-8 rounded-lg shadow-xl flex flex-col items-center space-y-6 border border-green-600/30">
            <div className="animate-bounce text-green-500">
              <CheckCircle className="h-20 w-20" />
            </div>
            <p className="text-white font-medium text-lg">Marking lesson complete...</p>
          </div>
        </div>
      )}
      
      {/* Marking incomplete animation overlay */}
      {markIncomplete.isPending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 p-8 rounded-lg shadow-xl flex flex-col items-center space-y-6 border border-yellow-600/30">
            <div className="animate-pulse text-yellow-500">
              <XCircle className="h-20 w-20" />
            </div>
            <p className="text-white font-medium text-lg">Resetting progress...</p>
          </div>
        </div>
      )}
      
      <Button
        variant={isCompleted ? 'outline' : 'default'}
        size="lg"
        className={`
          ${isCompleted ? 'border-green-600 text-green-600 hover:bg-green-600/10' : 'bg-green-600 hover:bg-green-700'} 
          transition-all duration-300 
          max-w-md w-full
          shadow-md hover:shadow-lg
          ${isCompleted ? 'shadow-green-900/10' : 'shadow-green-900/20'}
          font-medium
        `}
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
