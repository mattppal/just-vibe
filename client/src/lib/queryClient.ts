import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

  const res = await fetch(url, {
    method,
    headers: bodyData ? { "Content-Type": "application/json" } : {},
    body: bodyData ? JSON.stringify(bodyData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
      staleTime: 5 * 60 * 1000, // 5 minutes cache time
      retry: false,
      networkMode: 'offlineFirst', // Prefer cache first
      gcTime: 10 * 60 * 1000 // 10 minutes in cache (replaces deprecated cacheTime)
    },
    mutations: {
      retry: false,
    },
  },
});
