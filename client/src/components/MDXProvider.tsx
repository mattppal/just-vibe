import React from 'react';
import { Alert, Tabs, TabItem, TabsList, TabTrigger } from './mdx';
import CodeBlock from './CodeBlock';
import YouTubeEmbed from './YouTubeEmbed';

interface MDXProviderProps {
  children: React.ReactNode;
  components?: Record<string, React.ComponentType<any>>;
}

// Define the default components that will be available in MDX files
export const mdxComponents = {
  Alert,
  Tabs,
  TabItem,
  TabsList,
  TabTrigger,
  CodeBlock,
  YouTubeEmbed
};

/**
 * Simplified MDXProvider component
 * This component simply renders the HTML content from the server
 * with support for iframes and other embedded content
 */
export default function MDXProvider({ children }: MDXProviderProps) {
  // If children is a string, it's pre-rendered HTML from the server
  if (typeof children === 'string') {
    return (
      <div 
        className="mdx-content" 
        dangerouslySetInnerHTML={{ __html: children }}
      />
    );
  }
  
  // If children is not a string, pass it through as-is
  return <div className="mdx-content">{children}</div>;
}
