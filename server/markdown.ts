import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";
import { processMarkdown, extractHeadings } from "./simple-markdown";

// Content directory
const CONTENT_DIR = path.join(process.cwd(), "content");

// File extensions that we support for documentation
const SUPPORTED_EXTENSIONS = [".md", ".mdx"];

// Interface for document metadata (frontmatter)
export interface DocMeta {
  title: string;
  sidebarTitle: string;
  description: string;
  order?: number;
  section?: string;
  slug: string;
  path: string;
  authenticated?: boolean; // If true or undefined, the doc requires authentication
}

// Interface for full document
export interface Doc extends DocMeta {
  content: string;
  html: string;
  headings: { id: string; title: string; level: number }[];
}

// Get section by directory name
function getSectionFromDir(dir: string): string {
  // Special case for files in the root of the content directory
  if (dir === "") {
    return "root"; // Special section for root-level files
  }

  // Return the original directory name with number prefix intact
  // The frontend will handle formatting the display
  return dir;
}

// Get order from directory name
function getOrderFromDir(dir: string): number {
  // Extract order from directory name if it follows any number prefix pattern: "1-directory-name"
  const match = dir.match(/^(\d+)-/);
  if (match) {
    return parseInt(match[1], 10); // Use the numeric prefix as the order
  }

  // If the directory name doesn't have a numeric prefix, extract from the normalized name
  const normalizedDir = dir.replace(/^\d+-/, ""); // Remove numeric prefix

  // Fallback to predefined order if no number prefix
  const sectionOrder: Record<string, number> = {
    "getting-started": 0,
    "core-concepts": 1,
    "api-reference": 2,
  };

  return sectionOrder[normalizedDir] !== undefined ? sectionOrder[normalizedDir] : 999;
}

// Extract slug from filename by removing order prefix and extension
function getSlugFromFilename(filename: string, dir: string): string {
  // Remove order prefix (e.g., "1-" from "1-introduction.md")
  // This works with any number (non-zero-padded)
  const withoutOrder = filename.replace(/^\d+-/, "");
  // Remove extensions (.md and .mdx)
  const baseSlug = withoutOrder.replace(/\.(md|mdx)$/, "");

  // Special case for files in the root directory
  if (dir === "") {
    return baseSlug; // Files in root just use their name as slug
  }

  // For introduction in getting-started, just return 'introduction'
  if (baseSlug === "introduction" && dir === "getting-started") {
    return baseSlug;
  }

  // Otherwise include the directory in the slug for uniqueness
  return `${dir}/${baseSlug}`;
}

// Get page path from slug
function getPathFromSlug(slug: string, dir: string): string {
  // Special case for files in the root directory (no dir)
  if (dir === "") {
    // Root files should have the path '/'
    return "/";
  }

  // Special case: 'introduction' can be accessed from both '/' and '/introduction'
  if (slug === "introduction") {
    return "/welcome/introduction";
  }

  // Include section directory in the path for all other pages
  const parts = slug.split("/");
  const normalizedDir = dir.replace(/^\d+-/, ""); // Remove numeric prefix from directory

  // Return full path with section directory
  return `/${normalizedDir}/${parts[parts.length - 1]}`;
}

// Parse markdown file and extract frontmatter, content, and HTML
export async function parseMarkdownFile(filePath: string): Promise<Doc> {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  // Determine if this is an MDX file or a regular Markdown file
  const isMdx = path.extname(filePath).toLowerCase() === ".mdx";

  // Use the unified ecosystem to process markdown/mdx content
  const html = await processMarkdown(content, isMdx);

  // Extract headings from markdown content (for table of contents)
  const headings = await extractHeadings(content);

  // Determine dir and filename
  const relativePath = path.relative(CONTENT_DIR, filePath);
  // Handle files in root directory vs. subdirectories
  let dir = "";
  const parts = relativePath.split(path.sep);

  if (parts.length > 1) {
    // File is in a subdirectory
    dir = parts[0];
  } else {
    // File is directly in the content root
    dir = "";
  }

  const filename = path.basename(filePath);

  // Extract slug from filename
  const slug = getSlugFromFilename(filename, dir);

  // Derive other metadata
  const section = getSectionFromDir(dir);
  const pageRoute = getPathFromSlug(slug, dir);

  return {
    title: data.title,
    sidebarTitle: data.sidebarTitle || data.title,
    description: data.description || "",
    section,
    slug,
    path: pageRoute,
    content,
    html,
    headings,
    // Default to true/undefined for authenticated unless explicitly set to false
    authenticated:
      data.authenticated === false ? false : data.authenticated || undefined,
    ...data, // Include any other frontmatter fields
  };
}

// Get all markdown files recursively
export async function getAllMarkdownFiles(): Promise<string[]> {
  // Find all files with supported extensions (.md and .mdx)
  const allFiles = [];
  for (const ext of SUPPORTED_EXTENSIONS) {
    const files = await glob(`**/*${ext}`, {
      cwd: CONTENT_DIR,
      absolute: true,
    });
    allFiles.push(...files);
  }
  return allFiles;
}

// Get all documents
export async function getAllDocs(): Promise<Doc[]> {
  const markdownFiles = await getAllMarkdownFiles();

  // Process all markdown files in parallel and add source info for sorting
  const docPromises = markdownFiles.map(async (file) => {
    const doc = await parseMarkdownFile(file);

    // Store original path information for sorting
    const relativePath = path.relative(CONTENT_DIR, file);
    // Handle files in root directory vs. subdirectories
    let dir = "";
    const parts = relativePath.split(path.sep);

    if (parts.length > 1) {
      // File is in a subdirectory
      dir = parts[0];
    } else {
      // File is directly in the content root
      dir = "";
    }

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
    const dirA = (a as any).sourceDir || "";
    const dirB = (b as any).sourceDir || "";

    // Special case: Root files (empty dir) should always come first
    if (dirA === "" && dirB !== "") {
      return -1; // A is a root file, B is not -> A comes first
    }
    if (dirA !== "" && dirB === "") {
      return 1; // B is a root file, A is not -> B comes first
    }

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
    const filenameA = (a as any).sourceFilename || "";
    const filenameB = (b as any).sourceFilename || "";

    return getOrderFromFilename(filenameA) - getOrderFromFilename(filenameB);
  });
}

// Get document by slug
export async function getDocBySlug(slug: string): Promise<Doc | undefined> {
  const docs = await getAllDocs();
  return docs.find((doc) => doc.slug === slug);
}

// Get document by path
export async function getDocByPath(pagePath: string): Promise<Doc | undefined> {
  const docs = await getAllDocs();
  return docs.find((doc) => doc.path === pagePath);
}

// Extract order prefix from filename
function getOrderFromFilename(filename: string): number {
  // Get order from filename with number prefix like "1-introduction.md"
  const match = filename.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 999; // Default to high number if no order found
}

// Group documents by section
export async function getDocsBySection(): Promise<Record<string, Doc[]>> {
  const docs = await getAllDocs(); // Reuse the sorting logic from getAllDocs

  // Group docs by section
  const sections: Record<string, Doc[]> = {};

  for (const doc of docs) {
    if (!sections[doc.section || ""]) {
      sections[doc.section || ""] = [];
    }

    sections[doc.section || ""].push(doc);
  }

  // The docs are already sorted by getAllDocs, and since we're pushing them in order,
  // each section will maintain the same order

  return sections;
}
