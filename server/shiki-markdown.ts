/**
 * A markdown processor using Shiki for syntax highlighting
 */
import { JSDOM } from 'jsdom';
import { Highlighter, getHighlighter } from 'shiki';

// Initialize Shiki highlighter (will be cached)
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

async function getShikiHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) return highlighterInstance;
  
  if (!highlighterPromise) {
    // Initialize only once
    highlighterPromise = getHighlighter({
      theme: 'github-dark',
      langs: ['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'json', 'python', 'bash', 'markdown']
    });
  }
  
  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

/**
 * Process markdown content with Shiki syntax highlighting
 */
export async function processMarkdown(content: string, isMdx: boolean = false): Promise<string> {
  try {
    // Basic markdown processing with regex
    // Headers
    let html = content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    
    // Paragraphs - lines that aren't headings or code blocks
    html = html.replace(/^([^<#\s][^\n]+)$/gm, '<p>$1</p>');
    
    // Get our Shiki highlighter instance
    const highlighter = await getShikiHighlighter();
    
    // Replace code blocks with syntax-highlighted HTML
    html = html.replace(/```([a-z]*)(?:\s*\{([^\}]*)\})?\n([\s\S]*?)```/g, (_, lang, lineNumbers, code) => {
      // Default to text if no language specified
      const language = lang || 'text';
      
      try {
        // Highlight code with Shiki
        const highlighted = highlighter.codeToHtml(code.trim(), { lang: language });
        
        // If line numbers are specified, add the highlighting
        if (lineNumbers) {
          // Create a DOM to manipulate the highlighted code
          const dom = new JSDOM(highlighted);
          const { document } = dom.window;
          const codeEl = document.querySelector('code');
          
          if (codeEl) {
            // Parse line numbers spec like "1,3-5,7"
            const linesToHighlight = new Set();
            
            lineNumbers.split(',').forEach(part => {
              if (part.includes('-')) {
                // Handle ranges like 3-5
                const [start, end] = part.split('-').map(n => parseInt(n, 10));
                for (let i = start; i <= end; i++) {
                  linesToHighlight.add(i);
                }
              } else {
                // Handle single lines
                linesToHighlight.add(parseInt(part, 10));
              }
            });
            
            // Apply highlight class to specified lines
            const lines = codeEl.innerHTML.split('\n');
            codeEl.innerHTML = lines.map((line, i) => {
              const lineNum = i + 1;
              if (linesToHighlight.has(lineNum)) {
                return `<span class="highlighted-line">${line}</span>`;
              }
              return line;
            }).join('\n');
          }
          
          return dom.serialize();
        }
        
        return highlighted;
      } catch (error) {
        console.error(`Error highlighting ${language} code:`, error);
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      }
    });
    
    // For now, just return the processed HTML
    return html;
  } catch (error) {
    console.error('Error processing markdown:', error);
    return `<div class="markdown-error">Error processing content: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}

/**
 * Extract headings from markdown content
 */
export async function extractHeadings(content: string): Promise<Array<{ id: string; title: string; level: number }>> {
  const headings: Array<{ id: string; title: string; level: number }> = [];
  const usedIds = new Set<string>();
  
  // Extract headings with regex
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