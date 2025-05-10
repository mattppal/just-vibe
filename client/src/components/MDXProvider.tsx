import React from 'react';
import * as MDXComponents from './mdx';

interface MDXProviderProps {
  children: React.ReactNode;
}

/**
 * MDXProvider component that processes any MDX content and replaces custom component markers
 * with actual React components.
 */
export default function MDXProvider({ children }: MDXProviderProps) {
  const processedContent = React.useMemo(() => {
    if (typeof children !== 'string') return children;
    
    // Regular expression to match our custom MDX component markers
    const mdxComponentRegex = /<mdx-component name="([^"]+)"([^>]*)>([\s\S]*?)<\/mdx-component>/g;
    
    // Starting HTML content
    let html = children as string;
    let lastIndex = 0;
    let result = [];
    let match;
    
    // Find all MDX component markers
    while ((match = mdxComponentRegex.exec(html)) !== null) {
      // Add text before the component marker
      if (match.index > lastIndex) {
        result.push(
          <span 
            key={`text-${lastIndex}`} 
            dangerouslySetInnerHTML={{ __html: html.substring(lastIndex, match.index) }} 
          />
        );
      }
      
      // Extract component info
      const [fullMatch, componentName, propsString, children] = match;
      
      // Parse props from string (simple regex approach)
      const props = {};
      const propsMatches = propsString.matchAll(/\s+([\w-]+)="([^"]*)"/g);
      for (const propMatch of propsMatches) {
        const [, propName, propValue] = propMatch;
        props[propName] = propValue;
      }
      
      // Get the actual component from our MDX components
      const Component = (MDXComponents as any)[componentName];
      
      if (Component) {
        // Create the React component
        result.push(
          <Component key={`component-${match.index}`} {...props}>
            {/* Process the children recursively for nested components */}
            <MDXProvider>
              {children}
            </MDXProvider>
          </Component>
        );
      } else {
        // Component not found, render a fallback
        result.push(
          <div 
            key={`unknown-${match.index}`} 
            className="p-2 border border-red-500 rounded my-2"
          >
            Unknown component: {componentName}
          </div>
        );
      }
      
      // Update last index for next iteration
      lastIndex = match.index + fullMatch.length;
    }
    
    // Add any remaining content
    if (lastIndex < html.length) {
      result.push(
        <span 
          key={`text-${lastIndex}`} 
          dangerouslySetInnerHTML={{ __html: html.substring(lastIndex) }} 
        />
      );
    }
    
    return result.length ? result : <span dangerouslySetInnerHTML={{ __html: html }} />;
  }, [children]);
  
  return <>{processedContent}</>;
}
