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
  // First check if this is an MDX document by looking for the data-mdx attribute
  const processMdxData = React.useCallback((html: string) => {
    // Look for hidden MDX data elements
    const mdxDataRegex = /<div class="mdx-data"[^>]*data-mdx="([^"]*)"[^>]*><\/div>/g;
    let match = mdxDataRegex.exec(html);
    
    if (match && match[1]) {
      try {
        // Found MDX data - extract and process it
        const mdxData = decodeURIComponent(match[1]);
        console.log('Found MDX data, processing components');
        // In a full implementation, we would now evaluate this code and render the actual React components
      } catch (error) {
        console.error('Error processing MDX data:', error);
      }
    }
    
    return html;
  }, []);
  
  const processedContent = React.useMemo(() => {
    if (typeof children !== 'string') return children;
    
    // First check for MDX data
    const html = children as string;
    processMdxData(html);
    
    // Regular expression to match our custom MDX component markers
    const mdxComponentRegex = /<mdx-component name="([^"]+)"([^>]*)>([\s\S]*?)<\/mdx-component>/g;
    
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
      const [fullMatch, componentName, propsString, componentChildren] = match;
      
      // Parse props from string (simple regex approach)
      const props: Record<string, string> = {};
      const propsRegex = /\s+([\w-]+)="([^"]*)"/g;
      let propMatch;
      while ((propMatch = propsRegex.exec(propsString)) !== null) {
        const propName = propMatch[1];
        const propValue = propMatch[2];
        props[propName] = propValue;
      }
      
      // Get the actual component from our MDX components
      const Component = componentName in MDXComponents 
        ? (MDXComponents as Record<string, React.ComponentType<any>>)[componentName]
        : undefined;
      
      if (Component) {
        // Create the React component
        result.push(
          <Component key={`component-${match.index}`} {...props}>
            {/* Process the children recursively for nested components */}
            <MDXProvider>
              {componentChildren}
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
    
    // If we found and processed components, return the result array
    if (result.length > 0) {
      // Add any remaining content
      if (lastIndex < html.length) {
        result.push(
          <span 
            key={`text-${lastIndex}`} 
            dangerouslySetInnerHTML={{ __html: html.substring(lastIndex) }} 
          />
        );
      }
      return result;
    }
    
    // If no MDX components were found, just render the HTML directly
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }, [children, processMdxData]);
  
  return <>{processedContent}</>;
}
