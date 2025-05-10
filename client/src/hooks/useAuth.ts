import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes - user info changes very infrequently
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 30 * 60 * 1000, // Only check every 30 minutes to see if still logged in
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: () => {
      window.location.href = '/api/login';
    },
    logout: () => {
      window.location.href = '/api/logout';
    },
  };
}
