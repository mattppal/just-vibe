import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { compile } from '@mdx-js/mdx';
import { visit } from 'unist-util-visit';
import { Node } from 'unist';

/**
 * Rehype plugin to enhance code blocks for better styling and UX
 */
function rehypeEnhanceCodeBlocks() {
  return (tree: Node) => {
    visit(tree, 'element', (node: any) => {
      // Add Tailwind classes to all elements that need styling
      if (node.tagName) {
        // Initialize className array if it doesn't exist
        node.properties.className = node.properties.className || [];

        // Add specific styling based on element type
        switch (node.tagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            node.properties.className.push('text-white', 'font-semibold');
            break;
          case 'p':
            node.properties.className.push('text-white');
            break;
          case 'ul':
            node.properties.className.push('list-disc', 'pl-6');
            break;
          case 'ol':
            node.properties.className.push('list-decimal', 'pl-6');
            break;
          case 'li':
            node.properties.className.push('text-white', 'mb-1');
            break;
          case 'a':
            node.properties.className.push('text-blue-400', 'hover:underline');
            break;
          case 'blockquote':
            node.properties.className.push('border-l-4', 'border-gray-700', 'pl-4', 'py-1', 'italic', 'text-gray-300');
            break;
          case 'table':
            node.properties.className.push('w-full', 'border-collapse', 'my-4');
            break;
          case 'th':
          case 'td':
            node.properties.className.push('border', 'border-gray-700', 'px-4', 'py-2', 'text-white');
            break;
          // Handle YouTube embeds
          case 'iframe':
            if (node.properties.src && typeof node.properties.src === 'string' && 
                node.properties.src.match(/youtube\.com|youtu\.be/)) {
              const youtubeIdMatch = node.properties.src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^\/?&]+)/);
              if (youtubeIdMatch && youtubeIdMatch[1]) {
                const youtubeId = youtubeIdMatch[1];
                // Transform into a div that our React component will replace
                node.tagName = 'div';
                node.properties.className.push('youtube-embed');
                node.properties['data-youtube-id'] = youtubeId;
                node.children = [{
                  type: 'text',
                  value: 'YouTube video: ' + youtubeId
                }];
              }
            }
            break;
        }

        // Enhance code blocks with copy button
        if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
          // Add classes for styling with Tailwind Typography
          node.properties.className.push(
            'not-prose', // Exclude from prose styling to apply custom styles
            'rounded-md',
            'bg-[#111]',
            'p-4',
            'my-6',
            'relative', // For positioning the copy button
            'whitespace-pre-wrap', // Enable soft wrapping
            'break-words' // Break long words to prevent overflow
          );

          // Get language from the code element and code content
          const code = node.children[0];
          const codeContent = code.children
            .map((child: any) => child.value || '')
            .join('');
          
          // Store the code content as a data attribute for the copy button
          node.properties['data-code'] = codeContent;
          
          // Add a data attribute to identify as a code block with copy button
          node.properties['data-copyable'] = 'true';
          
          const lang = code.properties?.className
            ?.find((cls: string) => cls.startsWith('language-'))
            ?.replace('language-', '');

          // Add language label if available
          if (lang && lang !== 'text') {
            // Create a language indicator
            const langNode = {
              type: 'element',
              tagName: 'div',
              properties: {
                className: [
                  'text-xs',
                  'text-slate-400',
                  'mb-2',
                  'italic'
                ],
              },
              children: [
                {
                  type: 'text',
                  value: lang
                }
              ]
            };

            // Add the language indicator before the code
            node.children = [langNode, ...node.children];
          }
        }

        // Style inline code
        if (node.tagName === 'code' && node.parent?.tagName !== 'pre') {
          node.properties.className.push(
            'bg-[#111]',
            'text-[#d1d5db]',
            'px-1.5',
            'py-0.5',
            'rounded',
            'font-mono'
          );
        }
      }
    });
  };
}

/**
 * Process MDX content
 * 
 * @param content The MDX content to process
 * @param isMdx Whether the content is MDX or regular markdown
 * @returns Processed HTML string
 */
export async function processMarkdown(content: string, isMdx: boolean = false): Promise<string> {
  // For now, we'll use the same processing pipeline for both .md and .mdx
  // In a full implementation, we would use different pipelines
  
  // Create processor based on whether it's MDX or markdown
  let processor = unified().use(remarkParse).use(remarkGfm);
  
  // Add MDX plugin if processing MDX content
  if (isMdx) {
    processor = processor.use(remarkMdx);
  }
  
  // Continue with common processing
  processor = processor.use(remarkRehype, { 
    allowDangerousHtml: true,
    footnoteLabel: 'Footnotes',
    footnoteBackLabel: 'Back to content'
  })
    // Handle raw HTML in markdown
    .use(rehypeRaw)
    // Sanitize HTML to prevent XSS (very important for security)
    .use(rehypeSanitize, {
      tagNames: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'a', 'strong',
        'em', 'del', 'br', 'hr', 'div', 'span', 'img', 'iframe'
      ],
      attributes: {
        // Allow common attributes
        '*': ['className', 'id'],
        // Allow YouTube iframes with required attributes
        'iframe': ['src', 'allowFullScreen', 'allow', 'loading', 'title', 'width', 'height', 'frameBorder'],
        'a': ['href', 'target', 'rel']
      }
    })
    // Add IDs to headings for table of contents
    .use(rehypeSlug)
    // Add syntax highlighting to code blocks
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
    })
    // Apply custom styling to code blocks
    .use(rehypeEnhanceCodeBlocks)
    // Convert hast to HTML string
    .use(rehypeStringify)
    .process(content);

  return String(result);
}

/**
 * Extract headings from markdown content, excluding those in code blocks
 * 
 * @param content The markdown content
 * @returns Array of headings with ID, title, and level
 */
export async function extractHeadings(content: string): Promise<Array<{ id: string; title: string; level: number }>> {
  const headings: Array<{ id: string; title: string; level: number }> = [];
  const usedIds = new Set<string>();
  
  // Split content into lines to process code blocks correctly
  const lines = content.split('\n');
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code block delimiters (``` or ~~~)
    if (line.trim().match(/^(`{3}|~{3})/) !== null) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // Skip if in code block
    if (inCodeBlock) continue;
    
    // Match heading pattern only when outside code blocks
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      
      // Generate ID from title (same logic as rehype-slug uses)
      let id = title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/^-+|-+$/g, ''); // Remove trailing hyphens
      
      // Ensure unique IDs
      let uniqueId = id;
      let counter = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${id}-${counter}`;
        counter++;
      }
      
      usedIds.add(uniqueId);
      headings.push({ id: uniqueId, title, level });
    }
  }
  
  return headings;
}