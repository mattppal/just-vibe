import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

// Cache user data in memory to reduce authentication checks
// This is helpful for components that mount/unmount frequently
let cachedUser: User | null = null;
let lastAuthCheck = 0;
const AUTH_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: AUTH_CHECK_INTERVAL, // 30 minutes - user info changes very infrequently
    gcTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: AUTH_CHECK_INTERVAL, // Only check every 30 minutes to see if still logged in
    // Custom initialData function that uses our memory cache
    initialData: () => {
      const now = Date.now();
      // Return cached data if it's fresh enough (avoid unnecessary API calls)
      if (cachedUser && (now - lastAuthCheck < AUTH_CHECK_INTERVAL)) {
        return cachedUser;
      }
      return undefined;
    },
    // Update our memory cache whenever we get fresh data
    onSuccess: (data) => {
      cachedUser = data;
      lastAuthCheck = Date.now();
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: () => {
      window.location.href = '/api/login';
    },
    logout: () => {
      // Clear cache on logout
      cachedUser = null;
      lastAuthCheck = 0;
      // Invalidate the query cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to logout endpoint
      window.location.href = '/api/logout';
    },
  };
}
