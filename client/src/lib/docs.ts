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
    // Process the documents
    docsCache = docs;
    return docs;
  } catch (error) {
    console.error("Error fetching docs:", error);
    return [];
  }
}

export async function getDocByPath(path: string): Promise<DocPage | undefined> {
  try {
    // For root path, we need a special case
    if (path === "/") {
      // Access the root path API endpoint
      return await apiRequest('/api/docs/path/');
    }
    
    // For all other paths, remove the leading slash and use as path parameter
    const pathParam = path.substring(1);
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

// Using a simple in-memory cache for sections data to reduce API calls
// This is a more reliable approach than depending on the React Query cache
// which might not be accessible from all contexts
let sectionDataCache: Record<string, DocPage[]> | null = null;
let lastSectionFetchTime = 0;
const SECTION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getDocsBySection(): Promise<Record<string, DocPage[]>> {
  try {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (sectionDataCache && (now - lastSectionFetchTime < SECTION_CACHE_TTL)) {
      return sectionDataCache;
    }
    
    // Fetch new data if needed
    const data = await apiRequest("/api/sections");
    
    // Update cache
    sectionDataCache = data;
    lastSectionFetchTime = now;
    
    return data;
  } catch (error) {
    console.error("Error fetching doc sections:", error);
    return sectionDataCache || {};
  }
}
