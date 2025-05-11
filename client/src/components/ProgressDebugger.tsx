import React, { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function ProgressDebugger() {
  const { user, isLoading: authLoading } = useAuth();
  const { progress, markComplete, markIncomplete, isLessonCompleted } = useProgress();
  const [lessonSlug, setLessonSlug] = useState('1-getting-started/youtube-embed');
  const [debugInfo, setDebugInfo] = useState('');
  
  if (authLoading || !user) {
    return <div>Please log in to use this tool</div>;
  }
  
  const handleComplete = async () => {
    try {
      // Add a timestamp to avoid caching
      const timestamp = new Date().getTime();
      setDebugInfo(`Attempting to mark lesson ${lessonSlug} as complete at ${timestamp}...`);
      
      await markComplete.mutateAsync({ 
        lessonSlug, 
        version: `debug-${timestamp}` 
      });
      
      setDebugInfo(prev => `${prev}\nSuccess! Check progress data in console.`);
      console.log('Current progress after marking complete:', progress);
    } catch (error) {
      setDebugInfo(prev => `${prev}\nError: ${error}`);
      console.error('Error during mark complete:', error);
    }
  };
  
  const handleIncomplete = async () => {
    try {
      const timestamp = new Date().getTime();
      setDebugInfo(`Attempting to mark lesson ${lessonSlug} as incomplete at ${timestamp}...`);
      
      await markIncomplete.mutateAsync(lessonSlug);
      
      setDebugInfo(prev => `${prev}\nSuccess! Check progress data in console.`);
      console.log('Current progress after marking incomplete:', progress);
    } catch (error) {
      setDebugInfo(prev => `${prev}\nError: ${error}`);
      console.error('Error during mark incomplete:', error);
    }
  };
  
  const checkStatus = () => {
    const isCompleted = isLessonCompleted(lessonSlug);
    setDebugInfo(`Lesson ${lessonSlug} completion status: ${isCompleted ? 'Completed' : 'Not completed'}`);
    console.log('Current progress data:', progress);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 mt-8">
      <h2 className="text-xl font-bold mb-4">Progress Debugger</h2>
      
      <div className="flex flex-col space-y-4">
        <div>
          <label className="block mb-2">Lesson Slug:</label>
          <input 
            type="text" 
            value={lessonSlug} 
            onChange={(e) => setLessonSlug(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex space-x-4">
          <Button onClick={handleComplete} variant="default">
            Mark as Complete
          </Button>
          
          <Button onClick={handleIncomplete} variant="outline">
            Mark as Incomplete
          </Button>
          
          <Button onClick={checkStatus} variant="secondary">
            Check Status
          </Button>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Debug Info:</h3>
          <pre className="whitespace-pre-wrap bg-black text-green-400 p-3 rounded text-sm">
            {debugInfo || 'No debug info yet'}
          </pre>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Current Progress Data:</h3>
          <pre className="whitespace-pre-wrap bg-black text-blue-400 p-3 rounded text-sm overflow-auto max-h-60">
            {progress ? JSON.stringify(progress, null, 2) : 'No progress data available'}
          </pre>
        </div>
      </div>
    </div>
  );
}
