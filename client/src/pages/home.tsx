import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { getDocByPath } from '@/lib/docs';

export default function Home() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Immediately redirect to introduction page with full section path
    setLocation('/welcome/introduction');
  }, [setLocation]);

  return (
    <div className="py-20 animate-pulse text-center bg-black text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
      <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
    </div>
  );
}