/**
 * An optimized markdown processor with Shiki code highlighting via rehype.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import remarkMdx from "remark-mdx";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { transformerNotationHighlight } from "@shikijs/transformers";

// Cache for processed content to avoid reprocessing the same markdown
const processedCache = new Map<string, string>();

// Reusable processor instances
let markdownProcessor: any = null;
let mdxProcessor: any = null;

/**
 * Get the appropriate processor for markdown or MDX
 */
function getProcessor(isMdx: boolean): any {
  if (isMdx) {
    if (!mdxProcessor) {
      mdxProcessor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMdx)
        // Transform MDX to HTML
        .use(remarkRehype, { 
          allowDangerousHtml: true,
          // Add data attributes to code blocks for copy functionality
          handlers: {
            code: (h, node) => {
              const value = String(node.value || '');
              const lang = (node.lang || '').match(/^[^ \t]+(?=[\s\t]|$)/) || [];
              const props = { 
                className: lang.length > 0 ? `language-${lang[0]}` : undefined,
                'data-copyable': 'true',
                'data-code': value
              };
              return h(node, 'pre', props, [
                h(node, 'code', { className: props.className }, [value])
              ]);
            }
          }
        })
        // Process HTML in MDX
        .use(rehypeRaw)
        // Add IDs to headings for anchor links
        .use(rehypeSlug)
        // Apply syntax highlighting
        .use(rehypeShiki, {
          theme: "github-dark",
          transformers: [transformerNotationHighlight()],
          inline: "tailing-curly-colon",
        })
        // Convert to HTML string
        .use(rehypeStringify, { allowDangerousHtml: true });
    }
    return mdxProcessor;
  } else {
    if (!markdownProcessor) {
      markdownProcessor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        // Transform Markdown to HTML
        .use(remarkRehype, { 
          allowDangerousHtml: true,
          // Add data attributes to code blocks for copy functionality
          handlers: {
            code: (h, node) => {
              const value = String(node.value || '');
              const lang = (node.lang || '').match(/^[^ \t]+(?=[\s\t]|$)/) || [];
              const props = { 
                className: lang.length > 0 ? `language-${lang[0]}` : undefined,
                'data-copyable': 'true',
                'data-code': value
              };
              return h(node, 'pre', props, [
                h(node, 'code', { className: props.className }, [value])
              ]);
            }
          } 
        })
        // Process HTML in Markdown
        .use(rehypeRaw)
        // Add IDs to headings for anchor links
        .use(rehypeSlug)
        // Apply syntax highlighting
        .use(rehypeShiki, {
          theme: "github-dark",
          transformers: [transformerNotationHighlight()],
          inline: "tailing-curly-colon",
        })
        // Convert to HTML string
        .use(rehypeStringify, { allowDangerousHtml: true });
    }
    return markdownProcessor;
  }
}

/**
 * Process markdown content with Shiki syntax highlighting with improved performance
 *
 * @param content The markdown or MDX content to process
 * @param isMdx Whether the content is MDX
 * @returns Processed HTML string with syntax highlighting
 */
export async function processMarkdown(
  content: string,
  isMdx: boolean = false,
): Promise<string> {
  try {
    // Generate a cache key based on content and type
    const cacheKey = `${isMdx ? 'mdx' : 'md'}:${content.substring(0, 100)}`;
    
    // Check if we have a cached version
    if (processedCache.has(cacheKey)) {
      return processedCache.get(cacheKey)!;
    }

    // Get the appropriate processor
    const processor = getProcessor(isMdx);
    
    // Process the content
    const vFile = await processor.process(content);
    const result = String(vFile);
    
    // Cache the result for future requests
    processedCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Error processing markdown with Shiki:", error);
    return `<div class="markdown-error">Error processing content: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}

// Cache for extracted headings to avoid reprocessing the same content
const headingsCache = new Map<string, Array<{ id: string; title: string; level: number }>>();

/**
 * Extract headings from markdown content with caching for better performance
 */
export async function extractHeadings(
  content: string,
): Promise<Array<{ id: string; title: string; level: number }>> {
  // Generate a cache key based on content
  const cacheKey = content.substring(0, 100);
  
  // Check if we have a cached version
  if (headingsCache.has(cacheKey)) {
    return headingsCache.get(cacheKey)!;
  }
  
  const headings: Array<{ id: string; title: string; level: number }> = [];
  const usedIds = new Set<string>();

  // Extract headings using regex
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();

    // Generate ID from title
    let id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ""); // Remove trailing hyphens

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

  // Cache the result for future requests
  headingsCache.set(cacheKey, headings);
  
  return headings;
}
