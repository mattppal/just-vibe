import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Store CSRF token
let csrfToken: string | null = null;

// Function to fetch CSRF token
export async function getCsrfToken(force = false): Promise<string> {
  // Return cached token if available and not forced to refresh
  if (csrfToken && !force) {
    return csrfToken;
  }
  
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken as string;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrMethod: string,
  urlOrData?: string | unknown,
  data?: unknown
): Promise<any> {
  // Handle overloaded function signature
  let method: string;
  let url: string;
  let bodyData: unknown | undefined;

  if (urlOrData === undefined) {
    // Only URL provided, use GET method
    method = "GET";
    url = urlOrMethod;
    bodyData = undefined;
  } else if (typeof urlOrData === "string") {
    // Method and URL provided
    method = urlOrMethod;
    url = urlOrData;
    bodyData = data;
  } else {
    // URL and data provided, use POST method
    method = "POST";
    url = urlOrMethod;
    bodyData = urlOrData;
  }

  const headers: Record<string, string> = {
    ...(bodyData ? { "Content-Type": "application/json" } : {}),
  };

  // For mutating requests (POST, PUT, DELETE, PATCH), add CSRF token
  if (method !== "GET" && url.startsWith("/api/")) {
    try {
      // Get the CSRF token
      const token = await getCsrfToken();
      headers["X-CSRF-Token"] = token;
    } catch (error) {
      console.error("Failed to get CSRF token for request", error);
      throw new Error("CSRF protection error: Could not get token");
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: bodyData ? JSON.stringify(bodyData) : undefined,
    credentials: "include",
  });

  // If we get a 403 with a CSRF error, try to refresh the token and retry once
  if (res.status === 403) {
    try {
      const errorText = await res.text();
      if (errorText.includes("CSRF") && method !== "GET") {
        // Refresh token and retry
        const newToken = await getCsrfToken(true); // Force refresh
        
        const retryRes = await fetch(url, {
          method,
          headers: {
            ...headers,
            "X-CSRF-Token": newToken,
          },
          body: bodyData ? JSON.stringify(bodyData) : undefined,
          credentials: "include",
        });
        
        await throwIfResNotOk(retryRes);
        return await retryRes.json();
      }
    } catch (retryError) {
      console.error("CSRF retry failed", retryError);
      throw retryError;
    }
  }

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Standard query without CSRF token for read-only routes
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }
    
    // If resource requires CSRF token, we'll get a 403 with CSRF error
    if (res.status === 403) {
      try {
        const errorText = await res.text();
        if (errorText.includes("CSRF") || errorText.includes("csrf")) {
          // This endpoint requires CSRF protection, retry with token
          const token = await getCsrfToken();
          
          const retryRes = await fetch(url, {
            credentials: "include",
            headers: {
              "X-CSRF-Token": token
            }
          });
          
          if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
            return null;
          }
          
          await throwIfResNotOk(retryRes);
          return await retryRes.json();
        }
      } catch (error) {
        console.error("CSRF retry failed for GET request", error);
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 60 * 1000, // 60 minutes cache time (increased for docs site which changes rarely)
      retry: false,
      networkMode: 'offlineFirst', // Prefer cache first for better performance
      gcTime: 24 * 60 * 60 * 1000, // 24 hours in cache (significantly increased for better offline access)
      refetchOnMount: false // Don't refetch when component mounts if we have cached data
    },
    mutations: {
      retry: false,
    },
  },
});
