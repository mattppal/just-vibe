import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { Node } from 'unist';

/**
 * Rehype plugin to enhance code blocks for better styling and UX
 */
function rehypeEnhanceCodeBlocks() {
  return (tree: Node) => {
    visit(tree, 'element', (node: any) => {
      // Enhance code blocks
      if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
        // Add classes for styling with Tailwind Typography
        node.properties.className = [
          ...(node.properties.className || []),
          'not-prose', // Exclude from prose styling to apply custom styles
          'rounded-md',
          'bg-[#111]',
          'p-4',
          'my-6',
          'overflow-x-auto'
        ];

        // Get language from the code element
        const code = node.children[0];
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
        node.properties.className = [
          ...(node.properties.className || []),
          'bg-[#111]',
          'text-[#d1d5db]',
          'px-1.5',
          'py-0.5',
          'rounded'
        ];
      }
    });
  };
}

/**
 * Process markdown content using unified ecosystem with remark/rehype
 * 
 * @param content The markdown content to process
 * @returns Processed HTML with syntax highlighting and proper structure
 */
export async function processMarkdown(content: string): Promise<string> {
  const result = await unified()
    // Parse markdown into mdast
    .use(remarkParse)
    // Support GitHub Flavored Markdown features
    .use(remarkGfm)
    // Turn mdast into hast (HTML Abstract Syntax Tree)
    .use(remarkRehype, { 
      allowDangerousHtml: true, // Allow raw HTML in markdown
      // Custom footnote labels for accessibility
      footnoteLabel: 'Footnotes',
      footnoteBackLabel: 'Back to content',
    })
    // Handle raw HTML in markdown
    .use(rehypeRaw)
    // Sanitize HTML to prevent XSS (very important for security)
    .use(rehypeSanitize)
    // Add IDs to headings for table of contents
    .use(rehypeSlug)
    // Add syntax highlighting to code blocks
    .use(rehypeHighlight, {
      // Detect language from code block
      detect: true,
      // Add 'hljs' class for styling
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
 * Extract headings from markdown content
 * 
 * @param content The markdown content
 * @returns Array of headings with ID, title, and level
 */
export async function extractHeadings(content: string): Promise<Array<{ id: string; title: string; level: number }>> {
  // Regular expression to match headings in markdown
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ id: string; title: string; level: number }> = [];
  
  // Keep track of used IDs to avoid duplicates
  const usedIds = new Set<string>();
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    
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
  
  return headings;
}