/**
 * A simplified markdown processor with Shiki code highlighting via rehype.
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
    // Build the processor pipeline
    const processor = unified()
      .use(remarkParse)  // Parse markdown into mdast
      .use(remarkGfm);   // Support GFM (tables, autolinks, etc)
    
    // Add MDX support if processing an MDX file
    if (isMdx) {
      processor.use(remarkMdx);
    }
    
    processor
      // Convert markdown to HTML
      .use(remarkRehype, { allowDangerousHtml: true })
      // Apply Shiki code highlighting
      .use(rehypeShiki, {
        theme: 'github-dark',
        transformers: [transformerNotationHighlight()],
        inline: 'tailing-curly-colon'
      })
      // Convert to HTML string
      .use(rehypeStringify, { allowDangerousHtml: true });
    
    // Process the content
    const vFile = await processor.process(content);
    return String(vFile);
    
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