/**
 * A simplified markdown processor without TypeScript errors.
 * This is a temporary solution to get MDX working without advanced unified/rehype features.
 */

export async function processMarkdown(content: string, isMdx: boolean = false): Promise<string> {
  // For our MVP version, we'll just render the markdown as-is
  // We'll add proper MDX processing in a later version
  
  try {
    // Just return the content as regular HTML for now
    // A more robust solution would process markdown and handle MDX components properly
    
    // Convert markdown headings (# Title) to HTML <h1>, <h2>, etc.
    let html = content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    
    // Convert paragraphs - lines that aren't headings, code blocks, lists, etc.
    html = html.replace(/^([^<\s][^\n]+)$/gm, '<p>$1</p>');
    
    // Handle code blocks with syntax highlighting
    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`;
    });
    
    // For MDX, we would also need to handle JSX components, but we'll ignore them for now
    
    return html;
  } catch (error) {
    console.error('Error processing markdown content:', error);
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