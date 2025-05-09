import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import { processMarkdown, extractHeadings } from './unified-markdown';

// Content directory
const CONTENT_DIR = path.join(process.cwd(), 'content');

// Interface for document metadata (frontmatter)
export interface DocMeta {
  title: string;
  sidebarTitle: string;
  description: string;
  order?: number;
  section?: string;
  slug: string;
  path: string;
}

// Interface for full document
export interface Doc extends DocMeta {
  content: string;
  html: string;
  headings: { id: string; title: string; level: number }[];
}

// Get section by directory name
function getSectionFromDir(dir: string): string {
  const sectionMap: Record<string, string> = {
    'getting-started': 'Getting Started',
    'core-concepts': 'Core Concepts',
    'api-reference': 'API Reference',
  };
  
  return sectionMap[dir] || dir;
}

// Extract slug from filename by removing order prefix and extension
function getSlugFromFilename(filename: string): string {
  // Remove order prefix (e.g., "1-" from "1-introduction.md")
  const withoutOrder = filename.replace(/^\d+-/, '');
  // Remove extension
  return withoutOrder.replace(/\.md$/, '');
}

// Get page path from slug
function getPathFromSlug(slug: string, dir: string): string {
  if (slug === 'introduction' && dir === 'getting-started') {
    return '/';
  }
  return `/${slug}`;
}

// Parse markdown file and extract frontmatter, content, and HTML
export async function parseMarkdownFile(filePath: string): Promise<Doc> {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  // Use the unified ecosystem to process markdown
  const html = await processMarkdown(content);
  
  // Extract headings from markdown content (for table of contents)
  const headings = await extractHeadings(content);
  
  // Determine dir and filename
  const relativePath = path.relative(CONTENT_DIR, filePath);
  const [dir] = relativePath.split(path.sep);
  const filename = path.basename(filePath);
  
  // Extract slug from filename
  const slug = getSlugFromFilename(filename);
  
  // Derive other metadata
  const section = getSectionFromDir(dir);
  const pageRoute = getPathFromSlug(slug, dir);
  
  return {
    title: data.title,
    sidebarTitle: data.sidebarTitle || data.title,
    description: data.description || '',
    section,
    slug,
    path: pageRoute,
    content,
    html,
    headings,
    ...data, // Include any other frontmatter fields
  };
}

// Get all markdown files recursively
export async function getAllMarkdownFiles(): Promise<string[]> {
  return await glob('**/*.md', { cwd: CONTENT_DIR, absolute: true });
}

// Get all documents
export async function getAllDocs(): Promise<Doc[]> {
  const markdownFiles = await getAllMarkdownFiles();
  
  // Process all markdown files in parallel
  const docs = await Promise.all(markdownFiles.map(file => parseMarkdownFile(file)));
  
  // Sort docs by section and order
  return docs.sort((a, b) => {
    // First sort by section (using the directory order)
    const sectionOrder = {
      'Getting Started': 0,
      'Core Concepts': 1,
      'API Reference': 2,
    };
    
    const sectionA = sectionOrder[a.section as keyof typeof sectionOrder] || 999;
    const sectionB = sectionOrder[b.section as keyof typeof sectionOrder] || 999;
    
    if (sectionA !== sectionB) {
      return sectionA - sectionB;
    }
    
    // If in the same section, sort by order
    const orderA = a.order || 0;
    const orderB = b.order || 0;
    return orderA - orderB;
  });
}

// Get document by slug
export async function getDocBySlug(slug: string): Promise<Doc | undefined> {
  const docs = await getAllDocs();
  return docs.find(doc => doc.slug === slug);
}

// Get document by path
export async function getDocByPath(pagePath: string): Promise<Doc | undefined> {
  const docs = await getAllDocs();
  return docs.find(doc => doc.path === pagePath);
}

// Group documents by section
export async function getDocsBySection(): Promise<Record<string, Doc[]>> {
  const docs = await getAllDocs();
  
  // Group docs by section
  const sections: Record<string, Doc[]> = {};
  
  for (const doc of docs) {
    if (!sections[doc.section || '']) {
      sections[doc.section || ''] = [];
    }
    
    sections[doc.section || ''].push(doc);
  }
  
  // Sort docs within each section
  for (const section in sections) {
    sections[section].sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return orderA - orderB;
    });
  }
  
  return sections;
}