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
    const htmlContent = children as string;
    
    // Process MDX component placeholders in the HTML content
    // Look for component patterns like <ComponentName ...> or <ComponentName ... />
    const processedContent = replaceMDXComponents(htmlContent, defaultComponents);
    
    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
  }
  
  // If children is not a string, assume it's a React component tree
  // (this path isn't currently used but provides for future extension)
  return <>{children}</>;
}

/**
 * Replace MDX component tags in HTML content with actual React components
 */
function replaceMDXComponents(html: string, components: Record<string, React.ComponentType<any>>): string {
  // Don't try to process if no content
  if (!html) return html;
  
  // We can render these components as JavaScript by adding script tags that will run when inserted
  // This is a client-side only solution but works for SSR content
  
  // Extract all potential component tags 
  const componentMatches = html.match(/<([A-Z][a-zA-Z0-9]*)(\s+[^>]*)?>([\s\S]*?)<\/\1>|<([A-Z][a-zA-Z0-9]*)(\s+[^>]*)?\s*\/>/g) || [];
  
  // Each component gets a unique ID for targeting
  let counter = 0;
  
  // For each component tag found
  componentMatches.forEach(match => {
    // Create a placeholder div that will be replaced with the component
    const componentId = `mdx-component-${counter++}`;
    const placeholderId = `__${componentId}__`;
    
    // Extract the component name and props
    const tagMatch = match.match(/<([A-Z][a-zA-Z0-9]*)(\s+[^>]*)?>/) || [];
    const componentName = tagMatch[1];
    
    // We handle all components by adding a script that will run after the page loads
    if (componentName && components[componentName]) {
      // Replace the match with a placeholder div that will be populated with the component
      const placeholderDiv = `<div id="${placeholderId}" class="mdx-component-placeholder" data-component="${componentName}"></div>`;
      
      // Replace the component in the HTML
      html = html.replace(match, placeholderDiv);
    }
  });
  
  // Add script tag to render all components after the page loads
  html += `
<script>
(function() {
  // The components we use to replace placeholders
  const knownComponents = {
    Alert: function(props) {
      const typeClass = {
        info: 'bg-blue-900/20 border-blue-800 text-blue-100',
        warning: 'bg-yellow-900/20 border-yellow-800 text-yellow-100',
        error: 'bg-red-900/20 border-red-800 text-red-100',
        success: 'bg-green-900/20 border-green-800 text-green-100'
      }[props.type || 'info'];
      
      return '<div class="p-4 border rounded-md mb-4 ' + typeClass + '">'
        + '<div class="flex gap-2 mb-2 items-center">'
        + (props.title ? '<div class="font-medium">' + props.title + '</div>' : '')
        + '</div>'
        + '<div class="ml-6">' + (props.children || '') + '</div>'
        + '</div>';
    },
    YouTubeEmbed: function(props) {
      return '<div class="youtube-container mb-4">'
        + '<iframe src="https://www.youtube.com/embed/' + props.id + '" '
        + 'title="' + (props.title || 'YouTube video') + '" '
        + 'frameborder="0" '
        + 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
        + 'allowfullscreen></iframe>'
        + '</div>';
    }
  };
  
  // Find all component placeholders
  document.querySelectorAll('.mdx-component-placeholder').forEach(placeholder => {
    const componentName = placeholder.getAttribute('data-component');
    if (componentName && knownComponents[componentName]) {
      // Get component props from data attributes
      const props = {};
      Array.from(placeholder.attributes).forEach(attr => {
        if (attr.name.startsWith('data-prop-')) {
          const propName = attr.name.replace('data-prop-', '');
          props[propName] = attr.value;
        }
      });
      
      // Special case for Alert content
      if (componentName === 'Alert') {
        props.children = placeholder.innerHTML;
      }
      
      // Render the component HTML
      placeholder.outerHTML = knownComponents[componentName](props);
    }
  });
})();
</script>`;
  
  return html;
}

// Export the map of available MDX components to be imported elsewhere
export const mdxComponents = {
  ...defaultComponents
};

