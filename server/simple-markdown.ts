/**
 * High-performance markdown processor with Shiki code highlighting
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
import { promises as fs } from 'fs';
import path from 'path';

// Two-level caching strategy:
// 1. In-memory cache for most recently accessed content
// 2. File-based cache for long-term storage
const processedCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100; // Limit in-memory cache size

// Cache for extracted headings (in-memory only)
const headingsCache = new Map<
  string,
  Array<{ id: string; title: string; level: number }>
>();

// Cached processor instances (create once, reuse always)
let markdownProcessor: any = null;
let mdxProcessor: any = null;

// Cache directory path
const CACHE_DIR = path.join(process.cwd(), '.cache');

// Initialize cache directory
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create cache directory:', err);
  }
}

// Call this on startup
ensureCacheDir();

/**
 * Get optimized processor for markdown or MDX content
 */
function getProcessor(isMdx: boolean) {
  // Return cached processor if available
  if (isMdx && mdxProcessor) return mdxProcessor;
  if (!isMdx && markdownProcessor) return markdownProcessor;
  
  // Create unified processor pipeline
  const processor = unified()
    // Start with markdown parsing
    .use(remarkParse)
    // Add GitHub-flavored markdown support
    .use(remarkGfm);
  
  // Add MDX support for MDX files only
  const processorWithMdx = isMdx ? 
    processor.use(remarkMdx) : 
    processor;
    
  // Complete the processing pipeline
  const finalProcessor = processorWithMdx
    // Convert to HTML (preserving raw HTML)
    .use(remarkRehype, { allowDangerousHtml: true })
    // Process raw HTML
    .use(rehypeRaw)
    // Add IDs to headings
    .use(rehypeSlug)
    // Apply syntax highlighting with optimized options
    .use(rehypeShiki, {
      theme: "vitesse-dark",
      // Optimize transformer usage
      transformers: [
        transformerNotationHighlight(),
        transformerCopyButton()
      ],
    })
    // Stringify with HTML preservation
    .use(rehypeStringify, { allowDangerousHtml: true });
  
  // Cache processor instance
  if (isMdx) {
    mdxProcessor = finalProcessor;
  } else {
    markdownProcessor = finalProcessor;
  }
  
  return finalProcessor;
}

// Generate a cache key from content
function generateCacheKey(content: string, isMdx: boolean): string {
  // Use a hash of the first 200 chars to identify the content
  const contentPreview = content.substring(0, 200);
  const type = isMdx ? 'mdx' : 'md';
  return `${type}:${Buffer.from(contentPreview).toString('base64').substring(0, 40)}`;
}

// Get file path for disk cache
function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_DIR, `${cacheKey.replace(/[:/]/g, '_')}.html`);
}

// Manage cache size to prevent memory leaks
function manageMemoryCache() {
  if (processedCache.size > MAX_CACHE_SIZE) {
    // Convert to array, sort by recently used (if we had that data)
    // and remove oldest entries
    const entries = Array.from(processedCache.entries());
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 4)); // Remove 25%
    
    for (const [key] of toRemove) {
      processedCache.delete(key);
    }
  }
}

/**
 * High-performance markdown processing with multi-level caching
 * @param content The markdown or MDX content to process
 * @param isMdx Whether the content is MDX
 * @returns Processed HTML string with syntax highlighting
 */
export async function processMarkdown(
  content: string,
  isMdx: boolean = false,
): Promise<string> {
  try {
    // Generate a consistent cache key
    const cacheKey = generateCacheKey(content, isMdx);
    
    // Check in-memory cache first (fastest)
    if (processedCache.has(cacheKey)) {
      return processedCache.get(cacheKey)!;
    }
    
    // Then check disk cache
    const cacheFilePath = getCacheFilePath(cacheKey);
    try {
      const cached = await fs.readFile(cacheFilePath, 'utf8');
      // Store in memory cache for faster access next time
      processedCache.set(cacheKey, cached);
      manageMemoryCache();
      return cached;
    } catch (err) {
      // Cache miss - process the content
    }
    
    // Process content through the optimized pipeline
    const processor = getProcessor(isMdx);
    const vFile = await processor.process(content);
    let result = String(vFile);
    
    // Optimize the HTML output
    // 1. Fix encoded image URLs
    result = result.replace(/src="(%22)([^"]+)(%22)"/g, 'src="$2"');
    
    // 2. Optimize iframe embeds if present (ensuring proper attributes for YouTube etc.)
    result = result.replace(/<iframe([^>]*)>([\s\S]*?)<\/iframe>/g, (match, attrs) => {
      // Add loading="lazy" for performance if not already present
      if (!attrs.includes('loading=')) {
        match = match.replace('<iframe', '<iframe loading="lazy"');
      }
      return match;
    });
    
    // Cache the results
    // In-memory cache
    processedCache.set(cacheKey, result);
    manageMemoryCache();
    
    // Disk cache (don't await to avoid blocking)
    fs.writeFile(cacheFilePath, result, 'utf8').catch(err => {
      console.error('Failed to write to disk cache:', err);
    });
    
    return result;
  } catch (error) {
    console.error("Error processing markdown:", error);
    return `<div class="markdown-error">Error processing content: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}

// Define heading with typings
interface Heading {
  id: string;
  title: string;
  level: number;
}

/**
 * Extract headings from markdown content with optimized performance
 * @param content The markdown content to extract headings from
 * @returns Array of headings with ID, title, and level
 */
export async function extractHeadings(content: string): Promise<Heading[]> {
  // Generate a consistent cache key for headings
  const cacheKey = generateCacheKey(content, false) + ':headings';

  // Check in-memory cache first
  if (headingsCache.has(cacheKey)) {
    return headingsCache.get(cacheKey)!;
  }

  // Initialize results array and tracking
  const headings: Heading[] = [];
  const usedIds = new Set<string>();

  // Optimize: Use string manipulation instead of regex for large documents
  // by splitting content into lines first
  const lines = content.split('\n');
  
  // Pre-process: Remove code blocks to prevent false headings
  let inCodeBlock = false;
  const contentLines = lines.filter(line => {
    // Toggle code block state
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return false; // Remove code block markers
    }
    // Skip lines inside code blocks
    return !inCodeBlock;
  });

  // Process each line for headings (faster than regex on the whole content)
  const headingPattern = /^(#{1,6})\s+(.+)$/;
  
  for (const line of contentLines) {
    const match = line.match(headingPattern);
    if (!match) continue;
    
    const level = match[1].length;
    const title = match[2].trim();

    // Generate slug for ID (optimized version)
    let id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove trailing hyphens

    // Handle ID collisions
    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter++}`;
    }

    usedIds.add(uniqueId);
    headings.push({ id: uniqueId, title, level });
  }

  // Cache result for future requests
  headingsCache.set(cacheKey, headings);
  
  // Limit cache size to prevent memory issues
  if (headingsCache.size > MAX_CACHE_SIZE) {
    const oldestKey = headingsCache.keys().next().value;
    headingsCache.delete(oldestKey);
  }
  
  return headings;
}
