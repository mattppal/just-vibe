import React, { useEffect, useRef } from 'react';
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
  
  // Reference to the container div for post-processing
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Components that can be used in MDX content
  const components = {
    Alert,
    Tabs,
    TabItem,
    YouTubeEmbed
  };
  
  // Process MDX components after rendering
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Find all elements with data-mdx-component attribute
    const mdxElements = containerRef.current.querySelectorAll('[data-mdx-component]');
    
    mdxElements.forEach((element) => {
      const componentName = element.getAttribute('data-mdx-component');
      const propsStr = element.getAttribute('data-props');
      
      // Skip if we don't have the necessary information
      if (!componentName) return;
      
      try {
        let props = {};
        if (propsStr) {
          props = JSON.parse(propsStr);
        }
        
        // Handle Alert component
        if (componentName === 'Alert') {
          // Extract properties from data attributes
          const { type = 'info', title, content: propContent } = props as { type?: string, title?: string, content?: string };
          
          // Get content either from props or element text
          const content = propContent || element.textContent || '';
          
          // Create the alert element with appropriate styling based on type
          const alertElement = document.createElement('div');
          
          // Set classes based on alert type
          let colorClasses;
          switch (type) {
            case 'info':
              colorClasses = 'bg-blue-900/20 border-blue-500 text-blue-200';
              break;
            case 'warning':
              colorClasses = 'bg-amber-900/20 border-amber-500 text-amber-200';
              break;
            case 'error':
              colorClasses = 'bg-red-900/20 border-red-500 text-red-200';
              break;
            case 'success':
              colorClasses = 'bg-green-900/20 border-green-500 text-green-200';
              break;
            default:
              colorClasses = 'bg-blue-900/20 border-blue-500 text-blue-200';
          }
          
          alertElement.className = `rounded-md border-l-4 p-4 my-4 ${colorClasses}`;
          
          // Create the alert title if available
          if (title) {
            const titleElement = document.createElement('h5');
            titleElement.className = 'text-lg font-medium mb-2';
            titleElement.textContent = title;
            alertElement.appendChild(titleElement);
          }
          
          // Create the content container
          const contentElement = document.createElement('div');
          contentElement.className = 'text-sm';
          contentElement.textContent = content;
          alertElement.appendChild(contentElement);
          
          // Replace the original element with our enhanced version
          element.parentNode?.replaceChild(alertElement, element);
        }
        
        // Handle YouTubeEmbed component
        if (componentName === 'YouTubeEmbed') {
          const { id, title } = props as { id?: string, title?: string };
          
          if (id) {
            // Create YouTube embed container (16:9 aspect ratio)
            const container = document.createElement('div');
            container.className = 'relative w-full pt-[56.25%] my-6 bg-gray-800 rounded overflow-hidden';
            
            // Create iframe with proper YouTube embed
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${id}`;
            iframe.title = title || 'YouTube video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.className = 'absolute top-0 left-0 w-full h-full border-0';
            
            container.appendChild(iframe);
            element.parentNode?.replaceChild(container, element);
          }
        }
        
        // Here you can add handlers for other MDX components like Tabs, etc.
        
      } catch (error) {
        console.error(`Error processing MDX component ${componentName}:`, error);
      }
    });
  }, [children]);
  
  // For HTML content from processed MDX files
  return (
    <div className="mdx-content">
      {/* Render the HTML with proper styling */}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: children as string }} />
      
      {/* Add debugging info - will only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 border-t border-gray-800 pt-4">
          <summary className="cursor-pointer text-xs text-gray-500 font-mono">MDX Debug Info</summary>
          <div className="p-2 bg-gray-900 rounded text-gray-400 text-xs mt-2">
            <p>Available Components: {Object.keys(components).join(', ')}</p>
            <p>Rendering Mode: HTML String with hydrated components</p>
          </div>
        </details>
      )}
    </div>
  );
}
