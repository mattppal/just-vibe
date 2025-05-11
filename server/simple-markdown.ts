/**
 * A simplified markdown processor with Shiki code highlighting
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
import { transformerCopyButton } from "@rehype-pretty/transformers";

// Cache for processed content
const processedCache = new Map<string, string>();

// Cache for extracted headings
const headingsCache = new Map<
  string,
  Array<{ id: string; title: string; level: number }>
>();

// Reusable processor instances
let markdownProcessor: any = null;
let mdxProcessor: any = null;

/**
 * Get a processor for markdown or MDX content
 */
function getProcessor(isMdx: boolean): any {
  // Return cached processor if available
  if (isMdx && mdxProcessor) return mdxProcessor;
  if (!isMdx && markdownProcessor) return markdownProcessor;
  
  // Create new processor with the appropriate configuration
  let processor = unified()
    .use(remarkParse)
    .use(remarkGfm);
    
  // Only use MDX parser for MDX files
  if (isMdx) {
    processor = processor.use(remarkMdx);
  }
  
  // Transform to HTML
  processor = processor.use(remarkRehype, { allowDangerousHtml: true })
    // Process HTML
    .use(rehypeRaw)
    // Add IDs to headings for anchor links
    .use(rehypeSlug)
    // Apply syntax highlighting with copy button
    .use(rehypeShiki, {
      theme: "vitesse-dark",
      transformers: [
        transformerNotationHighlight(),
        transformerCopyButton()
      ],
    })
    // Convert to HTML string
    .use(rehypeStringify, { allowDangerousHtml: true });
  
  // Cache the processor
  if (isMdx) {
    mdxProcessor = processor;
  } else {
    markdownProcessor = processor;
  }
  
  return processor;
}

/**
 * Process markdown content with syntax highlighting
 * @param content The markdown or MDX content to process
 * @param isMdx Whether the content is MDX
 * @returns Processed HTML string with syntax highlighting
 */
export async function processMarkdown(
  content: string,
  isMdx: boolean = false,
): Promise<string> {
  try {
    // Generate a cache key
    const cacheKey = `${isMdx ? "mdx" : "md"}:${content.substring(0, 100)}`;
    
    // Use cached result if available
    if (processedCache.has(cacheKey)) {
      return processedCache.get(cacheKey)!;
    }
    
    // Process content with the appropriate processor
    const processor = getProcessor(isMdx);
    const vFile = await processor.process(content);
    let result = String(vFile);
    
    // Fix encoded image URLs if present (e.g. %22/path/to/image.png%22)
    result = result.replace(/src="(%22)([^"]+)(%22)"/g, 'src="$2"');
    
    // Cache the result
    processedCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error processing markdown:", error);
    return `<div class="markdown-error">Error processing content: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}

/**
 * Extract headings from markdown content with caching for better performance
 * @param content The markdown content to extract headings from
 * @returns Array of headings with ID, title, and level
 */
export async function extractHeadings(
  content: string,
): Promise<Array<{ id: string; title: string; level: number }>> {
  // Generate a cache key
  const cacheKey = content.substring(0, 100);

  // Check if we have a cached version
  if (headingsCache.has(cacheKey)) {
    return headingsCache.get(cacheKey)!;
  }

  const headings: Array<{ id: string; title: string; level: number }> = [];
  const usedIds = new Set<string>();

  // First, remove all code blocks to prevent headings in code from being captured
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```|`[^`\n]+`/g, "");

  // Extract headings using regex
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();

    // Generate ID from title (same logic as rehype-slug)
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

  // Cache the result
  headingsCache.set(cacheKey, headings);
  return headings;
}
