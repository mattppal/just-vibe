/**
 * A simplified markdown processor without TypeScript errors.
 * This is a temporary solution to get MDX working without advanced unified/rehype features.
 * Now enhanced with Shiki code highlighting.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import remarkMdx from 'remark-mdx';
import { transformerNotationHighlight } from '@shikijs/transformers';

/**
 * Process markdown content with Shiki syntax highlighting
 * 
 * @param content The markdown or MDX content to process
 * @param isMdx Whether the content is MDX
 * @returns Processed HTML string with syntax highlighting
 */
export async function processMarkdown(content: string, isMdx: boolean = false): Promise<string> {
  try {
    // Create the processor pipeline
    let processor = unified()
      .use(remarkParse)  // Parse markdown into mdast
      .use(remarkGfm);   // Support GFM (tables, autolinks, etc)
    
    // Add MDX support if needed
    if (isMdx) {
      processor = processor.use(remarkMdx);
    }
    
    // Convert to HTML and add Shiki syntax highlighting
    processor = processor
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeShiki, {
        // Configure Shiki themes
        theme: 'github-dark',
        
        // Enable line highlighting using the {1,3-4} syntax after language name
        transformers: [transformerNotationHighlight()],
        
        // Optionally enable inline code highlighting
        inline: 'tailing-curly-colon'
      })
      .use(rehypeStringify, { allowDangerousHtml: true });
    
    // Process the content
    const result = await processor.process(content);
    return String(result);
  } catch (error) {
    console.error('Error processing markdown with Shiki:', error);
    return `<div class="markdown-error">Error processing content: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}

export async function extractHeadings(content: string): Promise<Array<{ id: string; title: string; level: number }>> {
  const headings: Array<{ id: string; title: string; level: number }> = [];
  const usedIds = new Set<string>();
  
  // Extract headings using regex
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    
    // Generate ID from title 
    let id = title.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/^-+|-+$/g, '');  // Remove trailing hyphens
    
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