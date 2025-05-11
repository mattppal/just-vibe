import React from 'react';

interface MDXProviderProps {
  children: React.ReactNode;
}

/**
 * MDXProvider component for processing MDX content with components
 * This is a simplified version that just renders the HTML directly
 */
export default function MDXProvider({ children }: MDXProviderProps) {
  if (typeof children !== 'string') return <>{children}</>;
  
  // Just render the HTML directly for now
  return <div dangerouslySetInnerHTML={{ __html: children as string }} />;
}
