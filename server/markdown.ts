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

// Get order from directory name
function getOrderFromDir(dir: string): number {
  // Extract order from directory name if it follows pattern: "1-directory-name"
  const match = dir.match(/^(\d+)-/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Fallback to predefined order if no number prefix
  const sectionOrder: Record<string, number> = {
    'getting-started': 0,
    'core-concepts': 1,
    'api-reference': 2,
  };
  
  return sectionOrder[dir] !== undefined ? sectionOrder[dir] : 999;
}

// Extract slug from filename by removing order prefix and extension
function getSlugFromFilename(filename: string, dir: string): string {
  // Remove order prefix (e.g., "1-" from "1-introduction.md")
  const withoutOrder = filename.replace(/^\d+-/, '');
  // Remove extension
  const baseSlug = withoutOrder.replace(/\.md$/, '');
  
  // For introduction in getting-started, just return 'introduction'
  if (baseSlug === 'introduction' && dir === 'getting-started') {
    return baseSlug;
  }
  
  // Otherwise include the directory in the slug for uniqueness
  return `${dir}/${baseSlug}`;
}

// Get page path from slug
function getPathFromSlug(slug: string, dir: string): string {
  if (slug === 'introduction') {
    return '/';
  }
  // For directory-prefixed slugs, just use the base part
  const parts = slug.split('/');
  return `/${parts[parts.length - 1]}`;
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
  const slug = getSlugFromFilename(filename, dir);
  
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
  
  // Process all markdown files in parallel and add source info for sorting
  const docPromises = markdownFiles.map(async (file) => {
    const doc = await parseMarkdownFile(file);
    
    // Store original path information for sorting
    const relativePath = path.relative(CONTENT_DIR, file);
    const [dir] = relativePath.split(path.sep);
    const filename = path.basename(file);
    
    // Add metadata for sorting
    (doc as any).sourceDir = dir;
    (doc as any).sourceFilename = filename;
    
    return doc;
  });
  
  const docs = await Promise.all(docPromises);
  
  // Sort docs by section and order
  return docs.sort((a, b) => {
    // Extract source directory for directory-based ordering
    const dirA = (a as any).sourceDir || '';
    const dirB = (b as any).sourceDir || '';
    
    // Get directory orders (from numeric prefix or predefined order)
    const dirOrderA = getOrderFromDir(dirA);
    const dirOrderB = getOrderFromDir(dirB);
    
    // First sort by directory order
    if (dirOrderA !== dirOrderB) {
      return dirOrderA - dirOrderB;
    }
    
    // If in the same directory, sort by document order
    
    // First try to use frontmatter order
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    
    // If either document doesn't have frontmatter order, use filename order
    const filenameA = (a as any).sourceFilename || '';
    const filenameB = (b as any).sourceFilename || '';
    
    return getOrderFromFilename(filenameA) - getOrderFromFilename(filenameB);
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

// Extract order prefix from filename
function getOrderFromFilename(filename: string): number {
  const match = filename.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 999; // Default to high number if no order found
}

// Group documents by section
export async function getDocsBySection(): Promise<Record<string, Doc[]>> {
  const docs = await getAllDocs(); // Reuse the sorting logic from getAllDocs
  
  // Group docs by section
  const sections: Record<string, Doc[]> = {};
  
  for (const doc of docs) {
    if (!sections[doc.section || '']) {
      sections[doc.section || ''] = [];
    }
    
    sections[doc.section || ''].push(doc);
  }
  
  // The docs are already sorted by getAllDocs, and since we're pushing them in order,
  // each section will maintain the same order
  
  return sections;
}