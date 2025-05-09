import { apiRequest } from "./queryClient";

export interface DocPage {
  id: number;
  title: string;
  path?: string;
  slug: string;
  section?: string;
  content: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// This cache improves performance by storing retrieved docs
let docsCache: DocPage[] | null = null;

export async function getAllDocs(): Promise<DocPage[]> {
  if (docsCache) return docsCache;
  
  try {
    const response = await apiRequest("GET", "/api/docs");
    const docs = await response.json();
    
    // Transform data to match our DocPage interface
    const transformedDocs = docs.map((doc: any) => ({
      ...doc,
      path: getPathFromSlug(doc.slug),
      section: doc.section?.name
    }));
    
    docsCache = transformedDocs;
    return transformedDocs;
  } catch (error) {
    console.error("Error fetching docs:", error);
    return [];
  }
}

export async function getDocByPath(path: string): Promise<DocPage | undefined> {
  const docs = await getAllDocs();
  return docs.find((doc) => doc.path === path);
}

export async function getDocBySlug(slug: string): Promise<DocPage | undefined> {
  try {
    const response = await apiRequest("GET", `/api/docs/${slug}`);
    const doc = await response.json();
    
    return {
      ...doc,
      path: getPathFromSlug(doc.slug),
      section: doc.section?.name
    };
  } catch (error) {
    console.error(`Error fetching doc with slug ${slug}:`, error);
    return undefined;
  }
}

// Helper function to convert slug to path
function getPathFromSlug(slug: string): string {
  if (slug === "introduction") return "/";
  return `/${slug}`;
}
