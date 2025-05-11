import React from 'react';
import { Alert, Tabs, TabItem, TabsList, TabTrigger } from './mdx';
import CodeBlock from './CodeBlock';
import YouTubeEmbed from './YouTubeEmbed';

interface MDXProviderProps {
  children: React.ReactNode;
  components?: Record<string, React.ComponentType<any>>;
}

// Define the default components that will be available in MDX files
const defaultComponents = {
  Alert,
  Tabs,
  TabItem,
  TabsList,
  TabTrigger,
  CodeBlock,
  YouTubeEmbed
};

/**
 * MDXProvider component for processing MDX content with components
 * This provides a common set of components to MDX content while
 * also supporting direct HTML rendering for server-rendered content.
 */
export default function MDXProvider({ children, components = {} }: MDXProviderProps) {
  // If children is a string, it's pre-rendered HTML from the server
  if (typeof children === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: children as string }} />;
  }
  
  // If children is not a string, assume it's a React component tree
  // (this path isn't currently used but provides for future extension)
  return <>{children}</>;
}

// Export the map of available MDX components to be imported elsewhere
export const mdxComponents = {
  ...defaultComponents
};

