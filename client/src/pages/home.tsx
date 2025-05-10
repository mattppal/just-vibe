import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { getDocByPath, DocPage as DocPageType } from '@/lib/docs';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // If at the root path, redirect to the welcome/introduction page
    if (location === "/") {
      // Redirect to the introduction page with the full section path
      setLocation("/welcome/introduction");
    }
  }, [location, setLocation]);

  return (
    <div className="py-20 animate-pulse text-center bg-black text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Loading Documentation...</h1>
      <p className="text-gray-400">Please wait while we find the right starting page for you.</p>
    </div>
  );
}