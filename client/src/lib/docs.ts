import { apiRequest, queryClient } from "./queryClient";

export interface Heading {
  id: string;
  title: string;
  level: number;
}

export interface DocPage {
  title: string;
  sidebarTitle: string;
  description: string;
  section: string;
  slug: string;
  path: string;
  content: string;
  html: string;
  headings: Heading[];
  order?: number;
  authenticated?: boolean; // If true or undefined, the doc requires authentication
  requiresAuth?: boolean; // Added by server to indicate auth status for frontend
}

// This cache improves performance by storing retrieved docs
let docsCache: DocPage[] | null = null;

export async function getAllDocs(): Promise<DocPage[]> {
  if (docsCache) return docsCache;
  
  try {
    const docs = await apiRequest("/api/docs");
    // Log the first doc to see its structure
    if (docs && docs.length > 0) {
      console.log("First doc structure:", {
        title: docs[0].title,
        description: docs[0].description,
        contentLength: docs[0].content?.length || 'No content',
        html: docs[0].html?.substring(0, 100) + '...' || 'No HTML'
      });
    }
    docsCache = docs;
    return docs;
  } catch (error) {
    console.error("Error fetching docs:", error);
    return [];
  }
}

export async function getDocByPath(path: string): Promise<DocPage | undefined> {
  try {
    // For root path, we need to use "root" as a placeholder
    const pathParam = path === "/" ? "root" : path.substring(1);
    return await apiRequest(`/api/docs/path/${pathParam}`);
  } catch (error: any) {
    console.error("Error fetching doc by path:", error);
    
    // If this is an authentication error (status 401), rethrow the error
    // so that the AuthRequired component can handle it correctly
    if (error?.response?.status === 401 && error?.response?.data?.requiresAuth) {
      throw error;
    }
    
    return undefined;
  }
}

export async function getDocBySlug(slug: string): Promise<DocPage | undefined> {
  try {
    return await apiRequest(`/api/docs/${slug}`);
  } catch (error) {
    console.error(`Error fetching doc with slug ${slug}:`, error);
    return undefined;
  }
}

export async function getDocsBySection(): Promise<Record<string, DocPage[]>> {
  try {
    // Try to get from query cache first (if already fetched by sidebar)
    const cachedData = queryClient.getQueryData<Record<string, DocPage[]>>(['/api/sections']);
    if (cachedData) {
      return cachedData;
    }
    // Fall back to api request if not in cache
    return await apiRequest("/api/sections");
  } catch (error) {
    console.error("Error fetching doc sections:", error);
    return {};
  }
}
