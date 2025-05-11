/**
 * Custom fetch wrapper for making API calls that won't be intercepted by Vite's dev server
 * Uses a special prefix to avoid interception
 */

interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Make API calls that won't be intercepted by Vite's dev server
 * @param endpoint API endpoint path (without leading slash)
 * @param options Fetch options
 * @returns Response from API
 */
export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  // Create URL with parameters if provided
  let url = `/api-avoid-vite-interception/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  // Set default headers
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });
  
  // Check for error responses
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      // Try to parse error as JSON
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      // If it's not JSON, use the raw text
      if (errorText) {
        errorMessage = `${errorMessage} - ${errorText.slice(0, 100)}`;
        if (errorText.length > 100) errorMessage += '...';
      }
    }
    throw new Error(errorMessage);
  }
  
  // Parse JSON response
  try {
    // For empty responses or non-JSON responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as unknown as T;
    }
    
    // First get response as text for debugging
    const text = await response.text();
    console.log('Raw API response text:', text.slice(0, 100) + (text.length > 100 ? '...' : ''));
    
    if (!text) {
      return null as unknown as T;
    }

    // Check if the response looks like HTML (common error in Vite development)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('Received HTML instead of JSON response');
      // Return empty object as a fallback to avoid breaking the application
      return {} as T;
    }
    
    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'for text:', text.slice(0, 200));
      // Return empty object as a fallback
      return {} as T;
    }
  } catch (error) {
    console.error('Error handling API response:', error);
    // Return empty object as a fallback
    return {} as T;
  }
}
