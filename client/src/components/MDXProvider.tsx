import React from 'react';
import AlertComponent from '@/components/mdx/Alert';
import { Tabs, TabItem } from '@/components/mdx/Tabs';
import YouTubeEmbed from '@/components/YouTubeEmbed';

// Rename imports to match what's expected in MDX
const Alert = AlertComponent;

interface MDXProviderProps {
  children: React.ReactNode;
}

/**
 * MDXProvider component for processing MDX content with components
 * This version supports custom components and HTML content
 */
export default function MDXProvider({ children }: MDXProviderProps) {
  // If children is already a React node, just render it
  if (typeof children !== 'string') return <>{children}</>;
  
  // Components that can be used in MDX content
  const components = {
    Alert,
    Tabs,
    TabItem,
    YouTubeEmbed
  };
  
  // For HTML content from processed MDX files
  return (
    <div className="mdx-content">
      {/* Render the HTML with proper styling */}
      <div dangerouslySetInnerHTML={{ __html: children as string }} />
      
      {/* Add debugging info - will only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 border-t border-gray-800 pt-4">
          <summary className="cursor-pointer text-xs text-gray-500 font-mono">MDX Debug Info</summary>
          <div className="p-2 bg-gray-900 rounded text-gray-400 text-xs mt-2">
            <p>Available Components: {Object.keys(components).join(', ')}</p>
            <p>Rendering Mode: HTML String (Server-processed MDX)</p>
          </div>
        </details>
      )}
    </div>
  );
}
